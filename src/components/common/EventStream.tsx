import { useEffect, useRef } from 'react';
import { useMonitoringStore } from '../../store/monitoringStore';
import { Card, SectionHeader } from './index';
import { format } from 'date-fns';
import { AlertCircle, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import type { EventLog } from '../../types';

export function EventStream({ maxItems = 50, height = '400px' }: { maxItems?: number, height?: string }) {
  const { eventLog } = useMonitoringStore();
  const streamEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top (newest)
  useEffect(() => {
    if (streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [eventLog]);

  const items = eventLog.slice(0, maxItems);

  const getIcon = (severity: EventLog['severity']) => {
    switch (severity) {
      case 'INFO': return <Info size={14} className="text-cyan-400" />;
      case 'WARNING': return <AlertTriangle size={14} className="text-yellow-400" />;
      case 'ERROR': return <AlertCircle size={14} className="text-red-400" />;
      case 'CRITICAL': return <ShieldAlert size={14} className="text-red-500 animate-pulse" />;
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden" style={{ height }}>
      <div className="p-4 border-b border-surface-700 bg-surface-800/80 shrink-0">
        <SectionHeader title="System Event Stream" subtitle="Live telemetry and network events" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
        <div ref={streamEndRef} />
        {items.map((event) => (
          <div
            key={event.id}
            className={clsx(
              'flex gap-3 p-2 rounded border-l-2 bg-surface-900/50',
              event.severity === 'INFO' ? 'border-l-cyan-500/50' :
              event.severity === 'WARNING' ? 'border-l-yellow-500/50' :
              'border-l-red-500/50'
            )}
          >
            <div className="shrink-0 mt-0.5">{getIcon(event.severity)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 opacity-60">
                <span>{format(new Date(event.timestamp), 'HH:mm:ss.SSS')}</span>
                <span>[{event.eventType}]</span>
                <span className="font-bold text-slate-300">{event.source}</span>
                {event.destination && (
                  <>
                    <span>→</span>
                    <span className="font-bold text-slate-300">{event.destination}</span>
                  </>
                )}
              </div>
              <p className={clsx(
                'truncate',
                event.severity === 'ERROR' || event.severity === 'CRITICAL' ? 'text-red-300' :
                event.severity === 'WARNING' ? 'text-yellow-300' : 'text-slate-300'
              )}>
                {event.message}
              </p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-slate-500 font-sans text-sm mt-10">No events recorded.</p>
        )}
      </div>
    </Card>
  );
}
