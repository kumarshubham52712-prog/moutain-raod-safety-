import { useState }            from 'react';
import { useNavigate }         from 'react-router-dom';
import { useMonitoringStore }  from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge, CommBadge, ProgressBar, MetricRow } from '../components/common';
import { getRiskLevelConfig }  from '../config/thresholds';
import { getSensorTypeConfig } from '../config/sensorTypes';
import { format }              from 'date-fns';
import { ChevronRight, Wifi }  from 'lucide-react';
import clsx                    from 'clsx';

export default function Substations() {
  const { substations, sensors } = useMonitoringStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedSub = substations.find(s => s.id === selected);
  const selectedSubSensors = selectedSub
    ? sensors.filter(s => selectedSub.sensorIds.includes(s.id))
    : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ── Substation List ──────────────────────────────────── */}
        <div className="xl:col-span-1">
          <Card className="p-4">
            <SectionHeader title="All Substations" subtitle={`${substations.length} edge nodes`} />
            <div className="space-y-2">
              {substations.map(sub => {
                const cfg = getRiskLevelConfig(sub.riskLevel);
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelected(sub.id === selected ? null : sub.id)}
                    className={clsx(
                      'w-full text-left px-3 py-3 rounded-lg border transition-all hover:scale-[1.01]',
                      selected === sub.id
                        ? 'border-brand-500/50 bg-brand-600/10'
                        : 'border-surface-700 hover:border-slate-600 bg-surface-900/40',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Wifi size={14} style={{ color: cfg.color }} />
                        <span className="text-sm font-bold font-mono text-white">{sub.id}</span>
                      </div>
                      <StatusBadge level={sub.riskLevel} size="xs" />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>{sub.sensorIds.length} sensors</span>
                      <CommBadge status={sub.communicationStatus} />
                    </div>
                    <ProgressBar value={sub.loraSignal} label="LoRa Signal" color="#06b6d4" />
                    <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                      <span>Risk: {sub.riskScore}/100</span>
                      <span>Battery: {sub.batteryLevel.toFixed(0)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ── Substation Detail ────────────────────────────────── */}
        <div className="xl:col-span-2">
          {!selectedSub ? (
            <Card className="p-8 flex flex-col items-center justify-center h-full min-h-64">
              <Wifi size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">Select a substation to view details</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <Card className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-bold font-mono text-white">{selectedSub.id}</h2>
                      <StatusBadge level={selectedSub.riskLevel} />
                      <CommBadge status={selectedSub.communicationStatus} />
                    </div>
                    <p className="text-xs text-slate-500">
                      Connected to {selectedSub.masterStationId} · {selectedSub.loraFrequency}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold font-mono" style={{ color: getRiskLevelConfig(selectedSub.riskLevel).color }}>
                      {selectedSub.riskScore}
                    </p>
                    <p className="text-xs text-slate-500">Risk Score</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MetricRow label="LoRa Signal"     value={selectedSub.loraSignal}            unit="%" />
                  <MetricRow label="Battery"          value={selectedSub.batteryLevel.toFixed(0)} unit="%" />
                  <MetricRow label="Power Status"     value={selectedSub.powerStatus} />
                  <MetricRow label="Processor Load"   value={selectedSub.processorLoad}          unit="%" />
                  <MetricRow label="Packets Received" value={selectedSub.packetsReceived.toLocaleString()} />
                  <MetricRow label="Packets Lost"     value={selectedSub.packetsLost} />
                  <MetricRow label="Data Rate"        value={selectedSub.dataRate} unit=" kbps" />
                  <MetricRow label="Last Sync"        value={format(new Date(selectedSub.lastSync), 'HH:mm:ss')} />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <ProgressBar value={selectedSub.loraSignal}   label="LoRa Signal"   color="#06b6d4" />
                  <ProgressBar value={selectedSub.batteryLevel} label="Battery Level"  color="#22c55e" />
                </div>
              </Card>

              {/* Sensor Table */}
              <Card className="p-4">
                <SectionHeader
                  title="Connected Sensors"
                  subtitle={`${selectedSubSensors.length} sensors at this substation`}
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-surface-700">
                        {['Sensor ID', 'Type', 'Current Value', 'Unit', 'Warning', 'Critical', 'Status', 'Battery', 'Signal', 'Updated'].map(h => (
                          <th key={h} className="text-left py-2 px-2 text-slate-500 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSubSensors.map(sensor => {
                        const cfg   = getSensorTypeConfig(sensor.type);
                        const rCfg  = getRiskLevelConfig(sensor.riskLevel);
                        return (
                          <tr
                            key={sensor.id}
                            className="border-b border-surface-800 hover:bg-surface-700/30 transition-colors"
                          >
                            <td className="py-2 px-2 font-mono font-semibold text-white">{sensor.id}</td>
                            <td className="py-2 px-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                style={{ background: `${cfg.color}20`, color: cfg.color }}>
                                {sensor.type}
                              </span>
                            </td>
                            <td className="py-2 px-2 font-mono font-bold" style={{ color: rCfg.color }}>
                              {sensor.currentValue.toFixed(3)}
                            </td>
                            <td className="py-2 px-2 text-slate-500">{sensor.unit}</td>
                            <td className="py-2 px-2 font-mono text-yellow-400">{sensor.warningThreshold}</td>
                            <td className="py-2 px-2 font-mono text-red-400">{sensor.criticalThreshold}</td>
                            <td className="py-2 px-2"><StatusBadge level={sensor.riskLevel} size="xs" /></td>
                            <td className="py-2 px-2 font-mono text-slate-400">{sensor.batteryLevel.toFixed(0)}%</td>
                            <td className="py-2 px-2 font-mono text-slate-400">{sensor.signalStrength}%</td>
                            <td className="py-2 px-2 font-mono text-slate-600 whitespace-nowrap">
                              {format(new Date(sensor.timestamp), 'HH:mm:ss')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
