import React, { useState } from 'react';
import { AppProps, AppDefinition } from '../../types';
import { Cloud, Download, Check, Globe, Plus, Instagram, Facebook, Mail, Youtube, Music } from 'lucide-react';
import { APP_IDS } from '../../constants';

interface StoreProps extends AppProps {
  availableApps: AppDefinition[];
  installedAppIds: string[];
  onInstall: (appId: string) => void;
  onUninstall: (appId: string) => void;
  onInstallCustom: (name: string, url: string) => void;
}

export const StoreApp: React.FC<StoreProps> = ({ availableApps, installedAppIds, onInstall, onUninstall, onInstallCustom }) => {
  const [tab, setTab] = useState<'store' | 'web'>('store');
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  // Apps that are already in the registry but we want to highlight or "fake install" via the store logic in App.tsx
  const featuredApps = availableApps.filter(a => !a.isSystem && !a.id.startsWith('custom-'));

  return (
    <div className="h-full w-full bg-slate-900 text-slate-100 flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10 flex gap-4">
        <button 
            onClick={() => setTab('store')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'store' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}
        >
            App Store
        </button>
        <button 
            onClick={() => setTab('web')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${tab === 'web' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}
        >
            Custom Web App
        </button>
      </div>

      {tab === 'store' ? (
        <div className="p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-slate-200">Featured Apps</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredApps.map((app) => {
                const isInstalled = installedAppIds.includes(app.id);
                return (
                    <div key={app.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-4 hover:bg-slate-800/60 hover:border-slate-600 transition-all duration-300 shadow-sm hover:shadow-xl">
                    <div className="flex items-start justify-between">
                        <div className={`p-3.5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-${app.color}-400 shadow-inner`}>
                        <app.icon size={28} />
                        </div>
                        {isInstalled ? (
                        <button 
                            onClick={() => app.isSystem ? null : onUninstall(app.id)}
                            className="px-4 py-1.5 rounded-full bg-slate-700/50 text-slate-400 text-xs font-medium hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        >
                            Uninstall
                        </button>
                        ) : (
                        <button 
                            onClick={() => onInstall(app.id)}
                            className="px-4 py-1.5 rounded-full bg-sky-500 text-white hover:bg-sky-400 text-xs font-medium flex items-center gap-1 transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                        >
                            <Download size={14} />
                            Install
                        </button>
                        )}
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-lg">{app.name}</h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {app.id === 'instagram' ? 'Connect with friends, share photos and videos.' : 
                             app.id === 'facebook' ? 'Connect with friends, family and other people you know.' :
                             app.id === 'gmail' ? 'Secure, smart, and easy to use email.' :
                             'Official web application for CloudOS.'}
                        </p>
                    </div>
                    </div>
                );
                })}
            </div>
        </div>
      ) : (
        <div className="p-8 flex flex-col items-center justify-center h-full">
            <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-indigo-500/20 text-indigo-400 rounded-2xl">
                        <Globe size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Web Installer</h2>
                        <p className="text-sm text-slate-400">Turn any website into an app.</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">App Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600"
                            placeholder="e.g. Discord"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Website URL</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-600"
                            placeholder="https://discord.com/app"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => {
                            if(customName && customUrl) {
                                onInstallCustom(customName, customUrl);
                                setCustomName('');
                                setCustomUrl('');
                                alert('App installed to home screen!');
                            }
                        }}
                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-4 active:scale-[0.98]"
                    >
                        <Plus size={18} /> Install App
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};