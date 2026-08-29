import { useMonitoringStore }  from '../store/monitoringStore';
import {
  KPICard, SectionHeader, StatusBadge, CommBadge, Card, ProgressBar, MetricRow
} from '../components/common';
import { TimeSeriesChart, RiskGauge } from '../components/charts';
import { getRiskLevelConfig }         from '../config/thresholds';
import { getSensorTypeConfig }         from '../config/sensorTypes';
import {
  Wifi, Server, AlertTriangle, CheckCircle, XCircle,
  Activity, Droplets, Radio, Ruler, Play, Pause,
} from 'lucide-react';
import { format }    from 'date-fns';
import clsx          from 'clsx';

export default function Overview() {
  const {
    systemStatus, sensors, substations, masterStation,
    alerts, simulation, startSimulation, pauseSimulation,
  } = useMonitoringStore();

  const riskCfg    = getRiskLevelConfig(systemStatus.overallRiskLevel);
  const unresolved = alerts.filter(a => !a.resolved);
  const recentAlerts = unresolved.slice(0, 5);

  // Sensor type breakdown
  const sensorTypeCounts = sensors.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sensorTypeAbnormal = sensors.reduce((acc, s) => {
    if (s.isAbnormal) acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* ── Header Row ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">System Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dehradun Mountainous Region — {format(new Date(), 'dd MMM yyyy, HH:mm')}
          </p>
        </div>
        <button
          onClick={simulation.isRunning ? pauseSimulation : startSimulation}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
            simulation.isRunning
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
              : 'bg-brand-600/20 text-brand-400 border border-brand-600/30 hover:bg-brand-600/30'
          )}
        >
          {simulation.isRunning ? <Pause size={14} /> : <Play size={14} />}
          {simulation.isRunning ? 'Pause Simulation' : 'Start Simulation'}
        </button>
      </div>

      {/* ── Overall Risk Banner ────────────────────────────────── */}
      <div
        className="rounded-xl border p-4 flex items-center gap-4"
        style={{ background: riskCfg.bgColor, borderColor: riskCfg.borderColor }}
      >
        <RiskGauge score={systemStatus.overallRiskScore} size={80} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <StatusBadge level={systemStatus.overallRiskLevel} size="md" />
            <span className="text-sm font-semibold" style={{ color: riskCfg.textColor }}>
              Overall System Risk
            </span>
          </div>
          <p className="text-xs text-slate-400">{riskCfg.description}</p>
          <p className="text-xs font-semibold mt-1" style={{ color: riskCfg.textColor }}>
            Recommended: {riskCfg.action}
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs text-slate-500">Scenario</p>
          <p className="text-sm font-bold text-white">Scenario {simulation.scenario}</p>
          <p className="text-xs text-slate-500 mt-1">Tick #{simulation.tick}</p>
        </div>
      </div>

      {/* ── KPI Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
        <KPICard
          title="Total Sensors" value={systemStatus.totalSensors}
          icon={<Activity size={16} />} color="#8b5cf6"
          subtitle="Deployed monitoring nodes"
        />
        <KPICard
          title="Online" value={systemStatus.onlineSensors}
          icon={<CheckCircle size={16} />} color="#22c55e"
          subtitle={`${Math.round(systemStatus.onlineSensors / systemStatus.totalSensors * 100)}% uptime`}
        />
        <KPICard
          title="Offline" value={systemStatus.offlineSensors}
          icon={<XCircle size={16} />} color="#ef4444"
          subtitle="Requires attention"
        />
        <KPICard
          title="Substations" value={systemStatus.totalSubstations}
          icon={<Wifi size={16} />} color="#06b6d4"
          subtitle={`${systemStatus.onlineSubstations} online`}
        />
        <KPICard
          title="Master Stations" value={systemStatus.totalMasterStations}
          icon={<Server size={16} />} color="#0ea5e9"
          subtitle="Aggregation nodes"
        />
        <KPICard
          title="Active Warnings" value={systemStatus.activeWarnings}
          icon={<AlertTriangle size={16} />}
          riskLevel={systemStatus.activeWarnings > 0 ? 'WARNING' : 'NORMAL'}
          subtitle="Unresolved warnings"
        />
        <KPICard
          title="Critical Alerts" value={systemStatus.criticalAlerts}
          icon={<AlertTriangle size={16} />}
          riskLevel={systemStatus.criticalAlerts > 0 ? 'CRITICAL' : 'NORMAL'}
          subtitle="Immediate action required"
        />
        <KPICard
          title="Risk Score" value={`${systemStatus.overallRiskScore}/100`}
          icon={<Activity size={16} />}
          riskLevel={systemStatus.overallRiskLevel}
          subtitle="Aggregated risk"
        />
      </div>

      {/* ── Sensor Type Summary ────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['IPI', 'VWP', 'GEOPHONE', 'EXTENSOMETER'] as const).map(type => {
          const cfg       = getSensorTypeConfig(type);
          const total     = sensorTypeCounts[type] ?? 0;
          const abnormal  = sensorTypeAbnormal[type] ?? 0;
          const TypeIcon  = { IPI: Activity, VWP: Droplets, GEOPHONE: Radio, EXTENSOMETER: Ruler }[type];

          return (
            <div key={type} className="bg-surface-800 border border-surface-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg" style={{ background: `${cfg.color}20` }}>
                  <TypeIcon size={14} style={{ color: cfg.color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{type}</p>
                  <p className="text-[10px] text-slate-500">{cfg.label}</p>
                </div>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-xl font-bold text-white">{total}</span>
                {abnormal > 0 && (
                  <span className="text-xs font-semibold text-risk-warning">{abnormal} abnormal</span>
                )}
              </div>
              <ProgressBar
                value={total - abnormal}
                max={total}
                color={abnormal > 0 ? '#f97316' : cfg.color}
              />
            </div>
          );
        })}
      </div>

      {/* ── Bottom Row: Substations + Alerts ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Substation Grid */}
        <Card className="p-4">
          <SectionHeader title="Substations" subtitle="LoRa node status and local risk" />
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {substations.map(sub => {
              const subCfg = getRiskLevelConfig(sub.riskLevel);
              return (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-surface-900/60 hover:bg-surface-700/50 transition-colors"
                  style={{ borderColor: subCfg.borderColor }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: subCfg.color,
                      boxShadow: sub.riskLevel !== 'NORMAL' ? `0 0 6px ${subCfg.color}` : 'none' }} />
                  <span className="text-xs font-mono font-semibold text-slate-300 w-16 shrink-0">{sub.id}</span>
                  <span className="text-xs text-slate-500 flex-1 truncate">
                    {sub.sensorIds.length} sensors
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    LoRa {sub.loraSignal}%
                  </span>
                  <StatusBadge level={sub.riskLevel} size="xs" showDot={false} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Alerts */}
        <Card className="p-4">
          <SectionHeader title="Recent Alerts" subtitle="Latest unresolved alerts" />
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {recentAlerts.length === 0 ? (
              <p className="text-xs text-slate-600 py-4 text-center">No active alerts</p>
            ) : recentAlerts.map(alert => {
              const sevColors: Record<string, { bg: string; text: string; border: string }> = {
                CRITICAL:  { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30' },
                HIGH_RISK: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
                WARNING:   { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
                INFO:      { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30' },
              };
              const sc = sevColors[alert.severity] ?? sevColors.INFO;
              return (
                <div key={alert.id}
                  className={clsx('px-3 py-2 rounded-lg border text-xs', sc.bg, sc.border)}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={clsx('font-bold', sc.text)}>{alert.severity}</span>
                    <span className="text-slate-600 font-mono text-[10px]">
                      {format(new Date(alert.timestamp), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-slate-300 truncate">{alert.title}</p>
                  <p className="text-slate-500 truncate mt-0.5">{alert.location}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Master Station Snapshot ────────────────────────────── */}
      <Card className="p-4">
        <SectionHeader title="Master Station" subtitle={masterStation.name} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricRow label="Total Sensors"    value={masterStation.totalSensors} />
          <MetricRow label="Online"           value={masterStation.onlineSensors} highlight />
          <MetricRow label="Warning Sensors"  value={masterStation.warningSensors} />
          <MetricRow label="Critical Sensors" value={masterStation.criticalSensors} />
          <MetricRow label="LoRa Health"      value={masterStation.loraNetworkHealth} unit="%" highlight />
          <MetricRow label="Data Rate"        value={masterStation.dataRate} unit=" Mbps" />
          <MetricRow label="Uptime"           value={masterStation.uptime} unit="%" />
          <MetricRow label="Packets Processed" value={masterStation.packetsProcessed.toLocaleString()} />
        </div>
        <div className="mt-3">
          <CommBadge status={masterStation.communicationStatus} />
        </div>
      </Card>
    </div>
  );
}
