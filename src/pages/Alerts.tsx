import { useState }            from 'react';
import { useMonitoringStore }  from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge } from '../components/common';
import { format }              from 'date-fns';
import { Bell, Check, CheckCheck, Filter } from 'lucide-react';
import clsx                    from 'clsx';

type SeverityFilter = 'ALL' | 'CRITICAL' | 'HIGH_RISK' | 'WARNING' | 'INFO';
type StatusFilter   = 'ALL' | 'UNACK' | 'ACK' | 'RESOLVED';

const SEV_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  CRITICAL:  { bg: 'bg-red-500/10',    border: 'border-l-red-500',    text: 'text-red-400',    icon: '🚨' },
  HIGH_RISK: { bg: 'bg-orange-500/10', border: 'border-l-orange-500', text: 'text-orange-400', icon: '⚠️' },
  WARNING:   { bg: 'bg-yellow-500/10', border: 'border-l-yellow-500', text: 'text-yellow-400', icon: '⚡' },
  INFO:      { bg: 'bg-blue-500/10',   border: 'border-l-blue-500',   text: 'text-blue-400',   icon: 'ℹ️' },
};

export default function Alerts() {
  const { alerts, acknowledgeAlert, resolveAlert } = useMonitoringStore();
  const [sevFilter, setSevFilter]       = useState<SeverityFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  let filtered = [...alerts];
  if (sevFilter !== 'ALL')        filtered = filtered.filter(a => a.severity === sevFilter);
  if (statusFilter === 'UNACK')   filtered = filtered.filter(a => !a.acknowledged && !a.resolved);
  if (statusFilter === 'ACK')     filtered = filtered.filter(a => a.acknowledged && !a.resolved);
  if (statusFilter === 'RESOLVED') filtered = filtered.filter(a => a.resolved);

  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const counts = {
    total:    alerts.length,
    unack:    alerts.filter(a => !a.acknowledged && !a.resolved).length,
    ack:      alerts.filter(a => a.acknowledged && !a.resolved).length,
    resolved: alerts.filter(a => a.resolved).length,
    critical: alerts.filter(a => a.severity === 'CRITICAL' && !a.resolved).length,
  };

  return (
    <div className="space-y-4">
      {/* ── Summary Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Alerts', value: counts.total, color: '#0ea5e9' },
          { label: 'Unacknowledged', value: counts.unack, color: '#f97316' },
          { label: 'Acknowledged', value: counts.ack, color: '#3b82f6' },
          { label: 'Resolved', value: counts.resolved, color: '#22c55e' },
          { label: 'Active Critical', value: counts.critical, color: '#ef4444' },
        ].map(kpi => (
          <Card key={kpi.label} className="p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Filter size={12} /> Severity:
        </div>
        {(['ALL', 'CRITICAL', 'HIGH_RISK', 'WARNING', 'INFO'] as SeverityFilter[]).map(sev => (
          <button
            key={sev}
            onClick={() => setSevFilter(sev)}
            className={clsx(
              'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
              sevFilter === sev
                ? 'bg-brand-600/20 border-brand-600/40 text-brand-400'
                : 'border-surface-700 text-slate-500 hover:text-slate-300',
            )}
          >
            {sev === 'ALL' ? 'All' : sev.replace('_', ' ')}
          </button>
        ))}

        <div className="w-px h-5 bg-surface-700 mx-1" />

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          Status:
        </div>
        {(['ALL', 'UNACK', 'ACK', 'RESOLVED'] as StatusFilter[]).map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={clsx(
              'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
              statusFilter === st
                ? 'bg-brand-600/20 border-brand-600/40 text-brand-400'
                : 'border-surface-700 text-slate-500 hover:text-slate-300',
            )}
          >
            {st === 'ALL' ? 'All' : st === 'UNACK' ? 'Unacknowledged' : st === 'ACK' ? 'Acknowledged' : 'Resolved'}
          </button>
        ))}
      </div>

      {/* ── Alert List ─────────────────────────────────────────── */}
      <Card className="p-4">
        <SectionHeader title="Alert History" subtitle={`${filtered.length} alerts matching filters`} />

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={32} className="mx-auto text-slate-700 mb-2" />
            <p className="text-sm text-slate-600">No alerts match current filters</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map(alert => {
              const s = SEV_STYLES[alert.severity] ?? SEV_STYLES.INFO;
              return (
                <div
                  key={alert.id}
                  className={clsx(
                    'border-l-4 rounded-r-lg px-4 py-3 transition-all',
                    s.bg, s.border,
                    alert.resolved && 'opacity-50',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={clsx('text-xs font-bold', s.text)}>
                          {s.icon} {alert.severity.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">
                          {format(new Date(alert.timestamp), 'dd MMM, HH:mm:ss')}
                        </span>
                        {alert.acknowledged && (
                          <span className="text-[10px] text-blue-400 flex items-center gap-1">
                            <Check size={10} /> ACK
                          </span>
                        )}
                        {alert.resolved && (
                          <span className="text-[10px] text-green-400 flex items-center gap-1">
                            <CheckCheck size={10} /> RESOLVED
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white mb-0.5">{alert.title}</p>
                      <p className="text-xs text-slate-400 mb-1.5">{alert.message}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-600 flex-wrap">
                        {alert.sensorId && <span>Sensor: <span className="font-mono text-slate-400">{alert.sensorId}</span></span>}
                        {alert.substationId && <span>Station: <span className="font-mono text-slate-400">{alert.substationId}</span></span>}
                        {alert.dangerZoneId && <span>Zone: <span className="font-mono text-slate-400">{alert.dangerZoneId}</span></span>}
                        <span>Location: <span className="text-slate-400">{alert.location}</span></span>
                      </div>
                      {alert.acknowledgedBy && (
                        <p className="text-[10px] text-slate-600 mt-1">
                          Acknowledged by {alert.acknowledgedBy} at {format(new Date(alert.acknowledgedAt!), 'HH:mm')}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      {!alert.acknowledged && !alert.resolved && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-all"
                        >
                          Acknowledge
                        </button>
                      )}
                      {alert.acknowledged && !alert.resolved && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-all"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
