import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface SafetyScoreBadgeProps {
  score: number; // 0 - 100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const SafetyScoreBadge: React.FC<SafetyScoreBadgeProps> = ({
  score,
  showLabel = true,
  size = 'md',
}) => {
  let colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let Icon = ShieldCheck;
  let label = 'Segurança Alta';

  if (score < 55) {
    colorClasses = 'bg-red-500/10 text-red-400 border-red-500/30';
    Icon = ShieldX;
    label = 'Risco Crítico';
  } else if (score < 80) {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    Icon = ShieldAlert;
    label = 'Atenção Moderada';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-full border backdrop-blur-sm ${colorClasses} ${sizeClasses} font-mono`}
      title={`Índice de Segurança: ${score}/100`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      <span>{score}/100</span>
      {showLabel && (
        <span className="font-sans text-xs opacity-90 border-l border-current/20 pl-1.5 ml-0.5">
          {label}
        </span>
      )}
    </div>
  );
};
