import { useParams, Link } from 'react-router-dom';
import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader, StatusBadge, CommBadge, MetricRow, ProgressBar } from '../components/common';
import { TimeSeriesChart, RiskGauge, ContributionBar } from '../components/charts';
import { getRiskLevelConfig } from '../config/thresholds';
import { getSensorTypeConfig } from '../config/sensorTypes';
import { buildRiskAssessment } from '../services/riskEngine';
import { format } from 'date-fns';
import { ChevronRight, MapPin, Copy, Minus, Plus, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export default function SensorDetail() {
  const { id } = useParams<{ id: string }>();
  const { sensors, substations, masterStations, setSensorValue, setSensorBattery, setSensorSignal, setSensorOnline } = useMonitoringStore();

  const sensor = sensors.find(s => s.id === id);
  if (!sensor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Sensor "{id}" not found</p>
      </div>
    );
  }

  const sub = substations.find(s => s.id === sensor.substationId);
  const master = masterStations.find(m => m.id === sensor.masterStationId);
  const typeCfg = getSensorTypeConfig(sensor.type);
  const rCfg = getRiskLevelConfig(sensor.riskLevel);

  // Risk assessment for the substation's sensors
  const subSensors = sub ? sensors.filter(s => sub.sensorIds.includes(s.id)) : [sensor];
  const assessment = buildRiskAssessment(sub?.id ?? sensor.id, subSensors);

  // Gauge
  const range = sensor.criticalThreshold * 1.2 - sensor.normalMin;
  const pct = range > 0 ? ((sensor.currentValue - sensor.normalMin) / range) * 100 : 0;

  const copyCoords = () => {
    navigator.clipboard.writeText(`${sensor.latitude}, ${sensor.longitude}`);
  };

  const step = sensor.type === 'GEOPHONE' ? 0.1 : sensor.type === 'VWP' ? 5 : 0.5;

  const [manualValue, setManualValue] = useState<string>('');

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
        <Link to="/master-stations" className="hover:text-slate-300">Master Stations</Link>
        <ChevronRight size={12} />
        <Link to={`/master-stations/${sensor.masterStationId}`} className="hover:text-slate-300">{sensor.masterStationId}</Link>
        <ChevronRight size={12} />
        <Link to={`/substations/${sensor.substationId}`} className="hover:text-slate-300">{sensor.substationId}</Link>
        <ChevronRight size={12} />
        <span className="text-white font-semibold">{sensor.id}</span>
      </div>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold font-mono text-white">{sensor.id}</h2>
              <StatusBadge level={sensor.riskLevel} size="md" />
              <CommBadge status={sensor.communicationStatus} />
            </div>
            <p className="text-sm font-semibold" style={{ color: typeCfg.color }}>{typeCfg.label}</p>
            <p className="text-xs text-slate-500 mt-1">{typeCfg.description}</p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-4 text-xs">
              <MetricRow label="Sensor Type" value={sensor.type} />
              <MetricRow label="Substation" value={sensor.substationId} />
              <MetricRow label="Master Station" value={sensor.masterStationId} />
              <MetricRow label="Measurement" value={typeCfg.measurementDescription} />
              <div className="flex items-center justify-between py-1.5 border-b border-surface-700">
                <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> Latitude</span>
                <span className="text-xs font-mono text-slate-300">{sensor.latitude.toFixed(6)}°N</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-surface-700">
                <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} /> Longitude</span>
                <span className="text-xs font-mono text-slate-300">{sensor.longitude.toFixed(6)}°E</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button onClick={copyCoords} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                <Copy size={10} /> Copy Coordinates
              </button>
              <span className="text-[10px] text-slate-600 italic">DEMO coordinates</span>
            </div>
          </div>

          {/* Current Value Display */}
          <div className="text-center">
            <p className="text-4xl font-bold font-mono" style={{ color: rCfg.color }}>
              {sensor.currentValue.toFixed(2)}
            </p>
            <p className="text-sm text-slate-500">{sensor.unit}</p>
            <p className="text-[10px] text-slate-600 mt-1">
              Updated {format(new Date(sensor.timestamp), 'HH:mm:ss')}
            </p>
          </div>
        </div>
      </Card>

      {/* Status Gauge + Thresholds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <SectionHeader title="Threshold Range Visualization" subtitle="Demo thresholds — configurable for prototype simulation" />
          {/* Visual Gauge */}
          <div className="py-6 px-4">
            <div className="relative h-6 rounded-full overflow-hidden bg-surface-700 mb-2">
              {/* Normal zone */}
              <div className="absolute h-full bg-green-500/20" style={{
                left: 0,
                width: `${((sensor.warningThreshold - sensor.normalMin) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
              }} />
              {/* Warning zone */}
              <div className="absolute h-full bg-yellow-500/25" style={{
                left: `${((sensor.warningThreshold - sensor.normalMin) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
                width: `${((sensor.highRiskThreshold - sensor.warningThreshold) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
              }} />
              {/* High risk zone */}
              <div className="absolute h-full bg-orange-500/25" style={{
                left: `${((sensor.highRiskThreshold - sensor.normalMin) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
                width: `${((sensor.criticalThreshold - sensor.highRiskThreshold) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
              }} />
              {/* Critical zone */}
              <div className="absolute h-full bg-red-500/25" style={{
                left: `${((sensor.criticalThreshold - sensor.normalMin) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
                right: 0,
              }} />
              {/* Current value indicator */}
              <div
                className="absolute top-0 w-1.5 h-full rounded-full shadow-lg transition-all duration-500"
                style={{
                  left: `${Math.min(100, Math.max(0, pct))}%`,
                  background: rCfg.color,
                  boxShadow: `0 0 8px ${rCfg.color}`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 px-1">
              <span className="text-green-400">SAFE</span>
              <span className="text-yellow-400">WARNING</span>
              <span className="text-orange-400">HIGH RISK</span>
              <span className="text-red-400">CRITICAL</span>
            </div>
          </div>

          {/* Threshold Values */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <MetricRow label="Safe Range" value={`${sensor.normalMin} – ${sensor.normalMax} ${sensor.unit}`} />
            <MetricRow label="Warning" value={`≥ ${sensor.warningThreshold} ${sensor.unit}`} />
            <MetricRow label="High Risk" value={`≥ ${sensor.highRiskThreshold} ${sensor.unit}`} />
            <MetricRow label="Critical" value={`≥ ${sensor.criticalThreshold} ${sensor.unit}`} />
          </div>
        </Card>

        {/* Simulation Controls */}
        <Card className="p-4">
          <SectionHeader title="Simulation Controls" subtitle="Manually adjust sensor reading" />

          {/* Slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Current Value</span>
              <span className="text-sm font-bold font-mono" style={{ color: rCfg.color }}>
                {sensor.currentValue.toFixed(2)} {sensor.unit}
              </span>
            </div>
            <input
              type="range"
              min={sensor.normalMin}
              max={sensor.criticalThreshold * 1.2}
              step={step / 5}
              value={sensor.currentValue}
              onChange={(e) => setSensorValue(sensor.id, parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)` }}
            />
          </div>

          {/* +/- Buttons */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setSensorValue(sensor.id, sensor.currentValue - step)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-slate-300 text-sm font-semibold transition-colors"
            >
              <Minus size={14} /> {step}
            </button>
            <button
              onClick={() => setSensorValue(sensor.id, sensor.currentValue + step)}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-slate-300 text-sm font-semibold transition-colors"
            >
              <Plus size={14} /> {step}
            </button>
            <button
              onClick={() => {
                const cfg = getSensorTypeConfig(sensor.type);
                setSensorValue(sensor.id, (cfg.normalMin + cfg.normalMax) / 2);
              }}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-surface-700 hover:bg-surface-600 text-slate-300 text-sm font-semibold transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          {/* Set exact value */}
          <div className="flex gap-2 mb-6">
            <input
              type="number"
              step={step}
              placeholder="Enter value..."
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-surface-700 border border-surface-600 text-sm text-white font-mono focus:border-brand-500 focus:outline-none"
            />
            <button
              onClick={() => {
                const val = parseFloat(manualValue);
                if (!isNaN(val)) {
                  setSensorValue(sensor.id, val);
                  setManualValue('');
                }
              }}
              className="px-4 py-2 rounded-lg bg-brand-600/20 text-brand-400 text-sm font-semibold border border-brand-600/30 hover:bg-brand-600/30 transition-colors"
            >
              Set Value
            </button>
          </div>

          {/* Battery & Signal */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Battery</span>
                <span className="font-mono text-slate-400">{sensor.batteryLevel.toFixed(0)}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={1}
                value={sensor.batteryLevel}
                onChange={(e) => setSensorBattery(sensor.id, parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-700"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Signal Strength</span>
                <span className="font-mono text-slate-400">{sensor.signalStrength}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={1}
                value={sensor.signalStrength}
                onChange={(e) => setSensorSignal(sensor.id, parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-surface-700"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">Connectivity</span>
              <button
                onClick={() => setSensorOnline(sensor.id, sensor.communicationStatus === 'OFFLINE')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  sensor.communicationStatus === 'ONLINE'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {sensor.communicationStatus === 'ONLINE' ? '● ONLINE' : '○ OFFLINE'}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Health Metrics */}
      <Card className="p-4">
        <SectionHeader title="Health & Status" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricRow label="Battery" value={`${sensor.batteryLevel.toFixed(0)}%`} highlight />
          <MetricRow label="Signal" value={`${sensor.signalStrength}%`} highlight />
          <MetricRow label="Health" value={sensor.healthStatus} />
          <MetricRow label="Last Update" value={format(new Date(sensor.timestamp), 'HH:mm:ss')} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <ProgressBar value={sensor.batteryLevel} label="Battery Health" color="#22c55e" />
          <ProgressBar value={sensor.signalStrength} label="Signal Strength" color="#06b6d4" />
        </div>
      </Card>

      {/* Trend Chart */}
      <Card className="p-4">
        <SectionHeader title="Trend Chart" subtitle="Historical readings with threshold bands" />
        <TimeSeriesChart
          readings={sensor.history}
          color={typeCfg.color}
          unit={sensor.unit}
          warningThreshold={sensor.warningThreshold}
          criticalThreshold={sensor.criticalThreshold}
          label={typeCfg.measurementDescription}
          height={250}
        />
      </Card>

      {/* Risk Contributors */}
      <Card className="p-4">
        <SectionHeader title="Risk Assessment" subtitle={`Multi-sensor risk analysis for ${sub?.id ?? 'zone'}`} />
        <div className="flex items-center gap-3 mb-4">
          <RiskGauge score={assessment.overallScore} size={80} />
          <div>
            <StatusBadge level={assessment.riskLevel} size="md" />
            <p className="text-xs text-slate-400 mt-1">{assessment.summary}</p>
          </div>
        </div>
        <div>
          {assessment.contributors.map(c => (
            <ContributionBar
              key={c.sensorId}
              label={`${c.sensorId} (${c.sensorType})`}
              level={c.contributionLevel}
              points={c.contributionPoints}
              color={getSensorTypeConfig(c.sensorType).color}
            />
          ))}
        </div>
        <p className="text-[10px] text-slate-600 italic mt-2">
          Demo thresholds — configurable rule-based prototype. Not a scientifically validated model.
        </p>
      </Card>
    </div>
  );
}
