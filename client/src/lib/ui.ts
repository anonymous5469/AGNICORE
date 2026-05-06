import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Decision } from '../types';

export interface DecisionMeta {
  badgeClassName: string;
  glowClassName: string;
  icon: LucideIcon;
  label: string;
  accentColor: string;
}

export interface RiskMeta {
  label: 'Low' | 'Moderate' | 'High';
  toneClassName: string;
  meterClassName: string;
}

export function getDecisionMeta(decision: Decision): DecisionMeta {
  switch (decision) {
    case 'ALLOW':
      return {
        badgeClassName: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
        glowClassName: 'shadow-[0_0_32px_rgba(83,214,141,0.2)]',
        icon: ShieldCheck,
        label: 'Access Allowed',
        accentColor: '#53d68d',
      };
    case 'VERIFY':
      return {
        badgeClassName: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
        glowClassName: 'shadow-[0_0_32px_rgba(243,182,77,0.22)]',
        icon: ShieldAlert,
        label: 'Step-up Verification',
        accentColor: '#f3b64d',
      };
    case 'DENY':
      return {
        badgeClassName: 'border-rose-300/20 bg-rose-400/10 text-rose-100',
        glowClassName: 'shadow-[0_0_32px_rgba(255,107,94,0.24)]',
        icon: ShieldX,
        label: 'Access Denied',
        accentColor: '#ff6b5e',
      };
  }
}

export function getRiskMeta(score: number): RiskMeta {
  if (score <= 30) {
    return {
      label: 'Low',
      toneClassName: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200',
      meterClassName: 'from-emerald-400 to-emerald-200',
    };
  }

  if (score <= 60) {
    return {
      label: 'Moderate',
      toneClassName: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
      meterClassName: 'from-amber-400 to-orange-300',
    };
  }

  return {
    label: 'High',
    toneClassName: 'border-rose-300/20 bg-rose-400/10 text-rose-100',
    meterClassName: 'from-rose-400 to-red-300',
  };
}

export function formatPageTitle(page: string): string {
  switch (page) {
    case 'simulation':
      return 'Access Simulation';
    case 'logs':
      return 'Security Logs';
    case 'dashboard':
    default:
      return 'Trust Dashboard';
  }
}
