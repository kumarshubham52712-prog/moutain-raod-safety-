import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, Tooltip as LTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMonitoringStore }   from '../store/monitoringStore';
import { getRiskLevelConfig }   from '../config/thresholds';
import { getSensorTypeConfig }  from '../config/sensorTypes';
import { REGION_CENTER, MAP_BOUNDS } from '../config/geography';
import { StatusBadge, CommBadge } from '../components/common';
import { format }                from 'date-fns';
import clsx                      from 'clsx';
import { Link }                  from 'react-router-dom';

type MapLayer = 'sensors' | 'substations' | 'masters' | 'zones';

export default function LiveMap() {
  const { sensors, substations, masterStations, dangerZones } = useMonitoringStore();
  const [activeLayers, setActiveLayers] = useState<Set<MapLayer>>(
    new Set(['sensors', 'substations', 'masters', 'zones'])
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
    { key: 'masters',     label: 'Masters',     color: '#0ea5e9' },
    { key: 'zones',       label: 'Risk Zones',  color: '#ef4444' },
  ];

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col">
      {/* Controls */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Map Layers:</p>
          {layerButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => toggleLayer(btn.key)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                activeLayers.has(btn.key) ? 'opacity-100' : 'opacity-40 hover:opacity-60',
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
        <p className="text-xs text-slate-500">Dehradun / Mussoorie / Rishikesh Region</p>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-surface-700 flex-1 relative z-0">
        <MapContainer
          center={REGION_CENTER}
          zoom={11}
          maxBounds={MAP_BOUNDS}
          style={{ height: '100%', width: '100%', background: '#0d1630' }}
          zoomControl={true}
        >
          {/* High-resolution satellite basemap without dark filter */}
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
          {/* Optional labels layer overlay */}
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png"
            opacity={0.6}
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
                  className:   zone.riskLevel === 'CRITICAL' ? 'animate-pulse' : zone.riskLevel === 'HIGH_RISK' ? 'animate-pulse-slow' : '',
                  color:       cfg.color,
                  fillColor:   cfg.color,
                  fillOpacity: zone.riskLevel === 'NORMAL' ? 0.05 : 0.2,
                  weight:      zone.riskLevel === 'NORMAL' ? 1 : 2,
                  dashArray:   zone.riskLevel === 'NORMAL' ? '6,6' : undefined,
                }}
              >
                <Popup className="custom-popup">
                  <div className="bg-surface-800 text-white p-3 rounded-lg min-w-52 text-xs border border-surface-600 shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge level={zone.riskLevel} size="xs" />
                      <span className="font-bold">{zone.id}</span>
                    </div>
                    <p className="font-semibold text-slate-200 mb-1">{zone.name}</p>
                    <p className="text-slate-400 text-[10px] mb-2">{zone.description}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Master</span>
                        <span className="font-mono text-cyan-400">{zone.masterStationId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Risk Score</span>
                        <span className="font-mono font-bold" style={{ color: cfg.color }}>
                          {zone.riskScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status</span>
                        <span className="font-mono">{zone.status}</span>
                      </div>
                    </div>
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
                radius={8}
                pathOptions={{
                  color:       '#ffffff',
                  fillColor:   cfg.color,
                  fillOpacity: 0.9,
                  weight:      2,
                }}
              >
                <Popup className="custom-popup">
                  <div className="bg-surface-800 text-white p-3 rounded-lg min-w-48 text-xs shadow-2xl border border-surface-600">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge level={sub.riskLevel} size="xs" />
                      <Link to={`/substations/${sub.id}`} className="font-bold font-mono hover:text-brand-400 hover:underline">{sub.id}</Link>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Master</span>
                        <span className="font-mono text-cyan-400">{sub.masterStationId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sensors</span>
                        <span className="font-mono">{sub.sensorIds.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Risk</span>
                        <span className="font-mono font-bold" style={{ color: cfg.color }}>{sub.riskScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Battery</span>
                        <span className="font-mono">{sub.batteryLevel.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="mt-3">
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
            const isAbnormal = sensor.isAbnormal;

            return (
              <CircleMarker
                key={sensor.id}
                center={[sensor.latitude, sensor.longitude]}
                radius={isAbnormal ? 6 : 4}
                pathOptions={{
                  color:       isAbnormal ? '#ffffff' : cfg.color,
                  fillColor:   cfg.color,
                  fillOpacity: isAbnormal ? 1 : 0.7,
                  weight:      isAbnormal ? 2 : 1,
                }}
              >
                <Popup className="custom-popup">
                  <div className="bg-surface-800 text-white p-3 rounded-lg min-w-52 text-xs shadow-2xl border border-surface-600">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge level={sensor.riskLevel} size="xs" />
                      <Link to={`/sensors/${sensor.id}`} className="font-bold font-mono hover:text-brand-400 hover:underline">{sensor.id}</Link>
                    </div>
                    <p className="text-slate-400 mb-2">{typeCfg.label}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reading</span>
                        <span className="font-mono font-bold" style={{ color: cfg.color }}>
                          {sensor.currentValue.toFixed(2)} {sensor.unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Battery</span>
                        <span className="font-mono">{sensor.batteryLevel.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <CommBadge status={sensor.communicationStatus} />
                    </div>
                  </div>
                </Popup>
                <LTooltip>{sensor.id}: {sensor.currentValue.toFixed(2)} {sensor.unit}</LTooltip>
              </CircleMarker>
            );
          })}

          {/* ── Master Stations ───────────────────────────────── */}
          {activeLayers.has('masters') && masterStations.map(master => {
            const mCfg = getRiskLevelConfig(master.riskLevel);
            return (
              <CircleMarker
                key={master.id}
                center={[master.latitude, master.longitude]}
                radius={14}
                pathOptions={{
                  color:       '#ffffff',
                  fillColor:   mCfg.color,
                  fillOpacity: 0.9,
                  weight:      3,
                }}
              >
                <Popup className="custom-popup">
                  <div className="bg-surface-800 text-white p-3 rounded-lg min-w-56 text-xs shadow-2xl border border-surface-600">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🖥️</span>
                      <Link to={`/master-stations/${master.id}`} className="font-bold font-mono text-base hover:text-brand-400 hover:underline">{master.id}</Link>
                    </div>
                    <p className="text-slate-300 text-[11px] mb-3">{master.name}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Substations</span>
                        <span className="font-mono">{master.substationIds.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sensors</span>
                        <span className="font-mono">{master.totalSensors}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Risk Score</span>
                        <span className="font-mono font-bold" style={{ color: mCfg.color }}>
                          {master.aggregatedRiskScore}/100
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <CommBadge status={master.communicationStatus} />
                    </div>
                  </div>
                </Popup>
                <LTooltip permanent direction="right" className="master-tooltip">
                  <span className="font-bold">{master.id}</span>
                </LTooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 shrink-0 bg-surface-900 p-3 rounded-xl border border-surface-700">
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
        <div className="w-px h-4 bg-surface-600 mx-2" />
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-[3px] border-white" />
          Master Station
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyan-500 border-2 border-white" />
          Substation
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          Sensor
        </div>
      </div>
    </div>
  );
}
