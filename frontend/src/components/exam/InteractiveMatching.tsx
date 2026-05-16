'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Icon } from '@/components/ui/index';

interface InteractiveMatchingProps {
  keys: string[];
  values: string[];
  matches: Record<string, string>;
  onMatch: (key: string, value: string) => void;
  disabled?: boolean;
}

export const InteractiveMatching: React.FC<InteractiveMatchingProps> = ({
  keys,
  values,
  matches,
  onMatch,
  disabled = false,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<{ id: string; type: 'key' | 'val'; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [lineCoords, setLineCoords] = useState<any[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const keyRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const valRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const memoKeys = useMemo(() => keys, [keys]);
  const memoValues = useMemo(() => values, [values]);

  const updateLineCoords = useCallback(() => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newCoords = Object.entries(matches).map(([key, val]) => {
      const keyEl = keyRefs.current[key];
      const valEl = valRefs.current[val];
      
      if (keyEl && valEl) {
        const keyRect = keyEl.getBoundingClientRect();
        const valRect = valEl.getBoundingClientRect();
        
        return {
          key,
          val,
          x1: keyRect.left - containerRect.left + keyRect.width / 2,
          y1: keyRect.top - containerRect.top + keyRect.height / 2,
          x2: valRect.left - containerRect.left + valRect.width / 2,
          y2: valRect.top - containerRect.top + valRect.height / 2,
        };
      }
      return null;
    }).filter(Boolean);
    
    setLineCoords(newCoords);
  }, [matches]);

  useEffect(() => {
    updateLineCoords();
    const handleResize = () => updateLineCoords();
    window.addEventListener('resize', handleResize);
    
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [updateLineCoords]);

  useEffect(() => {
    const timer = setTimeout(updateLineCoords, 100);
    return () => clearTimeout(timer);
  }, [memoKeys, memoValues, matches, updateLineCoords]);

  const handlePointClick = (id: string, type: 'key' | 'val', e: React.MouseEvent) => {
    if (disabled) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current!.getBoundingClientRect();
    const x = rect.left - containerRect.left + rect.width / 2;
    const y = rect.top - containerRect.top + rect.height / 2;

    if (!selectedPoint) {
      setSelectedPoint({ id, type, x, y });
      setMousePos({ x, y }); // Initialize mousePos at the point
    } else {
      if (selectedPoint.type !== type) {
        const keyId = type === 'key' ? id : selectedPoint.id;
        const valId = type === 'val' ? id : selectedPoint.id;
        onMatch(keyId, valId);
        setSelectedPoint(null);
      } else {
        setSelectedPoint({ id, type, x, y });
      }
    }
  };

  useEffect(() => {
    if (!selectedPoint) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [selectedPoint]);

  const drawLine = (x1: number, y1: number, x2: number, y2: number, isGhost = false) => {
    const dx = x2 - x1;
    const curveWidth = Math.abs(dx) * 0.5;
    const cp1x = x1 - curveWidth;
    const cp2x = x2 + curveWidth;
    
    return (
      <path
        d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`}
        fill="none"
        stroke={isGhost ? 'rgba(66, 99, 235, 0.4)' : 'currentColor'}
        strokeWidth={isGhost ? 2 : 4}
        strokeDasharray={isGhost ? '8,8' : 'none'}
        strokeLinecap="round"
        className={isGhost ? 'animate-pulse' : 'text-primary-light'}
        style={isGhost ? {} : { filter: 'url(#glow)' }}
        markerEnd={isGhost ? 'none' : 'url(#arrowhead)'}
      />
    );
  };

  return (
    <div ref={containerRef} className="relative w-full mt-10 select-none bg-[#0a0f1d]/40 rounded-[48px] border border-white/5 p-8 md:p-16 overflow-visible shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#4263eb" />
          </marker>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {lineCoords.map((line) => (
          <g key={`${line.key}-${line.val}`}>
             {/* Thicker background path for neon effect */}
            <path
                d={`M ${line.x1} ${line.y1} C ${line.x1 - Math.abs(line.x2 - line.x1) * 0.5} ${line.y1}, ${line.x2 + Math.abs(line.x2 - line.x1) * 0.5} ${line.y2}, ${line.x2} ${line.y2}`}
                fill="none"
                stroke="rgba(66, 99, 235, 0.15)"
                strokeWidth="12"
                strokeLinecap="round"
            />
            {drawLine(line.x1, line.y1, line.x2, line.y2)}
          </g>
        ))}

        {selectedPoint && drawLine(selectedPoint.x, selectedPoint.y, mousePos.x, mousePos.y, true)}
      </svg>

      <div className="grid grid-cols-2 gap-24 md:gap-48 relative z-20">
        {/* Left Column (Values) */}
        <div className="space-y-8">
          <div className="text-center mb-10">
              <span className="px-6 py-2 rounded-2xl bg-white/5 border border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] shadow-sm">المطابق</span>
          </div>
          {memoValues.map((val, idx) => {
            const isMatched = Object.values(matches).includes(val);
            const isSelected = selectedPoint?.type === 'val' && selectedPoint.id === val;
            
            return (
              <div key={idx} className="flex items-center gap-6 group">
                <button
                  type="button"
                  onClick={(e) => handlePointClick(val, 'val', e)}
                  className={`flex-1 p-6 rounded-3xl border-2 transition-all duration-500 text-center font-bold text-xl relative ${
                    isSelected ? 'bg-primary/20 border-primary shadow-[0_0_50px_rgba(66,99,235,0.4)] scale-[1.05] z-30 text-white' :
                    isMatched ? 'bg-primary/10 border-primary/40 text-white shadow-[inset_0_0_30px_rgba(66,99,235,0.1)]' :
                    'bg-white/[0.03] border-white/5 hover:border-white/20 text-gray-400 hover:text-white hover:bg-white/[0.07]'
                  }`}
                >
                  {val}
                  {isMatched && (
                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-primary rounded-xl flex items-center justify-center border-2 border-[#0a0f1d] shadow-2xl animate-in zoom-in-50 duration-300">
                      <Icon name="check" size="xs" className="text-white" />
                    </div>
                  )}
                </button>
                <div 
                  ref={el => valRefs.current[val] = el}
                  className={`w-7 h-7 rounded-full border-4 transition-all duration-500 flex-shrink-0 cursor-pointer ${
                    isSelected || isMatched ? 'bg-primary border-primary-light shadow-[0_0_30px_rgba(66,99,235,1)] scale-125' : 'bg-[#151a2d] border-white/10 group-hover:border-primary/50'
                  }`}
                  onClick={(e) => handlePointClick(val, 'val', e)}
                />
              </div>
            );
          })}
        </div>

        {/* Right Column (Keys) */}
        <div className="space-y-8 text-right">
          <div className="text-center mb-10">
              <span className="px-6 py-2 rounded-2xl bg-white/5 border border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] shadow-sm">العنصر</span>
          </div>
          {memoKeys.map((key, idx) => {
            const isMatched = !!matches[key];
            const isSelected = selectedPoint?.type === 'key' && selectedPoint.id === key;
            
            return (
              <div key={idx} className="flex items-center gap-6 group">
                <div 
                  ref={el => keyRefs.current[key] = el}
                  className={`w-7 h-7 rounded-full border-4 transition-all duration-500 flex-shrink-0 cursor-pointer ${
                    isSelected || isMatched ? 'bg-primary border-primary-light shadow-[0_0_30px_rgba(66,99,235,1)] scale-125' : 'bg-[#151a2d] border-white/10 group-hover:border-primary/50'
                  }`}
                  onClick={(e) => handlePointClick(key, 'key', e)}
                />
                <button
                  type="button"
                  onClick={(e) => handlePointClick(key, 'key', e)}
                  className={`flex-1 p-6 rounded-3xl border-2 transition-all duration-500 text-center font-bold text-xl relative ${
                    isSelected ? 'bg-primary/20 border-primary shadow-[0_0_50px_rgba(66,99,235,0.4)] scale-[1.05] z-30 text-white' :
                    isMatched ? 'bg-primary/10 border-primary/40 text-white shadow-[inset_0_0_30px_rgba(66,99,235,0.1)]' :
                    'bg-white/[0.03] border-white/5 hover:border-white/20 text-gray-400 hover:text-white hover:bg-white/[0.07]'
                  }`}
                >
                  {key}
                  {isMatched && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary rounded-xl flex items-center justify-center border-2 border-[#0a0f1d] shadow-2xl animate-in zoom-in-50 duration-300">
                      <Icon name="check" size="xs" className="text-white" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
