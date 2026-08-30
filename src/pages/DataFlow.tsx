import { useState } from 'react';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge } from '../components/common';
import { Server, Wifi, Activity, Droplets, Radio, Ruler, ArrowRight, Activity as Pulse } from 'lucide-react';
import { getRiskLevelConfig } from '../config/thresholds';
import { getSensorTypeConfig } from '../config/sensorTypes';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

const SENSOR_ICONS: Record<string, React.ElementType> = {
  IPI: Activity, VWP: Droplets, GEOPHONE: Radio, EXTENSOMETER: Ruler,
};

export default function DataFlow() {
  const { masterStations, substations, sensors } = useMonitoringStore();

  const [selectedMaster, setSelectedMaster] = useState(masterStations[0]?.id);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);

  const master = masterStations.find(m => m.id === selectedMaster);
  const masterSubs = substations.filter(s => s.masterStationId === selectedMaster);

  // Auto-select first sub when master changes
  if (selectedMaster && !selectedSub && masterSubs.length > 0) {
    setSelectedSub(masterSubs[0].id);
  }

  const sub = substations.find(s => s.id === selectedSub);
  const subSensors = sub ? sensors.filter(s => sub.sensorIds.includes(s.id)) : [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="System Architecture & Data Flow"
        subtitle="SENSORS → SUBSTATION (LoRa) → MASTER STATION (Edge AI) → RISK ENGINE"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── 1. Master Stations ───────────────────────────────── */}
        <Card className="p-4 flex flex-col h-[600px]">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-600/20 text-brand-400 flex items-center justify-center">1</span>
            Master Stations
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1">
            {masterStations.map(m => {
              const rCfg = getRiskLevelConfig(m.riskLevel);
              const isActive = m.id === selectedMaster;
              return (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMaster(m.id); setSelectedSub(null); }}
                  className={clsx(
                    'w-full text-left p-4 rounded-xl border transition-all relative',
                    isActive ? 'bg-surface-700/50 scale-[1.02] shadow-lg' : 'bg-surface-800 hover:bg-surface-700 opacity-60 hover:opacity-100',
                  )}
                  style={{ borderColor: isActive ? rCfg.color : 'rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Server size={20} style={{ color: rCfg.color }} />
                    <span className="font-bold font-mono text-white text-base">{m.id}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{m.name}</p>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{m.substationIds.length} Subs</span>
                    <span>Risk: {m.aggregatedRiskScore}</span>
                  </div>
                  {isActive && (
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-brand-400 z-10">
                      <ArrowRight size={24} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── 2. Substations ───────────────────────────────────── */}
        <Card className="p-4 flex flex-col h-[600px] border-l-4 border-l-brand-500/50">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">2</span>
            Substations (Edge Nodes)
          </h3>
          <div className="space-y-2 overflow-y-auto pr-2 flex-1">
            {masterSubs.map(s => {
              const rCfg = getRiskLevelConfig(s.riskLevel);
              const isActive = s.id === selectedSub;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSub(s.id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-lg border transition-all relative',
                    isActive ? 'bg-surface-700/50 scale-[1.02] shadow-lg' : 'bg-surface-800 hover:bg-surface-700 opacity-60 hover:opacity-100',
                  )}
                  style={{ borderColor: isActive ? rCfg.color : 'rgba(255,255,255,0.05)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Wifi size={14} style={{ color: rCfg.color }} />
                      <span className="font-bold font-mono text-white text-sm">{s.id}</span>
                    </div>
                    <StatusBadge level={s.riskLevel} size="xs" showDot={false} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{s.sensorIds.length} Sensors</span>
                    <span>LoRa: {s.loraSignal}%</span>
                  </div>
                  {isActive && (
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-cyan-400 z-10">
                      <ArrowRight size={24} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── 3. Sensors ───────────────────────────────────────── */}
        <Card className="p-4 flex flex-col h-[600px] border-l-4 border-l-purple-500/50">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">3</span>
            Sensors
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1">
            {subSensors.map(s => {
              const sRisk = getRiskLevelConfig(s.riskLevel);
              const tCfg = getSensorTypeConfig(s.type);
              const IconComp = SENSOR_ICONS[s.type] || Pulse;
              return (
                <Link
                  key={s.id}
                  to={`/sensors/${s.id}`}
                  className="block p-3 rounded-lg border bg-surface-900/50 hover:bg-surface-700 transition-colors"
                  style={{ borderColor: sRisk.borderColor }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComp size={14} style={{ color: tCfg.color }} />
                      <span className="font-bold font-mono text-white text-sm">{s.id}</span>
                    </div>
                    <StatusBadge level={s.riskLevel} size="xs" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">{s.type}</span>
                    <span className="font-mono font-bold" style={{ color: sRisk.color }}>
                      {s.currentValue.toFixed(2)} <span className="text-[10px] text-slate-500 font-sans">{s.unit}</span>
                    </span>
                  </div>
                </Link>
              );
            })}
            {subSensors.length === 0 && (
              <p className="text-center text-slate-500 text-sm mt-10">Select a substation</p>
            )}
          </div>
        </Card>
      </div>

      {/* Data flow diagram */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-white mb-6">Logical Architecture</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
          <div className="flex-1 w-full bg-surface-900 border border-surface-700 p-4 rounded-xl">
            <Pulse size={24} className="text-purple-400 mx-auto mb-2" />
            <p className="font-bold text-sm text-white">Sensors (120)</p>
            <p className="text-[10px] text-slate-500">IPI, VWP, Geo, Ext</p>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">1 min polling</p>
          </div>
          <ArrowRight size={24} className="text-slate-600 rotate-90 md:rotate-0" />
          <div className="flex-1 w-full bg-surface-900 border border-surface-700 p-4 rounded-xl">
            <Wifi size={24} className="text-cyan-400 mx-auto mb-2" />
            <p className="font-bold text-sm text-white">Substations (30)</p>
            <p className="text-[10px] text-slate-500">Data Aggregation</p>
            <p className="text-[10px] text-cyan-400 mt-2 font-mono bg-cyan-400/10 inline-block px-2 py-0.5 rounded">LoRa 868MHz</p>
          </div>
          <ArrowRight size={24} className="text-slate-600 rotate-90 md:rotate-0" />
          <div className="flex-1 w-full bg-surface-900 border border-surface-700 p-4 rounded-xl border-t-4 border-t-brand-500">
            <Server size={24} className="text-brand-400 mx-auto mb-2" />
            <p className="font-bold text-sm text-white">Master Stations (3)</p>
            <p className="text-[10px] text-slate-500">Edge Processing</p>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">Correlated Risk Engine</p>
          </div>
          <ArrowRight size={24} className="text-slate-600 rotate-90 md:rotate-0" />
          <div className="flex-1 w-full bg-surface-900 border border-surface-700 p-4 rounded-xl">
            <Radio size={24} className="text-red-400 mx-auto mb-2" />
            <p className="font-bold text-sm text-white">Alerting System</p>
            <p className="text-[10px] text-slate-500">Danger Zones</p>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">NDMA / SDRF</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
