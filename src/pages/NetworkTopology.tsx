import { useState }          from 'react';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge, CommBadge } from '../components/common';
import { getRiskLevelConfig }  from '../config/thresholds';
import { getSensorTypeConfig } from '../config/sensorTypes';
import { format }              from 'date-fns';
import clsx                    from 'clsx';
import { Link } from 'react-router-dom';

interface NodeDetail {
  type:  'sensor' | 'substation' | 'master';
  id:    string;
}

export default function NetworkTopology() {
  const { sensors, substations, masterStations } = useMonitoringStore();
  const [selected, setSelected] = useState<NodeDetail | null>(null);
  const [selectedMasterId, setSelectedMasterId] = useState<string>(masterStations[0]?.id);

  const selectedSensor     = selected?.type === 'sensor'     ? sensors.find(s => s.id === selected.id) : null;
  const selectedSubstation = selected?.type === 'substation' ? substations.find(s => s.id === selected.id) : null;
  const selectedMaster     = selected?.type === 'master'     ? masterStations.find(m => m.id === selected.id) : null;
  
  const currentMaster = masterStations.find(m => m.id === selectedMasterId);
  const filteredSubs = substations.filter(s => s.masterStationId === selectedMasterId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Topology Graph ─────────────────────────────────── */}
        <div className="xl:col-span-2">
          <Card className="p-6">
            <SectionHeader
              title="Network Topology"
              subtitle="Sensor → Substation → Master Station hierarchy"
            >
              <select
                value={selectedMasterId}
                onChange={(e) => { setSelectedMasterId(e.target.value); setSelected(null); }}
                className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-sm"
              >
                {masterStations.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
              </select>
            </SectionHeader>

            {currentMaster && (
              <>
                {/* Master Station */}
                <div className="flex justify-center mb-6 mt-4">
                  <button
                    onClick={() => setSelected({ type: 'master', id: currentMaster.id })}
                    className={clsx(
                      'px-8 py-4 rounded-2xl border-2 transition-all hover:scale-105 shadow-sm',
                      selected?.id === currentMaster.id
                        ? 'border-brand-500 bg-brand-50 shadow-md'
                        : 'border-blue-200 bg-white hover:border-blue-300 hover:bg-slate-50',
                    )}
                  >
                    <p className="text-sm font-black text-blue-700 mb-1">🖥️ {currentMaster.id}</p>
                    <p className="text-[11px] font-bold text-slate-500">{currentMaster.name}</p>
                    <div className="flex items-center gap-3 mt-3 justify-center">
                      <CommBadge status={currentMaster.communicationStatus} />
                      <StatusBadge level={currentMaster.riskLevel} size="xs" />
                    </div>
                  </button>
                </div>

                {/* Connector to substations */}
                <div className="flex justify-center mb-4">
                  <div className="flex items-center gap-1">
                    <div className="w-0.5 h-8 bg-slate-200 rounded-full" />
                  </div>
                </div>

                {/* Substations Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  {filteredSubs.map(sub => {
                    const subCfg = getRiskLevelConfig(sub.riskLevel);
                    const isSelected = selected?.id === sub.id;
                    return (
                      <div key={sub.id} className="flex flex-col items-center gap-3">
                        {/* Vertical connector from master */}
                        <div className="w-0.5 h-6 bg-slate-200 rounded-full" />
                        <button
                          onClick={() => setSelected({ type: 'substation', id: sub.id })}
                          className={clsx(
                            'w-full px-3 py-3 rounded-xl border-2 transition-all hover:scale-105 text-center shadow-sm',
                            isSelected
                              ? 'border-cyan-500 bg-cyan-50 shadow-md'
                              : 'hover:border-slate-300 bg-white border-slate-200',
                          )}
                          style={{
                            borderColor: isSelected ? undefined : (subCfg.borderColor || '#e2e8f0'),
                            background:  isSelected ? undefined : 'white',
                          }}
                        >
                          <p className="text-xs font-black" style={{ color: subCfg.color }}>
                            📡 {sub.id}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                            {sub.sensorIds.length} sensors
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            LoRa {sub.loraSignal}%
                          </p>
                        </button>

                        {/* Sensor nodes below each substation */}
                        <div className="flex gap-1.5 flex-wrap justify-center mt-2">
                          {sub.sensorIds.map(sId => {
                            const sensor = sensors.find(s => s.id === sId);
                            if (!sensor) return null;
                            const sCfg = getRiskLevelConfig(sensor.riskLevel);
                            const typeColors: Record<string, string> = {
                              IPI: '#8b5cf6', VWP: '#0ea5e9', GEOPHONE: '#f59e0b', EXTENSOMETER: '#ec4899',
                            };
                            return (
                              <button
                                key={sId}
                                onClick={() => setSelected({ type: 'sensor', id: sId })}
                                className={clsx(
                                  'w-10 h-10 rounded-xl border-2 text-[9px] font-mono font-black transition-all hover:scale-110 shadow-sm flex items-center justify-center',
                                  selected?.id === sId ? 'scale-110 ring-2 ring-offset-1' : '',
                                )}
                                style={{
                                  borderColor: sensor.riskLevel !== 'NORMAL' ? sCfg.color : `${typeColors[sensor.type]}40`,
                                  background:  sensor.riskLevel !== 'NORMAL' ? `${sCfg.color}15` : `${typeColors[sensor.type]}10`,
                                  color:       sensor.riskLevel !== 'NORMAL' ? sCfg.color : typeColors[sensor.type],
                                  boxShadow:   sensor.riskLevel !== 'NORMAL' ? `0 0 10px ${sCfg.color}40` : 'none',
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
              </>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-5 border-t border-slate-100 font-bold uppercase tracking-widest justify-center">
              {[
                { color: '#8b5cf6', label: 'IPI' },
                { color: '#0ea5e9', label: 'VWP' },
                { color: '#f59e0b', label: 'Geophone' },
                { color: '#ec4899', label: 'Extensometer' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2 text-[10px] text-slate-500">
                  <div className="w-3.5 h-3.5 rounded-md shadow-sm" style={{ background: `${l.color}20`, border: `2px solid ${l.color}60` }} />
                  {l.label}
                </div>
              ))}
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse-slow shadow-sm" />
                Abnormal
              </div>
            </div>
          </Card>
        </div>

        {/* ── Detail Panel ────────────────────────────────────── */}
        <div>
          <Card className="p-6 sticky top-20 bg-slate-50 border-slate-200 shadow-md">
            <SectionHeader title="Node Details" subtitle={selected?.id ?? 'Click any node'} />
            {!selected && (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm font-medium text-slate-400 text-center max-w-[200px]">
                  Select a sensor, substation, or master station to view its details.
                </p>
              </div>
            )}

            {/* Sensor detail */}
            {selectedSensor && (() => {
              const cfg = getSensorTypeConfig(selectedSensor.type);
              return (
                <div className="space-y-4 text-xs font-medium">
                  <div className="flex items-center gap-3">
                    <StatusBadge level={selectedSensor.riskLevel} />
                    <CommBadge status={selectedSensor.communicationStatus} />
                  </div>
                  <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    {[
                      ['Sensor ID',   <Link to={`/sensors/${selectedSensor.id}`} className="text-brand-600 font-bold hover:underline">{selectedSensor.id}</Link>],
                      ['Type',        <span className="font-bold text-slate-700">{cfg.label}</span>],
                      ['Substation',  <Link to={`/substations/${selectedSensor.substationId}`} className="text-brand-600 font-bold hover:underline">{selectedSensor.substationId}</Link>],
                      ['Current Value', <span className="font-black text-slate-900">{selectedSensor.currentValue.toFixed(3)} <span className="text-[10px] text-slate-400">{selectedSensor.unit}</span></span>],
                      ['Warning Threshold', <span className="font-bold text-yellow-600">{selectedSensor.warningThreshold} {selectedSensor.unit}</span>],
                      ['Critical Threshold', <span className="font-bold text-red-600">{selectedSensor.criticalThreshold} {selectedSensor.unit}</span>],
                      ['Battery', <span className="font-bold text-slate-700">{selectedSensor.batteryLevel.toFixed(1)}%</span>],
                      ['Signal', <span className="font-bold text-slate-700">{selectedSensor.signalStrength}%</span>],
                      ['Last Update', <span className="font-mono text-slate-700">{format(new Date(selectedSensor.timestamp), 'HH:mm:ss')}</span>],
                      ['Health', <span className="font-bold text-slate-700">{selectedSensor.healthStatus}</span>],
                      ['Lat / Lon', <span className="font-mono text-slate-500 text-[10px]">{selectedSensor.latitude.toFixed(4)}, {selectedSensor.longitude.toFixed(4)}</span>],
                    ].map(([k, v], i) => (
                      <div key={i} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0 items-center">
                        <span className="text-slate-500">{k}</span>
                        <span className="text-right max-w-[55%] truncate">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Substation detail */}
            {selectedSubstation && (
              <div className="space-y-4 text-xs font-medium">
                <div className="flex items-center gap-3">
                  <StatusBadge level={selectedSubstation.riskLevel} />
                  <CommBadge status={selectedSubstation.communicationStatus} />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  {[
                    ['Substation ID',    <Link to={`/substations/${selectedSubstation.id}`} className="text-brand-600 font-bold hover:underline">{selectedSubstation.id}</Link>],
                    ['Master Station',   <Link to={`/master-stations/${selectedSubstation.masterStationId}`} className="text-brand-600 font-bold hover:underline">{selectedSubstation.masterStationId}</Link>],
                    ['Connected Sensors', <span className="font-black text-slate-900">{selectedSubstation.sensorIds.length}</span>],
                    ['Signal',      <span className="font-bold text-slate-700">{selectedSubstation.loraSignal}%</span>],
                    ['LoRa Frequency',   <span className="font-mono text-slate-600">{selectedSubstation.loraFrequency}</span>],
                    ['Battery',          <span className="font-bold text-slate-700">{selectedSubstation.batteryLevel.toFixed(1)}%</span>],
                    ['Power Status',     <span className="font-bold text-slate-700">{selectedSubstation.powerStatus}</span>],
                    ['Packets Received', <span className="font-mono text-slate-600">{selectedSubstation.packetsReceived.toLocaleString()}</span>],
                    ['Packets Lost',     <span className="font-mono text-slate-600">{selectedSubstation.packetsLost}</span>],
                    ['Data Rate',        <span className="font-mono text-slate-600">{selectedSubstation.dataRate} kbps</span>],
                    ['Risk Score',       <span className="font-black" style={{ color: getRiskLevelConfig(selectedSubstation.riskLevel).color }}>{selectedSubstation.riskScore}/100</span>],
                    ['Last Sync',        <span className="font-mono text-slate-700">{format(new Date(selectedSubstation.lastSync), 'HH:mm:ss')}</span>],
                  ].map(([k, v], i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0 items-center">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Master Station detail */}
            {selectedMaster && (
              <div className="space-y-4 text-xs font-medium">
                <div className="flex items-center gap-3">
                  <StatusBadge level={selectedMaster.riskLevel} />
                  <CommBadge status={selectedMaster.communicationStatus} />
                </div>
                <div className="space-y-2 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  {[
                    ['ID',             <Link to={`/master-stations/${selectedMaster.id}`} className="text-brand-600 font-bold hover:underline">{selectedMaster.id}</Link>],
                    ['Name',           <span className="font-bold text-slate-700">{selectedMaster.name}</span>],
                    ['Location',       <span className="font-bold text-slate-700">{selectedMaster.location}</span>],
                    ['Substations',    <span className="font-black text-slate-900">{selectedMaster.substationIds.length}</span>],
                    ['Total Sensors',  <span className="font-black text-slate-900">{selectedMaster.totalSensors}</span>],
                    ['Online',         <span className="font-bold text-green-600">{selectedMaster.onlineSensors}</span>],
                    ['Offline',        <span className="font-bold text-red-600">{selectedMaster.offlineSensors}</span>],
                    ['Warning',        <span className="font-bold text-yellow-600">{selectedMaster.warningSensors}</span>],
                    ['Critical',       <span className="font-bold text-red-600">{selectedMaster.criticalSensors}</span>],
                    ['LoRa Health',    <span className="font-bold text-slate-700">{selectedMaster.loraNetworkHealth}%</span>],
                    ['Data Rate',      <span className="font-mono text-slate-600">{selectedMaster.dataRate} Mbps</span>],
                    ['Uptime',         <span className="font-mono text-slate-600">{selectedMaster.uptime}%</span>],
                    ['Risk Score',     <span className="font-black" style={{ color: getRiskLevelConfig(selectedMaster.riskLevel).color }}>{selectedMaster.aggregatedRiskScore}/100</span>],
                  ].map(([k, v], i) => (
                    <div key={i} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0 items-center">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-right">{v}</span>
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
