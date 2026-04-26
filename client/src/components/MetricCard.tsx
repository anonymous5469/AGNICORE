import { LucideIcon } from 'lucide-react';

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
  glowClass: string;
  borderGradient: string;
}> = {
  danger: {
    gradient: 'from-rose-400/20 to-red-500/5',
    textColor: 'text-rose-100',
    glowClass: 'group-hover:shadow-[0_0_30px_rgba(255,107,94,0.3)]',
    borderGradient: 'from-rose-400/30 via-rose-400/10 to-transparent',
  },
  warning: {
    gradient: 'from-amber-300/20 to-orange-400/5',
    textColor: 'text-amber-100',
    glowClass: 'group-hover:shadow-[0_0_30px_rgba(243,182,77,0.3)]',
    borderGradient: 'from-amber-400/30 via-amber-400/10 to-transparent',
  },
  info: {
    gradient: 'from-sky-300/20 to-cyan-400/5',
    textColor: 'text-cyan-100',
    glowClass: 'group-hover:shadow-[0_0_30px_rgba(115,196,255,0.3)]',
    borderGradient: 'from-sky-400/30 via-sky-400/10 to-transparent',
  },
  success: {
    gradient: 'from-emerald-300/20 to-green-400/5',
    textColor: 'text-emerald-100',
    glowClass: 'group-hover:shadow-[0_0_30px_rgba(83,214,141,0.3)]',
    borderGradient: 'from-emerald-400/30 via-emerald-400/10 to-transparent',
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
    <div className="group relative">
      {/* Gradient Border Effect */}
      <div className={`absolute -inset-[1px] rounded-[28px] bg-gradient-to-br ${config.borderGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]`} />
      
      <div className={`glass-card-premium p-6 relative ${config.glowClass} transition-shadow duration-500`}>
        {/* Top accent line */}
        <div className={`absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r ${config.gradient} opacity-60`} />
        
        {/* Ambient orb */}
        <div className={`ambient-orb -right-4 -top-4 h-24 w-24 bg-gradient-to-br ${config.gradient} opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
        
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="eyebrow">{title}</p>
            <div className="space-y-1">
              <p className="text-3xl font-bold tracking-tight text-white group-hover:gradient-text transition-all duration-300">
                {value}
              </p>
              <p className="text-sm text-slate-400">{subtitle}</p>
            </div>
          </div>
          
          {/* Icon with glass container */}
          <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${config.gradient} backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-6 w-6 ${config.textColor}`} />
            
            {/* Icon glow */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500`} />
          </div>
        </div>
        
        {/* Bottom shimmer on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
}
