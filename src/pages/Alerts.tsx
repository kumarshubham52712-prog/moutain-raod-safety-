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
      case 'CRITICAL': return 'border-red-200 bg-red-50';
      case 'HIGH_RISK': return 'border-orange-200 bg-orange-50';
      case 'WARNING':  return 'border-yellow-200 bg-yellow-50';
      default:         return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SectionHeader
        title="Alert Center"
        subtitle={`${alerts.filter(a => !a.resolved).length} active alerts requiring attention`}
      />

      {/* Filters */}
      <Card className="p-5 bg-white border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <Filter size={16} className="text-slate-400" />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="ACTIVE">Active Only</option>
            <option value="RESOLVED">Resolved Only</option>
            <option value="ALL">All Alerts</option>
          </select>

          <select
            value={masterFilter}
            onChange={(e) => setMasterFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="ALL">All Master Stations</option>
            {masterStations.map(m => <option key={m.id} value={m.id}>{m.id}</option>)}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as typeof severityFilter)}
            className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-500 transition-colors"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH_RISK">High Risk</option>
            <option value="WARNING">Warning</option>
          </select>

          <span className="text-xs font-bold text-slate-500 ml-auto">
            Showing {filteredAlerts.length} alerts
          </span>

          <button
            onClick={clearAlertHistory}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors shadow-sm"
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
                'p-5 rounded-xl border transition-all flex flex-col md:flex-row gap-5 md:items-start relative overflow-hidden shadow-sm',
                isResolved
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : getAlertColor(alert.severity)
              )}
            >
              {/* Critical pulse bar */}
              {!isResolved && alert.severity === 'CRITICAL' && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 animate-pulse" />
              )}

              <div className="shrink-0 mt-1">
                {isResolved ? <CheckCircle size={24} className="text-green-500" /> : getAlertIcon(alert.severity)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className={clsx('text-lg font-black', isResolved ? 'text-slate-500' : 'text-slate-900')}>
                    {alert.title}
                  </h3>
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap bg-white/50 px-2 py-1 rounded-md border border-slate-200/50">
                    {format(new Date(alert.timestamp), 'MMM dd, HH:mm:ss')}
                  </span>
                </div>
                
                <p className="text-sm font-medium text-slate-600 mb-4">{alert.message}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                  {alert.sensorId && (
                    <span className="flex items-center gap-1 text-slate-500 bg-white/50 px-2 py-1 rounded border border-slate-200/50">
                      Sensor: <Link to={`/sensors/${alert.sensorId}`} className="font-mono font-bold text-brand-600 hover:underline">{alert.sensorId}</Link>
                    </span>
                  )}
                  {alert.dangerZoneId && (
                    <span className="flex items-center gap-1 text-slate-500 bg-white/50 px-2 py-1 rounded border border-slate-200/50">
                      Zone: <span className="font-mono font-bold text-red-600">{alert.dangerZoneId}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-500 bg-white/50 px-2 py-1 rounded border border-slate-200/50">
                    Master: <Link to={`/master-stations/${alert.masterStationId}`} className="font-mono font-bold text-brand-600 hover:underline">{alert.masterStationId}</Link>
                  </span>
                  <span className="flex items-center gap-1 text-slate-500 bg-white/50 px-2 py-1 rounded border border-slate-200/50">
                    Location: <span className="font-bold text-slate-700">{alert.location}</span>
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!isResolved && (
                <div className="flex md:flex-col gap-2 shrink-0 md:w-32">
                  {!isAcked && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200 shadow-sm"
                    >
                      <Check size={14} /> Acknowledge
                    </button>
                  )}
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold rounded-xl transition-colors border border-green-200 shadow-sm"
                  >
                    <CheckCircle size={14} /> Resolve
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl shadow-sm">
            <CheckCircle size={56} className="mx-auto text-green-500 mb-4 opacity-50" />
            <h3 className="text-xl font-black text-slate-900 mb-1">All Clear</h3>
            <p className="text-sm font-medium text-slate-500">No alerts match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
