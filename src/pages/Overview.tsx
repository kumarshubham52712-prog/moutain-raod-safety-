import { useMonitoringStore } from '../store/monitoringStore';
import { KPICard, SectionHeader, StatusBadge, CommBadge } from '../components/common';
import { EventStream } from '../components/common/EventStream';
import { RiskGauge, TimeSeriesChart } from '../components/charts';
import { getRiskLevelConfig } from '../config/thresholds';
import { format } from 'date-fns';
import { ShieldAlert, Activity, Wifi, Server, MapPin, Play, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Overview() {
  const { systemStatus, masterStations, simulation, startSimulation, pauseSimulation } = useMonitoringStore();
  const overallRiskCfg = getRiskLevelConfig(systemStatus.overallRiskLevel);

  return (
    <div className="space-y-6">
      {/* Simulation Banner */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock size={16} className="text-brand-400" />
            System Status: {simulation.isRunning ? <span className="text-green-400 animate-pulse-slow">LIVE SIMULATION (Tick #{simulation.tick})</span> : <span className="text-slate-400">PAUSED</span>}
          </h2>
          <p className="text-xs text-slate-500 mt-1">Data updated {format(new Date(systemStatus.lastUpdated), 'HH:mm:ss')}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/simulation" className="px-4 py-2 bg-surface-700 hover:bg-surface-600 rounded-lg text-xs font-bold text-white transition-colors border border-surface-600">
            Open Simulation Controls
          </Link>
          <button
            onClick={simulation.isRunning ? pauseSimulation : startSimulation}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors border ${
              simulation.isRunning
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
                : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
            }`}
          >
            {simulation.isRunning ? 'Pause Engine' : <><Play size={12} className="inline mr-1 -mt-0.5" /> Start Engine</>}
          </button>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Overall Risk Level"
          value={overallRiskCfg.label}
          subtitle={`Max Score: ${systemStatus.overallRiskScore}/100`}
          riskLevel={systemStatus.overallRiskLevel}
          icon={<ShieldAlert size={20} />}
        />
        <KPICard
          title="Master Stations"
          value={systemStatus.totalMasterStations}
          subtitle={`${systemStatus.onlineMasterStations} Online, ${systemStatus.totalMasterStations - systemStatus.onlineMasterStations} Offline`}
          icon={<Server size={20} />}
          color="#0ea5e9"
        />
        <KPICard
          title="Edge Substations"
          value={systemStatus.totalSubstations}
          subtitle={`${systemStatus.onlineSubstations} Online`}
          icon={<Wifi size={20} />}
          color="#8b5cf6"
        />
        <KPICard
          title="Active Sensors"
          value={systemStatus.totalSensors}
          subtitle={`${systemStatus.onlineSensors} Online · ${systemStatus.offlineSensors} Offline`}
          icon={<Activity size={20} />}
          color="#10b981"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Master Station Cards */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader
            title="Master Station Status"
            subtitle="Dehradun / Mussoorie / Rishikesh"
          />
          {masterStations.map(master => {
            const mCfg = getRiskLevelConfig(master.riskLevel);
            return (
              <div key={master.id} className="bg-surface-800 border border-surface-700 rounded-xl p-5 hover:border-surface-600 transition-colors shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 shrink-0"
                         style={{ borderColor: mCfg.color, background: mCfg.bgColor }}>
                      <Server size={24} style={{ color: mCfg.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <Link to={`/master-stations/${master.id}`} className="text-lg font-bold font-mono text-white hover:text-brand-400 transition-colors">
                          {master.id}
                        </Link>
                        <StatusBadge level={master.riskLevel} />
                        <CommBadge status={master.communicationStatus} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <MapPin size={12} />
                        {master.name} — {master.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 bg-surface-900 px-4 py-2 rounded-lg border border-surface-700">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Substations</p>
                      <p className="font-mono font-bold text-lg text-white">{master.substationIds.length}</p>
                    </div>
                    <div className="w-px h-8 bg-surface-700" />
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Sensors</p>
                      <p className="font-mono font-bold text-lg text-white">{master.totalSensors}</p>
                    </div>
                    <div className="w-px h-8 bg-surface-700" />
                    <div className="flex items-center gap-2">
                      <RiskGauge score={master.aggregatedRiskScore} size={60} />
                    </div>
                  </div>
                </div>

                {/* Substation mini-map */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>LoRa Network Health: {master.loraNetworkHealth}%</span>
                  <span>{master.criticalSensors} Critical Sensors</span>
                </div>
                <div className="h-1.5 w-full bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${master.loraNetworkHealth}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Col: Event Stream & Alerts */}
        <div className="space-y-6">
          {/* Active Alerts Summary */}
          <div className="bg-surface-800 border border-surface-700 rounded-xl p-5 shadow-lg">
            <SectionHeader title="Active Threats" />
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                <p className="text-3xl font-black text-red-500 mb-1">{systemStatus.criticalAlerts}</p>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Critical</p>
              </div>
              <div className="flex-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                <p className="text-3xl font-black text-yellow-500 mb-1">{systemStatus.activeWarnings}</p>
                <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">Warnings</p>
              </div>
            </div>
            <Link to="/alerts" className="block w-full text-center py-2 mt-4 text-xs font-bold text-slate-400 hover:text-white bg-surface-700 hover:bg-surface-600 rounded-lg transition-colors border border-surface-600">
              View Alert Center →
            </Link>
          </div>

          <EventStream height="520px" maxItems={50} />
        </div>
      </div>
    </div>
  );
}
