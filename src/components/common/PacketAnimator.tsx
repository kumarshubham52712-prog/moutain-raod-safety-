import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface Packet {
  id: string;
  source: string;
  destination: string;
  color: string;
  progress: number;
}

export function PacketAnimator({ activeEvents }: { activeEvents: number }) {
  const [packets, setPackets] = useState<Packet[]>([]);

  // When active events increase, generate some packets
  useEffect(() => {
    if (activeEvents > 0) {
      const newPackets: Packet[] = [];
      const numToGenerate = Math.min(3, activeEvents); // max 3 at a time to prevent flood
      
      for (let i = 0; i < numToGenerate; i++) {
        newPackets.push({
          id: Math.random().toString(36).substr(2, 9),
          source: 'bottom',
          destination: 'top',
          color: Math.random() > 0.5 ? '#06b6d4' : '#8b5cf6', // cyan or purple
          progress: 0,
        });
      }
      
      setPackets(prev => [...prev, ...newPackets].slice(-10)); // keep max 10 active
    }
  }, [activeEvents]);

  // Animation loop
  useEffect(() => {
    let frameId: number;
    
    const animate = () => {
      setPackets(prev => {
        const next = prev.map(p => ({ ...p, progress: p.progress + 2 })).filter(p => p.progress < 100);
        if (next.length === prev.length && next.every((p, i) => p.progress === prev[i].progress)) {
          return prev;
        }
        return next;
      });
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl opacity-60">
      {packets.map(p => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
          style={{
            backgroundColor: p.color,
            left: '50%',
            bottom: `${p.progress}%`,
            transform: 'translateX(-50%)',
            transition: 'bottom 0.05s linear',
          }}
        />
      ))}
    </div>
  );
}
