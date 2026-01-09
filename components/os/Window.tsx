import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { AppDefinition } from '../../types';

interface WindowProps {
  app: AppDefinition;
  isFocused: boolean;
  isComputerMode: boolean;
  onClose: () => void;
  onFocus: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({ 
    app, isFocused, isComputerMode, onClose, onFocus, onMinimize, isMinimized, children 
}) => {
  const [maximized, setMaximized] = useState(!isComputerMode);
  const [position, setPosition] = useState({ x: 20, y: 40 });
  const [size, setSize] = useState({ w: 600, h: 400 }); // Default smaller for safety
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [isResizing, setIsResizing] = useState(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  
  const windowRef = useRef<HTMLDivElement>(null);

  // Initialize size based on viewport
  useEffect(() => {
    if (isComputerMode) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        setSize({
            w: Math.min(800, vw * 0.9),
            h: Math.min(600, vh * 0.7)
        });
        setPosition({
            x: Math.max(0, (vw - Math.min(800, vw * 0.9)) / 2),
            y: Math.max(40, (vh - Math.min(600, vh * 0.7)) / 4)
        });
    }
  }, []); // Run once on mount to set initial nice position

  // Sync maximized state with mode
  useEffect(() => {
    if (!isComputerMode) setMaximized(true);
    else {
        // When switching to computer mode, ensure we aren't stuck in maximized if not desired, 
        // though usually we want to restore windowed state. 
        // For now, let's default to windowed (false) only if we were previously forced maximized by mobile mode.
        // But if user maximized it in desktop mode, keep it. 
        // Simple logic: If switching TO computer mode, defaulting to windowed is usually expected unless state persisted.
        // Here we just set it to false to show off the windowing capability immediately.
        setMaximized(false);
    }
  }, [isComputerMode]);

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (maximized || !isComputerMode) return;
    if (windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setIsDragging(true);
    }
    onFocus();
  };

  const handleResizeStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (maximized || !isComputerMode) return;
      
      setIsResizing(true);
      resizeStart.current = {
          x: e.clientX,
          y: e.clientY,
          w: size.w,
          h: size.h
      };
      onFocus();
  };

  // --- TOUCH HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (maximized || !isComputerMode) return;
    const touch = e.touches[0];
    if (windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();
        setDragOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        });
        setIsDragging(true);
    }
    onFocus();
  };

  const handleResizeTouchStart = (e: React.TouchEvent) => {
      e.stopPropagation();
      // Do not prevent default immediately to allow potential scrolling if missed, 
      // but usually for resize handle we want to prevent default.
      // e.preventDefault(); 
      if (maximized || !isComputerMode) return;
      
      const touch = e.touches[0];
      setIsResizing(true);
      resizeStart.current = {
          x: touch.clientX,
          y: touch.clientY,
          w: size.w,
          h: size.h
      };
      onFocus();
  };

  // --- GLOBAL MOVE HANDLERS ---
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
        if (isDragging) {
            setPosition({
                x: clientX - dragOffset.x,
                y: clientY - dragOffset.y
            });
        }
        if (isResizing) {
            const deltaX = clientX - resizeStart.current.x;
            const deltaY = clientY - resizeStart.current.y;
            setSize({
                w: Math.max(300, resizeStart.current.w + deltaX),
                h: Math.max(200, resizeStart.current.h + deltaY)
            });
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging || isResizing) {
            e.preventDefault();
            handleMove(e.clientX, e.clientY);
        }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        if (isDragging || isResizing) {
            e.preventDefault(); // Critical to prevent page scrolling while dragging window
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        }
    };
    
    const handleEnd = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    if (isDragging || isResizing) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isResizing, dragOffset]);

  if (isMinimized) return null;

  const computerStyle: React.CSSProperties = maximized 
    ? { inset: '0px', top: '32px', borderRadius: 0 } 
    : { left: `${position.x}px`, top: `${position.y}px`, width: `${size.w}px`, height: `${size.h}px`, maxWidth: '100vw', maxHeight: '100vh' };
    
  const mobileStyle: React.CSSProperties = { inset: '0px', top: '0px' };

  return (
    <div
      ref={windowRef}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
      className={`absolute flex flex-col overflow-hidden transition-all duration-75
        ${isFocused ? 'z-40 shadow-[0_20px_60px_rgba(0,0,0,0.6)]' : 'z-30 shadow-2xl opacity-90'}
        ${!maximized && isComputerMode ? 'rounded-xl border border-white/10 ring-1 ring-black/50' : ''}
      `}
      style={{
         backgroundColor: 'var(--window-bg, #0f172a)',
         ...(isComputerMode ? computerStyle : mobileStyle),
         transition: (isDragging || isResizing) ? 'none' : 'opacity 0.2s, transform 0.2s, width 0.1s, height 0.1s',
         animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Title Bar */}
      <div 
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`
            h-10 px-3 flex items-center justify-between select-none shrink-0 relative
            ${isFocused 
                ? 'bg-slate-900/95 text-white backdrop-blur-md' 
                : 'bg-slate-950/90 text-slate-400 backdrop-blur-md'
            }
            border-b border-white/5
            ${!maximized && isComputerMode ? 'cursor-grab active:cursor-grabbing touch-none' : ''}
        `}
      >
        {!isComputerMode && (
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                <div className="w-12 h-1 bg-white rounded-full" />
            </div>
        )}

        <div className="flex items-center gap-2 z-10 pointer-events-none">
            <app.icon size={16} className={isFocused ? `text-${app.color}-400` : ''} />
            <span className="text-xs font-bold tracking-wide">{app.name}</span>
        </div>

        <div className="flex items-center gap-2 z-10">
            <button 
                onClick={(e) => { e.stopPropagation(); onMinimize(); }} 
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                title="Minimize"
            >
                <Minus size={16} />
            </button>
            
            {isComputerMode && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setMaximized(!maximized); }}
                    className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                    title={maximized ? "Restore" : "Maximize"}
                >
                    {maximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
            )}
            
            <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }} 
                className="w-8 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white rounded-full text-slate-400 transition-colors"
                title="Close"
            >
                <X size={16} />
            </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-slate-950">
        {isDragging && <div className="absolute inset-0 z-50 bg-transparent" />}
        {children}
      </div>

      {/* Resize Handle (Desktop Mode Only) */}
      {!maximized && isComputerMode && (
          <div 
             onMouseDown={handleResizeStart}
             onTouchStart={handleResizeTouchStart}
             className="absolute bottom-0 right-0 w-8 h-8 z-50 cursor-se-resize flex items-center justify-center text-slate-600 hover:text-white transition-colors touch-none"
          >
              <svg width="12" height="12" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M10 10L10 0L0 10L10 10Z" opacity="0.5" />
              </svg>
          </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};