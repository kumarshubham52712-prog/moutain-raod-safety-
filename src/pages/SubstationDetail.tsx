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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb & Top Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/master-stations" className="hover:text-slate-900 transition-colors">Master Stations</Link>
          <ChevronRight size={12} />
          <Link to={`/master-stations/${sub.masterStationId}`} className="hover:text-slate-900 transition-colors">{sub.masterStationId}</Link>
          <ChevronRight size={12} />
          <span className="text-slate-900 font-bold">{sub.id}</span>
        </div>
        
        {/* BIG PLAY BUTTON */}
        <button
          onClick={playScenario}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:-translate-y-0.5"
        >
          <Play size={16} />
          PROCESS SIMULATION TICK
        </button>
      </div>

      {/* 1. Identity & Status Header */}
      <Card className="p-6 md:p-8 relative overflow-hidden">
        {/* Flashing border if critical */}
        {sub.riskLevel === 'CRITICAL' && (
          <div className="absolute inset-0 border-2 border-red-500/20 rounded-xl animate-pulse-slow pointer-events-none" />
        )}
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center border shrink-0 shadow-sm"
              style={{ borderColor: rCfg.borderColor, background: rCfg.bgColor }}
            >
              <Wifi size={32} style={{ color: rCfg.color }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black font-mono text-slate-900 tracking-tight">{sub.id}</h2>
                <StatusBadge level={sub.riskLevel} />
                <CommBadge status={sub.communicationStatus} />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-3">{sub.name}</p>
              <div className="flex items-center gap-4 flex-wrap text-xs font-medium">
                <span className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">
                  <MapPin size={12} className="text-brand-500" />
                  {sub.latitude.toFixed(4)}°N, {sub.longitude.toFixed(4)}°E
                  <button onClick={copyCoords} className="hover:text-slate-900 ml-1 transition-colors"><Copy size={12} /></button>
                </span>
                <span className="text-brand-600 font-semibold">Master: {sub.masterStationId}</span>
                <span className="text-slate-500">Coverage: ~3 km</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm w-full lg:w-auto justify-center lg:justify-end">
            <div className="space-y-4 min-w-[140px]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold tracking-widest uppercase">Signal</span>
                <span className="text-slate-900 font-mono font-bold">{sub.loraSignal}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500" style={{ width: `${sub.loraSignal}%` }} />
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold tracking-widest uppercase">Battery</span>
                <span className="text-slate-900 font-mono font-bold">{sub.batteryLevel.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${sub.batteryLevel}%` }} />
              </div>
            </div>
            
            <div className="w-px h-16 bg-slate-200 hidden sm:block" />
            
            <div className="text-center pr-2">
              <RiskGauge score={sub.riskScore} size={80} />
              <p className="text-[10px] text-slate-500 mt-2 font-bold tracking-widest uppercase">Risk Score</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2 & 3. Sensors & Simulation Controls */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader title="Sensors & Simulation Setup" subtitle="Prepare sensor values before hitting Play" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subSensors.map(sensor => {
              const typeCfg = getSensorTypeConfig(sensor.type);
              const sRisk = getRiskLevelConfig(sensor.riskLevel);
              const IconComp = SENSOR_ICONS[sensor.type] || Activity;
              const targetVal = sensor.targetValue ?? sensor.currentValue;

              return (
                <Card key={sensor.id} className="p-6 flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                  {/* Flashing border if critical */}
                  {sensor.riskLevel === 'CRITICAL' && (
                    <div className="absolute inset-0 border-2 border-red-500/20 rounded-xl animate-pulse-slow pointer-events-none" />
                  )}
                  
                  {/* Header */}
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

                  {/* Current Value Display */}
                  <div className="text-center py-5 bg-slate-50 rounded-xl border border-slate-100 shadow-sm relative z-10 mt-2">
                    <div className="text-4xl font-black font-mono tracking-tight transition-colors duration-300" style={{ color: sRisk.color }}>
                      {sensor.currentValue.toFixed(2)} <span className="text-sm font-bold text-slate-500 ml-1">{typeCfg.unit}</span>
                    </div>
                  </div>

                  {/* Time Series Graph */}
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

                  {/* Manual Target Override Slider */}
                  <div className="space-y-3 mt-4 relative z-10">
                    <div className="flex justify-between text-[11px] font-bold tracking-widest text-slate-500 mb-2 uppercase">
                      <span>Simulated Value</span>
                      <button onClick={() => setSensorTargetValue(sensor.id, typeCfg.normalMax * 0.5)} className="text-brand-600 hover:text-brand-500 transition-colors">Reset Normal</button>
                    </div>
                    
                    <input 
                      type="range"
                      min={0}
                      max={typeCfg.criticalThreshold * 1.5}
                      step={typeCfg.criticalThreshold * 0.01}
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

                  {/* +/- Adjusters */}
                  <div className="flex gap-2 mt-2 relative z-10">
                    <button onClick={() => setSensorTargetValue(sensor.id, targetVal - typeCfg.criticalThreshold*0.05)} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-600 border border-slate-200 transition-colors shadow-sm">-</button>
                    <button onClick={() => setSensorTargetValue(sensor.id, targetVal + typeCfg.criticalThreshold*0.05)} className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg font-bold text-slate-600 border border-slate-200 transition-colors shadow-sm">+</button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Col: Connectivity & Events */}
        <div className="space-y-8">
          <div>
            <SectionHeader title="Connectivity & Diagnostics" />
            <Card className="p-6 space-y-1">
              <MetricRow label="Data Rate" value={sub.dataRate} unit=" kbps" />
              <MetricRow label="Packets Received" value={sub.packetsReceived.toLocaleString()} />
              <MetricRow label="Packets Lost" value={sub.packetsLost} />
              <MetricRow label="Last Sync" value={format(new Date(sub.lastSync), 'HH:mm:ss')} />
            </Card>
          </div>

          <div>
            <SectionHeader title="Simulation Logs" />
            <div className="h-[400px]">
              <EventStream maxItems={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
