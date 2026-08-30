import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge, CommBadge, ProgressBar } from '../components/common';
import { getRiskLevelConfig } from '../config/thresholds';
import { format } from 'date-fns';
import { Wifi, ChevronRight, Server } from 'lucide-react';
import clsx from 'clsx';

export default function Substations() {
  const { substations, masterStations, sensors } = useMonitoringStore();
  const [selectedMaster, setSelectedMaster] = useState<string>('ALL');

  const filteredSubs = selectedMaster === 'ALL'
    ? substations
    : substations.filter(s => s.masterStationId === selectedMaster);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Substations (Edge Nodes)"
        subtitle={`${substations.length} substations across the monitoring region`}
      >
        <select
          value={selectedMaster}
          onChange={(e) => setSelectedMaster(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface-800 border border-surface-600 text-sm text-white focus:border-brand-500 focus:outline-none"
        >
          <option value="ALL">All Master Stations</option>
          {masterStations.map(m => (
            <option key={m.id} value={m.id}>{m.id} ({m.name})</option>
          ))}
        </select>
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSubs.map(sub => {
          const cfg = getRiskLevelConfig(sub.riskLevel);
          const subSensors = sensors.filter(s => sub.sensorIds.includes(s.id));

          return (
            <Link key={sub.id} to={`/substations/${sub.id}`} className="block group">
              <Card className="p-4 hover:border-slate-500 transition-all hover:scale-[1.02] h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg" style={{ background: `${cfg.color}20` }}>
                      <Wifi size={16} style={{ color: cfg.color }} />
                    </div>
                    <span className="text-sm font-bold font-mono text-white group-hover:text-brand-400 transition-colors">{sub.id}</span>
                  </div>
                  <StatusBadge level={sub.riskLevel} size="xs" />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <Server size={12} />
                  <Link to={`/master-stations/${sub.masterStationId}`} className="hover:text-slate-300 hover:underline">
                    {sub.masterStationId}
                  </Link>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>{subSensors.length} sensors connected</span>
                  <CommBadge status={sub.communicationStatus} />
                </div>

                <ProgressBar value={sub.loraSignal} label="Signal" color="#06b6d4" />

                <div className="mt-auto pt-3 flex justify-between text-[10px] text-slate-600">
                  <span>Risk: {sub.riskScore}/100</span>
                  <span>Battery: {sub.batteryLevel.toFixed(0)}%</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
