import { useState }            from 'react';
import { useMonitoringStore }  from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge } from '../components/common';
import { RiskGauge, ContributionBar } from '../components/charts';
import { getRiskLevelConfig }  from '../config/thresholds';
import { buildRiskAssessment } from '../services/riskEngine';
import { getSensorTypeConfig } from '../config/sensorTypes';
import { format }              from 'date-fns';
import { AlertTriangle, MapPin, Clock, Shield } from 'lucide-react';
import clsx                    from 'clsx';

export default function DangerZones() {
  const { dangerZones, sensors } = useMonitoringStore();
  const [selected, setSelected] = useState<string | null>(dangerZones[0]?.id ?? null);

  const selectedZone = dangerZones.find(z => z.id === selected);
  const zoneSensors  = selectedZone
    ? sensors.filter(s => selectedZone.triggeringSensorIds.includes(s.id))
    : [];
  const assessment   = selectedZone ? buildRiskAssessment(selectedZone.id, zoneSensors) : null;

  // Sort zones by risk descending
  const sortedZones = [...dangerZones].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ── Zone List ────────────────────────────────────────── */}
        <div className="xl:col-span-1">
          <Card className="p-4">
            <SectionHeader title="Danger Zones" subtitle={`${dangerZones.length} monitored zones`} />
            <div className="space-y-2">
              {sortedZones.map(zone => {
                const cfg = getRiskLevelConfig(zone.riskLevel);
                return (
                  <button
                    key={zone.id}
                    onClick={() => setSelected(zone.id)}
                    className={clsx(
                      'w-full text-left px-3 py-3 rounded-lg border transition-all hover:scale-[1.01]',
                      selected === zone.id
                        ? 'bg-surface-700/50'
                        : 'bg-surface-900/30 hover:bg-surface-800',
                    )}
                    style={{ borderColor: cfg.borderColor }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx('w-2.5 h-2.5 rounded-full shrink-0', zone.riskLevel === 'CRITICAL' && 'animate-ping-slow')}
                          style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}60` }}
                        />
                        <span className="text-sm font-bold font-mono text-white">{zone.id}</span>
                      </div>
                      <StatusBadge level={zone.riskLevel} size="xs" />
                    </div>
                    <p className="text-xs text-slate-400 truncate mb-1">{zone.name}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-600">
                      <span>Score: <span className="font-mono font-bold" style={{ color: cfg.color }}>{zone.riskScore}</span>/100</span>
                      <span>{zone.abnormalSensorCount} abnormal sensors</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ── Zone Detail ──────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          {!selectedZone ? (
            <Card className="p-8 flex flex-col items-center justify-center min-h-64">
              <AlertTriangle size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">Select a danger zone to inspect</p>
            </Card>
          ) : (
            <>
              {/* Header */}
              <Card className="p-5">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold font-mono text-white">{selectedZone.id}</h2>
                      <StatusBadge level={selectedZone.riskLevel} size="md" />
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-semibold',
                        selectedZone.status === 'ACTIVE'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
                      )}>
                        {selectedZone.status}
                      </span>
                    </div>
                    <p className="text-sm text-white font-medium mb-1">{selectedZone.name}</p>
                    <p className="text-xs text-slate-500 mb-3">{selectedZone.description}</p>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin size={12} /> Lat: {selectedZone.latitude.toFixed(4)}, Lon: {selectedZone.longitude.toFixed(4)}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Shield size={12} /> Radius: {selectedZone.radius}m / Evacuation: {selectedZone.evacuationRadius}m
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock size={12} /> Detected: {format(new Date(selectedZone.timeDetected), 'dd MMM, HH:mm')}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <AlertTriangle size={12} /> {selectedZone.abnormalSensorCount} abnormal / {selectedZone.triggeringSensorIds.length} monitored
                      </div>
                    </div>
                  </div>
                  <RiskGauge score={selectedZone.riskScore} size={110} />
                </div>

                {/* Recommended Action */}
                <div
                  className="mt-4 px-4 py-3 rounded-lg border text-sm font-semibold"
                  style={{
                    background: getRiskLevelConfig(selectedZone.riskLevel).bgColor,
                    borderColor: getRiskLevelConfig(selectedZone.riskLevel).borderColor,
                    color: getRiskLevelConfig(selectedZone.riskLevel).textColor,
                  }}
                >
                  ⚡ Recommended Action: {selectedZone.recommendedAction}
                </div>
              </Card>

              {/* AI Risk Assessment */}
              {assessment && (
                <Card className="p-5">
                  <SectionHeader
                    title="AI Risk Assessment"
                    subtitle="Rule-based transparency — why this score exists"
                  />
                  <p className="text-xs text-slate-400 mb-4 bg-surface-900 rounded-lg px-3 py-2 border border-surface-700">
                    {assessment.summary}
                  </p>

                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">
                    Individual Sensor Contributions
                  </p>

                  {assessment.contributors.length === 0 ? (
                    <p className="text-xs text-slate-600 py-4 text-center">
                      No sensors assigned to this zone.
                    </p>
                  ) : assessment.contributors.map(c => {
                    const typeColor: Record<string, string> = {
                      IPI: '#8b5cf6', VWP: '#06b6d4', GEOPHONE: '#f59e0b', EXTENSOMETER: '#ec4899',
                    };
                    const levelColor: Record<string, string> = {
                      LOW: '#22c55e', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444',
                    };
                    return (
                      <div key={c.sensorId} className="mb-4 last:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-white">{c.sensorId}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                            style={{ background: `${typeColor[c.sensorType]}20`, color: typeColor[c.sensorType] }}>
                            {c.sensorType}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono ml-auto">
                            {c.currentValue.toFixed(2)} {c.unit}
                          </span>
                        </div>
                        <ContributionBar
                          label={c.reason}
                          level={c.contributionLevel}
                          points={c.contributionPoints}
                          color={levelColor[c.contributionLevel] ?? '#22c55e'}
                        />
                      </div>
                    );
                  })}
                </Card>
              )}

              {/* Triggering Sensors Table */}
              {zoneSensors.length > 0 && (
                <Card className="p-4">
                  <SectionHeader title="Triggering Sensors" subtitle="Sensors contributing to this zone's risk" />
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-surface-700">
                          {['Sensor', 'Type', 'Value', 'Warning', 'Critical', 'Status', 'Substation'].map(h => (
                            <th key={h} className="text-left py-2 px-2 text-slate-500 font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {zoneSensors.map(s => {
                          const rc = getRiskLevelConfig(s.riskLevel);
                          return (
                            <tr key={s.id} className="border-b border-surface-800 hover:bg-surface-700/30">
                              <td className="py-2 px-2 font-mono font-bold text-white">{s.id}</td>
                              <td className="py-2 px-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                  style={{ background: `${getSensorTypeConfig(s.type).color}20`, color: getSensorTypeConfig(s.type).color }}>
                                  {s.type}
                                </span>
                              </td>
                              <td className="py-2 px-2 font-mono font-bold" style={{ color: rc.color }}>
                                {s.currentValue.toFixed(3)} {s.unit}
                              </td>
                              <td className="py-2 px-2 font-mono text-yellow-400">{s.warningThreshold}</td>
                              <td className="py-2 px-2 font-mono text-red-400">{s.criticalThreshold}</td>
                              <td className="py-2 px-2"><StatusBadge level={s.riskLevel} size="xs" /></td>
                              <td className="py-2 px-2 font-mono text-slate-500">{s.substationId}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
