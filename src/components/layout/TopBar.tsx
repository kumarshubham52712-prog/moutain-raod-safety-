import { useLocation } from 'react-router-dom';
import { Bell, RefreshCw, Clock } from 'lucide-react';
import { useMonitoringStore } from '../../store/monitoringStore';
import { format } from 'date-fns';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/':             { title: 'Overview Dashboard',  subtitle: 'System-wide status and KPIs' },
  '/dataflow':     { title: 'Live Data Flow',       subtitle: 'Real-time pipeline event stream' },
  '/topology':     { title: 'Network Topology',     subtitle: 'Sensor → Substation → Master station hierarchy' },
  '/map':          { title: 'Live Map',             subtitle: 'Geospatial sensor and risk zone visualization' },
  '/analytics':    { title: 'Sensor Analytics',     subtitle: 'Time-series charts and trend analysis' },
  '/substations':  { title: 'Substations',          subtitle: 'All edge stations and their sensor clusters' },
  '/master-stations': { title: 'Master Stations',   subtitle: 'Aggregation nodes and LoRa network status' },
  '/danger-zones': { title: 'Danger Zones',         subtitle: 'Active risk zones and recommended actions' },
  '/alerts':       { title: 'Alerts',               subtitle: 'System-generated alerts and history' },
  '/import':       { title: 'Data Import',          subtitle: 'Upload CSV/JSON sensor data' },
  '/simulation':   { title: 'Simulation Control',   subtitle: 'Configure and run demo scenarios' },
};

export function TopBar() {
  const location = useLocation();
  const { alerts, systemStatus } = useMonitoringStore();
  const pageInfo = PAGE_TITLES[location.pathname] ?? { title: 'Dashboard', subtitle: '' };
  const unackCritical = alerts.filter(a => !a.acknowledged && !a.resolved && a.severity === 'CRITICAL').length;
  const now = format(new Date(), 'dd MMM yyyy, HH:mm:ss');

  return (
    <header className="h-14 shrink-0 bg-surface-900/80 backdrop-blur border-b border-surface-700 flex items-center px-6 gap-4 sticky top-0 z-10">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-base font-bold text-white truncate">{pageInfo.title}</h1>
          <span className="hidden md:inline text-xs text-slate-500">/ {pageInfo.subtitle}</span>
        </div>
      </div>

      {/* Time */}
      <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
        <Clock size={12} />
        <span className="font-mono">{now}</span>
      </div>

      {/* Last update */}
      <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600">
        <RefreshCw size={11} />
        <span>Last: {format(new Date(systemStatus.lastUpdated), 'HH:mm:ss')}</span>
      </div>

      {/* Alert bell */}
      <button
        className="relative p-2 rounded-lg hover:bg-surface-700 text-slate-400 hover:text-white transition-colors"
        title="Unacknowledged alerts"
      >
        <Bell size={16} />
        {unackCritical > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-risk-critical animate-ping-slow" />
        )}
      </button>
    </header>
  );
}
