import { useMemo, useState } from 'react';
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
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  return (
    <section className="glass-panel-strong section-shell relative overflow-hidden">
      {/* Ambient background effect */}
      <div className="ambient-orb -left-20 -top-20 h-64 w-64 bg-sky-400/5 opacity-40" />
      
      <div className="relative mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="eyebrow text-sky-400/80">Recent Requests</p>
          <h2 className="panel-title text-2xl">Live analyst feed</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
            Search, sort, and inspect requests to understand what pushed each decision.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[420px]">
          <div className="relative group">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
            <input
              type="text"
              placeholder="Search actor or resource"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="field-shell w-full pl-11 transition-all focus:shadow-[0_0_20px_rgba(115,196,255,0.1)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {riskFilters.map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-300 ${
                  riskFilter === level
                    ? 'bg-white/15 text-white shadow-[0_0_16px_rgba(255,255,255,0.1)]'
                    : 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.05)]'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto scrollbar-subtle">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Identity
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Resource
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Context
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                <button
                  onClick={() => toggleSort('riskScore')}
                  className="flex items-center gap-1 text-left hover:text-sky-400 transition-colors"
                >
                  Risk
                  {renderSortIcon('riskScore')}
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Decision
              </th>
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                <button
                  onClick={() => toggleSort('time')}
                  className="flex items-center gap-1 text-left hover:text-sky-400 transition-colors"
                >
                  Time
                  {renderSortIcon('time')}
                </button>
              </th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                Inspect
              </th>
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
                  className="group relative transition-all duration-300 hover:translate-x-1"
                >
                  {/* Row background with glass effect */}
                  <td colSpan={7} className="absolute inset-0 rounded-2xl glass-inset opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  
                  {/* Left accent border on hover */}
                  <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    request.riskScore > 60 ? 'bg-rose-400' : 
                    request.riskScore > 30 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm font-medium text-white">{request.user}</div>
                    <div className="mt-1.5 text-xs font-mono text-slate-500">{request.ip}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm font-medium text-white">{request.resource}</div>
                    <div className="mt-1.5 text-xs uppercase tracking-[0.24em] text-slate-500">
                      {request.action}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm text-slate-300">{request.device}</div>
                    <div className="mt-1.5 text-xs text-slate-500">{request.location}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className={`glass-badge ${riskMeta.toneClassName}`}>
                      {request.riskScore} / {riskMeta.label}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className={`glass-badge ${decisionMeta.badgeClassName}`}>
                      <DecisionIcon className="h-3.5 w-3.5" />
                      {request.decision}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-slate-400">
                    {request.time}
                  </td>
                  <td className="px-4 py-4 align-top text-center">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="inline-flex rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-400 transition-all duration-300 hover:bg-white/10 hover:text-white hover:shadow-[0_0_16px_rgba(255,255,255,0.1)] hover:scale-110"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="relative mt-4 rounded-2xl border border-white/8 bg-black/10 px-4 py-8 text-center text-sm text-slate-400">
          No requests matched the current filters.
        </div>
      ) : null}

      {selectedRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xl">
          <div className="glass-panel-strong w-full max-w-2xl rounded-[30px] p-8 shadow-2xl relative overflow-hidden">
            {/* Ambient orb */}
            <div className="ambient-orb -right-20 -top-20 h-48 w-48 bg-sky-400/10 opacity-40" />
            
            <div className="relative mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-sky-400/80">Request Detail</p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">
                  {selectedRequest.user}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="button-secondary !rounded-full !p-3 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="glass-inset rounded-[24px] p-5 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                <p className="eyebrow">Identity</p>
                <p className="mt-3 text-lg font-bold text-white">{selectedRequest.user}</p>
                <p className="mt-2 text-sm font-mono text-slate-400">{selectedRequest.ip}</p>
              </div>
              <div className="glass-inset rounded-[24px] p-5 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                <p className="eyebrow">Request shape</p>
                <p className="mt-3 text-lg font-bold text-white">{selectedRequest.resource}</p>
                <p className="mt-2 text-sm text-slate-300">{selectedRequest.action}</p>
              </div>
              <div className="glass-inset rounded-[24px] p-5 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                <p className="eyebrow">Risk snapshot</p>
                <div className={`mt-3 glass-badge ${getRiskMeta(selectedRequest.riskScore).toneClassName}`}>
                  {selectedRequest.riskScore} / {getRiskMeta(selectedRequest.riskScore).label}
                </div>
              </div>
              <div className="glass-inset rounded-[24px] p-5 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                <p className="eyebrow">Decision</p>
                <div className={`mt-3 glass-badge ${getDecisionMeta(selectedRequest.decision).badgeClassName}`}>
                  {selectedRequest.decision === 'DENY' ? (
                    <ShieldX className="h-3.5 w-3.5" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  {selectedRequest.decision}
                </div>
              </div>
            </div>

            <div className="mt-4 glass-inset rounded-[24px] p-5 relative overflow-hidden">
              <p className="eyebrow">Primary factors</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {getRiskFactors(selectedRequest).map((factor) => (
                  <span
                    key={factor}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-200 hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
