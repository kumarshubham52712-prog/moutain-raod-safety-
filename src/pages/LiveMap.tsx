import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, Tooltip as LTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMonitoringStore }   from '../store/monitoringStore';
import { getRiskLevelConfig }   from '../config/thresholds';
import { getSensorTypeConfig }  from '../config/sensorTypes';
import { REGION_CENTER }        from '../config/geography';
import { StatusBadge, CommBadge } from '../components/common';
import { format }                from 'date-fns';
import clsx                      from 'clsx';

type MapLayer = 'sensors' | 'substations' | 'zones';

export default function LiveMap() {
  const { sensors, substations, masterStation, dangerZones } = useMonitoringStore();
  const [activeLayers, setActiveLayers] = useState<Set<MapLayer>>(
    new Set(['sensors', 'substations', 'zones'])
  );

  const toggleLayer = (layer: MapLayer) => {
    setActiveLayers(prev => {
      const n = new Set(prev);
      if (n.has(layer)) n.delete(layer); else n.add(layer);
      return n;
    });
  };

  const layerButtons: { key: MapLayer; label: string; color: string }[] = [
    { key: 'sensors',     label: 'Sensors',     color: '#8b5cf6' },
    { key: 'substations', label: 'Substations', color: '#06b6d4' },
    { key: 'zones',       label: 'Risk Zones',  color: '#ef4444' },
  ];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Map Layers:</p>
        {layerButtons.map(btn => (
          <button
            key={btn.key}
            onClick={() => toggleLayer(btn.key)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
              activeLayers.has(btn.key)
                ? 'opacity-100'
                : 'opacity-40 hover:opacity-60',
            )}
            style={{
              borderColor: btn.color,
              background:  activeLayers.has(btn.key) ? `${btn.color}20` : 'transparent',
              color:       btn.color,
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-surface-700" style={{ height: 600 }}>
        <MapContainer
          center={REGION_CENTER}
          zoom={12}
          style={{ height: '100%', width: '100%', background: '#0d1630' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles-dark"
          />

          {/* ── Risk Zones ────────────────────────────────────── */}
          {activeLayers.has('zones') && dangerZones.map(zone => {
            const cfg = getRiskLevelConfig(zone.riskLevel);
            return (
              <Circle
                key={zone.id}
                center={[zone.latitude, zone.longitude]}
                radius={zone.radius}
                pathOptions={{
                  color:       cfg.color,
                  fillColor:   cfg.color,
                  fillOpacity: 0.12,
                  weight:      2,
                  dashArray:   zone.riskLevel === 'NORMAL' ? '6,4' : undefined,
                }}
              >
                <Popup className="custom-popup">
                  <div className="bg-surface-800 text-white p-3 rounded-lg min-w-52 text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge level={zone.riskLevel} size="xs" />
                      <span className="font-bold">{zone.id}</span>
                    </div>
                    <p className="font-semibold text-slate-200 mb-1">{zone.name}</p>
                    <p className="text-slate-400 text-[10px] mb-2">{zone.description}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Risk Score</span>
                        <span className="font-mono font-bold" style={{ color: cfg.color }}>
                          {zone.riskScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Abnormal Sensors</span>
                        <span className="font-mono">{zone.abnormalSensorCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status</span>
                        <span className="font-mono">{zone.status}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold" style={{ color: cfg.color }}>
                      ⚡ {zone.recommendedAction}
                    </p>
                  </div>
                </Popup>
                <LTooltip>{zone.id}: {zone.riskLevel}</LTooltip>
              </Circle>
            );
          })}

          {/* ── Substations ───────────────────────────────────── */}
          {activeLayers.has('substations') && substations.map(sub => {
            const cfg = getRiskLevelConfig(sub.riskLevel);
            return (
              <CircleMarker
                key={sub.id}
                center={[sub.latitude, sub.longitude]}
                radius={10}
                pathOptions={{
                  color:       '#06b6d4',
                  fillColor:   cfg.color,
                  fillOpacity: 0.85,
                  weight:      2,
                }}
              >
                <Popup className="custom-popup">
                  <div className="bg-surface-800 text-white p-3 rounded-lg min-w-48 text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge level={sub.riskLevel} size="xs" />
                      <span className="font-bold">{sub.id}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sensors</span>
                        <span className="font-mono">{sub.sensorIds.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">LoRa Signal</span>
                        <span className="font-mono">{sub.loraSignal}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Risk Score</span>
                        <span className="font-mono font-bold" style={{ color: cfg.color }}>
                          {sub.riskScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Battery</span>
                        <span className="font-mono">{sub.batteryLevel.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Last Sync</span>
                        <span className="font-mono">{format(new Date(sub.lastSync), 'HH:mm:ss')}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <CommBadge status={sub.communicationStatus} />
                    </div>
                  </div>
                </Popup>
                <LTooltip>{sub.id}</LTooltip>
              </CircleMarker>
            );
          })}

          {/* ── Sensors ───────────────────────────────────────── */}
          {activeLayers.has('sensors') && sensors.map(sensor => {
            const cfg    = getRiskLevelConfig(sensor.riskLevel);
            const typeCfg = getSensorTypeConfig(sensor.type);
            return (
              <CircleMarker
                key={sensor.id}
                center={[sensor.latitude, sensor.longitude]}
                radius={sensor.riskLevel === 'CRITICAL' ? 7 : 5}
                pathOptions={{
                  color:       cfg.color,
                  fillColor:   cfg.color,
                  fillOpacity: 0.9,
                  weight:      sensor.riskLevel !== 'NORMAL' ? 2 : 1,
                }}
              >
                <Popup className="custom-popup">
                  <div className="bg-surface-800 text-white p-3 rounded-lg min-w-52 text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge level={sensor.riskLevel} size="xs" />
                      <span className="font-bold font-mono">{sensor.id}</span>
                    </div>
                    <p className="text-slate-400 mb-2">{typeCfg.label}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reading</span>
                        <span className="font-mono font-bold" style={{ color: cfg.color }}>
                          {sensor.currentValue.toFixed(3)} {sensor.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Warning</span>
                        <span className="font-mono text-yellow-400">{sensor.warningThreshold} {sensor.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Critical</span>
                        <span className="font-mono text-red-400">{sensor.criticalThreshold} {sensor.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Battery</span>
                        <span className="font-mono">{sensor.batteryLevel.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Signal</span>
                        <span className="font-mono">{sensor.signalStrength}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Updated</span>
                        <span className="font-mono">{format(new Date(sensor.timestamp), 'HH:mm:ss')}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <CommBadge status={sensor.communicationStatus} />
                    </div>
                  </div>
                </Popup>
                <LTooltip>{sensor.id}: {sensor.currentValue.toFixed(2)} {sensor.unit}</LTooltip>
              </CircleMarker>
            );
          })}

          {/* Master Station */}
          <CircleMarker
            center={[masterStation.latitude, masterStation.longitude]}
            radius={16}
            pathOptions={{
              color:       '#0ea5e9',
              fillColor:   '#0ea5e9',
              fillOpacity: 0.3,
              weight:      3,
            }}
          >
            <Popup className="custom-popup">
              <div className="bg-surface-800 text-white p-3 rounded-lg min-w-52 text-xs">
                <p className="font-bold text-brand-400 mb-1">🖥️ {masterStation.id}</p>
                <p className="text-slate-300 text-[11px] mb-2">{masterStation.name}</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Sensors</span>
                    <span className="font-mono">{masterStation.totalSensors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Risk Score</span>
                    <span className="font-mono font-bold text-brand-400">
                      {masterStation.aggregatedRiskScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">LoRa Health</span>
                    <span className="font-mono">{masterStation.loraNetworkHealth}%</span>
                  </div>
                </div>
                <div className="mt-2">
                  <CommBadge status={masterStation.communicationStatus} />
                </div>
              </div>
            </Popup>
            <LTooltip>MASTER-01 (Command Center)</LTooltip>
          </CircleMarker>
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          Normal
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          Watch
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          Warning
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          High Risk
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          Critical
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-blue-500/30 border-2 border-blue-500" />
          Master Station
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          Substation (color = local risk)
        </div>
      </div>
    </div>
  );
}
