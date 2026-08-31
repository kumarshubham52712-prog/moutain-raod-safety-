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
    <header className="h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-8 gap-6 sticky top-0 z-10 shadow-sm">
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <h1 className="text-lg font-black text-slate-900 truncate tracking-tight">{pageInfo.title}</h1>
          <span className="hidden md:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pageInfo.subtitle}</span>
        </div>
      </div>

      {/* Time */}
      <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
        <Clock size={14} className="text-brand-500" />
        <span className="font-mono">{now}</span>
      </div>

      {/* Last update */}
      <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400">
        <RefreshCw size={12} className={systemStatus.lastUpdated ? "animate-spin-slow text-brand-400" : ""} />
        <span>Last: {format(new Date(systemStatus.lastUpdated), 'HH:mm:ss')}</span>
      </div>

      {/* Alert bell */}
      <button
        className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors border border-transparent hover:border-slate-200"
        title="Unacknowledged alerts"
      >
        <Bell size={18} />
        {unackCritical > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shadow-sm" />
        )}
      </button>
    </header>
  );
}
