import { useState } from 'react';
import { useMonitoringStore } from '../store/monitoringStore';
import { SCENARIOS } from '../services/simulationEngine';
import { Card, SectionHeader, ProgressBar } from '../components/common';
import { getRiskLevelConfig } from '../config/thresholds';
import { Play, Pause, RotateCcw, Zap, Cloud, Thermometer, Wind, Droplet, Search } from 'lucide-react';
import clsx from 'clsx';
import type { SimulationScenario } from '../types';

export default function SimulationControl() {
  const {
    simulation, envState, systemStatus,
    startSimulation, pauseSimulation, resetSimulation,
    setScenario, setSimSpeed,
    sensors, masterStations, substations,
    setSensorValue, setSensorOnline,
  } = useMonitoringStore();

  const scenarioEntries = Object.entries(SCENARIOS) as [SimulationScenario, typeof SCENARIOS['A']][];
  const riskCfg = getRiskLevelConfig(systemStatus.overallRiskLevel);

  // Manual Control State
  const [selectedMaster, setSelectedMaster] = useState<string>('ALL');
  const [selectedSub, setSelectedSub] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSensors = sensors.filter(s => {
    if (selectedMaster !== 'ALL' && s.masterStationId !== selectedMaster) return false;
    if (selectedSub !== 'ALL' && s.substationId !== selectedSub) return false;
    if (searchQuery && !s.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).slice(0, 12); // Limit to 12 for UI performance in this view

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ── Top Controls ──────────────────────────────────────── */}
      <Card className="p-6">
        <SectionHeader title="Simulation Engine" subtitle="Global controls and system state" />

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button
            onClick={simulation.isRunning ? pauseSimulation : startSimulation}
            className={clsx(
              'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg',
              simulation.isRunning
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30 hover:shadow-yellow-500/20'
                : 'bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 hover:shadow-green-500/20',
            )}
          >
            {simulation.isRunning ? <Pause size={18} /> : <Play size={18} />}
            {simulation.isRunning ? 'PAUSE ENGINE' : 'START ENGINE'}
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30 hover:bg-slate-500/20 transition-all"
          >
            <RotateCcw size={16} /> Reset All
          </button>

          <div className="w-px h-8 bg-surface-700 mx-2" />

          {/* Speed */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Time Dilation:</span>
            {[1, 2, 5, 10].map(sp => (
              <button
                key={sp}
                onClick={() => setSimSpeed(sp)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                  simulation.speed === sp
                    ? 'bg-brand-600/20 border-brand-600/40 text-brand-400 shadow-[0_0_10px_rgba(14,165,233,0.2)]'
                    : 'border-surface-700 text-slate-500 hover:text-slate-300',
                )}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-700 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Engine Status</p>
            <p className={clsx('text-lg font-black', simulation.isRunning ? 'text-green-400 animate-pulse-slow' : 'text-slate-500')}>
              {simulation.isRunning ? '● RUNNING' : '○ PAUSED'}
            </p>
          </div>
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-700 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Simulation Tick</p>
            <p className="text-xl font-bold font-mono text-white">#{simulation.tick}</p>
          </div>
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-700 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Active Scenario</p>
            <p className="text-xl font-black text-brand-400">Scenario {simulation.scenario}</p>
          </div>
          <div className="bg-surface-900 rounded-xl p-4 border border-surface-700 flex flex-col justify-center">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Max System Risk</p>
            <p className="text-xl font-black font-mono" style={{ color: riskCfg.color }}>
              {systemStatus.overallRiskScore} / 100
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Col: Scenarios & Env ───────────────────────── */}
        <div className="space-y-6">
          <Card className="p-5">
            <SectionHeader
              title="Scenario Presets"
              subtitle="Inject correlated multi-sensor events"
            />
            <div className="space-y-3">
              {scenarioEntries.map(([key, scenario]) => {
                const isActive = simulation.scenario === key;
                const riskColors: Record<string, string> = {
                  A: '#22c55e', B: '#eab308', C: '#f97316', D: '#f97316', E: '#ef4444',
                };
                const color = riskColors[key] ?? '#0ea5e9';

                return (
                  <button
                    key={key}
                    onClick={() => setScenario(key)}
                    className={clsx(
                      'w-full text-left p-3 rounded-xl border transition-all',
                      isActive ? 'scale-[1.02] shadow-lg' : 'opacity-70 hover:opacity-100 hover:border-slate-600',
                    )}
                    style={{
                      borderColor: isActive ? color : 'rgba(255,255,255,0.1)',
                      background:  isActive ? `${color}15` : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-black shrink-0" style={{ background: `${color}30`, color }}>
                        {key}
                      </span>
                      <p className="text-sm font-bold text-white flex-1">{scenario.description.split('—')[0]}</p>
                      {isActive && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: color, color: '#000' }}>ACTIVE</span>}
                    </div>
                    <p className="text-xs text-slate-400 pl-9 pr-2">{scenario.description.split('—')[1]?.trim()}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Environmental Drivers" subtitle="Hidden variables driving sensor correlation" />
            <div className="space-y-4">
              {[
                { icon: <Cloud size={14} />,       label: 'Rainfall',     value: envState.rainfallIntensity, unit: '%', color: '#3b82f6', max: 100 },
                { icon: <Droplet size={14} />,     label: 'Ground Sat.',  value: envState.groundSaturation,  unit: '%', color: '#06b6d4', max: 100 },
                { icon: <Thermometer size={14} />, label: 'Temperature',  value: envState.temperature,       unit: '°C', color: '#f59e0b', max: 40 },
              ].map(env => (
                <div key={env.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-slate-300" style={{ color: env.color }}>{env.icon} {env.label}</span>
                    <span className="font-mono font-bold text-white">{env.value.toFixed(1)} {env.unit}</span>
                  </div>
                  <ProgressBar value={env.value} max={env.max} color={env.color} />
                </div>
              ))}
            </div>
            <div className="mt-5 p-3 bg-surface-900 rounded-lg border border-surface-700 text-[10px] text-slate-500 leading-relaxed">
              <Zap size={12} className="inline mr-1 text-yellow-400" />
              <strong>Engine logic:</strong> Rainfall ↑ → Ground Saturation ↑ → VWP pressure ↑ → IPI displacement ↑ → Geophone events ↑
            </div>
          </Card>
        </div>

        {/* ── Right Col: Manual Override ──────────────────────── */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-full flex flex-col">
            <SectionHeader
              title="Manual Sensor Injection"
              subtitle="Override specific sensors to test risk propagation"
            />

            {/* Filters */}
            <div className="flex gap-3 mb-6 bg-surface-900 p-3 rounded-xl border border-surface-700">
              <select
                value={selectedMaster}
                onChange={(e) => { setSelectedMaster(e.target.value); setSelectedSub('ALL'); }}
                className="flex-1 px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Masters</option>
                {masterStations.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
              </select>
              <select
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Substations</option>
                {substations.filter(s => selectedMaster === 'ALL' || s.masterStationId === selectedMaster).map(s => (
                  <option key={s.id} value={s.id}>{s.id}</option>
                ))}
              </select>
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Sensor List */}
            <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '600px' }}>
              {filteredSensors.map(sensor => {
                const step = sensor.type === 'GEOPHONE' ? 0.1 : sensor.type === 'VWP' ? 5 : 0.5;
                const riskColor = getRiskLevelConfig(sensor.riskLevel).color;

                return (
                  <div key={sensor.id} className="p-4 rounded-xl border border-surface-700 bg-surface-900/50 hover:bg-surface-800 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white text-sm">{sensor.id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-slate-400">{sensor.type}</span>
                        <span className="text-[10px] text-slate-500">{sensor.substationId}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-lg" style={{ color: riskColor }}>
                          {sensor.currentValue.toFixed(2)} <span className="text-xs text-slate-500 font-sans">{sensor.unit}</span>
                        </span>
                        <button
                          onClick={() => setSensorOnline(sensor.id, sensor.communicationStatus === 'OFFLINE')}
                          className={clsx('px-2 py-1 rounded text-[10px] font-bold', sensor.communicationStatus === 'ONLINE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}
                        >
                          {sensor.communicationStatus === 'ONLINE' ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={sensor.normalMin}
                        max={sensor.criticalThreshold * 1.2}
                        step={step / 5}
                        value={sensor.currentValue}
                        onChange={(e) => setSensorValue(sensor.id, parseFloat(e.target.value))}
                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, #22c55e, #eab308, #ef4444)` }}
                      />
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setSensorValue(sensor.id, sensor.currentValue - step)} className="w-7 h-7 rounded bg-surface-700 hover:bg-surface-600 text-white flex items-center justify-center font-mono">-</button>
                        <button onClick={() => setSensorValue(sensor.id, sensor.currentValue + step)} className="w-7 h-7 rounded bg-surface-700 hover:bg-surface-600 text-white flex items-center justify-center font-mono">+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredSensors.length === 0 && (
                <p className="text-center py-8 text-slate-500 text-sm">No sensors match your filters.</p>
              )}
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-3">
              Showing top 12 results for performance. Use filters to find specific sensors.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
