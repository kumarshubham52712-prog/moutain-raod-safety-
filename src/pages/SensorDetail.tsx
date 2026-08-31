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
        <p className="text-slate-500 font-medium">Sensor "{id}" not found</p>
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
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
        <Link to="/master-stations" className="hover:text-brand-600 transition-colors">Master Stations</Link>
        <ChevronRight size={12} className="text-slate-400" />
        <Link to={`/master-stations/${sensor.masterStationId}`} className="hover:text-brand-600 transition-colors">{sensor.masterStationId}</Link>
        <ChevronRight size={12} className="text-slate-400" />
        <Link to={`/substations/${sensor.substationId}`} className="hover:text-brand-600 transition-colors">{sensor.substationId}</Link>
        <ChevronRight size={12} className="text-slate-400" />
        <span className="text-slate-900 font-black">{sensor.id}</span>
      </div>

      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-2xl font-black font-mono text-slate-900">{sensor.id}</h2>
              <StatusBadge level={sensor.riskLevel} size="md" />
              <CommBadge status={sensor.communicationStatus} />
            </div>
            <p className="text-sm font-black" style={{ color: typeCfg.color }}>{typeCfg.label}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">{typeCfg.description}</p>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6 text-xs font-medium">
              <MetricRow label="Sensor Type" value={sensor.type} />
              <MetricRow label="Substation" value={sensor.substationId} />
              <MetricRow label="Master Station" value={sensor.masterStationId} />
              <MetricRow label="Measurement" value={typeCfg.measurementDescription} />
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin size={12} /> Latitude</span>
                <span className="text-xs font-mono font-bold text-slate-700">{sensor.latitude.toFixed(6)}°N</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs text-slate-500 flex items-center gap-1.5"><MapPin size={12} /> Longitude</span>
                <span className="text-xs font-mono font-bold text-slate-700">{sensor.longitude.toFixed(6)}°E</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={copyCoords} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-brand-600 transition-colors bg-slate-50 px-2 py-1 rounded border border-slate-200">
                <Copy size={10} /> Copy Coordinates
              </button>
              <span className="text-[10px] font-medium text-slate-400 italic">DEMO coordinates</span>
            </div>
          </div>

          {/* Current Value Display */}
          <div className="text-center bg-slate-50 p-6 rounded-2xl border border-slate-100 min-w-[200px] shadow-sm">
            <p className="text-5xl font-black font-mono tracking-tight" style={{ color: rCfg.color }}>
              {sensor.currentValue.toFixed(2)}
            </p>
            <p className="text-sm font-bold text-slate-500 mt-1">{sensor.unit}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest">
              Updated {format(new Date(sensor.timestamp), 'HH:mm:ss')}
            </p>
          </div>
        </div>
      </Card>

      {/* Status Gauge + Thresholds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionHeader title="Threshold Range" subtitle="Demo thresholds — configurable for simulation" />
          {/* Visual Gauge */}
          <div className="py-6 px-2">
            <div className="relative h-6 rounded-full overflow-hidden bg-slate-100 mb-3 shadow-inner">
              {/* Normal zone */}
              <div className="absolute h-full bg-green-100 border-r border-green-200" style={{
                left: 0,
                width: `${((sensor.warningThreshold - sensor.normalMin) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
              }} />
              {/* Warning zone */}
              <div className="absolute h-full bg-yellow-100 border-r border-yellow-200" style={{
                left: `${((sensor.warningThreshold - sensor.normalMin) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
                width: `${((sensor.highRiskThreshold - sensor.warningThreshold) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
              }} />
              {/* High risk zone */}
              <div className="absolute h-full bg-orange-100 border-r border-orange-200" style={{
                left: `${((sensor.highRiskThreshold - sensor.normalMin) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
                width: `${((sensor.criticalThreshold - sensor.highRiskThreshold) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
              }} />
              {/* Critical zone */}
              <div className="absolute h-full bg-red-100" style={{
                left: `${((sensor.criticalThreshold - sensor.normalMin) / (sensor.criticalThreshold * 1.2 - sensor.normalMin)) * 100}%`,
                right: 0,
              }} />
              {/* Current value indicator */}
              <div
                className="absolute top-0 w-2 h-full rounded-full shadow-md transition-all duration-500 border border-white/50"
                style={{
                  left: `${Math.min(100, Math.max(0, pct))}%`,
                  background: rCfg.color,
                  boxShadow: `0 0 10px ${rCfg.color}`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1">
              <span className="text-green-600">SAFE</span>
              <span className="text-yellow-600">WARNING</span>
              <span className="text-orange-600">HIGH RISK</span>
              <span className="text-red-600">CRITICAL</span>
            </div>
          </div>

          {/* Threshold Values */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <MetricRow label="Safe Range" value={`${sensor.normalMin} – ${sensor.normalMax} ${sensor.unit}`} />
            <MetricRow label="Warning" value={`≥ ${sensor.warningThreshold} ${sensor.unit}`} />
            <MetricRow label="High Risk" value={`≥ ${sensor.highRiskThreshold} ${sensor.unit}`} />
            <MetricRow label="Critical" value={`≥ ${sensor.criticalThreshold} ${sensor.unit}`} />
          </div>
        </Card>

        {/* Simulation Controls */}
        <Card className="p-5">
          <SectionHeader title="Simulation Controls" subtitle="Manually adjust sensor reading" />

          {/* Slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Value</span>
              <span className="text-base font-black font-mono" style={{ color: rCfg.color }}>
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
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setSensorValue(sensor.id, sensor.currentValue - step)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-sm transition-colors"
            >
              <Minus size={14} /> {step}
            </button>
            <button
              onClick={() => setSensorValue(sensor.id, sensor.currentValue + step)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-sm transition-colors"
            >
              <Plus size={14} /> {step}
            </button>
            <button
              onClick={() => {
                const cfg = getSensorTypeConfig(sensor.type);
                setSensorValue(sensor.id, (cfg.normalMin + cfg.normalMax) / 2);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 text-sm font-bold shadow-sm transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>

          {/* Set exact value */}
          <div className="flex gap-3 mb-8">
            <input
              type="number"
              step={step}
              placeholder="Enter value..."
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none shadow-sm transition-all"
            />
            <button
              onClick={() => {
                const val = parseFloat(manualValue);
                if (!isNaN(val)) {
                  setSensorValue(sensor.id, val);
                  setManualValue('');
                }
              }}
              className="px-6 py-2.5 rounded-xl bg-brand-50 text-brand-700 text-sm font-bold border border-brand-200 hover:bg-brand-100 shadow-sm transition-colors"
            >
              Set Value
            </button>
          </div>

          {/* Battery & Signal */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-500 uppercase tracking-widest">Battery</span>
                <span className="font-mono text-slate-700">{sensor.batteryLevel.toFixed(0)}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={1}
                value={sensor.batteryLevel}
                onChange={(e) => setSensorBattery(sensor.id, parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-green-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-500 uppercase tracking-widest">Signal Strength</span>
                <span className="font-mono text-slate-700">{sensor.signalStrength}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={1}
                value={sensor.signalStrength}
                onChange={(e) => setSensorSignal(sensor.id, parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200 accent-cyan-500"
              />
            </div>
            <div className="flex items-center justify-between pt-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Connectivity</span>
              <button
                onClick={() => setSensorOnline(sensor.id, sensor.communicationStatus === 'OFFLINE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm transition-colors ${
                  sensor.communicationStatus === 'ONLINE'
                    ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                    : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                }`}
              >
                {sensor.communicationStatus === 'ONLINE' ? '● ONLINE' : '○ OFFLINE'}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Health Metrics */}
      <Card className="p-5">
        <SectionHeader title="Health & Status" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <MetricRow label="Battery" value={`${sensor.batteryLevel.toFixed(0)}%`} highlight />
          <MetricRow label="Signal" value={`${sensor.signalStrength}%`} highlight />
          <MetricRow label="Health" value={sensor.healthStatus} />
          <MetricRow label="Last Update" value={format(new Date(sensor.timestamp), 'HH:mm:ss')} />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <ProgressBar value={sensor.batteryLevel} label="Battery Health" color="#22c55e" />
          <ProgressBar value={sensor.signalStrength} label="Signal Strength" color="#0ea5e9" />
        </div>
      </Card>

      {/* Trend Chart */}
      <Card className="p-5">
        <SectionHeader title="Trend Chart" subtitle="Historical readings with threshold bands" />
        <TimeSeriesChart
          readings={sensor.history}
          color={typeCfg.color}
          unit={sensor.unit}
          warningThreshold={sensor.warningThreshold}
          criticalThreshold={sensor.criticalThreshold}
          label={typeCfg.measurementDescription}
          height={300}
        />
      </Card>

      {/* Risk Contributors */}
      <Card className="p-5">
        <SectionHeader title="Risk Assessment" subtitle={`Multi-sensor risk analysis for ${sub?.id ?? 'zone'}`} />
        <div className="flex items-center gap-4 mb-5">
          <RiskGauge score={assessment.overallScore} size={90} />
          <div>
            <StatusBadge level={assessment.riskLevel} size="md" />
            <p className="text-sm font-medium text-slate-600 mt-2">{assessment.summary}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
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
        <p className="text-xs font-medium text-slate-400 italic mt-4 text-center">
          Demo thresholds — configurable rule-based prototype. Not a scientifically validated model.
        </p>
      </Card>
    </div>
  );
}
