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
import { AppDefinition, SystemSettings } from './types';
import { APP_IDS, DEFAULT_WALLPAPER } from './constants';
import { Terminal, Settings, Cloud, Search, LayoutGrid, FileText, Music, Gamepad2, Mic, Globe, Box, Instagram, Facebook, Mail, Youtube, Radio } from 'lucide-react';

// --- Placeholder Apps ---
const PlaceholderApp: React.FC<{title: string}> = ({ title }) => (
    <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-4 bg-slate-900">
        <LayoutGrid size={48} className="opacity-20" />
        <p>This is a cloud placeholder for {title}.</p>
    </div>
);

// --- Default Registry ---
const DEFAULT_REGISTRY: Record<string, AppDefinition> = {
  [APP_IDS.TERMINAL]: { id: APP_IDS.TERMINAL, name: 'Terminal', icon: Terminal, color: 'emerald', component: TerminalApp, isSystem: true },
  [APP_IDS.SETTINGS]: { id: APP_IDS.SETTINGS, name: 'Settings', icon: Settings, color: 'slate', component: SettingsApp, isSystem: true },
  [APP_IDS.STORE]: { id: APP_IDS.STORE, name: 'Cloud Store', icon: Cloud, color: 'sky', component: StoreApp, isSystem: true },
  [APP_IDS.ASSISTANT]: { id: APP_IDS.ASSISTANT, name: 'Assistant', icon: Search, color: 'indigo', component: AssistantApp, isSystem: true },
  [APP_IDS.BROWSER]: { id: APP_IDS.BROWSER, name: 'Shadow Surf', icon: Globe, color: 'blue', component: BrowserApp, isSystem: true },
  [APP_IDS.RADIO]: { id: APP_IDS.RADIO, name: 'World Radio', icon: Radio, color: 'violet', component: RadioApp, isSystem: true },
  [APP_IDS.FILES]: { id: APP_IDS.FILES, name: 'Files', icon: FileText, color: 'yellow', component: () => <PlaceholderApp title="File Manager" /> },
  [APP_IDS.MEDIA]: { id: APP_IDS.MEDIA, name: 'Media Player', icon: Music, color: 'pink', component: () => <PlaceholderApp title="Media Player" /> },
  // "Real" Apps (Web Wrappers)
  [APP_IDS.INSTAGRAM]: { id: APP_IDS.INSTAGRAM, name: 'Instagram', icon: Instagram, color: 'pink', component: BrowserApp, defaultUrl: 'https://instagram.com' },
  [APP_IDS.FACEBOOK]: { id: APP_IDS.FACEBOOK, name: 'Facebook', icon: Facebook, color: 'blue', component: BrowserApp, defaultUrl: 'https://facebook.com' },
  [APP_IDS.GMAIL]: { id: APP_IDS.GMAIL, name: 'Gmail', icon: Mail, color: 'red', component: BrowserApp, defaultUrl: 'https://gmail.com' },
  [APP_IDS.YOUTUBE]: { id: APP_IDS.YOUTUBE, name: 'YouTube', icon: Youtube, color: 'red', component: BrowserApp, defaultUrl: 'https://youtube.com' },
  [APP_IDS.SPOTIFY]: { id: APP_IDS.SPOTIFY, name: 'Spotify', icon: Music, color: 'green', component: BrowserApp, defaultUrl: 'https://open.spotify.com' },
};

export default function App() {
  const [appRegistry, setAppRegistry] = useState<Record<string, AppDefinition>>(DEFAULT_REGISTRY);

  const [installedApps, setInstalledApps] = useState<string[]>([
    APP_IDS.TERMINAL, 
    APP_IDS.STORE, 
    APP_IDS.SETTINGS,
    APP_IDS.BROWSER,
    APP_IDS.RADIO,
    APP_IDS.GMAIL
  ]);
  
  const [runningApps, setRunningApps] = useState<string[]>([]);
  const [minimizedApps, setMinimizedApps] = useState<string[]>([]);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<SystemSettings>({
    wallpaper: DEFAULT_WALLPAPER,
    darkMode: true,
    accentColor: 'blue',
    userName: 'user',
    hostname: 'cloud-os',
    isComputerMode: false,
    // Defaults for new settings
    iconSize: 'medium',
    gridDensity: 'comfortable',
    glassIntensity: 'medium',
    dockPosition: 'bottom',
    dockBehavior: 'always'
  });

  // --- Persistence Logic ---
  useEffect(() => {
    // Load persisted data on mount
    const savedApps = localStorage.getItem('installedApps');
    const savedCustomRegistry = localStorage.getItem('customRegistry');
    
    if (savedCustomRegistry) {
        try {
            const parsed = JSON.parse(savedCustomRegistry);
            // Rehydrate component references since JSON removed them
            const rehydrated: Record<string, AppDefinition> = {};
            Object.keys(parsed).forEach(key => {
                rehydrated[key] = {
                    ...parsed[key],
                    component: BrowserApp, // All custom web apps use the Browser wrapper
                    icon: Box // Generic icon
                };
            });
            setAppRegistry(prev => ({ ...prev, ...rehydrated }));
        } catch (e) {
            console.error("Failed to load custom apps", e);
        }
    }
    
    if (savedApps) {
        try {
            setInstalledApps(JSON.parse(savedApps));
        } catch (e) {
            console.error("Failed to load installed apps list", e);
        }
    }
  }, []);

  // Save installed apps whenever they change
  useEffect(() => {
      localStorage.setItem('installedApps', JSON.stringify(installedApps));
  }, [installedApps]);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Set CSS variable for glass effect
    const opacity = settings.glassIntensity === 'low' ? '0.98' : settings.glassIntensity === 'medium' ? '0.90' : '0.80';
    document.documentElement.style.setProperty('--window-bg', settings.darkMode ? `rgba(15, 23, 42, ${opacity})` : `rgba(255, 255, 255, ${opacity})`);
  }, [settings.darkMode, settings.glassIntensity]);

  const openApp = (id: string) => {
    if (!runningApps.includes(id)) {
      setRunningApps([...runningApps, id]);
    }
    // Restore if minimized
    if (minimizedApps.includes(id)) {
        setMinimizedApps(minimizedApps.filter(appId => appId !== id));
    }
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
    if (activeAppId === id) {
      setActiveAppId(null);
    }
  };

  const minimizeApp = (id: string) => {
      if (!minimizedApps.includes(id)) {
          setMinimizedApps([...minimizedApps, id]);
      }
      if (activeAppId === id) {
          setActiveAppId(null);
      }
  };

  const installApp = (id: string) => {
    if (!installedApps.includes(id)) {
      setInstalledApps([...installedApps, id]);
    }
  };

  const installCustomApp = (name: string, url: string) => {
      const id = `custom-${Date.now()}`;
      const newApp: AppDefinition = {
          id,
          name,
          icon: Box,
          color: 'indigo',
          component: BrowserApp,
          defaultUrl: url
      };
      
      // Update Registry (Memory)
      setAppRegistry(prev => {
          const updated: Record<string, AppDefinition> = { ...prev, [id]: newApp };
          
          // Persist Custom Registry (only simple data)
          const toSave: Record<string, any> = {};
          Object.values(updated).forEach((app: AppDefinition) => {
              if (app.id.startsWith('custom-')) {
                  // Strip component and icon function
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

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleComputerMode = () => {
      updateSettings({ isComputerMode: !settings.isComputerMode });
  };

  const handleHome = () => {
      const toMinimize = runningApps.filter(id => !minimizedApps.includes(id));
      setMinimizedApps([...minimizedApps, ...toMinimize]);
      setActiveAppId(null);
  };

  const myApps = installedApps.map(id => appRegistry[id]).filter(Boolean) as AppDefinition[];
  const allRegistryApps = Object.values(appRegistry).filter((a: AppDefinition) => !a.id.startsWith('custom-'));

  // Calculate Grid Classes based on settings
  const getGridCols = () => {
      if (settings.isComputerMode) return 'grid-cols-[repeat(auto-fill,minmax(80px,1fr))]';
      switch(settings.iconSize) {
          case 'small': return 'grid-cols-5 md:grid-cols-6 lg:grid-cols-8';
          case 'medium': return 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6';
          case 'large': return 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
          default: return 'grid-cols-4';
      }
  };

  const getIconSize = () => {
      if (settings.isComputerMode) return 28;
      switch(settings.iconSize) {
          case 'small': return 32; // md:40
          case 'medium': return 48; // md:56
          case 'large': return 64; // md:72
          default: return 48;
      }
  };

  const getIconContainerSize = () => {
      if (settings.isComputerMode) return 'w-14 h-14';
      switch(settings.iconSize) {
          case 'small': return 'w-12 h-12 md:w-14 md:h-14';
          case 'medium': return 'w-16 h-16 md:w-20 md:h-20';
          case 'large': return 'w-20 h-20 md:w-24 md:h-24';
          default: return 'w-16 h-16';
      }
  };

  // Adjust Grid margin based on dock position
  const getGridPadding = () => {
      if (!settings.isComputerMode) return 'pb-24'; // Mobile bottom dock space
      
      switch (settings.dockPosition) {
          case 'bottom': return 'pb-16';
          case 'left': return 'pl-16';
          case 'right': return 'pr-16';
          default: return 'pb-16';
      }
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-cover bg-center transition-all duration-700"
      style={{ backgroundImage: `url(${settings.wallpaper})` }}
    >
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

      <StatusBar isComputerMode={settings.isComputerMode} toggleMode={toggleComputerMode} />

      {/* Desktop Grid */}
      <div className={`absolute inset-0 pt-14 px-4 md:px-8 grid content-start transition-all overflow-y-auto
          ${getGridCols()}
          ${getGridPadding()}
          ${settings.isComputerMode ? 'grid-rows-[repeat(auto-fill,minmax(80px,1fr))]' : ''}
          ${settings.gridDensity === 'compact' ? 'gap-2' : 'gap-6'}
      `}>
        {myApps.map((app) => (
          <button
            key={app.id}
            onClick={() => openApp(app.id)}
            className={`flex flex-col items-center group p-2 rounded-xl hover:bg-white/10 transition-colors ${settings.gridDensity === 'compact' ? 'gap-1' : 'gap-2'}`}
          >
            <div className={`
              rounded-2xl flex items-center justify-center shadow-lg border border-white/10 transition-all duration-300 relative overflow-hidden
              ${settings.isComputerMode 
                 ? 'w-14 h-14 bg-slate-800/80 text-' + app.color + '-400' 
                 : `${getIconContainerSize()} bg-gradient-to-br from-slate-800 to-slate-900 text-${app.color}-400`
              }
              group-hover:scale-105 group-active:scale-95
            `}>
                {/* Glossy Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                <app.icon size={getIconSize()} />
            </div>
            <span className="text-xs text-white font-medium drop-shadow-md truncate w-full text-center bg-black/30 px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-white/5">
              {app.name}
            </span>
          </button>
        ))}
      </div>

      {/* Windows Layer */}
      {runningApps.map(appId => {
        const appDef = appRegistry[appId];
        if (!appDef) return null;
        const AppComp = appDef.component;
        let extraProps: any = { args: { url: appDef.defaultUrl } };

        if (appId === APP_IDS.SETTINGS) {
            extraProps = { settings, updateSettings };
        } else if (appId === APP_IDS.STORE) {
            extraProps = { availableApps: allRegistryApps, installedAppIds: installedApps, onInstall: installApp, onUninstall: uninstallApp, onInstallCustom: installCustomApp };
        } else if (appId === APP_IDS.BROWSER || appDef.component === BrowserApp) {
            // Pass wallpaper setter to Browser
            extraProps = { 
                args: { 
                    url: appDef.defaultUrl, 
                    onSetWallpaper: (url: string) => updateSettings({ wallpaper: url }) 
                } 
            };
        }

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