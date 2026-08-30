import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge, CommBadge } from '../components/common';
import { getRiskLevelConfig } from '../config/thresholds';
import { getSensorTypeConfig } from '../config/sensorTypes';
import { format } from 'date-fns';
import { Activity, Droplets, Radio, Ruler, ChevronRight, Search, Filter } from 'lucide-react';
import clsx from 'clsx';
import type { SensorType, RiskLevel } from '../types';

const SENSOR_ICONS: Record<string, React.ElementType> = {
  IPI: Activity, VWP: Droplets, GEOPHONE: Radio, EXTENSOMETER: Ruler,
};

export default function SensorsListPage() {
  const { sensors, masterStations, substations } = useMonitoringStore();

  const [typeFilter, setTypeFilter] = useState<SensorType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [masterFilter, setMasterFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return sensors.filter(s => {
      if (typeFilter !== 'ALL' && s.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && s.riskLevel !== statusFilter) return false;
      if (masterFilter !== 'ALL' && s.masterStationId !== masterFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return s.id.toLowerCase().includes(q)
          || s.type.toLowerCase().includes(q)
          || s.substationId.toLowerCase().includes(q);
      }
      return true;
    });
  }, [sensors, typeFilter, statusFilter, masterFilter, searchQuery]);

  const sensorTypes: SensorType[] = ['IPI', 'VWP', 'GEOPHONE', 'EXTENSOMETER'];
  const riskLevels: RiskLevel[] = ['NORMAL', 'WATCH', 'WARNING', 'HIGH_RISK', 'CRITICAL'];

  return (
    <div className="space-y-4">
      <SectionHeader
        title="All Sensors"
        subtitle={`${sensors.length} total sensors across ${masterStations.length} master stations`}
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search sensors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg bg-surface-700 border border-surface-600 text-sm text-white focus:border-brand-500 focus:outline-none w-48"
            />
          </div>

          <Filter size={14} className="text-slate-500" />

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as SensorType | 'ALL')}
            className="px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            {sensorTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RiskLevel | 'ALL')}
            className="px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            {riskLevels.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Master filter */}
          <select
            value={masterFilter}
            onChange={(e) => setMasterFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            <option value="ALL">All Masters</option>
            {masterStations.map(m => (
              <option key={m.id} value={m.id}>{m.id}</option>
            ))}
          </select>

          <span className="text-xs text-slate-500 ml-auto">
            Showing {filtered.length} of {sensors.length}
          </span>
        </div>
      </Card>

      {/* Sensor Table */}
      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-700">
                {['Sensor ID', 'Type', 'Substation', 'Master', 'Value', 'Unit', 'Warn', 'Crit', 'Status', 'Battery', 'Signal', 'Updated', ''].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-slate-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(sensor => {
                const cfg = getSensorTypeConfig(sensor.type);
                const rCfg = getRiskLevelConfig(sensor.riskLevel);
                const IconComp = SENSOR_ICONS[sensor.type] || Activity;
                return (
                  <tr key={sensor.id} className="border-b border-surface-800 hover:bg-surface-700/30 transition-colors">
                    <td className="py-2 px-2 font-mono font-semibold text-white">{sensor.id}</td>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: `${cfg.color}20`, color: cfg.color }}>
                        <IconComp size={10} />
                        {sensor.type}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <Link to={`/substations/${sensor.substationId}`} className="text-brand-400 hover:underline">
                        {sensor.substationId}
                      </Link>
                    </td>
                    <td className="py-2 px-2">
                      <Link to={`/master-stations/${sensor.masterStationId}`} className="text-cyan-400 hover:underline">
                        {sensor.masterStationId}
                      </Link>
                    </td>
                    <td className="py-2 px-2 font-mono font-bold" style={{ color: rCfg.color }}>
                      {sensor.currentValue.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-slate-500">{sensor.unit}</td>
                    <td className="py-2 px-2 font-mono text-yellow-400">{sensor.warningThreshold}</td>
                    <td className="py-2 px-2 font-mono text-red-400">{sensor.criticalThreshold}</td>
                    <td className="py-2 px-2"><StatusBadge level={sensor.riskLevel} size="xs" /></td>
                    <td className="py-2 px-2 font-mono text-slate-400">{sensor.batteryLevel.toFixed(0)}%</td>
                    <td className="py-2 px-2 font-mono text-slate-400">{sensor.signalStrength}%</td>
                    <td className="py-2 px-2 font-mono text-slate-600 whitespace-nowrap">
                      {format(new Date(sensor.timestamp), 'HH:mm:ss')}
                    </td>
                    <td className="py-2 px-2">
                      <Link to={`/sensors/${sensor.id}`} className="text-slate-500 hover:text-slate-300">
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
