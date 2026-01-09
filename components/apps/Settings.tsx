import React, { useState } from 'react';
import { AppProps, SystemSettings } from '../../types';
import { WALLPAPERS, HACKER_WALLPAPER } from '../../constants';
import { Monitor, Moon, Sun, Palette, LayoutGrid, Sliders, Image, Check, Sidebar, Terminal, Shield } from 'lucide-react';

interface SettingsAppProps extends AppProps {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({ settings, updateSettings, isHackerMode }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'wallpaper' | 'home' | 'dock'>('general');
  const [wallpaperCategory, setWallpaperCategory] = useState<string>('All');
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');

  const categories = ['All', ...Array.from(new Set(WALLPAPERS.map(w => w.category || 'Other')))];
  
  const filteredWallpapers = wallpaperCategory === 'All' 
    ? WALLPAPERS 
    : WALLPAPERS.filter(w => w.category === wallpaperCategory);

  const containerClass = isHackerMode 
    ? "bg-black text-green-500 font-mono" 
    : "bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100";

  const sidebarClass = isHackerMode
    ? "bg-black border-r border-green-900"
    : "bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800";
    
  const buttonClass = (active: boolean) => {
      if (isHackerMode) {
          return `w-full flex items-center gap-3 px-3 py-3 rounded transition-all ${active ? 'bg-green-900/30 text-green-400 border border-green-800' : 'text-green-800 hover:text-green-600'}`;
      }
      return `w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${active ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-900'}`;
  }

  const cardClass = isHackerMode
    ? "bg-black border border-green-900 p-6 rounded shadow-[0_0_15px_rgba(0,255,0,0.1)]"
    : "bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700";

  return (
    <div className={`h-full w-full flex overflow-hidden ${containerClass}`}>
      
      {/* Sidebar */}
      <div className={`w-16 md:w-56 flex flex-col shrink-0 ${sidebarClass}`}>
          <div className="p-4 md:p-6 font-bold text-xl hidden md:block opacity-70">SYSTEM_CONF</div>
          <div className="flex-1 px-2 py-4 space-y-2">
              <button onClick={() => setActiveTab('general')} className={buttonClass(activeTab === 'general')}>
                  <Sliders size={20} />
                  <span className="hidden md:inline font-medium">General</span>
              </button>
              <button onClick={() => setActiveTab('wallpaper')} className={buttonClass(activeTab === 'wallpaper')}>
                  <Image size={20} />
                  <span className="hidden md:inline font-medium">Wallpaper</span>
              </button>
              <button onClick={() => setActiveTab('home')} className={buttonClass(activeTab === 'home')}>
                  <LayoutGrid size={20} />
                  <span className="hidden md:inline font-medium">Display</span>
              </button>
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* --- GENERAL TAB --- */}
        {activeTab === 'general' && (
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-3xl shadow-lg ${isHackerMode ? 'bg-green-900 text-green-400 border border-green-500' : 'bg-indigo-500 text-white'}`}>
                        {settings.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{settings.userName}@{settings.hostname}</h2>
                        <p className="opacity-60">Kernel v6.8.0-kali</p>
                    </div>
                </div>

                {/* HACKER MODE TOGGLE */}
                <div className={cardClass}>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 opacity-80">
                        <Terminal size={16} /> Mode Selection
                    </h3>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <div className={`font-bold text-lg ${isHackerMode ? 'text-green-400' : ''}`}>Hacker Mode</div>
                            <div className="text-sm opacity-60">Enable Kali Linux matrix environment</div>
                        </div>
                        <button 
                            onClick={() => {
                                const newMode = settings.themeMode === 'hacker' ? 'default' : 'hacker';
                                updateSettings({ 
                                    themeMode: newMode,
                                    wallpaper: newMode === 'hacker' ? HACKER_WALLPAPER : WALLPAPERS[0].url
                                });
                            }}
                            className={`w-14 h-8 rounded-full p-1 transition-colors relative ${settings.themeMode === 'hacker' ? 'bg-green-600' : 'bg-slate-300'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md flex items-center justify-center text-xs ${settings.themeMode === 'hacker' ? 'translate-x-6' : 'translate-x-0'}`}>
                                {settings.themeMode === 'hacker' ? <Terminal size={12} className="text-green-600" /> : <Sun size={12} className="text-orange-500" />}
                            </div>
                        </button>
                    </div>
                </div>

                <div className={cardClass}>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2 opacity-80">
                        <Palette size={16} /> Appearance
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-lg">Dark Mode</div>
                            <div className="text-sm opacity-60">System-wide dark theme</div>
                        </div>
                        <button 
                            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                            disabled={isHackerMode}
                            className={`w-14 h-8 rounded-full p-1 transition-colors relative ${settings.darkMode || isHackerMode ? 'bg-indigo-500 opacity-50 cursor-not-allowed' : 'bg-slate-300'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md ${settings.darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- WALLPAPER TAB --- */}
        {activeTab === 'wallpaper' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Wallpapers</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredWallpapers.map((wp) => (
                        <button
                            key={wp.name}
                            onClick={() => updateSettings({ wallpaper: wp.url })}
                            className={`group relative aspect-video rounded overflow-hidden border-2 transition-all ${settings.wallpaper === wp.url ? (isHackerMode ? 'border-green-500' : 'border-indigo-500 scale-[1.02]') : 'border-transparent'}`}
                        >
                            <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};