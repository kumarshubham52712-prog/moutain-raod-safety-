import { useState } from 'react';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge } from '../components/common';
import { getRiskLevelConfig } from '../config/thresholds';
import { format } from 'date-fns';
import { Map, AlertTriangle, ShieldAlert, Navigation, Layers, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

export default function DangerZones() {
  const { dangerZones, dangerZoneHistory, masterStations, substations, sensors, clearDangerZoneHistory } = useMonitoringStore();
  const [selectedMaster, setSelectedMaster] = useState<string>('ALL');

  // Filter out NORMAL zones — only show WATCH or above
  const activeZones = dangerZones.filter(z => z.riskScore > 30);

  const filteredZones = selectedMaster === 'ALL'
    ? activeZones
    : activeZones.filter(z => z.masterStationId === selectedMaster);

  // Sort by risk descending
  const sortedZones = [...filteredZones].sort((a, b) => b.riskScore - a.riskScore);

  const handleDownloadJSON = () => {
    // 1. Get only the affected Substations (riskScore > 30 represents danger/warning/critical)
    const affectedSubstations = substations.filter(sub => sub.riskScore > 30);
    
    // 2. Format the data according to the exact requirement
    const exportData = {
      export_type: "danger_zones_substations",
      exported_at: new Date().toISOString(),
      total_danger_substations: affectedSubstations.length,
      danger_zones: affectedSubstations.map(sub => {
        // Find sensors for this substation
        const subSensors = sensors.filter(s => s.substationId === sub.id);
        
        // Build the sensor readings object dynamically based on sensor types
        const sensorReadings = subSensors.reduce((acc, sensor) => {
          const typeKey = sensor.type.toLowerCase();
          acc[typeKey] = {
            value: sensor.currentValue,
            unit: sensor.unit
          };
          return acc;
        }, {} as Record<string, any>);

        return {
          substation_id: sub.id,
          master_station_id: sub.masterStationId,
          latitude: sub.latitude,
          longitude: sub.longitude,
          risk_score: sub.riskScore,
          status: sub.riskLevel,
          affected_sensors: sub.sensorIds,
          sensor_readings: sensorReadings,
          signal: sub.loraSignal,
          battery: sub.batteryLevel,
          connectivity: sub.communicationStatus,
          timestamp: sub.lastSync
        };
      })
    };

    // 3. Trigger download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Format timestamp for filename: YYYY-MM-DD-HH-mm-ss
    const now = new Date();
    const dateStr = now.toISOString().replace(/T/, '-').replace(/:/g, '-').split('.')[0];
    
    link.download = `danger-zones-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Current Danger Zones"
        subtitle="Live derived geographic areas with elevated risk profiles"
      >
        <select
          value={selectedMaster}
          onChange={(e) => setSelectedMaster(e.target.value)}
          className="px-3 py-2 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none shadow-sm"
        >
          <option value="ALL">All Master Stations</option>
          {masterStations.map(m => (
            <option key={m.id} value={m.id}>{m.id} ({m.name})</option>
          ))}
        </select>

        <button
          onClick={handleDownloadJSON}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-brand-50 border border-brand-200 text-brand-600 text-xs font-semibold hover:bg-brand-100 transition-colors shadow-sm"
        >
          Download JSON
        </button>

        <button
          onClick={clearDangerZoneHistory}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors shadow-sm"
        >
          <Trash2 size={12} /> Clear History
        </button>
      </SectionHeader>

      {sortedZones.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <ShieldAlert size={56} className="mx-auto mb-4 opacity-30 text-slate-300" />
          <p className="text-xl font-bold text-slate-500">No Current Danger Zones</p>
          <p className="text-sm mt-1">All monitored substations are within normal parameters.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedZones.map(zone => {
          const cfg = getRiskLevelConfig(zone.riskLevel);
          const isCritical = zone.riskLevel === 'CRITICAL';

          return (
            <Card
              key={zone.id}
              className={clsx(
                'p-6 transition-all relative overflow-hidden group hover:shadow-md',
                isCritical ? 'border-red-500/30 shadow-sm' : ''
              )}
            >
              {isCritical && (
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
              )}

              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-md flex items-center justify-center shrink-0 border shadow-sm',
                      isCritical ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                    )}
                  >
                    {isCritical ? <ShieldAlert size={24} /> : <AlertTriangle size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{zone.id}</h3>
                    <StatusBadge level={zone.riskLevel} size="xs" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-mono leading-none" style={{ color: cfg.color }}>
                    {zone.riskScore}
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Risk Score</p>
                </div>
              </div>

              <p className="text-sm font-bold text-slate-700 mb-1">{zone.name}</p>
              <p className="text-xs font-medium text-slate-500 mb-5 h-10 line-clamp-2">{zone.description}</p>

              <div className="space-y-2.5 mb-5 bg-slate-50 p-4 rounded-md border border-slate-100 shadow-sm">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5"><Layers size={12} /> Master Station</span>
                  <Link to={`/master-stations/${zone.masterStationId}`} className="font-mono font-bold text-brand-600 hover:underline">
                    {zone.masterStationId}
                  </Link>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5"><Navigation size={12} /> Coordinates</span>
                  <span className="font-mono font-medium text-slate-700">{zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5"><Map size={12} /> Radius</span>
                  <span className="font-mono font-medium text-slate-700">{zone.radius}m</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5"><AlertTriangle size={12} /> Abnormal Sensors</span>
                  <span className={clsx('font-mono font-bold', zone.abnormalSensorCount > 0 ? 'text-red-600' : 'text-slate-700')}>
                    {zone.abnormalSensorCount} / {zone.triggeringSensorIds.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                <span className="text-[10px] font-medium text-slate-400">
                  Updated: {format(new Date(zone.lastUpdated), 'HH:mm:ss')}
                </span>
                <span className={clsx(
                  'text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm',
                  zone.status === 'ACTIVE' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                )}>
                  {zone.status === 'ACTIVE' ? '● ACTIVE ZONE' : '○ MONITORING'}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {dangerZoneHistory && dangerZoneHistory.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-200">
          <SectionHeader
            title="Danger Zone History"
            subtitle="Recent historical instances of danger zones"
          />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
            {dangerZoneHistory.map((zone, idx) => {
              const cfg = getRiskLevelConfig(zone.riskLevel);
              return (
                <Card key={`${zone.id}-${idx}`} className="p-5 bg-slate-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-700">{zone.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{format(new Date(zone.timeDetected), 'MMM dd, HH:mm:ss')}</p>
                    </div>
                    <StatusBadge level={zone.riskLevel} />
                  </div>
                  <div className="text-sm text-slate-600 mt-2">
                    Peak Score: <span className="font-bold">{zone.riskScore}</span> / 100
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
