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
  const [mobileSelected, setMobileSelected] = useState<{ id: string; type: 'key' | 'val' } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const keyRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const valRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const memoKeys = useMemo(() => keys, [keys]);
  const memoValues = useMemo(() => values, [values]);

  const getMatchColors = useCallback((index: number) => {
    const colors = [
      { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', border: 'border-indigo-500/40 dark:border-indigo-500/50 hover:border-indigo-500', text: 'text-indigo-600 dark:text-indigo-450', badge: 'bg-indigo-500', stroke: 'text-indigo-500', hex: '#6366f1' },
      { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', border: 'border-emerald-500/40 dark:border-emerald-500/50 hover:border-emerald-500', text: 'text-emerald-600 dark:text-emerald-450', badge: 'bg-emerald-500', stroke: 'text-emerald-500', hex: '#10b981' },
      { bg: 'bg-violet-500/10 dark:bg-violet-500/20', border: 'border-violet-500/40 dark:border-violet-500/50 hover:border-violet-500', text: 'text-violet-600 dark:text-violet-450', badge: 'bg-violet-500', stroke: 'text-violet-500', hex: '#8b5cf6' },
      { bg: 'bg-amber-500/10 dark:bg-amber-500/20', border: 'border-amber-500/40 dark:border-amber-500/50 hover:border-amber-500', text: 'text-amber-600 dark:text-amber-450', badge: 'bg-amber-500', stroke: 'text-amber-500', hex: '#f59e0b' },
      { bg: 'bg-rose-500/10 dark:bg-rose-500/20', border: 'border-rose-500/40 dark:border-rose-500/50 hover:border-rose-500', text: 'text-rose-600 dark:text-rose-450', badge: 'bg-rose-500', stroke: 'text-rose-500', hex: '#f43f5e' },
    ];
    return colors[index % colors.length];
  }, []);

  const getKeyForValue = useCallback((val: string) => {
    return Object.keys(matches).find(k => matches[k] === val);
  }, [matches]);

  const updateLineCoords = useCallback(() => {
    if (!containerRef.current || isMobile) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newCoords = Object.entries(matches).map(([key, val]) => {
      const keyEl = keyRefs.current[key];
      const valEl = valRefs.current[val];
      
      if (keyEl && valEl) {
        const keyRect = keyEl.getBoundingClientRect();
        const valRect = valEl.getBoundingClientRect();
        const matchIdx = keys.indexOf(key);
        
        return {
          key,
          val,
          matchIdx,
          x1: keyRect.left - containerRect.left + keyRect.width / 2,
          y1: keyRect.top - containerRect.top + keyRect.height / 2,
          x2: valRect.left - containerRect.left + valRect.width / 2,
          y2: valRect.top - containerRect.top + valRect.height / 2,
        };
      }
      return null;
    }).filter(Boolean);
    
    setLineCoords(newCoords);
  }, [matches, keys, isMobile]);

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
      setMousePos({ x, y });
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

  const handleMobileClick = useCallback((id: string, type: 'key' | 'val') => {
    if (disabled) return;
    if (!mobileSelected) {
      setMobileSelected({ id, type });
    } else {
      if (mobileSelected.id === id && mobileSelected.type === type) {
        setMobileSelected(null);
      } else if (mobileSelected.type !== type) {
        const keyId = type === 'key' ? id : mobileSelected.id;
        const valId = type === 'val' ? id : mobileSelected.id;
        onMatch(keyId, valId);
        setMobileSelected(null);
      } else {
        setMobileSelected({ id, type });
      }
    }
  }, [disabled, mobileSelected, onMatch]);

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

  const drawLine = (x1: number, y1: number, x2: number, y2: number, isGhost = false, matchIdx = -1) => {
    const dx = x2 - x1;
    const curveWidth = Math.abs(dx) * 0.5;
    const cp1x = x1 - curveWidth;
    const cp2x = x2 + curveWidth;
    
    const colors = matchIdx !== -1 ? getMatchColors(matchIdx) : null;
    const strokeColor = isGhost ? 'rgba(66, 99, 235, 0.4)' : 'currentColor';
    const textClass = isGhost ? 'animate-pulse text-primary-light' : (colors ? colors.stroke : 'text-primary-light');
    
    return (
      <path
        d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isGhost ? 2 : 4}
        strokeDasharray={isGhost ? '8,8' : 'none'}
        strokeLinecap="round"
        className={`${textClass} transition-all duration-300`}
        style={isGhost ? {} : { filter: 'url(#glow)' }}
        markerEnd={isGhost ? 'none' : (matchIdx !== -1 ? `url(#arrowhead-${matchIdx % 5})` : 'url(#arrowhead-default)')}
      />
    );
  };

  const totalPairs = memoKeys.length;
  const matchedPairsCount = Object.keys(matches).filter(k => matches[k]).length;
  const remainingCount = totalPairs - matchedPairsCount;

  return (
    <div ref={containerRef} className="relative w-full mt-4 sm:mt-6 select-none bg-surface-secondary/30 dark:bg-[#0a0f1d]/40 rounded-3xl sm:rounded-[48px] border border-border-theme-primary p-3 sm:p-8 md:p-16 overflow-visible shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      {/* Progress tracking header */}
      <div className="flex items-center justify-between mb-4 sm:mb-8 bg-surface-secondary/50 dark:bg-black/20 px-4 py-3 rounded-2xl border border-border-theme-secondary/40">
        <span className="text-xs sm:text-sm font-bold text-text-theme-secondary">توصيل العناصر المتطابقة</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs font-bold text-text-theme-muted">المتبقي:</span>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${remainingCount === 0 ? 'bg-success/15 text-success' : 'bg-primary/10 text-primary-light animate-pulse'}`}>
            {remainingCount} من {totalPairs}
          </span>
        </div>
      </div>

      {!isMobile && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
          <defs>
            <marker
              id="arrowhead-default"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#4263eb" />
            </marker>
            {Array.from({ length: 5 }).map((_, i) => (
              <marker
                key={i}
                id={`arrowhead-${i}`}
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill={getMatchColors(i).hex} />
              </marker>
            ))}
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
                stroke={line.matchIdx !== -1 ? getMatchColors(line.matchIdx).hex : "rgba(66, 99, 235, 0.15)"}
                strokeOpacity="0.15"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {drawLine(line.x1, line.y1, line.x2, line.y2, false, line.matchIdx)}
            </g>
          ))}

          {selectedPoint && drawLine(selectedPoint.x, selectedPoint.y, mousePos.x, mousePos.y, true)}
        </svg>
      )}
      
      <div className="grid grid-cols-2 gap-3 sm:gap-16 md:gap-32 relative z-20">
        {/* Right Column (Keys - Element / "العنصر") - First in RTL Grid */}
        <div className="space-y-3 sm:space-y-6 text-right">
          <div className="text-center mb-2 sm:mb-4">
            <span className="px-3 py-1.5 sm:px-6 sm:py-2 rounded-xl sm:rounded-2xl bg-surface-secondary border border-border-theme-secondary text-text-theme-secondary text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.3em] shadow-sm">العنصر</span>
          </div>
          {memoKeys.map((key, idx) => {
            const isMatched = !!matches[key];
            const matchIndex = keys.indexOf(key);
            const isSelected = isMobile
              ? (mobileSelected?.type === 'key' && mobileSelected.id === key)
              : (selectedPoint?.type === 'key' && selectedPoint.id === key);
            const colors = isMatched && matchIndex !== -1 ? getMatchColors(matchIndex) : null;
            
            return (
              <div key={idx} className="flex items-center gap-2 sm:gap-4 md:gap-6 group">
                <button
                  type="button"
                  onClick={(e) => isMobile ? handleMobileClick(key, 'key') : handlePointClick(key, 'key', e)}
                  className={`flex-1 p-3.5 sm:p-5 md:p-6 min-h-[48px] sm:min-h-[64px] rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 text-center font-bold text-sm sm:text-lg md:text-xl relative flex items-center justify-center ${
                    isSelected ? 'bg-primary/20 border-primary shadow-[0_0_25px_rgba(66,99,235,0.25)] scale-[1.02] z-30 text-text-theme-primary font-black' :
                    isMatched && colors ? `${colors.bg} ${colors.border} text-text-theme-primary shadow-sm` :
                    'bg-surface-secondary border-border-theme-secondary hover:border-border-theme-primary text-text-theme-secondary hover:text-text-theme-primary hover:bg-surface-hover'
                  }`}
                >
                  <span className="truncate max-w-[80%]">{key}</span>
                  {isMatched && matchIndex !== -1 && (
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm ${colors?.badge} animate-in zoom-in-50 duration-300`}>
                      {matchIndex + 1}
                    </div>
                  )}
                </button>
                {!isMobile && (
                  <div 
                    ref={el => { keyRefs.current[key] = el; }}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 sm:border-4 transition-all duration-300 flex-shrink-0 cursor-pointer ${
                      isSelected || isMatched ? 'bg-primary border-primary-light shadow-[0_0_20px_rgba(66,99,235,0.8)] scale-110' : 'bg-surface-tertiary border-border-theme-secondary group-hover:border-primary/50'
                    }`}
                    onClick={(e) => handlePointClick(key, 'key', e)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Left Column (Values - Match / "المطابق") - Second in RTL Grid */}
        <div className="space-y-3 sm:space-y-6">
          <div className="text-center mb-2 sm:mb-4">
            <span className="px-3 py-1.5 sm:px-6 sm:py-2 rounded-xl sm:rounded-2xl bg-surface-secondary border border-border-theme-secondary text-text-theme-secondary text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.3em] shadow-sm">المطابق</span>
          </div>
          {memoValues.map((val, idx) => {
            const matchedKey = getKeyForValue(val);
            const isMatched = !!matchedKey;
            const matchIndex = matchedKey ? keys.indexOf(matchedKey) : -1;
            const isSelected = isMobile
              ? (mobileSelected?.type === 'val' && mobileSelected.id === val)
              : (selectedPoint?.type === 'val' && selectedPoint.id === val);
            const colors = isMatched && matchIndex !== -1 ? getMatchColors(matchIndex) : null;
            
            return (
              <div key={idx} className="flex items-center gap-2 sm:gap-4 md:gap-6 group">
                {!isMobile && (
                  <div 
                    ref={el => { valRefs.current[val] = el; }}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 sm:border-4 transition-all duration-300 flex-shrink-0 cursor-pointer ${
                      isSelected || isMatched ? 'bg-primary border-primary-light shadow-[0_0_20px_rgba(66,99,235,0.8)] scale-110' : 'bg-surface-tertiary border-border-theme-secondary group-hover:border-primary/50'
                    }`}
                    onClick={(e) => handlePointClick(val, 'val', e)}
                  />
                )}
                <button
                  type="button"
                  onClick={(e) => isMobile ? handleMobileClick(val, 'val') : handlePointClick(val, 'val', e)}
                  className={`flex-1 p-3.5 sm:p-5 md:p-6 min-h-[48px] sm:min-h-[64px] rounded-2xl sm:rounded-3xl border-2 transition-all duration-300 text-center font-bold text-sm sm:text-lg md:text-xl relative flex items-center justify-center ${
                    isSelected ? 'bg-primary/20 border-primary shadow-[0_0_25px_rgba(66,99,235,0.25)] scale-[1.02] z-30 text-text-theme-primary font-black' :
                    isMatched && colors ? `${colors.bg} ${colors.border} text-text-theme-primary shadow-sm` :
                    'bg-surface-secondary border-border-theme-secondary hover:border-border-theme-primary text-text-theme-secondary hover:text-text-theme-primary hover:bg-surface-hover'
                  }`}
                >
                  <span className="truncate max-w-[80%]">{val}</span>
                  {isMatched && matchIndex !== -1 && (
                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm ${colors?.badge} animate-in zoom-in-50 duration-300`}>
                      {matchIndex + 1}
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
