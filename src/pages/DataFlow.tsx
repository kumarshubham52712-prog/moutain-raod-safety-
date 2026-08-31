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
        <Card className="p-5 flex flex-col h-[600px] bg-white border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shadow-sm">1</span>
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
                    isActive ? 'bg-slate-50 scale-[1.02] shadow-md border-slate-200' : 'bg-white hover:bg-slate-50 opacity-70 hover:opacity-100 border-slate-100',
                  )}
                  style={{ borderColor: isActive ? rCfg.color : undefined }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Server size={20} style={{ color: rCfg.color }} />
                    <span className="font-bold font-mono text-slate-900 text-base">{m.id}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mb-3">{m.name}</p>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{m.substationIds.length} Subs</span>
                    <span>Risk: {m.aggregatedRiskScore}</span>
                  </div>
                  {isActive && (
                    <div className="absolute top-1/2 -right-5 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-brand-600 z-10">
                      <ArrowRight size={24} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── 2. Substations ───────────────────────────────────── */}
        <Card className="p-5 flex flex-col h-[600px] bg-white border-l-4 border-l-cyan-500 border-y-slate-200 border-r-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center shadow-sm">2</span>
            Substations (Edge Nodes)
          </h3>
          <div className="space-y-3 overflow-y-auto pr-2 flex-1">
            {masterSubs.map(s => {
              const rCfg = getRiskLevelConfig(s.riskLevel);
              const isActive = s.id === selectedSub;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSub(s.id)}
                  className={clsx(
                    'w-full text-left p-4 rounded-xl border transition-all relative',
                    isActive ? 'bg-slate-50 scale-[1.02] shadow-md border-slate-200' : 'bg-white hover:bg-slate-50 opacity-70 hover:opacity-100 border-slate-100',
                  )}
                  style={{ borderColor: isActive ? rCfg.color : undefined }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Wifi size={16} style={{ color: rCfg.color }} />
                      <span className="font-bold font-mono text-slate-900 text-sm">{s.id}</span>
                    </div>
                    <StatusBadge level={s.riskLevel} size="xs" showDot={false} />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>{s.sensorIds.length} Sensors</span>
                    <span>LoRa: {s.loraSignal}%</span>
                  </div>
                  {isActive && (
                    <div className="absolute top-1/2 -right-5 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-cyan-600 z-10">
                      <ArrowRight size={24} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── 3. Sensors ───────────────────────────────────────── */}
        <Card className="p-5 flex flex-col h-[600px] bg-white border-l-4 border-l-purple-500 border-y-slate-200 border-r-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shadow-sm">3</span>
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
                  className="block p-4 rounded-xl border bg-white hover:bg-slate-50 transition-colors shadow-sm"
                  style={{ borderColor: sRisk.borderColor || '#e2e8f0' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <IconComp size={16} style={{ color: tCfg.color }} />
                      <span className="font-bold font-mono text-slate-900 text-sm">{s.id}</span>
                    </div>
                    <StatusBadge level={s.riskLevel} size="xs" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">{s.type}</span>
                    <span className="font-mono font-black text-lg" style={{ color: sRisk.color }}>
                      {s.currentValue.toFixed(2)} <span className="text-[10px] font-bold text-slate-400 font-sans">{s.unit}</span>
                    </span>
                  </div>
                </Link>
              );
            })}
            {subSensors.length === 0 && (
              <p className="text-center font-medium text-slate-400 text-sm mt-10">Select a substation</p>
            )}
          </div>
        </Card>
      </div>

      {/* Data flow diagram */}
      <Card className="p-8 bg-white border-slate-200 shadow-sm">
        <h3 className="text-base font-black text-slate-900 mb-6">Logical Architecture</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 text-center">
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <Pulse size={24} className="text-purple-600" />
            </div>
            <p className="font-black text-sm text-slate-900">Sensors (120)</p>
            <p className="text-xs font-medium text-slate-500 mt-1">IPI, VWP, Geo, Ext</p>
            <p className="text-[10px] font-bold text-slate-400 mt-3 font-mono bg-white border border-slate-200 inline-block px-2.5 py-1 rounded-md shadow-sm">1 min polling</p>
          </div>
          <ArrowRight size={24} className="text-slate-300 rotate-90 md:rotate-0 shrink-0" />
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center mx-auto mb-3">
              <Wifi size={24} className="text-cyan-600" />
            </div>
            <p className="font-black text-sm text-slate-900">Substations (30)</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Data Aggregation</p>
            <p className="text-[10px] font-bold text-cyan-700 mt-3 font-mono bg-cyan-100 border border-cyan-200 inline-block px-2.5 py-1 rounded-md shadow-sm">LoRa 868MHz</p>
          </div>
          <ArrowRight size={24} className="text-slate-300 rotate-90 md:rotate-0 shrink-0" />
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm border-t-4 border-t-brand-500">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-3">
              <Server size={24} className="text-brand-600" />
            </div>
            <p className="font-black text-sm text-slate-900">Master Stations (3)</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Edge Processing</p>
            <p className="text-[10px] font-bold text-slate-400 mt-3 font-mono bg-white border border-slate-200 inline-block px-2.5 py-1 rounded-md shadow-sm">Correlated Risk Engine</p>
          </div>
          <ArrowRight size={24} className="text-slate-300 rotate-90 md:rotate-0 shrink-0" />
          <div className="flex-1 w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
              <Radio size={24} className="text-red-600" />
            </div>
            <p className="font-black text-sm text-slate-900">Alerting System</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Danger Zones</p>
            <p className="text-[10px] font-bold text-slate-400 mt-3 font-mono bg-white border border-slate-200 inline-block px-2.5 py-1 rounded-md shadow-sm">NDMA / SDRF</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
