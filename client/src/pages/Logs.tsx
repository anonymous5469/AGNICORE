import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Siren, ShieldCheck, ShieldX } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getDecisionMeta, getRiskMeta } from '../lib/ui';
import { api } from '../lib/api';
import { LogEntry, Decision } from '../types';

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        interface BackendLog {
          id: string;
          user: string;
          resource: string;
          action: string;
          ip: string;
          device: string;
          location: string;
          risk_score: number;
          decision: string;
          reason: string;
          created_at: string;
        }
        const data = await api.get<BackendLog[]>('/access/logs');
        setLogs(data.map(log => ({
          id: log.id,
          timestamp: new Date(log.created_at).toLocaleString(),
          user: log.user,
          ip: log.ip || 'Unknown',
          device: log.device || 'Unknown',
          riskScore: log.risk_score,
          decision: log.decision as Decision,
          location: log.location || 'Unknown',
          resource: log.resource,
          reason: log.reason || (log.decision === 'DENY' ? 'Security policy enforcement' : 'Standard access verification'),
          severity: log.risk_score > 60 ? 'high' : log.risk_score > 30 ? 'medium' : 'low',
        })));
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLogs();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-10 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-40 bg-white/5 rounded-lg" />
          <div className="h-16 w-[32rem] bg-white/5 rounded-2xl" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/[0.03] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const highSeverityCount = logs.filter((log) => log.severity === 'high').length;
  const verifyCount = logs.filter((log) => log.decision === 'VERIFY').length;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Investigation Workspace"
        title="Trace the reason behind every policy decision."
        description="Security logs show where requests originated, how risky they appeared, and what AGNICORE did in response."
      >
        <div className="badge-glass border-red-500/20 bg-red-500/5 text-red-400 px-4 py-2">
          <Siren className="h-4 w-4" />
          <span className="text-sm font-semibold">{highSeverityCount} critical events</span>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <motion.div 
          className="glass p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500/60 to-transparent" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Denied attempts</p>
          <p className="text-4xl font-bold text-white tracking-tight">{highSeverityCount}</p>
          <p className="mt-2 text-sm text-slate-400">Critical policy blocks</p>
        </motion.div>
        <motion.div 
          className="glass p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/60 to-transparent" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Verification prompts</p>
          <p className="text-4xl font-bold text-white tracking-tight">{verifyCount}</p>
          <p className="mt-2 text-sm text-slate-400">Step-up challenges issued</p>
        </motion.div>
        <motion.div 
          className="glass p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/60 to-transparent" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3">Audit coverage</p>
          <p className="text-4xl font-bold text-white tracking-tight">100%</p>
          <p className="mt-2 text-sm text-slate-400">Full contextual retention</p>
        </motion.div>
      </div>

      <motion.section 
        className="glass-strong p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="eyebrow-glass mb-2">Decision Ledger</p>
            <h2 className="heading-section-glass">Analyst review stream</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="Search-ready layout"
                className="input-glass w-full sm:w-56 pl-10"
                readOnly
              />
            </div>
            <button className="btn-glass-secondary">
              <ShieldCheck className="h-4 w-4" />
              Filters coming next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-glass">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left border-b border-white/5">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Timestamp</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Actor</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Context</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Risk</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Decision</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const decisionMeta = getDecisionMeta(log.decision);
                const riskMeta = getRiskMeta(log.riskScore);
                const DecisionIcon = decisionMeta.icon;

                return (
                  <tr key={log.id} className="group transition-all duration-200 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="text-sm text-white">{log.timestamp}</div>
                      <div className="mt-1.5 text-xs text-slate-600">{log.location}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-sm font-medium text-white">{log.user}</div>
                      <div className="mt-1.5 text-xs font-mono text-slate-500">{log.ip}</div>
                      <div className="mt-1.5 text-xs text-slate-600">{log.device}</div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="text-sm font-medium text-white">{log.resource}</div>
                      <div className="mt-1.5 text-xs uppercase tracking-[0.15em] text-slate-600">
                        {log.severity} severity
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className={`badge-glass ${riskMeta.toneClassName}`}>
                        {log.riskScore} / {riskMeta.label}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className={`badge-glass ${decisionMeta.badgeClassName}`}>
                        <DecisionIcon className="h-3.5 w-3.5" />
                        {log.decision}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-start gap-2">
                        {log.decision === 'DENY' ? (
                          <ShieldX className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        ) : (
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        )}
                        <span className="text-sm text-slate-400">{log.reason}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}
