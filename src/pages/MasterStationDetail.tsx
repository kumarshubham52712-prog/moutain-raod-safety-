import { useParams, Link } from 'react-router-dom';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge, CommBadge, MetricRow, ProgressBar } from '../components/common';
import { RiskGauge, TimeSeriesChart } from '../components/charts';
import { getRiskLevelConfig } from '../config/thresholds';
import { getSensorTypeConfig } from '../config/sensorTypes';
import { format } from 'date-fns';
import { Server, Wifi, ChevronRight, MapPin, Copy, Activity, Droplets, Radio, Ruler, Play } from 'lucide-react';

const SENSOR_ICONS: Record<string, React.ElementType> = {
  IPI: Activity, VWP: Droplets, GEOPHONE: Radio, EXTENSOMETER: Ruler,
};

export default function MasterStationDetail() {
  const { id } = useParams<{ id: string }>();
  const { masterStations, substations, sensors, alerts, setSensorTargetValue, playScenario } = useMonitoringStore();

  const master = masterStations.find(m => m.id === id);
  if (!master) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Master Station "{id}" not found</p>
      </div>
    );
  }

  const rCfg = getRiskLevelConfig(master.riskLevel);
  const masterSubs = substations.filter(s => master.substationIds.includes(s.id));
  const masterSensors = sensors.filter(s =>
    masterSubs.some(sub => sub.sensorIds.includes(s.id))
  );
  const masterAlerts = alerts.filter(a => !a.resolved && a.masterStationId === master.id);

  const subsByRisk = {
    normal: masterSubs.filter(s => s.riskLevel === 'NORMAL').length,
    watch: masterSubs.filter(s => s.riskLevel === 'WATCH').length,
    warning: masterSubs.filter(s => s.riskLevel === 'WARNING').length,
    highRisk: masterSubs.filter(s => s.riskLevel === 'HIGH_RISK').length,
    critical: masterSubs.filter(s => s.riskLevel === 'CRITICAL').length,
    offline: masterSubs.filter(s => s.communicationStatus === 'OFFLINE').length,
  };

  const copyCoords = () => {
    navigator.clipboard.writeText(`${master.latitude}, ${master.longitude}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/master-stations" className="hover:text-slate-300 transition-colors">Master Stations</Link>
          <ChevronRight size={12} />
          <span className="text-white font-semibold">{master.id}</span>
        </div>
        
        <button
          onClick={playScenario}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-sm rounded-lg border border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
        >
          <Play size={16} />
          PROCESS SIMULATION TICK
        </button>
      </div>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center border-2"
              style={{ borderColor: rCfg.color, background: rCfg.bgColor }}
            >
              <Server size={28} style={{ color: rCfg.color }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold font-mono text-white">{master.id}</h2>
                <StatusBadge level={master.riskLevel} />
                <CommBadge status={master.communicationStatus} />
              </div>
              <p className="text-sm text-slate-400">{master.name}</p>
              <p className="text-xs text-slate-600">{master.location}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={10} />
                  {master.latitude.toFixed(4)}°N, {master.longitude.toFixed(4)}°E
                </span>
                <button onClick={copyCoords} className="text-slate-600 hover:text-slate-400 transition-colors" title="Copy coordinates">
                  <Copy size={10} />
                </button>
                <span className="text-[10px] text-slate-600 italic">DEMO coordinates</span>
              </div>
            </div>
          </div>
          <div className="ml-auto">
            <RiskGauge score={master.aggregatedRiskScore} size={100} />
          </div>
        </div>
      </Card>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {[
          { label: 'Total Sensors',   value: masterSensors.length },
          { label: 'Online Sensors',  value: master.onlineSensors },
          { label: 'Offline',         value: master.offlineSensors },
          { label: 'Warnings',        value: master.warningSensors },
          { label: 'Critical',        value: master.criticalSensors },
          { label: 'Active Alerts',   value: masterAlerts.length },
        ].map(kpi => (
          <Card key={kpi.label} className="p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{kpi.label}</p>
            <p className="text-xl font-bold font-mono text-white">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Network & Performance */}
      <Card className="p-4">
        <SectionHeader title="Network & Performance" subtitle="LoRa mesh and data throughput" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <MetricRow label="LoRa Health"       value={master.loraNetworkHealth}         unit="%" highlight />
          <MetricRow label="Data Rate"         value={master.dataRate}                  unit=" Mbps" />
          <MetricRow label="Uptime"            value={master.uptime}                   unit="%" highlight />
          <MetricRow label="Last Sync"         value={format(new Date(master.lastSync), 'HH:mm:ss')} />
          <MetricRow label="Packets Processed" value={master.packetsProcessed.toLocaleString()} highlight />
          <MetricRow label="Packets Dropped"   value={master.packetsDropped}           />
          <MetricRow label="Edge Connection"   value={master.edgeConnectionStatus} />
          <MetricRow label="Risk Score"        value={`${master.aggregatedRiskScore}/100`} highlight />
        </div>
        <ProgressBar value={master.loraNetworkHealth} label="Network Health" color="#06b6d4" />
      </Card>

      {/* Substation Status Summary */}
      <Card className="p-4">
        <SectionHeader title="Substation Status Distribution" subtitle={`${masterSubs.length} connected substations`} />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
          {[
            { label: 'Normal', count: subsByRisk.normal, color: '#22c55e' },
            { label: 'Watch', count: subsByRisk.watch, color: '#3b82f6' },
            { label: 'Warning', count: subsByRisk.warning, color: '#eab308' },
            { label: 'High Risk', count: subsByRisk.highRisk, color: '#f97316' },
            { label: 'Critical', count: subsByRisk.critical, color: '#ef4444' },
            { label: 'Offline', count: subsByRisk.offline, color: '#64748b' },
          ].map(item => (
            <div key={item.label} className="text-center p-2 rounded-lg bg-surface-900 border border-surface-700">
              <p className="text-xl font-bold font-mono" style={{ color: item.color }}>{item.count}</p>
              <p className="text-[10px] text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Local Master Monitoring (Master's own sensors) */}
      <div className="space-y-4">
        <SectionHeader 
          title="Local Master Monitoring" 
          subtitle="Sensors directly attached to this master station" 
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5">
          {sensors.filter(s => s.substationId === master.id).map(sensor => {
            const typeCfg = getSensorTypeConfig(sensor.type);
            const sRisk = getRiskLevelConfig(sensor.riskLevel);
            const IconComp = SENSOR_ICONS[sensor.type] || Activity;
            const targetVal = sensor.targetValue ?? sensor.currentValue;

            return (
              <Card key={sensor.id} className="p-5 flex flex-col gap-4 border-surface-600 bg-surface-800 shadow-lg relative overflow-hidden group hover:border-surface-500 transition-colors">
                {sensor.riskLevel === 'CRITICAL' && (
                  <div className="absolute inset-0 border-2 border-red-500/50 rounded-xl animate-pulse-slow pointer-events-none" />
                )}
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg shadow-inner" style={{ background: `${typeCfg.color}20` }}>
                      <IconComp size={18} style={{ color: typeCfg.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-white tracking-tight">{sensor.type}</h3>
                        <span className="text-[10px] text-slate-500 font-mono bg-surface-900 px-1.5 py-0.5 rounded">{sensor.id}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{typeCfg.measurementDescription}</p>
                    </div>
                  </div>
                  <StatusBadge level={sensor.riskLevel} size="xs" />
                </div>

                <div className="text-center py-4 bg-surface-900/80 rounded-xl border border-surface-700 shadow-inner relative z-10 mt-2">
                  <div className="text-3xl font-black font-mono tracking-tight transition-colors duration-300" style={{ color: sRisk.color }}>
                    {sensor.currentValue.toFixed(2)} <span className="text-sm font-bold text-slate-500 ml-1">{typeCfg.unit}</span>
                  </div>
                </div>

                <div className="mt-4 relative z-10 bg-surface-900/50 p-2 rounded-xl border border-surface-700">
                  <TimeSeriesChart
                    readings={sensor.history}
                    color={typeCfg.color}
                    unit={typeCfg.unit}
                    warningThreshold={typeCfg.warningThreshold}
                    criticalThreshold={typeCfg.criticalThreshold}
                    label={sensor.type}
                    height={120}
                  />
                </div>

                <div className="space-y-3 mt-4 relative z-10">
                  <div className="flex justify-between text-[11px] font-bold tracking-widest text-slate-400 mb-2 uppercase">
                    <span>Simulated Value</span>
                    <button onClick={() => setSensorTargetValue(sensor.id, typeCfg.normalMax * 0.5)} className="text-brand-400 hover:text-brand-300 transition-colors">Reset Normal</button>
                  </div>
                  <input 
                    type="range" min={0} max={typeCfg.criticalThreshold * 1.5} step={typeCfg.criticalThreshold * 0.01}
                    value={targetVal}
                    onChange={(e) => setSensorTargetValue(sensor.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-surface-900 rounded-lg appearance-none cursor-pointer accent-brand-500 border border-surface-700"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                    <span>0</span>
                    <span className="text-yellow-500 border-l border-yellow-500/50 pl-1">W: {typeCfg.warningThreshold}</span>
                    <span className="text-red-500 border-l border-red-500/50 pl-1">C: {typeCfg.criticalThreshold}</span>
                    <span>Max</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 relative z-10">
                  <button onClick={() => setSensorTargetValue(sensor.id, targetVal - typeCfg.criticalThreshold*0.05)} className="flex-1 py-2 bg-surface-700/50 hover:bg-surface-600 rounded-lg font-bold text-slate-300 border border-surface-600 transition-colors shadow-sm">-</button>
                  <button onClick={() => setSensorTargetValue(sensor.id, targetVal + typeCfg.criticalThreshold*0.05)} className="flex-1 py-2 bg-surface-700/50 hover:bg-surface-600 rounded-lg font-bold text-slate-300 border border-surface-600 transition-colors shadow-sm">+</button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Connected Substations */}
      <Card className="p-4">
        <SectionHeader
          title="Connected Substations"
          subtitle={`${masterSubs.length} edge stations reporting to ${master.id}`}
        />
        <div className="space-y-2">
          {masterSubs.slice().sort((a, b) => b.riskScore - a.riskScore).map(sub => {
            const sCfg = getRiskLevelConfig(sub.riskLevel);
            const subSensors = sensors.filter(s => sub.sensorIds.includes(s.id));
            return (
              <Link
                key={sub.id}
                to={`/substations/${sub.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-surface-900/60 hover:bg-surface-700/50 transition-all hover:scale-[1.005] group"
                style={{ borderColor: sCfg.borderColor }}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: sCfg.color,
                    boxShadow: sub.riskLevel !== 'NORMAL' ? `0 0 8px ${sCfg.color}` : 'none' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono text-white">{sub.id}</span>
                    <StatusBadge level={sub.riskLevel} size="xs" showDot={false} />
                    <CommBadge status={sub.communicationStatus} />
                  </div>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                    {subSensors.length} sensors · Signal {sub.loraSignal}% · Battery {sub.batteryLevel.toFixed(0)}%
                  </p>
                </div>
                <span className="text-sm font-mono font-bold" style={{ color: sCfg.color }}>
                  {sub.riskScore}
                </span>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
