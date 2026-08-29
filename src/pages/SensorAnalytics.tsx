import { useState }          from 'react';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge } from '../components/common';
import { TimeSeriesChart }    from '../components/charts';
import { getSensorTypeConfig } from '../config/sensorTypes';
import clsx                   from 'clsx';

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

const TIME_RANGE_POINTS: Record<TimeRange, number> = {
  '1h':  60,
  '6h':  60,   // history array max 120 pts; represent 6h as all available
  '24h': 60,
  '7d':  60,
  '30d': 60,
};

const TYPE_TABS: { type: string; label: string; color: string }[] = [
  { type: 'IPI',          label: 'IPI — Ground Displacement', color: '#8b5cf6' },
  { type: 'VWP',          label: 'VWP — Pore-Water Pressure',  color: '#06b6d4' },
  { type: 'GEOPHONE',     label: 'Geophone — Seismic Activity', color: '#f59e0b' },
  { type: 'EXTENSOMETER', label: 'Extensometer — Displacement', color: '#ec4899' },
];

export default function SensorAnalytics() {
  const { sensors } = useMonitoringStore();
  const [activeType, setActiveType]   = useState<string>('IPI');
  const [timeRange, setTimeRange]     = useState<TimeRange>('1h');
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);

  const typeSensors = sensors.filter(s => s.type === activeType);
  const cfg         = getSensorTypeConfig(activeType);
  const displaySensors = selectedSensor
    ? typeSensors.filter(s => s.id === selectedSensor)
    : typeSensors;

  return (
    <div className="space-y-4">
      {/* ── Sensor Type Tabs ─────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.type}
            onClick={() => { setActiveType(tab.type); setSelectedSensor(null); }}
            className={clsx(
              'px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
              activeType === tab.type ? 'opacity-100' : 'opacity-40 hover:opacity-70',
            )}
            style={{
              borderColor: tab.color,
              background:  activeType === tab.type ? `${tab.color}20` : 'transparent',
              color:       tab.color,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* ── Sensor Selector ────────────────────────────────── */}
        <Card className="p-4 xl:col-span-1">
          <SectionHeader title={activeType + ' Sensors'} subtitle={`${typeSensors.length} deployed`} />
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedSensor(null)}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg text-xs border transition-all',
                selectedSensor === null
                  ? 'border-brand-600/50 bg-brand-600/10 text-brand-400'
                  : 'border-surface-700 text-slate-400 hover:text-slate-200 hover:bg-surface-700',
              )}
            >
              All {activeType} sensors
            </button>
            {typeSensors.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSensor(s.id === selectedSensor ? null : s.id)}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded-lg text-xs border transition-all',
                  selectedSensor === s.id
                    ? 'border-brand-600/50 bg-brand-600/10 text-brand-400'
                    : 'border-surface-700 text-slate-400 hover:text-slate-200 hover:bg-surface-700',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono">{s.id}</span>
                  <StatusBadge level={s.riskLevel} size="xs" showDot={false} />
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5 flex justify-between">
                  <span>{s.substationId}</span>
                  <span className="font-mono">{s.currentValue.toFixed(2)} {s.unit}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* ── Charts ─────────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">
          {/* Time range selector */}
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Time Range:</p>
            {(['1h', '6h', '24h', '7d', '30d'] as TimeRange[]).map(tr => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                  timeRange === tr
                    ? 'bg-brand-600/20 border-brand-600/40 text-brand-400'
                    : 'border-surface-700 text-slate-500 hover:text-slate-300',
                )}
              >
                {tr}
              </button>
            ))}
          </div>

          {/* Sensor charts */}
          {displaySensors.map(sensor => (
            <Card key={sensor.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white font-mono">{sensor.id}</p>
                    <StatusBadge level={sensor.riskLevel} size="xs" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cfg.measurementDescription} · {sensor.substationId} · {cfg.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold font-mono" style={{ color: cfg.color }}>
                    {sensor.currentValue.toFixed(3)}
                  </p>
                  <p className="text-xs text-slate-500">{cfg.unit}</p>
                </div>
              </div>

              <TimeSeriesChart
                readings={sensor.history.slice(-TIME_RANGE_POINTS[timeRange])}
                color={cfg.color}
                unit={cfg.unit}
                warningThreshold={sensor.warningThreshold}
                criticalThreshold={sensor.criticalThreshold}
                label={cfg.measurementDescription}
                height={200}
              />

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-surface-700 text-xs">
                <div className="text-center">
                  <p className="text-slate-500">Warning</p>
                  <p className="font-mono font-semibold text-yellow-400">{sensor.warningThreshold} {cfg.unit}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">Critical</p>
                  <p className="font-mono font-semibold text-red-400">{sensor.criticalThreshold} {cfg.unit}</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500">Battery</p>
                  <p className="font-mono font-semibold text-slate-300">{sensor.batteryLevel.toFixed(0)}%</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
