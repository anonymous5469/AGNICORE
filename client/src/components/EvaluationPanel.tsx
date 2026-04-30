import { Activity, ChevronRight } from 'lucide-react';
import { SimulationResult } from '../types';
import { getDecisionMeta, getRiskMeta } from '../lib/ui';

interface EvaluationPanelProps {
  readonly result: SimulationResult | null;
}

const stageToneClasses = {
  neutral: 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[#8a8a96]',
  positive: 'border-emerald-500/15 bg-emerald-500/5 text-emerald-400',
  warning: 'border-amber-500/15 bg-amber-500/5 text-amber-400',
  danger: 'border-rose-500/15 bg-rose-500/5 text-rose-400',
};

export default function EvaluationPanel({ result }: EvaluationPanelProps) {
  if (!result) {
    return (
      <div className="card-elevated p-6 flex min-h-[540px] flex-col">
        <div className="mb-8">
          <p className="eyebrow-v2 mb-2">Decision Console</p>
          <h2 className="heading-section text-2xl">Awaiting evaluation</h2>
          <p className="text-body mt-2 max-w-md">
            Run a simulation to visualize how context, risk, and policy combine into a final
            access verdict.
          </p>
        </div>

        <div className="mt-auto card p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-500/10 p-2.5 text-sky-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#f0f0f5]">Zero-trust evaluation pipeline</p>
              <p className="text-xs text-[#5a5a66]">Context ingestion, risk scoring, policy check</p>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            {['Context enriched', 'Risk score computed', 'Policy verdict emitted'].map((label) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-[#8a8a96]"
              >
                <span>{label}</span>
                <ChevronRight className="h-4 w-4 text-[#5a5a66]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const decisionMeta = getDecisionMeta(result.decision);
  const riskMeta = getRiskMeta(result.riskScore);
  const DecisionIcon = decisionMeta.icon;
  const ringFill = Math.min(result.riskScore, 100);

  return (
    <div className="card-elevated p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow-v2 mb-2">Decision Console</p>
          <h2 className="heading-section text-2xl">Evaluation result</h2>
          <p className="text-body mt-2 max-w-md">
            Each request is assessed through context weighting, behavior scoring, and policy
            enforcement before a trust decision is returned.
          </p>
        </div>
        <div className={`badge-v2 ${decisionMeta.badgeClassName}`}>
          <DecisionIcon className="h-4 w-4" />
          {result.decision}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card p-5">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <p className="text-caption">Risk score</p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-semibold tracking-tight text-white">
                  {result.riskScore}
                </span>
                <span className={`badge-v2 ${riskMeta.toneClassName}`}>{riskMeta.label}</span>
              </div>
              <p className="text-sm text-[#8a8a96]">{decisionMeta.label}</p>
            </div>

            <div
              className="relative flex h-36 w-36 items-center justify-center rounded-full shrink-0"
              style={{
                background: `conic-gradient(${decisionMeta.accentColor} ${ringFill * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
              }}
            >
              <div className="absolute inset-3 rounded-full bg-[#0a0a0f] border border-[rgba(255,255,255,0.06)]" />
              <div className="relative text-center">
                <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[#5a5a66]">Decision</p>
                <p className="mt-1 text-lg font-semibold text-white">{result.decision}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-caption mb-4">Reason stack</p>
          <div className="space-y-3">
            {result.reasons.map((reason) => (
              <div
                key={reason}
                className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm text-[#8a8a96]"
              >
                {reason}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-caption">Evaluation stages</p>
        <div className="grid gap-2">
          {result.stages.map((stage) => (
            <div
              key={stage.id}
              className={`rounded-xl border px-4 py-4 ${stageToneClasses[stage.state]}`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-[#f0f0f5]">{stage.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#8a8a96]">{stage.detail}</p>
                </div>
                <span className="text-sm font-semibold shrink-0">{stage.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
