import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Radio, Network, Map, BarChart2,
  Server, Cpu, AlertTriangle, Bell, Upload, Play,
  Mountain, Wifi, ChevronRight,
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
        className={({ isActive }) => clsx(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group mb-0.5',
          isActive
            ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-surface-700',
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
    { path: '/',          label: 'Overview',         icon: <LayoutDashboard size={16} /> },
    { path: '/dataflow',  label: 'Live Data Flow',   icon: <Radio size={16} /> },
    { path: '/topology',  label: 'Network Topology', icon: <Network size={16} /> },
    { path: '/map',       label: 'Live Map',         icon: <Map size={16} /> },
    { path: '/analytics', label: 'Sensor Analytics', icon: <BarChart2 size={16} /> },
  ];

  const infrastructureItems: NavItem[] = [
    { path: '/substations',    label: 'Substations',     icon: <Wifi size={16} /> },
    { path: '/master-stations',label: 'Master Stations', icon: <Server size={16} /> },
  ];

  const riskItems: NavItem[] = [
    { path: '/danger-zones', label: 'Danger Zones', icon: <AlertTriangle size={16} />,
      badge: systemStatus.criticalAlerts },
    { path: '/alerts',       label: 'Alerts',       icon: <Bell size={16} />,
      badge: systemStatus.activeWarnings + systemStatus.criticalAlerts },
  ];

  const toolItems: NavItem[] = [
    { path: '/import',     label: 'Data Import',   icon: <Upload size={16} /> },
    { path: '/simulation', label: 'Simulation',     icon: <Play size={16} /> },
  ];

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-surface-900 border-r border-surface-700 h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-700">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 shadow-glow-blue">
          <Mountain size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">MountainWatch</p>
          <p className="text-[10px] text-slate-500 leading-tight">Dehradun, Uttarakhand</p>
        </div>
      </div>

      {/* Overall Risk Pill */}
      <div
        className="mx-3 mt-3 mb-1 px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2"
        style={{ background: riskCfg.bgColor, borderColor: riskCfg.borderColor, color: riskCfg.textColor }}
      >
        <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ background: riskCfg.color }} />
        <span>System Risk: {riskCfg.label}</span>
        <ChevronRight size={12} className="ml-auto opacity-50" />
      </div>

      {/* Sim indicator */}
      {simulation.isRunning && (
        <div className="mx-3 mb-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping-slow" />
          Simulation Running — Tick #{simulation.tick}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <NavSection title="Monitoring"      items={monitoringItems} />
        <NavSection title="Infrastructure"  items={infrastructureItems} />
        <NavSection title="Risk & Alerts"   items={riskItems} />
        <NavSection title="Tools"           items={toolItems} />
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-surface-700 text-[10px] text-slate-600">
        <div className="flex items-center gap-2 mb-1">
          <Cpu size={10} />
          <span>Edge AI Engine v2.4.1</span>
        </div>
        <div>NDMA / SDRF Field System</div>
      </div>
    </aside>
  );
}
