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
        {/* Skeleton header */}
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-white/5 rounded-lg" />
          <div className="h-14 w-[28rem] bg-white/5 rounded-2xl" />
          <div className="h-6 w-80 bg-white/5 rounded-xl" />
        </div>

        {/* Skeleton metric cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-white/[0.03] rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Skeleton table */}
        <div className="space-y-4">
          <div className="h-4 w-40 bg-white/5 rounded-lg" />
          <div className="h-10 w-64 bg-white/5 rounded-xl" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="card p-12 text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-[#ff6b5e] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Sync Error</h2>
          <p className="text-[#8a8a96] mb-8">{error || 'Metrics unavailable'}</p>
          <button 
            onClick={() => globalThis.location.reload()}
            className="btn-primary-v2 px-8"
          >
            Retry Connection
          </button>
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
        <div className="badge-v2 badge-allow px-4 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-semibold">Live Stream Active</span>
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
