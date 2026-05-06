import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Eye, Search, X, ShieldCheck, ShieldX } from 'lucide-react';
import { AccessRequest } from '../types';
import { getDecisionMeta, getRiskMeta } from '../lib/ui';

interface RequestsTableProps {
  readonly requests: AccessRequest[];
}

type SortField = 'riskScore' | 'time' | null;
type SortOrder = 'asc' | 'desc';
type RiskLevel = 'all' | 'low' | 'medium' | 'high';

const riskFilters: RiskLevel[] = ['all', 'low', 'medium', 'high'];

const getRiskLevel = (score: number): Exclude<RiskLevel, 'all'> => {
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
};

const getRiskFactors = (request: AccessRequest): string[] => {
  const factors: string[] = [];

  if (request.device === 'Unknown') factors.push('Unknown endpoint posture');
  if (request.location === 'Unknown') factors.push('Location confidence unavailable');
  if (request.action === 'write' || request.action === 'approve') factors.push('Mutation-capable action');
  if (request.riskScore > 60) factors.push('Request exceeded deny threshold');

  return factors.length > 0 ? factors : ['Baseline-aligned behavior'];
};

export default function RequestsTable({ requests }: RequestsTableProps) {
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel>('all');
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);

  const filteredAndSorted = useMemo(() => {
    const filtered = requests.filter((request) => {
      const query = search.toLowerCase();
      const matchesSearch =
        request.user.toLowerCase().includes(query) ||
        request.ip.toLowerCase().includes(query) ||
        request.device.toLowerCase().includes(query) ||
        request.resource.toLowerCase().includes(query);
      const matchesRisk =
        riskFilter === 'all' || getRiskLevel(request.riskScore) === riskFilter;

      return matchesSearch && matchesRisk;
    });

    if (!sortField) {
      return filtered;
    }

    return [...filtered].sort((left, right) => {
      const leftValue = sortField === 'riskScore' ? left.riskScore : left.time;
      const rightValue = sortField === 'riskScore' ? right.riskScore : right.time;

      if (sortOrder === 'asc') {
        return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
      }

      return leftValue > rightValue ? -1 : leftValue < rightValue ? 1 : 0;
    });
  }, [requests, search, riskFilter, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortOrder('desc');
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <section>
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <p className="eyebrow-glass mb-2">Recent Requests</p>
          <h2 className="heading-section-glass mb-2">Live analyst feed</h2>
          <p className="text-slate-400 max-w-xl">
            Search, sort, and inspect requests to understand what pushed each decision.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[420px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              type="text"
              placeholder="Search actor or resource"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-glass w-full pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {riskFilters.map((level) => (
              <motion.button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-all duration-200 ${
                  riskFilter === level
                    ? 'bg-blue-500 text-white'
                    : 'glass text-slate-400 hover:text-white'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {level}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto scrollbar-glass">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left border-b border-white/5">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Identity</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resource</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Context</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <button
                  onClick={() => toggleSort('riskScore')}
                  className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
                >
                  Risk
                  {renderSortIcon('riskScore')}
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Decision</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <button
                  onClick={() => toggleSort('time')}
                  className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
                >
                  Time
                  {renderSortIcon('time')}
                </button>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Inspect</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((request) => {
              const riskMeta = getRiskMeta(request.riskScore);
              const decisionMeta = getDecisionMeta(request.decision);
              const DecisionIcon = decisionMeta.icon;

              return (
                <tr
                  key={request.id}
                  className="group relative transition-all duration-200 hover:bg-white/[0.02]"
                >
                  <div className={`absolute left-0 top-2 bottom-2 w-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                    request.riskScore > 60 ? 'bg-red-400' : 
                    request.riskScore > 30 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm font-medium text-white">{request.user}</div>
                    <div className="mt-1.5 text-xs font-mono text-slate-600">{request.ip}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm font-medium text-white">{request.resource}</div>
                    <div className="mt-1.5 text-xs uppercase tracking-[0.15em] text-slate-600">
                      {request.action}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm text-slate-400">{request.device}</div>
                    <div className="mt-1.5 text-xs text-slate-600">{request.location}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className={`badge-glass ${riskMeta.toneClassName}`}>
                      {request.riskScore} / {riskMeta.label}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className={`badge-glass ${decisionMeta.badgeClassName}`}>
                      <DecisionIcon className="h-3.5 w-3.5" />
                      {request.decision}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-slate-400">
                    {request.time}
                  </td>
                  <td className="px-4 py-4 align-top text-center">
                    <motion.button
                      onClick={() => setSelectedRequest(request)}
                      className="inline-flex rounded-xl glass p-2.5 text-slate-500 transition-all duration-200 hover:text-white"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Eye className="h-4 w-4" />
                    </motion.button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="mt-6 rounded-xl glass px-4 py-10 text-center text-sm text-slate-500">
          No requests matched the current filters.
        </div>
      ) : null}

      {selectedRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div 
            className="glass-strong w-full max-w-2xl p-8 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow-glass mb-2">Request Detail</p>
                <h3 className="text-2xl font-semibold text-white">
                  {selectedRequest.user}
                </h3>
              </div>
              <motion.button
                onClick={() => setSelectedRequest(null)}
                className="btn-glass-secondary !rounded-full !p-2.5"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="glass p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Identity</p>
                <p className="text-lg font-semibold text-white">{selectedRequest.user}</p>
                <p className="mt-2 text-sm font-mono text-slate-500">{selectedRequest.ip}</p>
              </div>
              <div className="glass p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Request shape</p>
                <p className="text-lg font-semibold text-white">{selectedRequest.resource}</p>
                <p className="mt-2 text-sm text-slate-400">{selectedRequest.action}</p>
              </div>
              <div className="glass p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Risk snapshot</p>
                <div className={`badge-glass ${getRiskMeta(selectedRequest.riskScore).toneClassName}`}>
                  {selectedRequest.riskScore} / {getRiskMeta(selectedRequest.riskScore).label}
                </div>
              </div>
              <div className="glass p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Decision</p>
                <div className={`badge-glass ${getDecisionMeta(selectedRequest.decision).badgeClassName}`}>
                  {selectedRequest.decision === 'DENY' ? (
                    <ShieldX className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  {selectedRequest.decision}
                </div>
              </div>
            </div>

            <div className="mt-4 glass p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">Primary factors</p>
              <div className="flex flex-wrap gap-2">
                {getRiskFactors(selectedRequest).map((factor) => (
                  <span
                    key={factor}
                    className="rounded-full glass px-3 py-2 text-xs font-medium text-slate-400"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </section>
  );
}
