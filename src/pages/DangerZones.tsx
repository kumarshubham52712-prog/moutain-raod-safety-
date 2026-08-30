import { useState } from 'react';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge } from '../components/common';
import { getRiskLevelConfig } from '../config/thresholds';
import { format } from 'date-fns';
import { Map, AlertTriangle, ShieldAlert, Navigation, Layers } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

export default function DangerZones() {
  const { dangerZones, masterStations } = useMonitoringStore();
  const [selectedMaster, setSelectedMaster] = useState<string>('ALL');

  const filteredZones = selectedMaster === 'ALL'
    ? dangerZones
    : dangerZones.filter(z => z.masterStationId === selectedMaster);

  // Sort by risk descending
  const sortedZones = [...filteredZones].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Active Danger Zones"
        subtitle="Geographic areas with elevated risk profiles"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedZones.map(zone => {
          const cfg = getRiskLevelConfig(zone.riskLevel);
          const isCritical = zone.riskLevel === 'CRITICAL';

          return (
            <Card
              key={zone.id}
              className={clsx(
                'p-5 transition-all relative overflow-hidden',
                isCritical ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''
              )}
            >
              {isCritical && (
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
                      isCritical ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-surface-700 text-slate-400 border-surface-600'
                    )}
                  >
                    {isCritical ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight">{zone.id}</h3>
                    <StatusBadge level={zone.riskLevel} size="xs" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black font-mono leading-none" style={{ color: cfg.color }}>
                    {zone.riskScore}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Risk Score</p>
                </div>
              </div>

              <p className="text-sm text-white font-medium mb-1">{zone.name}</p>
              <p className="text-xs text-slate-400 mb-4 h-10 line-clamp-2">{zone.description}</p>

              <div className="space-y-2 mb-4 bg-surface-900/50 p-3 rounded-lg border border-surface-700">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5"><Layers size={12} /> Master Station</span>
                  <Link to={`/master-stations/${zone.masterStationId}`} className="font-mono text-cyan-400 hover:underline">
                    {zone.masterStationId}
                  </Link>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5"><Navigation size={12} /> Coordinates</span>
                  <span className="font-mono text-slate-300">{zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5"><Map size={12} /> Radius</span>
                  <span className="font-mono text-slate-300">{zone.radius}m</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5"><AlertTriangle size={12} /> Abnormal Sensors</span>
                  <span className={clsx('font-mono font-bold', zone.abnormalSensorCount > 0 ? 'text-red-400' : 'text-slate-300')}>
                    {zone.abnormalSensorCount} / {zone.triggeringSensorIds.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-[10px] text-slate-500">
                  Updated: {format(new Date(zone.lastUpdated), 'HH:mm:ss')}
                </span>
                <span className={clsx(
                  'text-[10px] font-bold px-2 py-1 rounded',
                  zone.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400' : 'bg-surface-700 text-slate-400'
                )}>
                  {zone.status === 'ACTIVE' ? '● ACTIVE ZONE' : '○ MONITORING'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
