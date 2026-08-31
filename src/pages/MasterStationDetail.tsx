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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/master-stations" className="hover:text-slate-900 transition-colors">Master Stations</Link>
          <ChevronRight size={12} />
          <span className="text-slate-900 font-bold">{master.id}</span>
        </div>
        
        <button
          onClick={playScenario}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:-translate-y-0.5"
        >
          <Play size={16} />
          PROCESS SIMULATION TICK
        </button>
      </div>

      {/* Header */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center border shrink-0 shadow-sm"
              style={{ borderColor: rCfg.borderColor, background: rCfg.bgColor }}
            >
              <Server size={28} style={{ color: rCfg.color }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black font-mono text-slate-900 tracking-tight">{master.id}</h2>
                <StatusBadge level={master.riskLevel} />
                <CommBadge status={master.communicationStatus} />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">{master.name}</p>
              <p className="text-xs text-slate-400 mb-2">{master.location}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
                  <MapPin size={10} className="text-brand-500" />
                  {master.latitude.toFixed(4)}°N, {master.longitude.toFixed(4)}°E
                  <button onClick={copyCoords} className="text-slate-400 hover:text-slate-900 transition-colors ml-1" title="Copy coordinates">
                    <Copy size={12} />
                  </button>
                </span>
                <span className="text-[10px] font-medium text-slate-400 italic">DEMO coordinates</span>
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
             <div className="text-center pr-2">
              <RiskGauge score={master.aggregatedRiskScore} size={90} />
              <p className="text-[10px] text-slate-500 mt-2 font-bold tracking-widest uppercase">Aggregated Risk</p>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total Sensors',   value: masterSensors.length },
          { label: 'Online Sensors',  value: master.onlineSensors },
          { label: 'Offline',         value: master.offlineSensors },
          { label: 'Warnings',        value: master.warningSensors },
          { label: 'Critical',        value: master.criticalSensors },
          { label: 'Active Alerts',   value: masterAlerts.length },
        ].map(kpi => (
          <Card key={kpi.label} className="p-4 text-center hover:shadow-md transition-shadow">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">{kpi.label}</p>
            <p className="text-2xl font-black font-mono text-slate-900">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* Network & Performance */}
      <Card className="p-6">
        <SectionHeader title="Network & Performance" subtitle="LoRa mesh and data throughput" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-2 mb-6">
          <MetricRow label="LoRa Health"       value={master.loraNetworkHealth}         unit="%" highlight />
          <MetricRow label="Data Rate"         value={master.dataRate}                  unit=" Mbps" />
          <MetricRow label="Uptime"            value={master.uptime}                   unit="%" highlight />
          <MetricRow label="Last Sync"         value={format(new Date(master.lastSync), 'HH:mm:ss')} />
          <MetricRow label="Packets Processed" value={master.packetsProcessed.toLocaleString()} highlight />
          <MetricRow label="Packets Dropped"   value={master.packetsDropped}           />
          <MetricRow label="Edge Connection"   value={master.edgeConnectionStatus} />
          <MetricRow label="Risk Score"        value={`${master.aggregatedRiskScore}/100`} highlight />
        </div>
        <ProgressBar value={master.loraNetworkHealth} label="Network Health" color="#0ea5e9" />
      </Card>

      {/* Substation Status Summary */}
      <Card className="p-6">
        <SectionHeader title="Substation Status Distribution" subtitle={`${masterSubs.length} connected substations`} />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-2">
          {[
            { label: 'Normal', count: subsByRisk.normal, color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
            { label: 'Watch', count: subsByRisk.watch, color: '#2563eb', bg: '#dbeafe', border: '#bfdbfe' },
            { label: 'Warning', count: subsByRisk.warning, color: '#ca8a04', bg: '#fef9c3', border: '#fef08a' },
            { label: 'High Risk', count: subsByRisk.highRisk, color: '#ea580c', bg: '#ffedd5', border: '#fed7aa' },
            { label: 'Critical', count: subsByRisk.critical, color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
            { label: 'Offline', count: subsByRisk.offline, color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' },
          ].map(item => (
            <div key={item.label} className="text-center py-4 rounded-xl border" style={{ backgroundColor: item.bg, borderColor: item.border }}>
              <p className="text-2xl font-black font-mono mb-0.5" style={{ color: item.color }}>{item.count}</p>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Local Master Monitoring (Master's own sensors) */}
      <div className="space-y-6">
        <SectionHeader 
          title="Local Master Monitoring" 
          subtitle="Sensors directly attached to this master station" 
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {sensors.filter(s => s.substationId === master.id).map(sensor => {
            const typeCfg = getSensorTypeConfig(sensor.type);
            const sRisk = getRiskLevelConfig(sensor.riskLevel);
            const IconComp = SENSOR_ICONS[sensor.type] || Activity;
            const targetVal = sensor.targetValue ?? sensor.currentValue;

            return (
              <Card key={sensor.id} className="p-6 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                {sensor.riskLevel === 'CRITICAL' && (
                  <div className="absolute inset-0 border-2 border-red-500/20 rounded-xl animate-pulse-slow pointer-events-none" />
                )}
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl shadow-sm border border-slate-100" style={{ background: sRisk.bgColor }}>
                      <IconComp size={20} style={{ color: sRisk.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-slate-900 tracking-tight">{sensor.type}</h3>
                        <span className="text-[10px] text-slate-600 font-mono font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">{sensor.id}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 line-clamp-1">{typeCfg.measurementDescription}</p>
                    </div>
                  </div>
                  <StatusBadge level={sensor.riskLevel} size="xs" />
                </div>

                <div className="text-center py-5 bg-slate-50 rounded-xl border border-slate-100 shadow-sm relative z-10 mt-2">
                  <div className="text-4xl font-black font-mono tracking-tight transition-colors duration-300" style={{ color: sRisk.color }}>
                    {sensor.currentValue.toFixed(2)} <span className="text-sm font-bold text-slate-500 ml-1">{typeCfg.unit}</span>
                  </div>
                </div>

                <div className="mt-4 relative z-10 bg-white p-3 rounded-xl border border-surface-750">
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
                  <div className="flex justify-between text-[11px] font-bold tracking-widest text-slate-500 mb-2 uppercase">
                    <span>Simulated Value</span>
                    <button onClick={() => setSensorTargetValue(sensor.id, typeCfg.normalMax * 0.5)} className="text-brand-600 hover:text-brand-500 transition-colors">Reset Normal</button>
                  </div>
                  <input 
                    type="range" min={0} max={typeCfg.criticalThreshold * 1.5} step={typeCfg.criticalThreshold * 0.01}
                    value={targetVal}
                    onChange={(e) => setSensorTargetValue(sensor.id, parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mt-2">
                    <span>0</span>
                    <span className="text-yellow-600 border-l border-yellow-200 pl-1">W: {typeCfg.warningThreshold}</span>
                    <span className="text-red-500 border-l border-red-200 pl-1">C: {typeCfg.criticalThreshold}</span>
                    <span>Max</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 relative z-10">
                  <button onClick={() => setSensorTargetValue(sensor.id, targetVal - typeCfg.criticalThreshold*0.05)} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-600 border border-slate-200 transition-colors shadow-sm">-</button>
                  <button onClick={() => setSensorTargetValue(sensor.id, targetVal + typeCfg.criticalThreshold*0.05)} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-600 border border-slate-200 transition-colors shadow-sm">+</button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Connected Substations */}
      <Card className="p-6">
        <SectionHeader
          title="Connected Substations"
          subtitle={`${masterSubs.length} edge stations reporting to ${master.id}`}
        />
        <div className="space-y-3">
          {masterSubs.slice().sort((a, b) => b.riskScore - a.riskScore).map(sub => {
            const sCfg = getRiskLevelConfig(sub.riskLevel);
            const subSensors = sensors.filter(s => sub.sensorIds.includes(s.id));
            return (
              <Link
                key={sub.id}
                to={`/substations/${sub.id}`}
                className="flex items-center gap-4 px-5 py-4 rounded-xl border bg-white hover:shadow-md transition-all group"
                style={{ borderColor: sCfg.borderColor }}
              >
                <div className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ background: sCfg.color,
                    boxShadow: sub.riskLevel !== 'NORMAL' ? `0 0 10px ${sCfg.color}80` : 'none' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black font-mono text-slate-900">{sub.id}</span>
                    <StatusBadge level={sub.riskLevel} size="xs" showDot={false} />
                    <CommBadge status={sub.communicationStatus} />
                  </div>
                  <p className="text-xs font-medium text-slate-500 truncate mt-1.5">
                    {subSensors.length} sensors · Signal {sub.loraSignal}% · Battery {sub.batteryLevel.toFixed(0)}%
                  </p>
                </div>
                <span className="text-lg font-mono font-black" style={{ color: sCfg.color }}>
                  {sub.riskScore}
                </span>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-brand-600 transition-colors ml-2" />
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
