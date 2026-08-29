import { useMonitoringStore }    from '../store/monitoringStore';
import { SCENARIOS }            from '../services/simulationEngine';
import { Card, SectionHeader, StatusBadge, ProgressBar } from '../components/common';
import { getRiskLevelConfig }   from '../config/thresholds';
import { Play, Pause, RotateCcw, Zap, Cloud, Thermometer, Wind, Droplet } from 'lucide-react';
import clsx                     from 'clsx';
import type { SimulationScenario } from '../types';

export default function SimulationControl() {
  const {
    simulation, envState, systemStatus,
    startSimulation, pauseSimulation, resetSimulation,
    setScenario, setSimSpeed,
  } = useMonitoringStore();

  const scenarioEntries = Object.entries(SCENARIOS) as [SimulationScenario, typeof SCENARIOS['A']][];
  const riskCfg = getRiskLevelConfig(systemStatus.overallRiskLevel);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Controls ──────────────────────────────────────────── */}
      <Card className="p-6">
        <SectionHeader title="Simulation Controls" subtitle="Start, pause, or reset the correlated sensor simulation" />

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={simulation.isRunning ? pauseSimulation : startSimulation}
            className={clsx(
              'flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all',
              simulation.isRunning
                ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/40 hover:bg-yellow-500/30'
                : 'bg-green-500/20 text-green-400 border-2 border-green-500/40 hover:bg-green-500/30',
            )}
          >
            {simulation.isRunning ? <Pause size={18} /> : <Play size={18} />}
            {simulation.isRunning ? 'Pause Simulation' : 'Start Simulation'}
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-slate-500/10 text-slate-400 border-2 border-slate-500/30 hover:bg-slate-500/20 transition-all"
          >
            <RotateCcw size={16} /> Reset
          </button>

          <div className="w-px h-8 bg-surface-700 mx-1" />

          {/* Speed Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Speed:</span>
            {[1, 2, 5, 10].map(sp => (
              <button
                key={sp}
                onClick={() => setSimSpeed(sp)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                  simulation.speed === sp
                    ? 'bg-brand-600/20 border-brand-600/40 text-brand-400'
                    : 'border-surface-700 text-slate-500 hover:text-slate-300',
                )}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>

        {/* Live Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface-900 rounded-lg p-3 border border-surface-700 text-center">
            <p className="text-[10px] text-slate-500 uppercase">Status</p>
            <p className={clsx('text-sm font-bold', simulation.isRunning ? 'text-green-400' : 'text-slate-500')}>
              {simulation.isRunning ? '● RUNNING' : '○ PAUSED'}
            </p>
          </div>
          <div className="bg-surface-900 rounded-lg p-3 border border-surface-700 text-center">
            <p className="text-[10px] text-slate-500 uppercase">Tick</p>
            <p className="text-sm font-bold font-mono text-white">#{simulation.tick}</p>
          </div>
          <div className="bg-surface-900 rounded-lg p-3 border border-surface-700 text-center">
            <p className="text-[10px] text-slate-500 uppercase">Scenario</p>
            <p className="text-sm font-bold text-brand-400">{simulation.scenario}</p>
          </div>
          <div className="bg-surface-900 rounded-lg p-3 border border-surface-700 text-center">
            <p className="text-[10px] text-slate-500 uppercase">System Risk</p>
            <p className="text-sm font-bold font-mono" style={{ color: riskCfg.color }}>
              {systemStatus.overallRiskScore}/100
            </p>
          </div>
        </div>
      </Card>

      {/* ── Scenario Selector ─────────────────────────────────── */}
      <Card className="p-6">
        <SectionHeader
          title="Scenario Selection"
          subtitle="Switch between pre-configured demo scenarios to test different risk conditions"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarioEntries.map(([key, scenario]) => {
            const isActive = simulation.scenario === key;
            const riskColors: Record<string, string> = {
              A: '#22c55e',
              B: '#eab308',
              C: '#f97316',
              D: '#f97316',
              E: '#ef4444',
            };
            const color = riskColors[key] ?? '#0ea5e9';

            return (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className={clsx(
                  'text-left px-4 py-4 rounded-xl border-2 transition-all hover:scale-[1.02]',
                  isActive ? 'scale-[1.02]' : 'opacity-60 hover:opacity-80',
                )}
                style={{
                  borderColor: isActive ? color : 'rgba(255,255,255,0.06)',
                  background:  isActive ? `${color}10` : 'rgba(255,255,255,0.02)',
                  boxShadow:   isActive ? `0 0 20px ${color}20` : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                    style={{ background: `${color}20`, color }}
                  >
                    {key}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-white">
                      Scenario {key}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Rainfall: {scenario.rainfallIntensity}%
                    </p>
                  </div>
                  {isActive && (
                    <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ background: `${color}20`, color }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{scenario.description}</p>
                {Object.keys(scenario.sensorOverrides).length > 0 && (
                  <p className="text-[10px] text-slate-600 mt-1">
                    {Object.keys(scenario.sensorOverrides).length} sensor overrides
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Environmental State ────────────────────────────────── */}
      <Card className="p-6">
        <SectionHeader
          title="Environmental State"
          subtitle="Hidden simulation driver — correlated with sensor behaviour"
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: <Cloud size={16} />,       label: 'Rainfall',     value: envState.rainfallIntensity, unit: '%', color: '#3b82f6', max: 100 },
            { icon: <Droplet size={16} />,     label: 'Ground Sat.',  value: envState.groundSaturation,  unit: '%', color: '#06b6d4', max: 100 },
            { icon: <Thermometer size={16} />, label: 'Temperature',  value: envState.temperature,       unit: '°C', color: '#f59e0b', max: 40 },
            { icon: <Droplet size={16} />,     label: 'Humidity',     value: envState.humidity,          unit: '%', color: '#8b5cf6', max: 100 },
            { icon: <Wind size={16} />,        label: 'Wind Speed',   value: envState.windSpeed,         unit: 'km/h', color: '#ec4899', max: 80 },
          ].map(env => (
            <div key={env.label} className="bg-surface-900 rounded-xl p-4 border border-surface-700">
              <div className="flex items-center gap-2 mb-2" style={{ color: env.color }}>
                {env.icon}
                <span className="text-xs font-semibold">{env.label}</span>
              </div>
              <p className="text-xl font-bold font-mono text-white mb-2">
                {env.value.toFixed(1)}<span className="text-xs text-slate-500 ml-1">{env.unit}</span>
              </p>
              <ProgressBar value={env.value} max={env.max} color={env.color} />
            </div>
          ))}
        </div>

        <div className="mt-4 px-3 py-2 bg-surface-900 rounded-lg border border-surface-700 text-xs text-slate-500">
          <Zap size={12} className="inline mr-1 text-yellow-400" />
          <strong className="text-slate-400">Correlation chain:</strong>{' '}
          Rainfall ↑ → Ground Saturation ↑ → VWP Pressure ↑ → IPI Displacement ↑ → Geophone Activity ↑ → Extensometer Displacement ↑
        </div>
      </Card>
    </div>
  );
}
