import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend, AreaChart, Area,
} from 'recharts';
import { format } from 'date-fns';
import type { SensorReading } from '../../types';

// ── Custom Tooltip ────────────────────────────────────────────

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1 font-mono">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-medium" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Time Series Chart ─────────────────────────────────────────

interface TimeSeriesChartProps {
  readings:          SensorReading[];
  color:             string;
  unit:              string;
  warningThreshold?: number;
  criticalThreshold?: number;
  label?:            string;
  height?:           number;
  areaFill?:         boolean;
}

export function TimeSeriesChart({
  readings, color, unit, warningThreshold, criticalThreshold,
  label = 'Value', height = 180, areaFill = true,
}: TimeSeriesChartProps) {
  const data = readings.map(r => ({
    time:  format(new Date(r.timestamp), 'HH:mm'),
    value: r.value,
  }));

  const ChartComponent = areaFill ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="time"
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          unit={` ${unit}`}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        {warningThreshold != null && (
          <ReferenceLine y={warningThreshold} stroke="#eab308" strokeDasharray="4 2" strokeWidth={1}
            label={{ value: 'WARN', fill: '#eab308', fontSize: 9, position: 'insideTopRight' }} />
        )}
        {criticalThreshold != null && (
          <ReferenceLine y={criticalThreshold} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1}
            label={{ value: 'CRIT', fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
        )}
        {areaFill ? (
          <Area
            type="monotone"
            dataKey="value"
            name={label}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${color.replace('#', '')})`}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        ) : (
          <Line
            type="monotone"
            dataKey="value"
            name={label}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        )}
      </ChartComponent>
    </ResponsiveContainer>
  );
}

// ── Risk Gauge ────────────────────────────────────────────────

interface RiskGaugeProps {
  score:  number;
  size?:  number;
}

export function RiskGauge({ score, size = 120 }: RiskGaugeProps) {
  const color = score >= 86 ? '#ef4444'
    : score >= 71 ? '#f97316'
    : score >= 51 ? '#eab308'
    : score >= 31 ? '#3b82f6'
    : '#22c55e';

  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75; // 270° arc
  const filled = arc * (score / 100);
  const offset = circumference - arc; // start of arc

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.05)"
          strokeWidth={10}
          strokeDasharray={`${arc} ${circumference - arc}`}
          strokeDashoffset={-offset / 2}
          strokeLinecap="round"
          transform={`rotate(135 ${size / 2} ${size / 2})`}
        />
        {/* Filled arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color}
          strokeWidth={10}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={-offset / 2}
          strokeLinecap="round"
          transform={`rotate(135 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Score */}
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
          fill={color} fontSize={size * 0.18} fontWeight="bold" fontFamily="monospace">
          {score}
        </text>
        <text x={size / 2} y={size / 2 + size * 0.18} textAnchor="middle"
          fill="#64748b" fontSize={size * 0.09}>
          / 100
        </text>
      </svg>
    </div>
  );
}

// ── Contribution Bar ──────────────────────────────────────────

interface ContribBarProps {
  label:   string;
  level:   string;
  points:  number;
  maxPts?: number;
  color:   string;
}

export function ContributionBar({ label, level, points, maxPts = 30, color }: ContribBarProps) {
  const pct = Math.min(100, (points / maxPts) * 100);
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${color}22`, color }}>
            {level}
          </span>
          <span className="text-xs font-mono text-slate-500">{points} pts</span>
        </div>
      </div>
      <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
