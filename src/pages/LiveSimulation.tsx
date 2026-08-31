import { useState, useEffect } from 'react';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, StatusBadge, CommBadge, EventStream } from '../components/common';
import { SCENARIO_SEQUENCES } from '../services/simulationEngine';
import { getSensorTypeConfig } from '../config/sensorTypes';
import { getRiskLevelConfig } from '../config/thresholds';
import { Play, Pause, RotateCcw, FastForward, Settings, Activity, Cpu, Radio, Network, ChevronRight, ChevronDown, Zap } from 'lucide-react';
import clsx from 'clsx';
import type { SimulationScenario, Sensor, Substation, MasterStation } from '../types';

type SelectedNode = { type: 'master' | 'substation' | 'sensor'; id: string };

export default function LiveSimulation() {
  const { 
    simulation, startSimulation, pauseSimulation, resetSimulation, setScenario, setSimSpeed, startDemoMode,
    masterStations, substations, sensors,
    setSensorTargetValue
  } = useMonitoringStore();

  const [selected, setSelected] = useState<SelectedNode>({ type: 'master', id: masterStations[0]?.id });
  const [expandedMasters, setExpandedMasters] = useState<Record<string, boolean>>({ [masterStations[0]?.id]: true });
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});

  const toggleMaster = (id: string) => setExpandedMasters(p => ({ ...p, [id]: !p[id] }));
  const toggleSub = (id: string) => setExpandedSubs(p => ({ ...p, [id]: !p[id] }));

  const currentMaster = selected.type === 'master' ? masterStations.find(m => m.id === selected.id) : null;
  const currentSub = selected.type === 'substation' ? substations.find(s => s.id === selected.id) : null;
  const currentSensor = selected.type === 'sensor' ? sensors.find(s => s.id === selected.id) : null;

  // Breadcrumbs
  const getBreadcrumbs = () => {
    if (selected.type === 'master') return [selected.id];
    if (selected.type === 'substation') {
      const sub = substations.find(s => s.id === selected.id);
      return [sub?.masterStationId, selected.id];
    }
    if (selected.type === 'sensor') {
      const sen = sensors.find(s => s.id === selected.id);
      return [sen?.masterStationId, sen?.substationId, selected.id];
    }
    return [];
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-5">
      {/* ── TOP CONTROLLER ────────────────────────────────────── */}
      <Card className="flex items-center justify-between p-4 shrink-0 shadow-sm border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-50 rounded-lg border border-brand-100">
              <Activity className="text-brand-600" size={24} />
            </div>
            <h1 className="font-black text-2xl tracking-tight text-slate-900">LIVE SIMULATION</h1>
          </div>
          
          <div className="h-10 w-px bg-slate-200" />
          
          <div className="flex items-center gap-3">
            <button
              onClick={simulation.isRunning ? pauseSimulation : startSimulation}
              className={clsx(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all',
                simulation.isRunning 
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 shadow-sm'
                  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 shadow-sm'
              )}
            >
              {simulation.isRunning ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> PLAY</>}
            </button>
            <button onClick={resetSimulation} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors shadow-sm" title="Reset Simulation">
              <RotateCcw size={16} />
            </button>
            
            <div className="flex bg-slate-100 rounded-xl p-1 ml-3 border border-slate-200">
              {[1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setSimSpeed(s)}
                  className={clsx(
                    'px-4 py-1.5 rounded-lg text-sm font-bold transition-all',
                    simulation.speed === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── MAIN WORKSPACE ────────────────────────────────────── */}
      <div className="flex-1 flex gap-5 min-h-0">
        
        {/* ── LEFT PANE: Hierarchy Tree ──────────────────────── */}
        <Card className="w-80 flex flex-col overflow-hidden shrink-0 border-slate-200 bg-slate-50 shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Network size={16} /> Network Explorer
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {masterStations.map(master => (
              <div key={master.id} className="text-sm">
                <div 
                  className={clsx('flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors', selected.id === master.id ? 'bg-brand-100 text-brand-700 shadow-sm' : 'hover:bg-slate-200 text-slate-700')}
                  onClick={() => { toggleMaster(master.id); setSelected({ type: 'master', id: master.id }); }}
                >
                  {expandedMasters[master.id] ? <ChevronDown size={16} className="opacity-50" /> : <ChevronRight size={16} className="opacity-50" />}
                  <Cpu size={16} className={master.riskLevel === 'CRITICAL' ? 'text-red-500' : 'text-slate-400'} />
                  <span className="font-mono font-bold">{master.id}</span>
                </div>
                
                {expandedMasters[master.id] && (
                  <div className="ml-5 pl-3 border-l-2 border-slate-200 mt-1 space-y-1">
                    {substations.filter(s => s.masterStationId === master.id).map(sub => (
                      <div key={sub.id}>
                        <div 
                          className={clsx('flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors', selected.id === sub.id ? 'bg-cyan-100 text-cyan-700 shadow-sm' : 'hover:bg-slate-200 text-slate-600')}
                          onClick={() => { toggleSub(sub.id); setSelected({ type: 'substation', id: sub.id }); }}
                        >
                          {expandedSubs[sub.id] ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
                          <Radio size={14} className={sub.riskLevel === 'CRITICAL' ? 'text-red-500' : 'text-slate-400'} />
                          <span className="font-mono font-bold">{sub.id}</span>
                        </div>
                        
                        {expandedSubs[sub.id] && (
                          <div className="ml-5 pl-3 border-l-2 border-slate-200 mt-1 space-y-1">
                            {sensors.filter(s => s.substationId === sub.id).map(sensor => (
                              <div
                                key={sensor.id}
                                className={clsx('flex items-center gap-2 p-2 rounded-md cursor-pointer text-xs font-mono font-bold transition-colors', selected.id === sensor.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'hover:bg-slate-200 text-slate-500 border border-transparent')}
                                onClick={() => setSelected({ type: 'sensor', id: sensor.id })}
                              >
                                <div className={clsx('w-2 h-2 rounded-full shrink-0', sensor.riskLevel === 'CRITICAL' ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]' : sensor.riskLevel === 'NORMAL' ? 'bg-green-500' : 'bg-yellow-500')} />
                                {sensor.id}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* ── CENTER PANE: Detail / Controls ──────────────────── */}
        <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-sm relative bg-slate-50">
          
          {/* Breadcrumb Header */}
          <div className="p-5 border-b border-slate-200 bg-white flex items-center gap-3">
            {getBreadcrumbs().map((bc, i, arr) => (
              <div key={bc} className="flex items-center gap-3">
                <span className={clsx('font-mono font-black', i === arr.length - 1 ? 'text-slate-900 text-xl' : 'text-slate-400 text-sm')}>
                  {bc}
                </span>
                {i < arr.length - 1 && <ChevronRight size={16} className="text-slate-300" />}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            
            {/* ── SENSOR CONTROL VIEW ── */}
            {selected.type === 'sensor' && currentSensor && (() => {
              const cfg = getSensorTypeConfig(currentSensor.type);
              const rCfg = getRiskLevelConfig(currentSensor.riskLevel);
              const imageMap: Record<string, string> = {
                IPI: '/images/ipi_sensor_diagram_1788091221905.jpg',
                VWP: '/images/vwp_sensor_diagram_1788091242769.jpg',
                GEOPHONE: '/images/geophone_sensor_diagram_1788091255307.jpg',
                EXTENSOMETER: '/images/extensometer_sensor_diagram_1788091267779.jpg',
              };
              const sensorImage = imageMap[currentSensor.type];

              return (
                <div className="max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* LEFT: Sensor Diagram */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{cfg.label} DIAGRAM</span>
                        <StatusBadge level={currentSensor.riskLevel} size="xs" />
                      </div>
                      <div className="flex-1 relative bg-white p-4">
                        {sensorImage ? (
                          <img src={sensorImage} alt={`${cfg.label} diagram`} className="w-full h-full object-contain rounded-xl" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">No Image Available</div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: Serial Monitor & Controls */}
                    <div className="space-y-6">
                      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="text-center mb-8">
                          <h2 className="text-5xl font-black font-mono tracking-tight" style={{ color: rCfg.color }}>
                            {currentSensor.currentValue.toFixed(3)} <span className="text-2xl font-bold text-slate-500">{cfg.unit}</span>
                          </h2>
                          <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">Current Reading</p>
                        </div>

                        {/* Manual Target Override Slider */}
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-inner">
                          <div className="flex justify-between items-end mb-5">
                            <div>
                              <h3 className="text-xs font-bold text-slate-500 mb-1 tracking-widest uppercase">INTERPOLATION TARGET</h3>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-brand-600 font-black text-xl">
                                {(currentSensor.targetValue ?? currentSensor.currentValue).toFixed(3)}
                              </span>
                            </div>
                          </div>
                          
                          <input 
                            type="range"
                            min={0}
                            max={cfg.criticalThreshold * 1.5}
                            step={cfg.criticalThreshold * 0.01}
                            value={currentSensor.targetValue ?? currentSensor.currentValue}
                            onChange={(e) => setSensorTargetValue(currentSensor.id, parseFloat(e.target.value))}
                            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                          />

                          <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mt-3">
                            <span>0</span>
                            <span className="text-yellow-600 border-l-2 border-yellow-200 pl-1">Warn: {cfg.warningThreshold}</span>
                            <span className="text-red-500 border-l-2 border-red-200 pl-1">Crit: {cfg.criticalThreshold}</span>
                            <span>Max</span>
                          </div>

                          <div className="flex gap-3 mt-8">
                            <button onClick={() => setSensorTargetValue(currentSensor.id, (currentSensor.targetValue ?? currentSensor.currentValue) - cfg.criticalThreshold*0.1)} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-black text-2xl text-slate-700 shadow-sm transition-colors">-</button>
                            <button onClick={() => setSensorTargetValue(currentSensor.id, (currentSensor.targetValue ?? currentSensor.currentValue) + cfg.criticalThreshold*0.1)} className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-black text-2xl text-slate-700 shadow-sm transition-colors">+</button>
                            <button onClick={() => setSensorTargetValue(currentSensor.id, cfg.normalMax * 0.5)} className="flex-1 py-3 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-xl font-bold text-xs uppercase tracking-widest border border-brand-200 shadow-sm transition-colors">Reset</button>
                          </div>
                        </div>

                        <div className="mt-8 flex justify-center gap-4">
                          <CommBadge status={currentSensor.communicationStatus} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── SUBSTATION VIEW ── */}
            {selected.type === 'substation' && currentSub && (
              <div className="space-y-8 animate-in fade-in duration-200 max-w-5xl mx-auto">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-1">Substation {currentSub.id}</h2>
                    <p className="text-slate-500 text-sm font-medium">Edge Processing Node</p>
                  </div>
                  <div className="flex gap-4">
                    <StatusBadge level={currentSub.riskLevel} />
                    <CommBadge status={currentSub.communicationStatus} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {sensors.filter(s => s.substationId === currentSub.id).map(sensor => {
                    const cfg = getSensorTypeConfig(sensor.type);
                    const rCfg = getRiskLevelConfig(sensor.riskLevel);
                    return (
                      <div key={sensor.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden" onClick={() => setSelected({ type: 'sensor', id: sensor.id })}>
                        {sensor.riskLevel === 'CRITICAL' && <div className="absolute inset-0 border-2 border-red-500/20 rounded-2xl animate-pulse pointer-events-none" />}
                        <div className="flex justify-between items-start mb-3 relative z-10">
                          <span className="font-mono font-black text-sm text-slate-900 group-hover:text-brand-600 transition-colors">{sensor.id}</span>
                          <StatusBadge level={sensor.riskLevel} size="xs" />
                        </div>
                        <p className="text-xs font-bold text-slate-500 mb-4 relative z-10">{cfg.label}</p>
                        <p className="text-2xl font-black font-mono relative z-10" style={{ color: rCfg.color }}>
                          {sensor.currentValue.toFixed(3)} <span className="text-xs font-bold text-slate-400">{cfg.unit}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── MASTER VIEW ── */}
            {selected.type === 'master' && currentMaster && (
              <div className="space-y-8 animate-in fade-in duration-200 max-w-5xl mx-auto">
                <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-1">{currentMaster.id}</h2>
                    <p className="text-slate-500 text-sm font-medium">{currentMaster.name}</p>
                  </div>
                  <div className="flex gap-4">
                    <StatusBadge level={currentMaster.riskLevel} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {substations.filter(s => s.masterStationId === currentMaster.id).map(sub => (
                    <div key={sub.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setSelected({ type: 'substation', id: sub.id })}>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-mono font-black text-base text-slate-900 group-hover:text-brand-600 transition-colors">{sub.id}</span>
                        <StatusBadge level={sub.riskLevel} size="xs" />
                      </div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                        <span className="uppercase tracking-widest">Risk Score</span>
                        <span className="font-mono text-slate-700">{sub.riskScore}/100</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${sub.riskScore}%`, backgroundColor: getRiskLevelConfig(sub.riskLevel).color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </Card>

        {/* ── RIGHT PANE: Event Stream & Analytics ────────────── */}
        <div className="w-80 shrink-0 flex flex-col gap-5 min-h-0">
          
          {/* Timeline Info */}
          <Card className="p-5 bg-white border-slate-200 shadow-sm shrink-0">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FastForward size={16} /> Simulation Status
            </h3>
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Scenario Tick</span>
              <span className="font-mono text-xl font-black text-brand-600">T+{simulation.scenarioTick}</span>
            </div>
            {simulation.isDemoMode && (
              <div className="text-[10px] text-center font-bold text-brand-700 bg-brand-50 py-2 rounded-lg border border-brand-200 shadow-sm">
                AUTOMATIC DEMONSTRATION ACTIVE
              </div>
            )}
          </Card>

          <EventStream height="100%" maxItems={100} />
        </div>
      </div>
    </div>
  );
}
