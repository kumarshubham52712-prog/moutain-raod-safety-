import { useParams, Link } from 'react-router-dom';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge, CommBadge, MetricRow, ProgressBar } from '../components/common';
import { TimeSeriesChart, RiskGauge } from '../components/charts';
import { getRiskLevelConfig } from '../config/thresholds';
import { getSensorTypeConfig } from '../config/sensorTypes';
import { format } from 'date-fns';
import { Wifi, ChevronRight, MapPin, Copy, Activity, Droplets, Radio, Ruler } from 'lucide-react';

const SENSOR_ICONS: Record<string, React.ElementType> = {
  IPI: Activity, VWP: Droplets, GEOPHONE: Radio, EXTENSOMETER: Ruler,
};

export default function SubstationDetail() {
  const { id } = useParams<{ id: string }>();
  const { substations, sensors, masterStations } = useMonitoringStore();

  const sub = substations.find(s => s.id === id);
  if (!sub) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Substation "{id}" not found</p>
      </div>
    );
  }

  const master = masterStations.find(m => m.id === sub.masterStationId);
  const subSensors = sensors.filter(s => sub.sensorIds.includes(s.id));
  const rCfg = getRiskLevelConfig(sub.riskLevel);

  const copyCoords = () => {
    navigator.clipboard.writeText(`${sub.latitude}, ${sub.longitude}`);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/master-stations" className="hover:text-slate-300 transition-colors">Master Stations</Link>
        <ChevronRight size={12} />
        <Link to={`/master-stations/${sub.masterStationId}`} className="hover:text-slate-300 transition-colors">{sub.masterStationId}</Link>
        <ChevronRight size={12} />
        <span className="text-white font-semibold">{sub.id}</span>
      </div>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center border-2"
              style={{ borderColor: rCfg.color, background: rCfg.bgColor }}
            >
              <Wifi size={24} style={{ color: rCfg.color }} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold font-mono text-white">{sub.id}</h2>
                <StatusBadge level={sub.riskLevel} />
                <CommBadge status={sub.communicationStatus} />
              </div>
              <p className="text-sm text-slate-400">{sub.name}</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-slate-500">
                  Connected Master: <Link to={`/master-stations/${sub.masterStationId}`} className="text-brand-400 hover:underline">{sub.masterStationId}</Link>
                </span>
                <span className="text-xs text-slate-600">·</span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={10} />
                  {sub.latitude.toFixed(4)}°N, {sub.longitude.toFixed(4)}°E
                </span>
                <button onClick={copyCoords} className="text-slate-600 hover:text-slate-400 transition-colors" title="Copy coordinates">
                  <Copy size={10} />
                </button>
                <span className="text-[10px] text-slate-600 italic">DEMO coordinates</span>
              </div>
            </div>
          </div>
          <div className="ml-auto text-right">
            <RiskGauge score={sub.riskScore} size={90} />
          </div>
        </div>
      </Card>

      {/* Station Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <MetricRow label="Coverage" value="~3 km" />
        </Card>
        <Card className="p-3">
          <MetricRow label="Communication" value={sub.loraFrequency} />
        </Card>
        <Card className="p-3">
          <MetricRow label="Battery" value={`${sub.batteryLevel.toFixed(0)}%`} />
        </Card>
        <Card className="p-3">
          <MetricRow label="Power" value={sub.powerStatus} />
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card className="p-4">
        <SectionHeader title="Performance" subtitle="Signal, telemetry, and processing" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <MetricRow label="LoRa Signal"     value={sub.loraSignal}            unit="%" highlight />
          <MetricRow label="Battery"         value={sub.batteryLevel.toFixed(0)} unit="%" />
          <MetricRow label="Processor Load"  value={sub.processorLoad}          unit="%" />
          <MetricRow label="Data Rate"       value={sub.dataRate}               unit=" kbps" />
          <MetricRow label="Packets Received" value={sub.packetsReceived.toLocaleString()} />
          <MetricRow label="Packets Lost"    value={sub.packetsLost} />
          <MetricRow label="Storage Used"    value={sub.storageUsed}            unit=" MB" />
          <MetricRow label="Last Sync"       value={format(new Date(sub.lastSync), 'HH:mm:ss')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ProgressBar value={sub.loraSignal}   label="LoRa Signal"   color="#06b6d4" />
          <ProgressBar value={sub.batteryLevel} label="Battery Level" color="#22c55e" />
        </div>
      </Card>

      {/* Sensor Cards */}
      <SectionHeader title="Connected Sensors" subtitle={`${subSensors.length} sensors at this substation`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subSensors.map(sensor => {
          const typeCfg = getSensorTypeConfig(sensor.type);
          const sRisk = getRiskLevelConfig(sensor.riskLevel);
          const IconComp = SENSOR_ICONS[sensor.type] || Activity;

          // Gauge position calculation
          const range = sensor.criticalThreshold - sensor.normalMin;
          const pct = range > 0 ? Math.min(100, Math.max(0, ((sensor.currentValue - sensor.normalMin) / range) * 100)) : 0;

          return (
            <Link
              key={sensor.id}
              to={`/sensors/${sensor.id}`}
              className="block group"
            >
              <Card className="p-4 hover:border-slate-500 transition-all hover:scale-[1.005]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg" style={{ background: `${typeCfg.color}20` }}>
                      <IconComp size={14} style={{ color: typeCfg.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{sensor.type}</p>
                      <p className="text-[10px] text-slate-500">{typeCfg.measurementDescription}</p>
                    </div>
                  </div>
                  <StatusBadge level={sensor.riskLevel} size="xs" />
                </div>

                {/* Current Reading */}
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-2xl font-bold font-mono" style={{ color: sRisk.color }}>
                    {sensor.currentValue.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 mb-1">{sensor.unit}</span>
                </div>

                {/* Visual Gauge */}
                <div className="mb-3">
                  <div className="relative h-2 rounded-full overflow-hidden bg-surface-700">
                    {/* Warning zone */}
                    <div className="absolute h-full bg-yellow-500/20" style={{
                      left: `${((sensor.warningThreshold - sensor.normalMin) / range) * 100}%`,
                      width: `${((sensor.highRiskThreshold - sensor.warningThreshold) / range) * 100}%`,
                    }} />
                    {/* High risk zone */}
                    <div className="absolute h-full bg-orange-500/20" style={{
                      left: `${((sensor.highRiskThreshold - sensor.normalMin) / range) * 100}%`,
                      width: `${((sensor.criticalThreshold - sensor.highRiskThreshold) / range) * 100}%`,
                    }} />
                    {/* Critical zone */}
                    <div className="absolute h-full bg-red-500/20" style={{
                      left: `${((sensor.criticalThreshold - sensor.normalMin) / range) * 100}%`,
                      right: 0,
                    }} />
                    {/* Current value indicator */}
                    <div
                      className="absolute top-0 w-1 h-full rounded-full"
                      style={{ left: `${Math.min(100, pct)}%`, background: sRisk.color }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-600 mt-0.5">
                    <span>Safe</span>
                    <span>Warn</span>
                    <span>High</span>
                    <span>Crit</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-[10px] text-slate-500">
                  <span>🔋 {sensor.batteryLevel.toFixed(0)}%</span>
                  <span>📶 {sensor.signalStrength}%</span>
                  <span>ID: {sensor.id}</span>
                </div>

                {/* Mini chart */}
                <div className="mt-3 -mx-2">
                  <TimeSeriesChart
                    readings={sensor.history.slice(-30)}
                    color={typeCfg.color}
                    unit={sensor.unit}
                    warningThreshold={sensor.warningThreshold}
                    criticalThreshold={sensor.criticalThreshold}
                    label={sensor.type}
                    height={100}
                  />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
