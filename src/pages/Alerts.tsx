import { useState } from 'react';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader } from '../components/common';
import { format } from 'date-fns';
import { AlertCircle, AlertTriangle, CheckCircle, Check, Trash2, Filter } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import type { Alert } from '../types';

export default function Alerts() {
  const { alerts, masterStations, acknowledgeAlert, resolveAlert, clearAlertHistory } = useMonitoringStore();

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [masterFilter, setMasterFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'HIGH_RISK'>('ALL');

  // Filter out INFO severity by default — only show WARNING/HIGH_RISK/CRITICAL
  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ACTIVE' && a.resolved) return false;
    if (filter === 'RESOLVED' && !a.resolved) return false;
    if (masterFilter !== 'ALL' && a.masterStationId !== masterFilter) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (a.severity === 'INFO') return false; // Hide INFO/normal alerts
    return true;
  });

  const getAlertIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircle size={24} className="text-red-500" />;
      case 'HIGH_RISK': return <AlertTriangle size={24} className="text-orange-500" />;
      case 'WARNING':  return <AlertTriangle size={24} className="text-yellow-500" />;
      default:         return <AlertCircle size={24} className="text-blue-500" />;
    }
  };

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'CRITICAL': return 'border-red-500/50 bg-red-500/5';
      case 'HIGH_RISK': return 'border-orange-500/50 bg-orange-500/5';
      case 'WARNING':  return 'border-yellow-500/50 bg-yellow-500/5';
      default:         return 'border-blue-500/50 bg-blue-500/5';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionHeader
        title="Alert Center"
        subtitle={`${alerts.filter(a => !a.resolved).length} active alerts requiring attention`}
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={14} className="text-slate-500" />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-sm text-white focus:outline-none"
          >
            <option value="ACTIVE">Active Only</option>
            <option value="RESOLVED">Resolved Only</option>
            <option value="ALL">All Alerts</option>
          </select>

          <select
            value={masterFilter}
            onChange={(e) => setMasterFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-sm text-white focus:outline-none"
          >
            <option value="ALL">All Master Stations</option>
            {masterStations.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)}
            className="px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-sm text-white focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH_RISK">High Risk</option>
            <option value="WARNING">Warning</option>
          </select>

          <span className="text-xs text-slate-500 ml-auto">
            Showing {filteredAlerts.length} alerts
          </span>

          <button
            onClick={clearAlertHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
          >
            <Trash2 size={12} /> Clear History
          </button>
        </div>
      </Card>

      {/* Alert List */}
      <div className="space-y-4">
        {filteredAlerts.map(alert => {
          const isResolved = alert.resolved;
          const isAcked = alert.acknowledged;

          return (
            <div
              key={alert.id}
              className={clsx(
                'p-4 rounded-xl border transition-all flex flex-col md:flex-row gap-4 md:items-start relative overflow-hidden',
                isResolved
                  ? 'bg-surface-800/50 border-surface-700 opacity-60'
                  : getAlertColor(alert.severity)
              )}
            >
              {/* Critical pulse bar */}
              {!isResolved && alert.severity === 'CRITICAL' && (
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse" />
              )}

              <div className="shrink-0 mt-1">
                {isResolved ? <CheckCircle size={24} className="text-green-500" /> : getAlertIcon(alert.severity)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <h3 className={clsx('text-base font-bold', isResolved ? 'text-slate-400' : 'text-white')}>
                    {alert.title}
                  </h3>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {format(new Date(alert.timestamp), 'MMM dd, HH:mm:ss')}
                  </span>
                </div>
                
                <p className="text-sm text-slate-400 mb-3">{alert.message}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {alert.sensorId && (
                    <span className="flex items-center gap-1 text-slate-500">
                      Sensor: <Link to={`/sensors/${alert.sensorId}`} className="font-mono text-brand-400 hover:underline">{alert.sensorId}</Link>
                    </span>
                  )}
                  {alert.dangerZoneId && (
                    <span className="flex items-center gap-1 text-slate-500">
                      Zone: <span className="font-mono text-red-400">{alert.dangerZoneId}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-500">
                    Master: <Link to={`/master-stations/${alert.masterStationId}`} className="font-mono text-cyan-400 hover:underline">{alert.masterStationId}</Link>
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    Location: <span className="font-medium text-slate-300">{alert.location}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!isResolved && (
                <div className="flex md:flex-col gap-2 shrink-0 md:w-32">
                  {!isAcked && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-surface-700 hover:bg-surface-600 text-white text-xs font-bold rounded-lg transition-colors border border-surface-600"
                    >
                      <Check size={14} /> Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-bold rounded-lg transition-colors border border-green-500/30"
                  >
                    <CheckCircle size={14} /> Resolve
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12 bg-surface-800 border border-surface-700 rounded-xl">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-slate-300 mb-1">All Clear</h3>
            <p className="text-sm text-slate-500">No alerts match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
