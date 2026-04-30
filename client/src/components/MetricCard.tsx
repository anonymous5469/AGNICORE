import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly subtitle: string;
  readonly icon: LucideIcon;
  readonly tone: 'danger' | 'warning' | 'info' | 'success';
}

const toneConfig: Record<MetricCardProps['tone'], {
  iconBg: string;
  iconColor: string;
  accentColor: string;
}> = {
  danger: {
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-400',
    accentColor: '#ff6b5e',
  },
  warning: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    accentColor: '#f3b64d',
  },
  info: {
    iconBg: 'bg-sky-500/10',
    iconColor: 'text-sky-400',
    accentColor: '#73c4ff',
  },
  success: {
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-400',
    accentColor: '#53d68d',
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
    <div className="card p-6 relative overflow-hidden group">
      {/* Top accent line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={{ backgroundColor: config.accentColor }}
      />
      
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-caption">{title}</p>
          <p className="text-4xl font-semibold text-white tracking-tight">
            {value}
          </p>
          <p className="text-sm text-[#8a8a96]">{subtitle}</p>
        </div>
        
        <div className={`p-3 rounded-xl ${config.iconBg} ${config.iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
