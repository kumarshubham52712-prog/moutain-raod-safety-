import { useState }          from 'react';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge, CommBadge } from '../components/common';
import { getRiskLevelConfig }  from '../config/thresholds';
import { getSensorTypeConfig } from '../config/sensorTypes';
import { format }              from 'date-fns';
import clsx                    from 'clsx';

interface NodeDetail {
  type:  'sensor' | 'substation' | 'master';
  id:    string;
}

export default function NetworkTopology() {
  const { sensors, substations, masterStation } = useMonitoringStore();
  const [selected, setSelected] = useState<NodeDetail | null>(null);

  const selectedSensor     = selected?.type === 'sensor'     ? sensors.find(s => s.id === selected.id) : null;
  const selectedSubstation = selected?.type === 'substation' ? substations.find(s => s.id === selected.id) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ── Topology Graph ─────────────────────────────────── */}
        <div className="xl:col-span-2">
          <Card className="p-4">
            <SectionHeader
              title="Network Topology"
              subtitle="Sensor → Substation → Master Station hierarchy"
            />

            {/* Master Station */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setSelected({ type: 'master', id: masterStation.id })}
                className={clsx(
                  'px-6 py-3 rounded-xl border-2 transition-all hover:scale-105',
                  selected?.id === masterStation.id
                    ? 'border-brand-500 bg-brand-600/20 shadow-glow-blue'
                    : 'border-blue-500/40 bg-blue-500/10 hover:border-blue-400',
                )}
              >
                <p className="text-xs font-bold text-blue-400 mb-0.5">🖥️ {masterStation.id}</p>
                <p className="text-[10px] text-slate-400">{masterStation.name}</p>
                <div className="flex items-center gap-2 mt-1.5 justify-center">
                  <CommBadge status={masterStation.communicationStatus} />
                  <StatusBadge level={masterStation.riskLevel} size="xs" />
                </div>
              </button>
            </div>

            {/* Connector to substations */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <div className="w-px h-6 bg-slate-700" />
              </div>
            </div>

            {/* Substations Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              {substations.map(sub => {
                const subCfg = getRiskLevelConfig(sub.riskLevel);
                const isSelected = selected?.id === sub.id;
                return (
                  <div key={sub.id} className="flex flex-col items-center gap-2">
                    {/* Vertical connector from master */}
                    <div className="w-px h-4 bg-slate-700" />
                    <button
                      onClick={() => setSelected({ type: 'substation', id: sub.id })}
                      className={clsx(
                        'w-full px-2 py-2 rounded-lg border transition-all hover:scale-105 text-center',
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/20 shadow-glow-blue'
                          : 'hover:border-slate-500',
                      )}
                      style={{
                        borderColor: isSelected ? undefined : subCfg.borderColor,
                        background:  isSelected ? undefined : subCfg.bgColor,
                      }}
                    >
                      <p className="text-[10px] font-bold" style={{ color: subCfg.textColor }}>
                        📡 {sub.id}
                      </p>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {sub.sensorIds.length} sensors
                      </p>
                      <p className="text-[9px] text-slate-500">
                        LoRa {sub.loraSignal}%
                      </p>
                    </button>

                    {/* Sensor nodes below each substation */}
                    <div className="flex gap-1 flex-wrap justify-center">
                      {sub.sensorIds.map(sId => {
                        const sensor = sensors.find(s => s.id === sId);
                        if (!sensor) return null;
                        const sCfg = getRiskLevelConfig(sensor.riskLevel);
                        const typeColors: Record<string, string> = {
                          IPI: '#8b5cf6', VWP: '#06b6d4', GEOPHONE: '#f59e0b', EXTENSOMETER: '#ec4899',
                        };
                        return (
                          <button
                            key={sId}
                            onClick={() => setSelected({ type: 'sensor', id: sId })}
                            className={clsx(
                              'w-8 h-8 rounded-lg border text-[8px] font-mono font-bold transition-all hover:scale-110',
                              selected?.id === sId ? 'scale-110' : '',
                            )}
                            style={{
                              borderColor: sensor.riskLevel !== 'NORMAL' ? sCfg.color : typeColors[sensor.type],
                              background:  `${typeColors[sensor.type]}20`,
                              color:       typeColors[sensor.type],
                              boxShadow:   sensor.riskLevel !== 'NORMAL' ? `0 0 8px ${sCfg.color}60` : 'none',
                            }}
                            title={`${sId}: ${sensor.currentValue.toFixed(2)} ${sensor.unit}`}
                          >
                            {sId.split('-')[0][0]}{sId.split('-')[1]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-surface-700">
              {[
                { color: '#8b5cf6', label: 'IPI' },
                { color: '#06b6d4', label: 'VWP' },
                { color: '#f59e0b', label: 'Geophone' },
                { color: '#ec4899', label: 'Extensometer' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <div className="w-3 h-3 rounded" style={{ background: `${l.color}40`, border: `1px solid ${l.color}` }} />
                  {l.label}
                </div>
              ))}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse-slow" />
                Abnormal
              </div>
            </div>
          </Card>
        </div>

        {/* ── Detail Panel ────────────────────────────────────── */}
        <div>
          <Card className="p-4 sticky top-20">
            <SectionHeader title="Node Details" subtitle={selected?.id ?? 'Click any node'} />
            {!selected && (
              <p className="text-xs text-slate-600 py-8 text-center">
                Click a sensor, substation, or master station to inspect its details.
              </p>
            )}

            {/* Sensor detail */}
            {selectedSensor && (() => {
              const cfg = getSensorTypeConfig(selectedSensor.type);
              return (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <StatusBadge level={selectedSensor.riskLevel} />
                    <CommBadge status={selectedSensor.communicationStatus} />
                  </div>
                  <div className="space-y-1.5">
                    {[
                      ['Sensor ID',   selectedSensor.id],
                      ['Type',        cfg.label],
                      ['Substation',  selectedSensor.substationId],
                      ['Current Value', `${selectedSensor.currentValue.toFixed(3)} ${selectedSensor.unit}`],
                      ['Warning Threshold', `${selectedSensor.warningThreshold} ${selectedSensor.unit}`],
                      ['Critical Threshold', `${selectedSensor.criticalThreshold} ${selectedSensor.unit}`],
                      ['Battery', `${selectedSensor.batteryLevel.toFixed(1)}%`],
                      ['Signal', `${selectedSensor.signalStrength}%`],
                      ['Last Update', format(new Date(selectedSensor.timestamp), 'HH:mm:ss')],
                      ['Health', selectedSensor.healthStatus],
                      ['Lat / Lon', `${selectedSensor.latitude.toFixed(4)}, ${selectedSensor.longitude.toFixed(4)}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1 border-b border-surface-700 last:border-0">
                        <span className="text-slate-500">{k}</span>
                        <span className="font-mono font-medium text-slate-200 text-right max-w-[55%] truncate">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Substation detail */}
            {selectedSubstation && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <StatusBadge level={selectedSubstation.riskLevel} />
                  <CommBadge status={selectedSubstation.communicationStatus} />
                </div>
                <div className="space-y-1.5">
                  {[
                    ['Substation ID',    selectedSubstation.id],
                    ['Master Station',   selectedSubstation.masterStationId],
                    ['Connected Sensors', selectedSubstation.sensorIds.length],
                    ['LoRa Signal',      `${selectedSubstation.loraSignal}%`],
                    ['LoRa Frequency',   selectedSubstation.loraFrequency],
                    ['Battery',          `${selectedSubstation.batteryLevel.toFixed(1)}%`],
                    ['Power Status',     selectedSubstation.powerStatus],
                    ['Packets Received', selectedSubstation.packetsReceived.toLocaleString()],
                    ['Packets Lost',     selectedSubstation.packetsLost],
                    ['Data Rate',        `${selectedSubstation.dataRate} kbps`],
                    ['Risk Score',       `${selectedSubstation.riskScore}/100`],
                    ['Last Sync',        format(new Date(selectedSubstation.lastSync), 'HH:mm:ss')],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 border-b border-surface-700 last:border-0">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono font-medium text-slate-200">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Master Station detail */}
            {selected?.type === 'master' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <StatusBadge level={masterStation.riskLevel} />
                  <CommBadge status={masterStation.communicationStatus} />
                </div>
                <div className="space-y-1.5">
                  {[
                    ['ID',             masterStation.id],
                    ['Name',           masterStation.name],
                    ['Location',       masterStation.location],
                    ['Substations',    masterStation.substationIds.length],
                    ['Total Sensors',  masterStation.totalSensors],
                    ['Online',         masterStation.onlineSensors],
                    ['Offline',        masterStation.offlineSensors],
                    ['Warning',        masterStation.warningSensors],
                    ['Critical',       masterStation.criticalSensors],
                    ['LoRa Health',    `${masterStation.loraNetworkHealth}%`],
                    ['Data Rate',      `${masterStation.dataRate} Mbps`],
                    ['Uptime',         `${masterStation.uptime}%`],
                    ['Risk Score',     `${masterStation.aggregatedRiskScore}/100`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 border-b border-surface-700 last:border-0">
                      <span className="text-slate-500">{k}</span>
                      <span className="font-mono font-medium text-slate-200">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
