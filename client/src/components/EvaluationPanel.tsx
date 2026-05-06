import { Activity, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SimulationResult } from '../types';
import { getDecisionMeta, getRiskMeta } from '../lib/ui';

interface EvaluationPanelProps {
  readonly result: SimulationResult | null;
}

const stageToneClasses = {
  neutral: 'border-white/5 bg-white/[0.02] text-slate-400',
  positive: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
  warning: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
  danger: 'border-red-500/20 bg-red-500/5 text-red-400',
};

export default function EvaluationPanel({ result }: EvaluationPanelProps) {
  if (!result) {
    return (
      <motion.div 
        className="glass-strong p-6 flex min-h-[540px] flex-col"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <p className="eyebrow-glass mb-2">Decision Console</p>
          <h2 className="heading-section-glass">Awaiting evaluation</h2>
          <p className="text-slate-400 mt-2 max-w-md">
            Run a simulation to visualize how context, risk, and policy combine into a final
            access verdict.
          </p>
        </div>

        <div className="mt-auto glass p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Zero-trust evaluation pipeline</p>
              <p className="text-xs text-slate-500">Context ingestion, risk scoring, policy check</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {['Context enriched', 'Risk score computed', 'Policy verdict emitted'].map((label) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl glass px-4 py-3 text-sm text-slate-400"
              >
                <span>{label}</span>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  const decisionMeta = getDecisionMeta(result.decision);
  const riskMeta = getRiskMeta(result.riskScore);
  const DecisionIcon = decisionMeta.icon;
  const ringFill = Math.min(result.riskScore, 100);

  return (
    <motion.div 
      className="glass-strong p-6 space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow-glass mb-2">Decision Console</p>
          <h2 className="heading-section-glass">Evaluation result</h2>
          <p className="text-slate-400 mt-2 max-w-md">
            Each request is assessed through context weighting, behavior scoring, and policy
            enforcement before a trust decision is returned.
          </p>
        </div>
        <div className={`badge-glass ${decisionMeta.badgeClassName}`}>
          <DecisionIcon className="h-4 w-4" />
          {result.decision}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="glass p-5">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Risk score</p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold text-white tracking-tight">
                  {result.riskScore}
                </span>
                <span className={`badge-glass ${riskMeta.toneClassName}`}>{riskMeta.label}</span>
              </div>
              <p className="text-sm text-slate-400">{decisionMeta.label}</p>
            </div>

            <div
              className="relative flex h-36 w-36 items-center justify-center rounded-full shrink-0"
              style={{
                background: `conic-gradient(${decisionMeta.accentColor} ${ringFill * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
              }}
            >
              <div className="absolute inset-3 rounded-full bg-[#0a0e1a] border border-white/5" />
              <div className="relative text-center">
                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">Decision</p>
                <p className="mt-1 text-lg font-semibold text-white">{result.decision}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">Reason stack</p>
          <div className="space-y-3">
            {result.reasons.map((reason) => (
              <div
                key={reason}
                className="rounded-xl glass px-4 py-3 text-sm text-slate-400"
              >
                {reason}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Evaluation stages</p>
        <div className="grid gap-2">
          {result.stages.map((stage) => (
            <motion.div
              key={stage.id}
              className={`rounded-xl border px-4 py-4 ${stageToneClasses[stage.state]}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{stage.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{stage.detail}</p>
                </div>
                <span className="text-sm font-semibold shrink-0">{stage.value}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
