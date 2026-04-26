import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import PageHeader from '../components/PageHeader';
import RequestsTable from '../components/RequestsTable';
import { api } from '../lib/api';
import { DashboardMetrics, AccessRequest, Decision } from '../types';

interface LogResponse {
  id: string;
  user: string;
  risk_score: number;
  decision: string;
  created_at: string;
  resource: string;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [metricsData, logsData] = await Promise.all([
          api.get<DashboardMetrics>('/access/metrics'),
          api.get<LogResponse[]>('/access/logs'),
        ]);
        
        setMetrics(metricsData);
        setRequests(logsData.map(log => {
          const getSeverity = (score: number) => {
            return score > 60 ? 'high' : score > 30 ? 'medium' : 'low';
          };
          return {
            id: log.id,
            user: log.user,
            ip: 'Dynamic',
            device: 'Dynamic',
            riskScore: log.risk_score,
            decision: log.decision as Decision,
            time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            resource: log.resource,
            action: 'access',
            location: 'Remote',
            severity: getSeverity(log.risk_score),
            trustLabel: log.decision === 'DENY' ? 'Security Violation' : 'Verified Access',
          };
        }));
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Unable to reach Trust Engine. Please check if the backend is active.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-10 py-4">
        {/* Shimmer header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between animate-pulse">
          <div className="max-w-3xl space-y-3">
            <div className="h-3 w-32 rounded-full bg-white/5 shimmer-skeleton" />
            <div className="h-12 w-96 rounded-2xl bg-white/5 shimmer-skeleton" />
            <div className="h-6 w-80 rounded-xl bg-white/5 shimmer-skeleton" />
          </div>
          <div className="h-10 w-40 rounded-full bg-white/5 shimmer-skeleton" />
        </div>

        {/* Shimmer metric cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-panel-strong section-shell relative overflow-hidden">
              <div className="space-y-4">
                <div className="h-3 w-24 rounded-full bg-white/5 shimmer-skeleton" />
                <div className="h-10 w-20 rounded-xl bg-white/5 shimmer-skeleton" />
                <div className="h-4 w-32 rounded-lg bg-white/5 shimmer-skeleton" />
              </div>
              <div className="absolute right-6 top-6 h-14 w-14 rounded-2xl bg-white/5 shimmer-skeleton" />
            </div>
          ))}
        </div>

        {/* Shimmer table */}
        <div className="glass-panel-strong section-shell">
          <div className="space-y-4 mb-6">
            <div className="h-3 w-32 rounded-full bg-white/5 shimmer-skeleton" />
            <div className="h-8 w-48 rounded-xl bg-white/5 shimmer-skeleton" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/5 shimmer-skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="glass-card-premium p-10 text-center max-w-md relative">
          <div className="ambient-orb -right-10 -top-10 h-32 w-32 bg-rose-400/10 opacity-40" />
          <div className="relative">
            <AlertTriangle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Sync Error</h2>
            <p className="text-slate-400 mb-6">{error || 'Metrics unavailable'}</p>
            <button 
              onClick={() => globalThis.location.reload()}
              className="button-primary px-8"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4">
      <PageHeader
        eyebrow="System Overview"
        title="Environment Posture"
        description="Real-time access intelligence and threat surface monitoring."
      >
        <div className="glass-badge border-emerald-500/30 bg-emerald-500/10 text-emerald-100 px-5 py-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-bold tracking-wide">Live Stream Active</span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Risk Level"
          value={`${metrics.riskScore}%`}
          subtitle="Aggregate threat score"
          icon={AlertTriangle}
          tone="danger"
        />
        <MetricCard
          title="Latest Verdict"
          value={metrics.decision}
          subtitle="Policy engine response"
          icon={ShieldAlert}
          tone="warning"
        />
        <MetricCard
          title="Daily Traffic"
          value={metrics.requestsToday}
          subtitle="Monitored requests"
          icon={Activity}
          tone="info"
        />
        <MetricCard
          title="Integrity Index"
          value={metrics.threatIndex}
          subtitle="Posture stability"
          icon={ShieldCheck}
          tone="success"
        />
      </div>

      <div className="pt-4">
        <RequestsTable requests={requests} />
      </div>
    </div>
  );
}
