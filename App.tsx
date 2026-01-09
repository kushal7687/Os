import React, { useState, useEffect } from 'react';
import { StatusBar } from './components/os/StatusBar';
import { Dock } from './components/os/Dock';
import { Window } from './components/os/Window';
import { TerminalApp } from './components/apps/Terminal';
import { SettingsApp } from './components/apps/Settings';
import { StoreApp } from './components/apps/Store';
import { AssistantApp } from './components/apps/Assistant';
import { BrowserApp } from './components/apps/Browser';
import { RadioApp } from './components/apps/Radio';
import { MonitorApp } from './components/apps/Monitor';
import { MatrixBackground } from './components/os/MatrixBackground';
import { AppDefinition, SystemSettings } from './types';
import { APP_IDS, DEFAULT_WALLPAPER } from './constants';
import { Terminal, Settings, Cloud, Search, LayoutGrid, FileText, Music, Gamepad2, Mic, Globe, Box, Instagram, Facebook, Mail, Youtube, Radio, Activity } from 'lucide-react';

const PlaceholderApp: React.FC<{title: string}> = ({ title }) => (
    <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-4 bg-slate-900">
        <LayoutGrid size={48} className="opacity-20" />
        <p>This is a cloud placeholder for {title}.</p>
    </div>
);

// NOTE: We do NOT strictly type this constant as Record<string, AppDefinition> here.
// This allows TypeScript to infer the specific shape first, preventing "Props incompatible" errors.
// We then cast it to 'any' when passing to useState.
const DEFAULT_REGISTRY = {
  [APP_IDS.TERMINAL]: { id: APP_IDS.TERMINAL, name: 'Terminal', icon: Terminal, color: 'emerald', component: TerminalApp, isSystem: true },
  [APP_IDS.SETTINGS]: { id: APP_IDS.SETTINGS, name: 'Settings', icon: Settings, color: 'slate', component: SettingsApp as any, isSystem: true },
  [APP_IDS.STORE]: { id: APP_IDS.STORE, name: 'Cloud Store', icon: Cloud, color: 'sky', component: StoreApp as any, isSystem: true },
  [APP_IDS.ASSISTANT]: { id: APP_IDS.ASSISTANT, name: 'Assistant', icon: Search, color: 'indigo', component: AssistantApp, isSystem: true },
  [APP_IDS.BROWSER]: { id: APP_IDS.BROWSER, name: 'Shadow Surf', icon: Globe, color: 'blue', component: BrowserApp, isSystem: true },
  [APP_IDS.RADIO]: { id: APP_IDS.RADIO, name: 'World Radio', icon: Radio, color: 'violet', component: RadioApp, isSystem: true },
  [APP_IDS.MONITOR]: { id: APP_IDS.MONITOR, name: 'Net Monitor', icon: Activity, color: 'red', component: MonitorApp, isSystem: true },
  [APP_IDS.FILES]: { id: APP_IDS.FILES, name: 'Files', icon: FileText, color: 'yellow', component: () => <PlaceholderApp title="File Manager" />, isSystem: true },
  [APP_IDS.MEDIA]: { id: APP_IDS.MEDIA, name: 'Media Player', icon: Music, color: 'pink', component: () => <PlaceholderApp title="Media Player" />, isSystem: true },
  [APP_IDS.INSTAGRAM]: { id: APP_IDS.INSTAGRAM, name: 'Instagram', icon: Instagram, color: 'pink', component: BrowserApp, defaultUrl: 'https://instagram.com' },
  [APP_IDS.FACEBOOK]: { id: APP_IDS.FACEBOOK, name: 'Facebook', icon: Facebook, color: 'blue', component: BrowserApp, defaultUrl: 'https://facebook.com' },
  [APP_IDS.GMAIL]: { id: APP_IDS.GMAIL, name: 'Gmail', icon: Mail, color: 'red', component: BrowserApp, defaultUrl: 'https://gmail.com' },
  [APP_IDS.YOUTUBE]: { id: APP_IDS.YOUTUBE, name: 'YouTube', icon: Youtube, color: 'red', component: BrowserApp, defaultUrl: 'https://youtube.com' },
  [APP_IDS.SPOTIFY]: { id: APP_IDS.SPOTIFY, name: 'Spotify', icon: Music, color: 'green', component: BrowserApp, defaultUrl: 'https://open.spotify.com' },
};

export default function App() {
  // Cast DEFAULT_REGISTRY to 'any' first to bypass strict prop checks, then to the target type.
  const [appRegistry, setAppRegistry] = useState<Record<string, AppDefinition>>(DEFAULT_REGISTRY as any);

  const [installedApps, setInstalledApps] = useState<string[]>([
    APP_IDS.TERMINAL, 
    APP_IDS.MONITOR,
    APP_IDS.STORE, 
    APP_IDS.SETTINGS,
    APP_IDS.BROWSER, 
    APP_IDS.RADIO
  ]);
  
  const [runningApps, setRunningApps] = useState<string[]>([]);
  const [minimizedApps, setMinimizedApps] = useState<string[]>([]);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<SystemSettings>({
    wallpaper: DEFAULT_WALLPAPER,
    darkMode: true,
    accentColor: 'blue',
    userName: 'root',
    hostname: 'kali',
    isComputerMode: false,
    themeMode: 'default',
    iconSize: 'medium',
    gridDensity: 'comfortable',
    glassIntensity: 'medium',
    dockPosition: 'bottom',
    dockBehavior: 'always'
  });

  const isHackerMode = settings.themeMode === 'hacker';

  // Persistence
  useEffect(() => {
    const savedApps = localStorage.getItem('installedApps');
    const savedCustomRegistry = localStorage.getItem('customRegistry');
    
    if (savedCustomRegistry) {
        try {
            const parsed = JSON.parse(savedCustomRegistry);
            const rehydrated: Record<string, AppDefinition> = {};
            Object.keys(parsed).forEach(key => {
                rehydrated[key] = {
                    ...parsed[key],
                    component: BrowserApp, 
                    icon: Box 
                };
            });
            setAppRegistry(prev => ({ ...prev, ...rehydrated }));
        } catch (e) { console.error(e); }
    }
    
    if (savedApps) {
        try { setInstalledApps(JSON.parse(savedApps)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
      localStorage.setItem('installedApps', JSON.stringify(installedApps));
  }, [installedApps]);

  useEffect(() => {
    // Theme Injection
    if (isHackerMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.setProperty('--window-bg', 'rgba(0, 0, 0, 0.95)');
        document.documentElement.style.setProperty('--font-primary', '"JetBrains Mono", monospace');
    } else {
        if (settings.darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        const opacity = settings.glassIntensity === 'low' ? '0.98' : settings.glassIntensity === 'medium' ? '0.90' : '0.80';
        document.documentElement.style.setProperty('--window-bg', settings.darkMode ? `rgba(15, 23, 42, ${opacity})` : `rgba(255, 255, 255, ${opacity})`);
        document.documentElement.style.removeProperty('--font-primary');
    }
  }, [settings.darkMode, settings.glassIntensity, isHackerMode]);

  const openApp = (id: string) => {
    if (!runningApps.includes(id)) setRunningApps([...runningApps, id]);
    if (minimizedApps.includes(id)) setMinimizedApps(minimizedApps.filter(appId => appId !== id));
    setActiveAppId(id);
  };

  const toggleAppVisibility = (id: string) => {
      if (activeAppId === id && !minimizedApps.includes(id)) {
          setMinimizedApps([...minimizedApps, id]);
          setActiveAppId(null);
      } else {
          openApp(id);
      }
  }

  const closeApp = (id: string) => {
    setRunningApps(runningApps.filter(appId => appId !== id));
    setMinimizedApps(minimizedApps.filter(appId => appId !== id));
    if (activeAppId === id) setActiveAppId(null);
  };

  const minimizeApp = (id: string) => {
      if (!minimizedApps.includes(id)) setMinimizedApps([...minimizedApps, id]);
      if (activeAppId === id) setActiveAppId(null);
  };

  const installApp = (id: string) => {
    if (!installedApps.includes(id)) setInstalledApps([...installedApps, id]);
  };

  const installCustomApp = (name: string, url: string) => {
      const id = `custom-${Date.now()}`;
      const newApp: AppDefinition = {
          id, name, icon: Box, color: 'indigo', component: BrowserApp, defaultUrl: url
      };
      setAppRegistry(prev => {
          const updated = { ...prev, [id]: newApp };
          const toSave: Record<string, any> = {};
          (Object.values(updated) as AppDefinition[]).forEach((app) => {
              if (app.id.startsWith('custom-')) {
                  const { component, icon, ...rest } = app;
                  toSave[app.id] = rest;
              }
          });
          localStorage.setItem('customRegistry', JSON.stringify(toSave));
          return updated;
      });
      setInstalledApps(prev => [...prev, id]);
  };

  const uninstallApp = (id: string) => {
    setInstalledApps(installedApps.filter(appId => appId !== id));
    closeApp(id);
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => setSettings(prev => ({ ...prev, ...newSettings }));
  const toggleComputerMode = () => updateSettings({ isComputerMode: !settings.isComputerMode });
  const handleHome = () => {
      const toMinimize = runningApps.filter(id => !minimizedApps.includes(id));
      setMinimizedApps([...minimizedApps, ...toMinimize]);
      setActiveAppId(null);
  };

  const myApps = installedApps.map(id => appRegistry[id]).filter((app): app is AppDefinition => !!app);
  const allRegistryApps = (Object.values(appRegistry) as AppDefinition[]).filter(a => !a.id.startsWith('custom-'));

  const getGridCols = () => {
      if (settings.isComputerMode) return 'grid-cols-[repeat(auto-fill,minmax(80px,1fr))]';
      switch(settings.iconSize) {
          case 'small': return 'grid-cols-5 md:grid-cols-6 lg:grid-cols-8';
          case 'medium': return 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6';
          case 'large': return 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
          default: return 'grid-cols-4';
      }
  };

  return (
    <div 
      className={`relative w-full h-screen overflow-hidden bg-cover bg-center transition-all duration-700 ${isHackerMode ? 'font-mono text-green-500 bg-black' : ''}`}
      style={{ backgroundImage: isHackerMode ? 'none' : `url(${settings.wallpaper})` }}
    >
      {isHackerMode ? (
          <MatrixBackground />
      ) : (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      )}

      {/* Scanline Overlay for Hacker Mode */}
      {isHackerMode && (
          <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />
      )}

      <StatusBar isComputerMode={settings.isComputerMode} toggleMode={toggleComputerMode} />

      {/* Desktop Grid */}
      <div className={`absolute inset-0 pt-14 px-4 md:px-8 grid content-start transition-all overflow-y-auto ${getGridCols()} ${settings.gridDensity === 'compact' ? 'gap-2' : 'gap-6'} pb-24`}>
        {myApps.map((app) => (
          <button
            key={app.id}
            onClick={() => openApp(app.id)}
            className="flex flex-col items-center group p-2 rounded-xl hover:bg-white/10 transition-colors gap-2"
          >
            <div className={`
              rounded-2xl flex items-center justify-center shadow-lg border transition-all duration-300 relative overflow-hidden
              ${settings.isComputerMode 
                 ? (isHackerMode ? 'w-14 h-14 bg-black border-green-500' : `w-14 h-14 bg-slate-800/80 text-${app.color}-400 border-white/10`)
                 : (isHackerMode ? 'w-16 h-16 bg-black border-green-500 shadow-[0_0_15px_rgba(0,255,0,0.3)]' : 'w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 border-white/10')
              }
              group-hover:scale-105 group-active:scale-95
            `}>
                <app.icon size={isHackerMode ? 28 : 32} className={isHackerMode ? 'text-green-500' : `text-${app.color}-400`} />
            </div>
            <span className={`text-xs font-medium drop-shadow-md truncate w-full text-center px-2.5 py-0.5 rounded-full backdrop-blur-sm ${isHackerMode ? 'bg-black/70 text-green-500 border border-green-900' : 'bg-black/30 text-white border border-white/5'}`}>
              {app.name}
            </span>
          </button>
        ))}
      </div>

      {/* Windows */}
      {runningApps.map(appId => {
        const appDef = appRegistry[appId];
        if (!appDef) return null;
        const AppComp = appDef.component;
        let extraProps: any = { args: { url: appDef.defaultUrl }, isHackerMode };

        if (appId === APP_IDS.SETTINGS) extraProps = { settings, updateSettings, isHackerMode };
        else if (appId === APP_IDS.STORE) extraProps = { availableApps: allRegistryApps, installedAppIds: installedApps, onInstall: installApp, onUninstall: uninstallApp, onInstallCustom: installCustomApp };
        else if (appId === APP_IDS.BROWSER || appDef.component === BrowserApp) extraProps = { args: { url: appDef.defaultUrl, onSetWallpaper: (url: string) => updateSettings({ wallpaper: url }) }, isHackerMode };

        return (
          <Window
            key={appId}
            app={appDef}
            isFocused={activeAppId === appId}
            isComputerMode={settings.isComputerMode}
            onFocus={() => setActiveAppId(appId)}
            onClose={() => closeApp(appId)}
            onMinimize={() => minimizeApp(appId)}
            isMinimized={minimizedApps.includes(appId)}
          >
            <AppComp 
              appId={appId} 
              onClose={() => closeApp(appId)} 
              isFocused={activeAppId === appId}
              isComputerMode={settings.isComputerMode}
              {...extraProps}
            />
          </Window>
        );
      })}

      <Dock 
        apps={myApps} 
        openApp={toggleAppVisibility} 
        isComputerMode={settings.isComputerMode} 
        onHome={handleHome}
        position={settings.dockPosition}
        behavior={settings.dockBehavior}
        hasActiveApps={activeAppId !== null && runningApps.length > 0 && !minimizedApps.includes(activeAppId)}
      />
    </div>
  );
}