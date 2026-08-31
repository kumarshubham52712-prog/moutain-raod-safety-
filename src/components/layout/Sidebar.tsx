import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Map, BarChart2,
  Server, Cpu, AlertTriangle, Bell, Upload, Play, PlaySquare,
  Mountain, Wifi, ChevronRight, Radio, Activity, Network,
} from 'lucide-react';
import { useMonitoringStore } from '../../store/monitoringStore';
import { getRiskLevelConfig } from '../../config/thresholds';
import clsx from 'clsx';

interface NavItem {
  path:  string;
  label: string;
  icon:  React.ReactNode;
  badge?: number | null;
}

const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
  <div className="mb-6">
    <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
    {items.map(item => (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.path === '/'}
        className={({ isActive }) => clsx(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group mb-0.5',
          isActive
            ? 'bg-brand-50 text-brand-600 border border-brand-100 shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-surface-800 hover:shadow-sm',
        )}
      >
        <span className="w-4 h-4 shrink-0">{item.icon}</span>
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge != null && item.badge > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-risk-critical/20 text-risk-critical border border-risk-critical/30">
            {item.badge}
          </span>
        )}
      </NavLink>
    ))}
  </div>
);

export function Sidebar() {
  const { systemStatus, simulation } = useMonitoringStore();
  const riskCfg = getRiskLevelConfig(systemStatus.overallRiskLevel);

  const monitoringItems: NavItem[] = [
    { path: '/',              label: 'Overview',         icon: <LayoutDashboard size={16} /> },
    { path: '/master-stations', label: 'Master Stations', icon: <Server size={16} /> },
    { path: '/substations',   label: 'Substations',      icon: <Wifi size={16} /> },
    { path: '/map',           label: 'Live Map',         icon: <Map size={16} /> },
    { path: '/dataflow',      label: 'Data Flow',        icon: <Radio size={16} /> },
    { path: '/topology',      label: 'Topology',         icon: <Network size={16} /> },
    { path: '/analytics',     label: 'Analytics',        icon: <Activity size={16} /> },
  ];

  const riskItems: NavItem[] = [
    { path: '/danger-zones', label: 'Danger Zones', icon: <AlertTriangle size={16} />,
      badge: systemStatus.criticalAlerts },
    { path: '/alerts',       label: 'Alerts',       icon: <Bell size={16} />,
      badge: systemStatus.activeWarnings + systemStatus.criticalAlerts },
  ];

  const toolItems: NavItem[] = [
    { path: '/simulation', label: 'Simulation', icon: <PlaySquare size={16} /> },
    { path: '/import',     label: 'Data Import', icon: <Upload size={16} /> },
  ];

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0 overflow-y-auto shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-md">
          <Mountain size={20} className="text-white" />
        </div>
        <div>
          <p className="text-base font-black text-slate-900 tracking-tight">MountainWatch</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Uttarakhand</p>
        </div>
      </div>

      {/* Overall Risk Pill */}
      <div
        className="mx-4 mt-4 mb-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold flex items-center gap-2 shadow-sm"
        style={{ background: riskCfg.bgColor || 'white', borderColor: riskCfg.borderColor, color: riskCfg.color }}
      >
        <span className="w-2.5 h-2.5 rounded-full animate-pulse-slow shadow-sm" style={{ background: riskCfg.color }} />
        <span className="uppercase tracking-widest text-[10px]">Risk: {riskCfg.label}</span>
        <ChevronRight size={14} className="ml-auto opacity-50" />
      </div>

      {/* Sim indicator */}
      {simulation.isRunning && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 text-[10px] font-bold flex items-center gap-2 shadow-sm uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping shadow-sm" />
          Sim: Tick #{simulation.tick}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <NavSection title="Monitoring"      items={monitoringItems} />
        <NavSection title="Risk & Alerts"   items={riskItems} />
        <NavSection title="Tools"           items={toolItems} />
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50">
        <div className="flex items-center gap-2 mb-1.5 text-slate-500">
          <Cpu size={12} />
          <span>Edge AI v2.4.1</span>
        </div>
        <div>NDMA / SDRF System</div>
      </div>
    </aside>
  );
}
