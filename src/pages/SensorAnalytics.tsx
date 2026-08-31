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
      <div className="flex gap-3 flex-wrap">
        {TYPE_TABS.map(tab => (
          <button
            key={tab.type}
            onClick={() => { setActiveType(tab.type); setSelectedSensor(null); }}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm',
              activeType === tab.type ? 'opacity-100' : 'opacity-60 hover:opacity-100 bg-white',
            )}
            style={{
              borderColor: activeType === tab.type ? tab.color : '#e2e8f0',
              background:  activeType === tab.type ? `${tab.color}15` : 'white',
              color:       activeType === tab.type ? tab.color : '#64748b',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ── Sensor Selector ────────────────────────────────── */}
        <Card className="p-5 xl:col-span-1 border-slate-200 shadow-sm bg-slate-50">
          <SectionHeader title={activeType + ' Sensors'} subtitle={`${typeSensors.length} deployed`} />
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            <button
              onClick={() => setSelectedSensor(null)}
              className={clsx(
                'w-full text-left px-4 py-3 rounded-xl text-xs font-bold border transition-all shadow-sm',
                selectedSensor === null
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-100',
              )}
            >
              All {activeType} sensors
            </button>
            {typeSensors.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSensor(s.id === selectedSensor ? null : s.id)}
                className={clsx(
                  'w-full text-left px-4 py-3 rounded-xl text-xs border transition-all shadow-sm',
                  selectedSensor === s.id
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-100',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={clsx('font-mono font-bold', selectedSensor === s.id ? 'text-brand-700' : 'text-slate-700')}>{s.id}</span>
                  <StatusBadge level={s.riskLevel} size="xs" showDot={false} />
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-1 flex justify-between uppercase tracking-widest">
                  <span>{s.substationId}</span>
                  <span className="font-mono text-slate-500">{s.currentValue.toFixed(2)} {s.unit}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* ── Charts ─────────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-6">
          {/* Time range selector */}
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Time Range:</p>
            <div className="flex gap-2">
              {(['1h', '6h', '24h', '7d', '30d'] as TimeRange[]).map(tr => (
                <button
                  key={tr}
                  onClick={() => setTimeRange(tr)}
                  className={clsx(
                    'px-4 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm',
                    timeRange === tr
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                  )}
                >
                  {tr}
                </button>
              ))}
            </div>
          </div>

          {/* Sensor charts */}
          <div className="space-y-6">
            {displaySensors.map(sensor => (
              <Card key={sensor.id} className="p-6">
                <div className="flex flex-wrap items-center justify-between mb-5 gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-base font-black text-slate-900 font-mono">{sensor.id}</p>
                      <StatusBadge level={sensor.riskLevel} size="xs" />
                    </div>
                    <p className="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-widest">
                      {cfg.measurementDescription} · {sensor.substationId} · {cfg.unit}
                    </p>
                  </div>
                  <div className="text-right bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                    <p className="text-2xl font-black font-mono tracking-tight" style={{ color: cfg.color }}>
                      {sensor.currentValue.toFixed(3)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{cfg.unit}</p>
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                  <TimeSeriesChart
                    readings={sensor.history.slice(-TIME_RANGE_POINTS[timeRange])}
                    color={cfg.color}
                    unit={cfg.unit}
                    warningThreshold={sensor.warningThreshold}
                    criticalThreshold={sensor.criticalThreshold}
                    label={cfg.measurementDescription}
                    height={220}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100 text-xs">
                  <div className="text-center bg-slate-50 py-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Warning</p>
                    <p className="font-mono font-black text-yellow-600">{sensor.warningThreshold} <span className="text-slate-400 text-[10px]">{cfg.unit}</span></p>
                  </div>
                  <div className="text-center bg-slate-50 py-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Critical</p>
                    <p className="font-mono font-black text-red-600">{sensor.criticalThreshold} <span className="text-slate-400 text-[10px]">{cfg.unit}</span></p>
                  </div>
                  <div className="text-center bg-slate-50 py-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Battery</p>
                    <p className="font-mono font-black text-slate-700">{sensor.batteryLevel.toFixed(0)}%</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
