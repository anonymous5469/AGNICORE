export type Decision = 'ALLOW' | 'VERIFY' | 'DENY';

export interface DecisionAppearance {
  label: string;
  summary: string;
}

export interface AccessRequest {
  id: string;
  user: string;
  ip: string;
  device: string;
  riskScore: number;
  decision: Decision;
  time: string;
  resource: string;
  action: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  trustLabel: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  ip: string;
  device: string;
  riskScore: number;
  decision: Decision;
  location: string;
  resource: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DashboardMetrics {
  riskScore: number;
  decision: Decision;
  requestsToday: number;
  blockedRequests: number;
  verificationQueue: number;
  trustCoverage: string;
  threatIndex: string;
}

export interface SimulationInput {
  device: string;
  location: string;
  requestFrequency: number;
  sensitivity: string;
  action: string;
}

export interface SimulationStage {
  id: string;
  label: string;
  value: string;
  detail: string;
  state: 'neutral' | 'positive' | 'warning' | 'danger';
}

export interface SimulationResult {
  riskScore: number;
  decision: Decision;
  reasons: string[];
  stages: SimulationStage[];
}
