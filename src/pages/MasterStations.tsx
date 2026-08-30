import { Link } from 'react-router-dom';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge, CommBadge, MetricRow, ProgressBar } from '../components/common';
import { RiskGauge } from '../components/charts';
import { getRiskLevelConfig } from '../config/thresholds';
import { format } from 'date-fns';
import { Server, ChevronRight } from 'lucide-react';

export default function MasterStations() {
  const { masterStations, substations, sensors } = useMonitoringStore();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Master Stations"
        subtitle={`${masterStations.length} command centers — Dehradun monitoring region`}
      />

      <div className="grid grid-cols-1 gap-6">
        {masterStations.map(master => {
          const rCfg = getRiskLevelConfig(master.riskLevel);
          const masterSubs = substations.filter(s => master.substationIds.includes(s.id));
          const masterSensors = sensors.filter(s =>
            masterSubs.some(sub => sub.sensorIds.includes(s.id))
          );

          return (
            <Link key={master.id} to={`/master-stations/${master.id}`} className="group">
              <Card className="p-6 hover:border-slate-500 transition-all hover:scale-[1.003]">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center border-2 shrink-0"
                      style={{ borderColor: rCfg.color, background: rCfg.bgColor }}
                    >
                      <Server size={28} style={{ color: rCfg.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-lg font-bold font-mono text-white">{master.id}</h2>
                        <StatusBadge level={master.riskLevel} />
                        <CommBadge status={master.communicationStatus} />
                      </div>
                      <p className="text-sm text-slate-400">{master.name}</p>
                      <p className="text-xs text-slate-600">{master.location}</p>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-6">
                    <div className="hidden md:block text-right">
                      <div className="grid grid-cols-3 gap-x-6 gap-y-1">
                        <MetricRow label="Sensors" value={masterSensors.length} />
                        <MetricRow label="Substations" value={masterSubs.length} />
                        <MetricRow label="Online" value={master.onlineSensors} highlight />
                        <MetricRow label="Warnings" value={master.warningSensors} />
                        <MetricRow label="Critical" value={master.criticalSensors} />
                        <MetricRow label="LoRa" value={`${master.loraNetworkHealth}%`} />
                      </div>
                    </div>
                    <RiskGauge score={master.aggregatedRiskScore} size={80} />
                    <ChevronRight size={20} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>

                {/* Health bar */}
                <div className="mt-4">
                  <ProgressBar value={master.loraNetworkHealth} label="LoRa Network Health" color="#06b6d4" />
                </div>

                {/* Sub mini-status */}
                <div className="flex gap-1.5 mt-3">
                  {masterSubs.map(sub => {
                    const sCfg = getRiskLevelConfig(sub.riskLevel);
                    return (
                      <div
                        key={sub.id}
                        className="flex-1 h-2 rounded-full transition-all"
                        style={{ background: sCfg.color, opacity: sub.communicationStatus === 'OFFLINE' ? 0.2 : 0.8 }}
                        title={`${sub.id}: ${sub.riskLevel} (Risk: ${sub.riskScore})`}
                      />
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-600 mt-1">
                  Substation status — each bar represents one substation's risk level
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
