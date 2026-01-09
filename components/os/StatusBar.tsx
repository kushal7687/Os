import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Monitor, Smartphone } from 'lucide-react';

interface StatusBarProps {
    isComputerMode: boolean;
    toggleMode: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ isComputerMode, toggleMode }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // In Computer Mode, the "StatusBar" becomes a top panel or is hidden/merged. 
  // For Linux style, let's make it a Top Bar in Computer Mode, or hide it if we treat the Dock as the main bar.
  // The user asked for "Computer Mode". Usually Computer mode implies a taskbar. 
  // Let's keep this as the "System Tray" or "Top Bar" but adapt style.

  return (
    <div className={`
        w-full flex items-center justify-between px-4 text-white select-none z-50 absolute top-0 left-0 transition-all duration-300
        ${isComputerMode ? 'h-8 bg-slate-900 shadow-sm' : 'h-8 bg-black/20 backdrop-blur-md'}
    `}>
      <div className="flex items-center gap-4 text-xs font-mono opacity-80">
        <span className="font-bold tracking-wider hidden md:inline">CloudOS</span>
        
        {/* Mode Toggle Button */}
        <button 
            onClick={toggleMode}
            className="flex items-center gap-2 bg-white/10 px-2 py-0.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
        >
            {isComputerMode ? <Monitor size={12} /> : <Smartphone size={12} />}
            <span className="hidden sm:inline">{isComputerMode ? 'Desktop' : 'Mobile'}</span>
        </button>
      </div>
      
      {!isComputerMode && (
        <div className="font-semibold text-sm absolute left-1/2 -translate-x-1/2">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      <div className="flex items-center gap-3 opacity-90">
        <Signal size={14} />
        <Wifi size={14} />
        <div className="flex items-center gap-1">
          <span className="text-xs">100%</span>
          <Battery size={16} className="fill-white" />
        </div>
      </div>
    </div>
  );
};