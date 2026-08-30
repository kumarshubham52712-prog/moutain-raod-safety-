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
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      {/* ── TOP CONTROLLER ────────────────────────────────────── */}
      <Card className="flex items-center justify-between p-3 shrink-0 shadow-lg border-surface-600 bg-surface-800/90 backdrop-blur">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="text-brand-400" size={24} />
            <h1 className="font-black text-xl tracking-tight text-white">LIVE SIMULATION</h1>
          </div>
          
          <div className="h-8 w-px bg-surface-600" />
          
          <div className="flex items-center gap-2">
            <button
              onClick={simulation.isRunning ? pauseSimulation : startSimulation}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all',
                simulation.isRunning 
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
              )}
            >
              {simulation.isRunning ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> PLAY</>}
            </button>
            <button onClick={resetSimulation} className="p-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-slate-300 transition-colors" title="Reset Simulation">
              <RotateCcw size={16} />
            </button>
            
            <div className="flex bg-surface-900 rounded-lg p-1 ml-2 border border-surface-700">
              {[1, 2, 4].map(s => (
                <button
                  key={s}
                  onClick={() => setSimSpeed(s)}
                  className={clsx(
                    'px-3 py-1 rounded-md text-xs font-bold transition-all',
                    simulation.speed === s ? 'bg-surface-700 text-white' : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Scenario</span>
            <select
              value={simulation.scenario}
              onChange={(e) => setScenario(e.target.value as SimulationScenario)}
              className="bg-surface-900 border border-surface-600 text-xs text-white rounded px-2 py-1 focus:outline-none"
            >
              {Object.entries(SCENARIO_SEQUENCES).map(([key, seq]) => (
                <option key={key} value={key}>{seq.name}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={startDemoMode}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-black text-sm rounded-lg border border-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all"
          >
            <Zap size={16} className={simulation.isDemoMode ? 'animate-pulse' : ''} />
            {simulation.isDemoMode ? 'DEMO RUNNING' : 'START DEMO'}
          </button>
        </div>
      </Card>

      {/* ── MAIN WORKSPACE ────────────────────────────────────── */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* ── LEFT PANE: Hierarchy Tree ──────────────────────── */}
        <Card className="w-72 flex flex-col overflow-hidden shrink-0 border-surface-700 bg-surface-900/50">
          <div className="p-3 border-b border-surface-700 bg-surface-800">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Network size={14} /> Network Explorer
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {masterStations.map(master => (
              <div key={master.id} className="text-sm">
                <div 
                  className={clsx('flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-colors', selected.id === master.id ? 'bg-brand-500/20 text-brand-300' : 'hover:bg-surface-800 text-slate-300')}
                  onClick={() => { toggleMaster(master.id); setSelected({ type: 'master', id: master.id }); }}
                >
                  {expandedMasters[master.id] ? <ChevronDown size={14} className="opacity-50" /> : <ChevronRight size={14} className="opacity-50" />}
                  <Cpu size={14} className={master.riskLevel === 'CRITICAL' ? 'text-red-500' : 'text-slate-400'} />
                  <span className="font-mono font-bold">{master.id}</span>
                </div>
                
                {expandedMasters[master.id] && (
                  <div className="ml-4 pl-2 border-l border-surface-700/50 mt-1 space-y-1">
                    {substations.filter(s => s.masterStationId === master.id).map(sub => (
                      <div key={sub.id}>
                        <div 
                          className={clsx('flex items-center gap-1.5 p-1.5 rounded cursor-pointer text-xs transition-colors', selected.id === sub.id ? 'bg-cyan-500/20 text-cyan-300' : 'hover:bg-surface-800 text-slate-400')}
                          onClick={() => { toggleSub(sub.id); setSelected({ type: 'substation', id: sub.id }); }}
                        >
                          {expandedSubs[sub.id] ? <ChevronDown size={12} className="opacity-50" /> : <ChevronRight size={12} className="opacity-50" />}
                          <Radio size={12} className={sub.riskLevel === 'CRITICAL' ? 'text-red-500' : 'text-slate-500'} />
                          <span className="font-mono">{sub.id}</span>
                        </div>
                        
                        {expandedSubs[sub.id] && (
                          <div className="ml-4 pl-2 border-l border-surface-700/50 mt-1 space-y-0.5">
                            {sensors.filter(s => s.substationId === sub.id).map(sensor => (
                              <div
                                key={sensor.id}
                                className={clsx('flex items-center gap-2 p-1.5 rounded cursor-pointer text-[11px] font-mono transition-colors', selected.id === sensor.id ? 'bg-surface-700 text-white' : 'hover:bg-surface-800 text-slate-500')}
                                onClick={() => setSelected({ type: 'sensor', id: sensor.id })}
                              >
                                <div className={clsx('w-1.5 h-1.5 rounded-full', sensor.riskLevel === 'CRITICAL' ? 'bg-red-500 animate-pulse' : sensor.riskLevel === 'NORMAL' ? 'bg-green-500' : 'bg-yellow-500')} />
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
        <Card className="flex-1 flex flex-col overflow-hidden border-surface-600 shadow-xl relative bg-surface-900/40">
          
          {/* Breadcrumb Header */}
          <div className="p-4 border-b border-surface-700 bg-surface-800/80 flex items-center gap-3">
            {getBreadcrumbs().map((bc, i, arr) => (
              <div key={bc} className="flex items-center gap-2">
                <span className={clsx('font-mono font-bold', i === arr.length - 1 ? 'text-white text-lg' : 'text-slate-500 text-sm')}>
                  {bc}
                </span>
                {i < arr.length - 1 && <ChevronRight size={14} className="text-surface-600" />}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            
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
                    <div className="bg-surface-800 rounded-2xl border border-surface-600 shadow-lg overflow-hidden flex flex-col">
                      <div className="p-3 bg-surface-900 border-b border-surface-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cfg.label} DIAGRAM</span>
                        <StatusBadge level={currentSensor.riskLevel} size="xs" />
                      </div>
                      <div className="flex-1 relative bg-surface-950 p-2">
                        {sensorImage ? (
                          <img src={sensorImage} alt={`${cfg.label} diagram`} className="w-full h-full object-contain rounded-xl" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">No Image Available</div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: Serial Monitor & Controls */}
                    <div className="space-y-6">
                      <div className="bg-surface-800 p-6 rounded-2xl border border-surface-600 shadow-lg">
                        <div className="text-center mb-6">
                          <h2 className="text-4xl font-black font-mono tracking-tight" style={{ color: rCfg.color }}>
                            {currentSensor.currentValue.toFixed(3)} <span className="text-xl text-slate-500">{cfg.unit}</span>
                          </h2>
                          <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest">Current Reading</p>
                        </div>

                        {/* Manual Target Override Slider */}
                        <div className="bg-surface-900 p-5 rounded-xl border border-surface-700">
                          <div className="flex justify-between items-end mb-4">
                            <div>
                              <h3 className="text-xs font-bold text-slate-300 mb-1">INTERPOLATION TARGET</h3>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-cyan-400 font-bold text-lg">
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
                            className="w-full h-2 bg-surface-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                          />

                          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                            <span>0</span>
                            <span className="text-yellow-500 border-l border-yellow-500/50 pl-1">Warn: {cfg.warningThreshold}</span>
                            <span className="text-red-500 border-l border-red-500/50 pl-1">Crit: {cfg.criticalThreshold}</span>
                            <span>Max</span>
                          </div>

                          <div className="flex gap-2 mt-6">
                            <button onClick={() => setSensorTargetValue(currentSensor.id, (currentSensor.targetValue ?? currentSensor.currentValue) - cfg.criticalThreshold*0.1)} className="flex-1 py-2 bg-surface-700 hover:bg-surface-600 rounded-lg font-bold text-xl text-white">-</button>
                            <button onClick={() => setSensorTargetValue(currentSensor.id, (currentSensor.targetValue ?? currentSensor.currentValue) + cfg.criticalThreshold*0.1)} className="flex-1 py-2 bg-surface-700 hover:bg-surface-600 rounded-lg font-bold text-xl text-white">+</button>
                            <button onClick={() => setSensorTargetValue(currentSensor.id, cfg.normalMax * 0.5)} className="flex-1 py-2 bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 rounded-lg font-bold text-xs uppercase tracking-widest border border-brand-500/30">Reset</button>
                          </div>
                        </div>

                        <div className="mt-6 flex justify-center gap-4">
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
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-white">Substation {currentSub.id}</h2>
                    <p className="text-slate-400 text-sm">Edge Processing Node</p>
                  </div>
                  <div className="flex gap-3">
                    <StatusBadge level={currentSub.riskLevel} />
                    <CommBadge status={currentSub.communicationStatus} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {sensors.filter(s => s.substationId === currentSub.id).map(sensor => {
                    const cfg = getSensorTypeConfig(sensor.type);
                    const rCfg = getRiskLevelConfig(sensor.riskLevel);
                    return (
                      <div key={sensor.id} className="bg-surface-800 p-4 rounded-xl border border-surface-700 hover:border-brand-500/50 transition-colors cursor-pointer" onClick={() => setSelected({ type: 'sensor', id: sensor.id })}>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono font-bold text-sm text-slate-300">{sensor.id}</span>
                          <StatusBadge level={sensor.riskLevel} size="xs" />
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{cfg.label}</p>
                        <p className="text-xl font-black font-mono" style={{ color: rCfg.color }}>
                          {sensor.currentValue.toFixed(3)} <span className="text-xs">{cfg.unit}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── MASTER VIEW ── */}
            {selected.type === 'master' && currentMaster && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-white">{currentMaster.id}</h2>
                    <p className="text-slate-400 text-sm">{currentMaster.name}</p>
                  </div>
                  <div className="flex gap-3">
                    <StatusBadge level={currentMaster.riskLevel} />
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {substations.filter(s => s.masterStationId === currentMaster.id).map(sub => (
                    <div key={sub.id} className="bg-surface-800 p-4 rounded-xl border border-surface-700 hover:border-cyan-500/50 transition-colors cursor-pointer" onClick={() => setSelected({ type: 'substation', id: sub.id })}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono font-bold text-sm text-white">{sub.id}</span>
                        <StatusBadge level={sub.riskLevel} size="xs" />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Risk Score</span>
                        <span className="font-mono font-bold text-slate-300">{sub.riskScore}/100</span>
                      </div>
                      <div className="h-1 w-full bg-surface-900 rounded-full mt-2 overflow-hidden">
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
        <div className="w-80 shrink-0 flex flex-col gap-4 min-h-0">
          
          {/* Timeline Info */}
          <Card className="p-4 bg-surface-800/80 border-surface-600 shadow-lg shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FastForward size={14} /> Simulation Status
            </h3>
            <div className="flex justify-between items-center bg-surface-900 p-3 rounded-lg border border-surface-700 mb-2">
              <span className="text-xs text-slate-500">Scenario Tick</span>
              <span className="font-mono text-lg font-black text-cyan-400">T+{simulation.scenarioTick}</span>
            </div>
            {simulation.isDemoMode && (
              <div className="text-[10px] text-center font-bold text-brand-400 bg-brand-500/10 py-1.5 rounded border border-brand-500/20">
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
