import React, { useState } from 'react';
import { AppDefinition } from '../../types';
import { Circle, Square, AppWindow } from 'lucide-react';

interface DockProps {
  apps: AppDefinition[];
  openApp: (id: string) => void;
  isComputerMode: boolean;
  onHome: () => void;
  position: 'bottom' | 'left' | 'right';
  behavior: 'always' | 'intelligent' | 'hidden';
  hasActiveApps: boolean;
}

export const Dock: React.FC<DockProps> = ({ apps, openApp, isComputerMode, onHome, position, behavior, hasActiveApps }) => {
  const [hovered, setHovered] = useState(false);

  // --- MOBILE MODE (Floating Dock) ---
  if (!isComputerMode) {
    const shouldHide = behavior === 'intelligent' && hasActiveApps && !hovered;
    
    return (
        <>
            {/* Hover Trigger for auto-hide */}
            <div 
                className="absolute bottom-0 left-0 w-full h-4 z-40 bg-transparent"
                onMouseEnter={() => setHovered(true)}
            />

            {/* Dock */}
            <div 
                className={`absolute left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${shouldHide ? 'translate-y-24 opacity-0' : 'bottom-4 opacity-100'}`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-3 flex gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {apps.slice(0, 5).map((app) => (
                    <button
                    key={app.id}
                    onClick={() => openApp(app.id)}
                    className="group relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 bg-white/5 hover:bg-white/20"
                    >
                    <div className={`text-${app.color}-400`}>
                        <app.icon size={26} />
                    </div>
                    </button>
                ))}
                </div>
            </div>

            {/* Mobile Home Indicator/Button */}
            {!shouldHide && (
                <div className="absolute bottom-1 w-full flex justify-center z-50 pb-2 transition-opacity duration-300">
                    <button 
                        onClick={onHome}
                        className="w-32 h-1.5 bg-white/30 rounded-full hover:bg-white/50 active:bg-white transition-colors"
                    />
                </div>
            )}
        </>
    );
  }

  // --- COMPUTER MODE (Taskbar) ---
  
  // Logic for Auto-Hide
  const isHidden = behavior === 'intelligent' && hasActiveApps && !hovered;
  
  // Style configurations based on Position
  const isVertical = position === 'left' || position === 'right';
  
  const containerClasses = `
    absolute bg-slate-900/90 backdrop-blur-md border-white/10 z-50 flex shadow-2xl transition-all duration-300 ease-in-out
    ${position === 'bottom' ? 'bottom-0 left-0 w-full h-12 border-t flex-row items-center px-4 justify-between' : ''}
    ${position === 'left' ? 'top-0 left-0 h-full w-14 border-r flex-col items-center py-4 justify-start' : ''}
    ${position === 'right' ? 'top-0 right-0 h-full w-14 border-l flex-col items-center py-4 justify-start' : ''}
    ${isHidden ? (position === 'bottom' ? 'translate-y-full' : position === 'left' ? '-translate-x-full' : 'translate-x-full') : 'translate-0'}
  `;

  // Trigger Area for Auto-Hide (Invisible strip at edge)
  const triggerStyle: React.CSSProperties = {
      position: 'absolute',
      zIndex: 49,
      [position]: 0,
      [isVertical ? 'top' : 'left']: 0,
      [isVertical ? 'width' : 'height']: '16px',
      [isVertical ? 'height' : 'width']: '100%'
  };

  return (
    <>
        {/* Hover Trigger */}
        {(behavior === 'intelligent') && (
            <div style={triggerStyle} onMouseEnter={() => setHovered(true)} />
        )}

        <div 
            className={containerClasses}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
        
        {/* Start / Home Button */}
        <div className={`flex ${isVertical ? 'flex-col gap-4 mb-4' : 'flex-row items-center gap-1'}`}>
            <button 
                onClick={onHome} 
                className="w-10 h-10 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-sky-400 shrink-0"
                title="Start / Home"
            >
                <AppWindow size={24} />
            </button>
            
            {/* Divider */}
            <div className={`${isVertical ? 'w-full h-px my-2' : 'h-6 w-px mx-2'} bg-white/10`} />

            {/* App Icons */}
            {apps.map((app) => (
                <button
                    key={app.id}
                    onClick={() => openApp(app.id)}
                    className="w-10 h-10 flex items-center justify-center rounded hover:bg-white/10 transition-colors group relative shrink-0"
                    title={app.name}
                >
                    <app.icon size={20} className={`text-${app.color}-400 opacity-80 group-hover:opacity-100`} />
                    {/* Active Indicator Dot */}
                    <div className={`absolute bg-white rounded-full opacity-50 ${isVertical ? 'right-0.5 top-1/2 -translate-y-1/2 h-1 w-1' : 'bottom-1 w-1 h-1'}`} />
                </button>
            ))}
        </div>

        {/* Clock / Status (Only show in bottom bar efficiently, hide or simplify on sidebars) */}
        {!isVertical && (
            <div className="text-xs text-slate-400 flex items-center gap-4">
                <span>EN</span>
                <div className="flex flex-col items-end">
                    <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="text-[10px] opacity-70">{new Date().toLocaleDateString()}</span>
                </div>
            </div>
        )}
        </div>
    </>
  );
};