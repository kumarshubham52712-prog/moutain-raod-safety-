import { useMonitoringStore }  from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge, CommBadge, MetricRow, ProgressBar } from '../components/common';
import { RiskGauge }           from '../components/charts';
import { getRiskLevelConfig }  from '../config/thresholds';
import { format }              from 'date-fns';
import { Server }              from 'lucide-react';

export default function MasterStations() {
  const { masterStation, substations, sensors } = useMonitoringStore();
  const rCfg = getRiskLevelConfig(masterStation.riskLevel);

  return (
    <div className="space-y-6">
      {/* ── Master Station Header ─────────────────────────────── */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center border-2"
              style={{ borderColor: rCfg.color, background: rCfg.bgColor }}
            >
              <Server size={28} style={{ color: rCfg.color }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold font-mono text-white">{masterStation.id}</h2>
                <StatusBadge level={masterStation.riskLevel} />
                <CommBadge status={masterStation.communicationStatus} />
              </div>
              <p className="text-sm text-slate-400">{masterStation.name}</p>
              <p className="text-xs text-slate-600">{masterStation.location}</p>
            </div>
          </div>
          <div className="ml-auto">
            <RiskGauge score={masterStation.aggregatedRiskScore} size={100} />
          </div>
        </div>
      </Card>

      {/* ── KPI Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
        {[
          { label: 'Total Sensors',  value: masterStation.totalSensors },
          { label: 'Online',         value: masterStation.onlineSensors },
          { label: 'Offline',        value: masterStation.offlineSensors },
          { label: 'Warnings',       value: masterStation.warningSensors },
          { label: 'Critical',       value: masterStation.criticalSensors },
          { label: 'Substations',    value: masterStation.substationIds.length },
        ].map(kpi => (
          <Card key={kpi.label} className="p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">{kpi.label}</p>
            <p className="text-xl font-bold font-mono text-white">{kpi.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Network Health ────────────────────────────────────── */}
      <Card className="p-4">
        <SectionHeader title="Network & Performance" subtitle="LoRa mesh network and data throughput" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <MetricRow label="LoRa Health"       value={masterStation.loraNetworkHealth}         unit="%" highlight />
          <MetricRow label="Data Rate"         value={masterStation.dataRate}                  unit=" Mbps" />
          <MetricRow label="Uptime"            value={masterStation.uptime}                   unit="%" highlight />
          <MetricRow label="Last Sync"         value={format(new Date(masterStation.lastSync), 'HH:mm:ss')} />
          <MetricRow label="Packets Processed" value={masterStation.packetsProcessed.toLocaleString()} highlight />
          <MetricRow label="Packets Dropped"   value={masterStation.packetsDropped}           />
          <MetricRow label="Packet Loss"       value={masterStation.packetsProcessed > 0
            ? `${((masterStation.packetsDropped / masterStation.packetsProcessed) * 100).toFixed(3)}%`
            : '0%'} />
          <MetricRow label="Risk Score"        value={`${masterStation.aggregatedRiskScore}/100`} highlight />
        </div>
        <ProgressBar value={masterStation.loraNetworkHealth} label="LoRa Network Health" color="#06b6d4" />
      </Card>

      {/* ── Connected Substations ─────────────────────────────── */}
      <Card className="p-4">
        <SectionHeader
          title="Connected Substations"
          subtitle={`${substations.length} edge stations reporting to ${masterStation.id}`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-surface-700">
                {['ID', 'Sensors', 'LoRa Signal', 'Battery', 'Power', 'Status', 'Risk', 'Packets', 'Lost', 'Last Sync'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-slate-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {substations.map(sub => {
                const sCfg = getRiskLevelConfig(sub.riskLevel);
                return (
                  <tr key={sub.id} className="border-b border-surface-800 hover:bg-surface-700/30 transition-colors">
                    <td className="py-2.5 px-2 font-mono font-bold text-white">{sub.id}</td>
                    <td className="py-2.5 px-2 text-slate-300">{sub.sensorIds.length}</td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${sub.loraSignal}%`, background: '#06b6d4' }} />
                        </div>
                        <span className="font-mono text-slate-400">{sub.loraSignal}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-400">{sub.batteryLevel.toFixed(0)}%</td>
                    <td className="py-2.5 px-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-700 text-slate-400">
                        {sub.powerStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-2"><CommBadge status={sub.communicationStatus} /></td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge level={sub.riskLevel} size="xs" showDot={false} />
                        <span className="font-mono text-[10px]" style={{ color: sCfg.color }}>{sub.riskScore}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-500">{sub.packetsReceived.toLocaleString()}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-600">{sub.packetsLost}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-600 whitespace-nowrap">
                      {format(new Date(sub.lastSync), 'HH:mm:ss')}
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
