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
  const sizes = { xs: 'text-[10px] px-2 py-0.5', sm: 'text-xs px-2.5 py-1', md: 'text-sm px-3 py-1' };
  
  // Create a darker text color for pastel backgrounds
  const textColors = {
    NORMAL: '#166534',
    WATCH: '#1e40af',
    WARNING: '#854d0e',
    HIGH_RISK: '#9a3412',
    CRITICAL: '#991b1b',
  };
  
  return (
    <span
      className={clsx('inline-flex items-center gap-1.5 font-semibold rounded-full border', sizes[size])}
      style={{ background: cfg.bgColor, borderColor: cfg.borderColor, color: textColors[level] ?? cfg.textColor }}
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
  const cfg: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    ONLINE:   { bg: 'bg-green-50',   text: 'text-green-700', dot: 'bg-green-500', border: 'border-green-200' },
    OFFLINE:  { bg: 'bg-red-50',     text: 'text-red-700',   dot: 'bg-red-500',   border: 'border-red-200' },
    DEGRADED: { bg: 'bg-yellow-50',  text: 'text-yellow-700',dot: 'bg-yellow-500',border: 'border-yellow-200' },
    UNKNOWN:  { bg: 'bg-slate-50',   text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' },
  };
  const c = cfg[status] ?? cfg.UNKNOWN;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border', c.bg, c.border, c.text)}>
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
        'relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1',
        cfg ? '' : 'bg-white border-surface-750 hover:shadow-md',
        className,
      )}
      style={cfg ? {
        background:   cfg.bgColor,
        borderColor:  cfg.borderColor,
      } : undefined}
    >
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
          {icon && (
            <div className="p-1.5 rounded-lg" style={{ background: (cfg?.bgColor ?? 'rgba(14,165,233,0.1)') }}>
              <span style={{ color: cfg?.color ?? color ?? '#0ea5e9' }}>{icon}</span>
            </div>
          )}
        </div>
        <p
          className="text-3xl font-black mb-1"
          style={{ color: cfg ? '#111827' : '#0f172a' }} /* slate-900 */
        >
          {value}
        </p>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────

export function SectionHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-5 mt-8 first:mt-0">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────

export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={clsx('bg-white border border-surface-750 shadow-sm rounded-xl', className)} style={style}>
      {children}
    </div>
  );
}

// ── Loading Spinner ───────────────────────────────────────────

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={clsx('border-2 border-brand-500 border-t-transparent rounded-full animate-spin', s[size])} />
  );
}

// ── Empty State ───────────────────────────────────────────────

export function EmptyState({ icon, title, subtitle }: { icon?: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-slate-400 mb-3">{icon}</div>}
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// ── Metric Row ────────────────────────────────────────────────

export function MetricRow({ label, value, unit, highlight }: {
  label: string; value: string | number; unit?: string; highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-750 last:border-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className={clsx('text-xs font-mono font-bold', highlight ? 'text-brand-600' : 'text-slate-700')}>
        {value}{unit && <span className="text-slate-400 ml-1">{unit}</span>}
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
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-600 font-medium">{label}</span>
          <span className="font-mono text-slate-500">{pct}%</span>
        </div>
      )}
      <div className="h-2 bg-surface-750 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export * from './EventStream';
export * from './PacketAnimator';
