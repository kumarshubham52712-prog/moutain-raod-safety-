import { useParams, Link } from 'react-router-dom';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge, CommBadge, MetricRow, EventStream } from '../components/common';
import { RiskGauge, TimeSeriesChart } from '../components/charts';
import { getRiskLevelConfig } from '../config/thresholds';
import { getSensorTypeConfig } from '../config/sensorTypes';
import { format } from 'date-fns';
import { Wifi, ChevronRight, MapPin, Copy, Activity, Droplets, Radio, Ruler, Play } from 'lucide-react';

const SENSOR_ICONS: Record<string, React.ElementType> = {
  IPI: Activity, VWP: Droplets, GEOPHONE: Radio, EXTENSOMETER: Ruler,
};

export default function SubstationDetail() {
  const { id } = useParams<{ id: string }>();
  const { 
    substations, sensors, masterStations, eventLog,
    setSensorTargetValue, playScenario
  } = useMonitoringStore();

  const sub = substations.find(s => s.id === id);
  if (!sub) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Substation "{id}" not found</p>
      </div>
    );
  }

  const master = masterStations.find(m => m.id === sub.masterStationId);
  const subSensors = sensors.filter(s => sub.sensorIds.includes(s.id));
  const rCfg = getRiskLevelConfig(sub.riskLevel);
  // Optional: filter events for this substation specifically, but for now we'll show global system events since playScenario generates global events
  
  const copyCoords = () => {
    navigator.clipboard.writeText(`${sub.latitude}, ${sub.longitude}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Top Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/master-stations" className="hover:text-slate-300 transition-colors">Master Stations</Link>
          <ChevronRight size={12} />
          <Link to={`/master-stations/${sub.masterStationId}`} className="hover:text-slate-300 transition-colors">{sub.masterStationId}</Link>
          <ChevronRight size={12} />
          <span className="text-white font-semibold">{sub.id}</span>
        </div>
        
        {/* BIG PLAY BUTTON */}
        <button
          onClick={playScenario}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-sm rounded-lg border border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
        >
          <Play size={16} />
          PROCESS SIMULATION TICK
        </button>
      </div>

      {/* 1. Identity & Status Header */}
      <Card className="p-6 border-surface-600 bg-surface-800 shadow-xl relative overflow-hidden">
        {/* Flashing border if critical */}
        {sub.riskLevel === 'CRITICAL' && (
          <div className="absolute inset-0 border-2 border-red-500/50 rounded-xl animate-pulse-slow pointer-events-none" />
        )}
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center border-2 shrink-0 shadow-lg"
              style={{ borderColor: rCfg.color, background: rCfg.bgColor }}
            >
              <Wifi size={32} style={{ color: rCfg.color }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold font-mono text-white tracking-tight">{sub.id}</h2>
                <StatusBadge level={sub.riskLevel} />
                <CommBadge status={sub.communicationStatus} />
              </div>
              <p className="text-sm text-slate-400 mb-2">{sub.name}</p>
              <div className="flex items-center gap-4 flex-wrap text-xs font-medium">
                <span className="flex items-center gap-1 text-slate-400 bg-surface-900/50 px-2 py-1 rounded">
                  <MapPin size={12} className="text-brand-400" />
                  {sub.latitude.toFixed(4)}°N, {sub.longitude.toFixed(4)}°E
                  <button onClick={copyCoords} className="hover:text-white ml-1 transition-colors"><Copy size={10} /></button>
                </span>
                <span className="text-brand-400">Master: {sub.masterStationId}</span>
                <span className="text-slate-500">Coverage: ~3 km</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8 bg-surface-900/80 p-4 rounded-xl border border-surface-700 shadow-inner">
            <div className="space-y-3 min-w-[140px]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold tracking-widest uppercase">Signal</span>
                <span className="text-white font-mono">{sub.loraSignal}%</span>
              </div>
              <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${sub.loraSignal}%` }} />
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold tracking-widest uppercase">Battery</span>
                <span className="text-white font-mono">{sub.batteryLevel.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${sub.batteryLevel}%` }} />
              </div>
            </div>
            
            <div className="w-px h-16 bg-surface-700" />
            
            <div className="text-center pr-2">
              <RiskGauge score={sub.riskScore} size={80} />
              <p className="text-[10px] text-slate-500 mt-2 font-bold tracking-widest uppercase">Risk Score</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2 & 3. Sensors & Simulation Controls */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader title="Sensors & Simulation Setup" subtitle="Prepare sensor values before hitting Play" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {subSensors.map(sensor => {
              const typeCfg = getSensorTypeConfig(sensor.type);
              const sRisk = getRiskLevelConfig(sensor.riskLevel);
              const IconComp = SENSOR_ICONS[sensor.type] || Activity;
              const targetVal = sensor.targetValue ?? sensor.currentValue;

              return (
                <Card key={sensor.id} className="p-5 flex flex-col gap-4 border-surface-600 bg-surface-800 shadow-lg relative overflow-hidden group hover:border-surface-500 transition-colors">
                  {/* Flashing border if critical */}
                  {sensor.riskLevel === 'CRITICAL' && (
                    <div className="absolute inset-0 border-2 border-red-500/50 rounded-xl animate-pulse-slow pointer-events-none" />
                  )}
                  
                  {/* Header */}
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

                  {/* Current Value Display */}
                  <div className="text-center py-4 bg-surface-900/80 rounded-xl border border-surface-700 shadow-inner relative z-10 mt-2">
                    <div className="text-3xl font-black font-mono tracking-tight transition-colors duration-300" style={{ color: sRisk.color }}>
                      {sensor.currentValue.toFixed(2)} <span className="text-sm font-bold text-slate-500 ml-1">{typeCfg.unit}</span>
                    </div>
                  </div>

                  {/* Time Series Graph */}
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

                  {/* Manual Target Override Slider */}
                  <div className="space-y-3 mt-4 relative z-10">
                    <div className="flex justify-between text-[11px] font-bold tracking-widest text-slate-400 mb-2 uppercase">
                      <span>Simulated Value</span>
                      <button onClick={() => setSensorTargetValue(sensor.id, typeCfg.normalMax * 0.5)} className="text-brand-400 hover:text-brand-300 transition-colors">Reset Normal</button>
                    </div>
                    
                    <input 
                      type="range"
                      min={0}
                      max={typeCfg.criticalThreshold * 1.5}
                      step={typeCfg.criticalThreshold * 0.01}
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

                  {/* +/- Adjusters */}
                  <div className="flex gap-2 mt-2 relative z-10">
                    <button onClick={() => setSensorTargetValue(sensor.id, targetVal - typeCfg.criticalThreshold*0.05)} className="flex-1 py-2 bg-surface-700/50 hover:bg-surface-600 rounded-lg font-bold text-slate-300 border border-surface-600 transition-colors shadow-sm">-</button>
                    <button onClick={() => setSensorTargetValue(sensor.id, targetVal + typeCfg.criticalThreshold*0.05)} className="flex-1 py-2 bg-surface-700/50 hover:bg-surface-600 rounded-lg font-bold text-slate-300 border border-surface-600 transition-colors shadow-sm">+</button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Col: Connectivity & Events */}
        <div className="space-y-6">
          <SectionHeader title="Connectivity & Diagnostics" />
          
          <Card className="p-5 space-y-4 bg-surface-800 border-surface-600 shadow-lg">
            <MetricRow label="Data Rate" value={sub.dataRate} unit=" kbps" />
            <MetricRow label="Packets Received" value={sub.packetsReceived.toLocaleString()} />
            <MetricRow label="Packets Lost" value={sub.packetsLost} />
            <MetricRow label="Last Sync" value={format(new Date(sub.lastSync), 'HH:mm:ss')} />
          </Card>

          <SectionHeader title="Simulation Logs" />
          <div className="h-[400px]">
            <EventStream maxItems={20} />
          </div>
        </div>
      </div>
    </div>
  );
}
