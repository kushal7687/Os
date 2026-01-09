import React, { useState } from 'react';
import { AppProps, SystemSettings } from '../../types';
import { WALLPAPERS } from '../../constants';
import { Monitor, Moon, Sun, Palette, LayoutGrid, Sliders, Image, Check, Sidebar, AppWindow } from 'lucide-react';

interface SettingsAppProps extends AppProps {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({ settings, updateSettings }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'wallpaper' | 'home' | 'dock'>('general');
  const [wallpaperCategory, setWallpaperCategory] = useState<string>('All');
  const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');

  const categories = ['All', ...Array.from(new Set(WALLPAPERS.map(w => w.category || 'Other')))];
  
  const filteredWallpapers = wallpaperCategory === 'All' 
    ? WALLPAPERS 
    : WALLPAPERS.filter(w => w.category === wallpaperCategory);

  return (
    <div className="h-full w-full bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100 flex overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-16 md:w-56 bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
          <div className="p-4 md:p-6 font-bold text-xl hidden md:block text-slate-400">Settings</div>
          <div className="flex-1 px-2 py-4 space-y-2">
              <button 
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'general' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-900'}`}
              >
                  <Sliders size={20} />
                  <span className="hidden md:inline font-medium">General</span>
              </button>
              <button 
                onClick={() => setActiveTab('wallpaper')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'wallpaper' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-900'}`}
              >
                  <Image size={20} />
                  <span className="hidden md:inline font-medium">Wallpaper</span>
              </button>
              <button 
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'home' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-900'}`}
              >
                  <LayoutGrid size={20} />
                  <span className="hidden md:inline font-medium">Home Screen</span>
              </button>
              <button 
                onClick={() => setActiveTab('dock')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${activeTab === 'dock' ? 'bg-white dark:bg-slate-800 text-indigo-500 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-900'}`}
              >
                  <Sidebar size={20} />
                  <span className="hidden md:inline font-medium">Dock & Taskbar</span>
              </button>
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        
        {/* --- GENERAL TAB --- */}
        {activeTab === 'general' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                        {settings.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{settings.userName}</h2>
                        <p className="text-slate-500">Hostname: {settings.hostname}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                        <Palette size={16} /> Appearance
                    </h3>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-lg">Dark Mode</div>
                            <div className="text-sm text-slate-500">Switch between light and dark themes</div>
                        </div>
                        <button 
                            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                            className={`w-14 h-8 rounded-full p-1 transition-colors relative ${settings.darkMode ? 'bg-indigo-500' : 'bg-slate-300'}`}
                        >
                            <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-md flex items-center justify-center text-xs ${settings.darkMode ? 'translate-x-6' : 'translate-x-0'}`}>
                                {settings.darkMode ? <Moon size={12} className="text-indigo-500" /> : <Sun size={12} className="text-orange-500" />}
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- WALLPAPER TAB --- */}
        {activeTab === 'wallpaper' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold">Wallpapers</h2>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setWallpaperCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${wallpaperCategory === cat ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom URL Input */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Paste image URL here..." 
                        value={customWallpaperUrl}
                        onChange={(e) => setCustomWallpaperUrl(e.target.value)}
                        className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                        onClick={() => {
                            if(customWallpaperUrl) {
                                updateSettings({ wallpaper: customWallpaperUrl });
                                setCustomWallpaperUrl('');
                            }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Set Custom
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredWallpapers.map((wp) => (
                        <button
                            key={wp.name}
                            onClick={() => updateSettings({ wallpaper: wp.url })}
                            className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${settings.wallpaper === wp.url ? 'border-indigo-500 scale-[1.02] shadow-xl ring-2 ring-indigo-500/20' : 'border-transparent hover:border-slate-400'}`}
                        >
                            <img src={wp.url} alt={wp.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <span className="text-white text-xs font-medium">{wp.name}</span>
                            </div>
                            {settings.wallpaper === wp.url && (
                                <div className="absolute top-2 right-2 bg-indigo-500 text-white p-1 rounded-full shadow-lg">
                                    <Check size={12} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* --- HOME SCREEN TAB --- */}
        {activeTab === 'home' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-2xl font-bold mb-6">Home Screen</h2>

                {/* Icon Size */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                     <h3 className="font-bold text-lg mb-4">Icon Size</h3>
                     <div className="grid grid-cols-3 gap-4">
                         {['small', 'medium', 'large'].map((size) => (
                             <button
                                key={size}
                                onClick={() => updateSettings({ iconSize: size as any })}
                                className={`py-3 rounded-xl border-2 transition-all capitalize font-medium ${settings.iconSize === size ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-slate-100 dark:bg-slate-950 text-slate-500'}`}
                             >
                                 {size}
                             </button>
                         ))}
                     </div>
                </div>

                {/* Grid Density */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                     <h3 className="font-bold text-lg mb-4">Grid Layout</h3>
                     <div className="grid grid-cols-2 gap-4">
                         {['compact', 'comfortable'].map((density) => (
                             <button
                                key={density}
                                onClick={() => updateSettings({ gridDensity: density as any })}
                                className={`py-3 rounded-xl border-2 transition-all capitalize font-medium ${settings.gridDensity === density ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-slate-100 dark:bg-slate-950 text-slate-500'}`}
                             >
                                 {density}
                             </button>
                         ))}
                     </div>
                </div>

                {/* Glass Effect */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                     <h3 className="font-bold text-lg mb-4">Window Transparency</h3>
                     <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                         {['low', 'medium', 'high'].map((intensity) => (
                             <button
                                key={intensity}
                                onClick={() => updateSettings({ glassIntensity: intensity as any })}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${settings.glassIntensity === intensity ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                             >
                                 {intensity}
                             </button>
                         ))}
                     </div>
                </div>
            </div>
        )}

        {/* --- DOCK & TASKBAR TAB --- */}
        {activeTab === 'dock' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-2xl font-bold mb-6">Dock & Taskbar</h2>

                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-sm mb-6 flex gap-3">
                    <Monitor size={20} className="shrink-0" />
                    These settings mostly apply to "Desktop Mode".
                </div>

                {/* Dock Position */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                     <h3 className="font-bold text-lg mb-4">Position</h3>
                     <div className="grid grid-cols-3 gap-4">
                         {['bottom', 'left', 'right'].map((pos) => (
                             <button
                                key={pos}
                                onClick={() => updateSettings({ dockPosition: pos as any })}
                                className={`py-3 rounded-xl border-2 transition-all capitalize font-medium ${settings.dockPosition === pos ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-slate-100 dark:bg-slate-950 text-slate-500'}`}
                             >
                                 {pos}
                             </button>
                         ))}
                     </div>
                </div>

                {/* Dock Visibility */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                     <h3 className="font-bold text-lg mb-4">Visibility & Behavior</h3>
                     <div className="space-y-3">
                        <button
                            onClick={() => updateSettings({ dockBehavior: 'always' })}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${settings.dockBehavior === 'always' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-slate-100 dark:bg-slate-950 text-slate-500'}`}
                        >
                            <AppWindow size={20} />
                            <div>
                                <div className="font-bold">Always Visible</div>
                                <div className="text-xs opacity-70">Taskbar is always shown on screen</div>
                            </div>
                        </button>
                        <button
                            onClick={() => updateSettings({ dockBehavior: 'intelligent' })}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${settings.dockBehavior === 'intelligent' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-slate-100 dark:bg-slate-950 text-slate-500'}`}
                        >
                            <Sidebar size={20} />
                            <div>
                                <div className="font-bold">Auto-Hide in Apps</div>
                                <div className="text-xs opacity-70">Hides when an app window is open or fullscreen</div>
                            </div>
                        </button>
                     </div>
                </div>

            </div>
        )}

      </div>
    </div>
  );
};