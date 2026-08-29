import { ReactNode } from 'react';
import { getRiskLevelConfig } from '../../config/thresholds';
import type { RiskLevel } from '../../types';
import clsx from 'clsx';

// ── Status Badge ──────────────────────────────────────────────

interface StatusBadgeProps {
  level: RiskLevel;
  showDot?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export function StatusBadge({ level, showDot = true, size = 'sm' }: StatusBadgeProps) {
  const cfg  = getRiskLevelConfig(level);
  const sizes = { xs: 'text-[10px] px-1.5 py-0.5', sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1' };
  return (
    <span
      className={clsx('inline-flex items-center gap-1.5 font-semibold rounded-full border', sizes[size])}
      style={{ background: cfg.bgColor, borderColor: cfg.borderColor, color: cfg.textColor }}
    >
      {showDot && (
        <span className={clsx('rounded-full shrink-0', level === 'CRITICAL' ? 'w-2 h-2 animate-ping-slow' : 'w-1.5 h-1.5')}
          style={{ background: cfg.color }} />
      )}
      {cfg.label}
    </span>
  );
}

// ── Communication Status Badge ────────────────────────────────

interface CommBadgeProps { status: string; }
export function CommBadge({ status }: CommBadgeProps) {
  const cfg: Record<string, { bg: string; text: string; dot: string }> = {
    ONLINE:   { bg: 'bg-green-500/10 border-green-500/30',   text: 'text-green-400', dot: 'bg-green-400' },
    OFFLINE:  { bg: 'bg-red-500/10 border-red-500/30',       text: 'text-red-400',   dot: 'bg-red-400' },
    DEGRADED: { bg: 'bg-yellow-500/10 border-yellow-500/30', text: 'text-yellow-400',dot: 'bg-yellow-400' },
    UNKNOWN:  { bg: 'bg-slate-500/10 border-slate-500/30',   text: 'text-slate-400', dot: 'bg-slate-400' },
  };
  const c = cfg[status] ?? cfg.UNKNOWN;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border', c.bg, c.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', c.dot)} />
      {status}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────

interface KPICardProps {
  title:       string;
  value:       string | number;
  subtitle?:   string;
  icon?:       ReactNode;
  trend?:      'up' | 'down' | 'stable';
  riskLevel?:  RiskLevel;
  color?:      string;
  className?:  string;
  children?:   ReactNode;
}

export function KPICard({
  title, value, subtitle, icon, riskLevel, color, className, children
}: KPICardProps) {
  const cfg = riskLevel ? getRiskLevelConfig(riskLevel) : null;

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02]',
        cfg ? '' : 'bg-surface-800 border-surface-700 hover:border-surface-600',
        className,
      )}
      style={cfg ? {
        background:   cfg.bgColor,
        borderColor:  cfg.borderColor,
      } : undefined}
    >
      {/* Decorative corner glow */}
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20 blur-xl"
        style={{ background: cfg?.color ?? color ?? '#0ea5e9' }}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          {icon && (
            <div className="p-1.5 rounded-lg" style={{ background: (cfg?.bgColor ?? 'rgba(14,165,233,0.1)') }}>
              <span style={{ color: cfg?.color ?? color ?? '#0ea5e9' }}>{icon}</span>
            </div>
          )}
        </div>
        <p
          className="text-2xl font-bold mb-0.5"
          style={{ color: cfg?.textColor ?? 'white' }}
        >
          {value}
        </p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────

export function SectionHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-base font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('bg-surface-800 border border-surface-700 rounded-xl', className)}>
      {children}
    </div>
  );
}

// ── Loading Spinner ───────────────────────────────────────────

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={clsx('border-2 border-brand-600 border-t-transparent rounded-full animate-spin', s[size])} />
  );
}

// ── Empty State ───────────────────────────────────────────────

export function EmptyState({ icon, title, subtitle }: { icon?: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-slate-600 mb-3">{icon}</div>}
      <p className="text-sm font-medium text-slate-400">{title}</p>
      {subtitle && <p className="text-xs text-slate-600 mt-1">{subtitle}</p>}
    </div>
  );
}

// ── Metric Row ────────────────────────────────────────────────

export function MetricRow({ label, value, unit, highlight }: {
  label: string; value: string | number; unit?: string; highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-surface-700 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={clsx('text-xs font-mono font-medium', highlight ? 'text-brand-400' : 'text-slate-300')}>
        {value}{unit && <span className="text-slate-500 ml-1">{unit}</span>}
      </span>
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────

export function ProgressBar({ value, max = 100, color = '#0ea5e9', label }: {
  value: number; max?: number; color?: string; label?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">{label}</span>
          <span className="font-mono text-slate-400">{pct}%</span>
        </div>
      )}
      <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
