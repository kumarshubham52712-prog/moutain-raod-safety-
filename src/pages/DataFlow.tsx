import { useMonitoringStore } from '../store/monitoringStore';
import { Card, SectionHeader } from '../components/common';
import { format }              from 'date-fns';
import clsx                   from 'clsx';
import { useRef, useEffect }   from 'react';

const EVENT_ICONS: Record<string, string> = {
  SENSOR_READING:    '📡',
  SENSOR_ALERT:      '🚨',
  SUBSTATION_PACKET: '📦',
  LORA_TRANSMISSION: '🔗',
  MASTER_RECEIVE:    '🖥️',
  EDGE_PROCESS:      '⚙️',
  RISK_UPDATE:       '🧠',
  ZONE_STATUS_CHANGE:'🗺️',
  ALERT_GENERATED:   '🔔',
  SIMULATION_EVENT:  '🎬',
};

const SEV_COLORS: Record<string, string> = {
  ERROR:   'border-l-red-500 bg-red-500/5',
  WARNING: 'border-l-yellow-500 bg-yellow-500/5',
  INFO:    'border-l-brand-600 bg-brand-600/5',
};

const PIPELINE_NODES = [
  { id: 'sensor',   label: 'Sensors',          sub: '30 IoT nodes',           color: '#8b5cf6' },
  { id: 'sub',      label: 'Substation / Edge', sub: '10 LoRa edge stations',  color: '#06b6d4' },
  { id: 'lora',     label: 'LoRa Network',      sub: '868 MHz mesh',           color: '#f59e0b' },
  { id: 'master',   label: 'Master Station',    sub: 'MASTER-01 Dehradun',     color: '#0ea5e9' },
  { id: 'edge',     label: 'Edge Processing',   sub: 'Local AI gateway',       color: '#3b82f6' },
  { id: 'ai',       label: 'AI / Risk Engine',  sub: 'Rule-based scoring',     color: '#a855f7' },
  { id: 'score',    label: 'Risk Score',         sub: '0–100 composite',       color: '#f97316' },
  { id: 'alert',    label: 'Danger Zone / Alert',sub: 'Response & evacuation', color: '#ef4444' },
];

function PipelineNode({ node, active }: { node: typeof PIPELINE_NODES[0]; active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={clsx(
          'w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-500',
          active ? 'scale-110' : 'opacity-60',
        )}
        style={{
          borderColor:  node.color,
          background:   `${node.color}15`,
          boxShadow:    active ? `0 0 20px ${node.color}40` : 'none',
        }}
      >
        <span className="text-xl">{EVENT_ICONS[node.id] ?? '●'}</span>
      </div>
      <p className="text-[10px] font-semibold text-center text-white w-20 leading-tight">{node.label}</p>
      <p className="text-[9px] text-center text-slate-600 w-20 leading-tight">{node.sub}</p>
    </div>
  );
}

function FlowArrow({ color, animated }: { color: string; animated: boolean }) {
  return (
    <div className="flex flex-col items-center self-start mt-5 px-1">
      <div className="relative w-8 h-1 rounded-full overflow-hidden" style={{ background: `${color}30` }}>
        {animated && (
          <div
            className="absolute inset-y-0 w-4 rounded-full animate-flow"
            style={{ background: color }}
          />
        )}
      </div>
      <span className="text-[8px] text-slate-600 mt-0.5" style={{ color }}>→</span>
    </div>
  );
}

export default function DataFlow() {
  const { eventLog, masterStation, simulation } = useMonitoringStore();
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = 0;
    }
  }, [eventLog.length]);

  // Determine which pipeline nodes are "active" based on recent events
  const recentTypes = new Set(eventLog.slice(0, 10).map(e => e.eventType));
  const activeNodes = new Set<string>();
  if (recentTypes.has('SENSOR_READING') || recentTypes.has('SENSOR_ALERT')) activeNodes.add('sensor');
  if (recentTypes.has('SUBSTATION_PACKET')) { activeNodes.add('sub'); activeNodes.add('lora'); }
  if (recentTypes.has('MASTER_RECEIVE') || recentTypes.has('SUBSTATION_PACKET')) activeNodes.add('master');
  if (recentTypes.has('EDGE_PROCESS')) activeNodes.add('edge');
  if (recentTypes.has('RISK_UPDATE')) { activeNodes.add('ai'); activeNodes.add('score'); }
  if (recentTypes.has('ZONE_STATUS_CHANGE') || recentTypes.has('ALERT_GENERATED') || recentTypes.has('SENSOR_ALERT')) activeNodes.add('alert');

  return (
    <div className="space-y-6">
      {/* ── Pipeline Visualization ────────────────────────────── */}
      <Card className="p-6">
        <SectionHeader
          title="Data Pipeline"
          subtitle="End-to-end flow from sensor to alert"
        />
        <div className="overflow-x-auto">
          <div className="flex items-start gap-0 min-w-max py-2">
            {PIPELINE_NODES.map((node, i) => (
              <div key={node.id} className="flex items-start">
                <PipelineNode node={node} active={simulation.isRunning ? activeNodes.has(node.id) : true} />
                {i < PIPELINE_NODES.length - 1 && (
                  <FlowArrow color={node.color} animated={simulation.isRunning} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sub-topology: sensors → substations → master */}
        <div className="mt-6 pt-4 border-t border-surface-700">
          <p className="text-xs font-semibold text-slate-400 mb-3">Network Hierarchy Detail</p>
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max">
              {['SUB-01', 'SUB-02', 'SUB-03', 'SUB-07'].map((subId, si) => {
                const subSensorIds = {
                  'SUB-01': ['IPI-001', 'VWP-001', 'GEO-001'],
                  'SUB-02': ['IPI-002', 'VWP-002', 'EXT-001'],
                  'SUB-03': ['IPI-003', 'VWP-003', 'GEO-002'],
                  'SUB-07': ['GEO-004', 'VWP-007', 'EXT-004'],
                }[subId] ?? [];

                return (
                  <div key={subId} className="flex flex-col items-center gap-2">
                    {/* Sensors */}
                    <div className="flex gap-2">
                      {subSensorIds.map(sid => (
                        <div key={sid}
                          className="px-2 py-1 rounded text-[9px] font-mono bg-surface-700 border border-surface-600 text-slate-400 text-center"
                          style={{ minWidth: 52 }}>
                          {sid}
                        </div>
                      ))}
                    </div>
                    {/* Connector lines */}
                    <div className="flex gap-2">
                      {subSensorIds.map(sid => (
                        <div key={sid} className="w-px h-4 bg-surface-600 mx-auto" style={{ width: 52, display:'flex', justifyContent:'center' }}>
                          <div className="w-px h-full bg-slate-600" />
                        </div>
                      ))}
                    </div>
                    {/* Substation */}
                    <div className="px-4 py-1.5 rounded-lg text-[10px] font-mono font-semibold border border-cyan-500/40 bg-cyan-500/10 text-cyan-400">
                      {subId}
                    </div>
                    {/* LoRa arrow */}
                    <div className="flex flex-col items-center text-slate-600">
                      <div className="w-px h-3 bg-slate-600" />
                      <span className="text-[9px]">LoRa</span>
                    </div>
                    {/* Master contribution indicator */}
                    <div className="px-2 py-1 rounded text-[9px] font-mono border border-blue-500/30 bg-blue-500/10 text-blue-400">
                      → M-01
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center text-slate-600 text-xs px-2">
                <span>... +6 more</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Live Event Stream ─────────────────────────────────── */}
      <Card className="p-4">
        <SectionHeader
          title="Live Event Stream"
          subtitle={`${eventLog.length} recent pipeline events`}
        >
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping-slow" />
            {simulation.isRunning ? 'Live' : 'Paused'}
          </span>
        </SectionHeader>

        <div ref={streamRef} className="space-y-1.5 max-h-96 overflow-y-auto font-mono text-xs pr-1">
          {eventLog.length === 0 ? (
            <p className="text-slate-600 text-center py-8">
              Start the simulation to see live pipeline events.
            </p>
          ) : eventLog.map(evt => (
            <div
              key={evt.id}
              className={clsx(
                'border-l-2 px-3 py-2 rounded-r-lg transition-all',
                SEV_COLORS[evt.severity] ?? SEV_COLORS.INFO,
              )}
            >
              <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-0.5">
                <span>{format(new Date(evt.timestamp), 'HH:mm:ss.SSS')}</span>
                <span className="text-slate-700">·</span>
                <span className="font-semibold text-slate-400">{evt.source}</span>
                {evt.destination && (
                  <>
                    <span className="text-slate-700">→</span>
                    <span className="font-semibold text-brand-400">{evt.destination}</span>
                  </>
                )}
                <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] bg-surface-800 text-slate-500 border border-surface-700">
                  {evt.eventType}
                </span>
              </div>
              <p className="text-slate-300">{evt.message}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
