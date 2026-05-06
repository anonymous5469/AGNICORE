import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly subtitle: string;
  readonly icon: LucideIcon;
  readonly tone: 'danger' | 'warning' | 'info' | 'success';
}

const toneConfig: Record<MetricCardProps['tone'], {
  gradient: string;
  textColor: string;
  glowColor: string;
}> = {
  danger: {
    gradient: 'from-red-500/20 to-red-600/5',
    textColor: 'text-red-400',
    glowColor: 'rgba(239,68,68,0.3)',
  },
  warning: {
    gradient: 'from-amber-500/20 to-amber-600/5',
    textColor: 'text-amber-400',
    glowColor: 'rgba(245,158,11,0.3)',
  },
  info: {
    gradient: 'from-blue-500/20 to-blue-600/5',
    textColor: 'text-blue-400',
    glowColor: 'rgba(59,130,246,0.3)',
  },
  success: {
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    textColor: 'text-emerald-400',
    glowColor: 'rgba(16,185,129,0.3)',
  },
};

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: MetricCardProps) {
  const config = toneConfig[tone];

  return (
    <motion.div 
      className="glass p-6 relative overflow-hidden group cursor-pointer"
      whileHover={{ 
        y: -4,
        boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 30px ${config.glowColor}`
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Top accent line */}
      <div 
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${config.gradient}`}
      />
      
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            {title}
          </p>
          <p className="text-4xl font-bold text-white tracking-tight">
            {value}
          </p>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        
        <div className={`p-3 rounded-xl bg-gradient-to-br ${config.gradient}`}>
          <Icon className={`h-5 w-5 ${config.textColor}`} />
        </div>
      </div>
    </motion.div>
  );
}
