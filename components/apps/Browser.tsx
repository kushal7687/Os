import React, { useState, useEffect, useRef } from 'react';
import { AppProps } from '../../types';
import { 
    ArrowLeft, ArrowRight, RotateCcw, Lock, Globe, Search, Plus, X, 
    ExternalLink, MoreVertical, Shield, AlertTriangle, Wifi, Server, 
    Settings, Eye, EyeOff, Ghost, Code, Terminal
} from 'lucide-react';

// --- Types ---
interface Tab {
    id: string;
    title: string;
    urlInput: string;
    activeUrl: string;
    history: string[];
    historyIndex: number;
    loading: boolean;
    mode: 'cloud' | 'direct' | 'tor';
    error?: boolean;
    securityLevel: 'standard' | 'high' | 'off';
}

export const BrowserApp: React.FC<AppProps> = ({ args, onClose }) => {
    // --- State ---
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>('');
    const [showMenu, setShowMenu] = useState(false);
    const [showSource, setShowSource] = useState(false);
    
    // --- Initialization ---
    useEffect(() => {
        const initialUrl = args?.url || 'cloud://newtab';
        const newTab = createTabObj(initialUrl);
        setTabs([newTab]);
        setActiveTabId(newTab.id);
    }, []); 

    // --- Helpers ---
    const createTabObj = (url: string): Tab => ({
        id: `tab-${Date.now()}-${Math.random()}`,
        title: 'New Session',
        urlInput: url === 'cloud://newtab' ? '' : url,
        activeUrl: url,
        history: [url],
        historyIndex: 0,
        loading: false,
        mode: 'direct', // Defaulting to direct connection as requested (no proxy)
        securityLevel: 'standard'
    });

    const getActiveTab = () => tabs.find(t => t.id === activeTabId);

    const updateTab = (id: string, updates: Partial<Tab>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    // --- URL Logic ---
    const navigate = (id: string, input: string) => {
        let url = input.trim();
        if (!url) return;

        // Internal Pages
        if (url === 'cloud://newtab') {
            updateTab(id, { activeUrl: url, urlInput: '', title: 'New Tab', loading: false, error: false, mode: 'direct' });
            return;
        }

        let mode: Tab['mode'] = 'direct';

        // Protocol & Domain Logic
        if (!url.startsWith('http') && !url.startsWith('cloud://')) {
            if (url.includes('.') && !url.includes(' ')) {
                if (url.endsWith('.onion')) {
                    url = `https://${url}`;
                    mode = 'tor';
                } else {
                    url = `https://${url}`;
                }
            } else {
                // Search Engine (DuckDuckGo Unfiltered)
                url = `https://duckduckgo.com/?q=${encodeURIComponent(url)}&ia=web`;
            }
        } else if (url.includes('.onion')) {
            mode = 'tor';
        }

        const currentTab = tabs.find(t => t.id === id);
        if (currentTab) {
            // Keep existing mode if user manually selected 'direct', unless switching to tor
            if (currentTab.mode === 'direct' && mode !== 'tor') mode = 'direct';
            
            const newHistory = [...currentTab.history.slice(0, currentTab.historyIndex + 1), url];
            updateTab(id, {
                activeUrl: url,
                urlInput: url,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                loading: true,
                error: false,
                mode: mode
            });
        }
    };

    const handleIframeLoad = (id: string) => {
        updateTab(id, { loading: false });
    };

    const handleIframeError = (id: string) => {
        updateTab(id, { loading: false, error: true });
    };

    // --- Renderers ---
    const renderContent = (tab: Tab) => {
        // 1. New Tab Page (Hacker/Linux Style)
        if (tab.activeUrl === 'cloud://newtab') {
            return (
                <div className="h-full w-full bg-[#0a0a0a] flex flex-col items-center justify-center text-green-500 font-mono relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                        style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(32, 255, 77, .1) 25%, rgba(32, 255, 77, .1) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .1) 75%, rgba(32, 255, 77, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(32, 255, 77, .1) 25%, rgba(32, 255, 77, .1) 26%, transparent 27%, transparent 74%, rgba(32, 255, 77, .1) 75%, rgba(32, 255, 77, .1) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }} 
                    />
                    
                    <div className="z-10 flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 border border-green-500/30 bg-green-500/5 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                            <Server size={40} />
                        </div>
                        
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold tracking-tighter">CLOUD OS <span className="text-xs align-top opacity-50">v3.0</span></h1>
                            <p className="text-xs text-green-500/60">Secure • Private • Tor Ready</p>
                        </div>

                        <div className="w-full max-w-lg px-6">
                            <form onSubmit={(e) => { e.preventDefault(); navigate(tab.id, (e.target as any).q.value); }} className="relative group">
                                <input 
                                    name="q"
                                    className="w-full bg-[#111] border border-green-500/20 text-green-400 placeholder-green-700/50 py-4 pl-12 pr-4 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/50 transition-all font-mono text-sm rounded-none"
                                    placeholder="> Enter URL or Search Query..."
                                    autoComplete="off"
                                    autoFocus
                                />
                                <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-green-700 group-focus-within:text-green-500" size={18} />
                            </form>
                        </div>

                        <div className="flex gap-6 mt-8">
                            {[
                                { n: 'DuckDuckGo', u: 'duckduckgo.com' },
                                { n: 'PornHub', u: 'pornhub.com' },
                                { n: 'Hidden Wiki', u: 'thehiddenwiki.org' },
                                { n: 'Instagram', u: 'instagram.com' },
                            ].map((l, idx) => (
                                <button 
                                    key={idx} 
                                    onClick={() => navigate(tab.id, l.u)} 
                                    className="text-xs text-green-600 hover:text-green-400 hover:underline uppercase tracking-widest"
                                >
                                    [{l.n}]
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="absolute bottom-4 right-4 flex flex-col items-end text-[10px] text-green-900 gap-1">
                        <div>ENCRYPTION: AES-256</div>
                        <div>NODE: LOCAL</div>
                        <div>STATUS: ONLINE</div>
                    </div>
                </div>
            );
        }

        // 2. Web Content Logic
        let finalUrl = tab.activeUrl;
        
        // Tor Routing
        if (tab.mode === 'tor' && finalUrl.includes('.onion')) {
            try {
                const urlObj = new URL(finalUrl);
                if (urlObj.hostname.endsWith('.onion')) {
                    urlObj.hostname = urlObj.hostname + '.ly'; // Tor2Web
                    finalUrl = urlObj.toString();
                }
            } catch (e) {
                if (finalUrl.includes('.onion') && !finalUrl.startsWith('http')) {
                    finalUrl = `https://${finalUrl}.ly`;
                }
            }
        }

        return (
            <div className="w-full h-full relative bg-[#1a1a1a]">
                {tab.loading && (
                    <div className="absolute inset-0 bg-[#0a0a0a] z-20 flex flex-col items-center justify-center font-mono">
                        <div className="flex items-center gap-3 text-green-500 mb-4">
                            <Server className="animate-pulse" size={24} />
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping delay-75" />
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping delay-150" />
                        </div>
                        <p className="text-green-500 text-xs uppercase tracking-widest mb-1">
                            {tab.mode === 'tor' ? 'Negotiating Onion Route...' : 'Connecting...'}
                        </p>
                        <p className="text-green-800 text-[10px]">{tab.activeUrl}</p>
                    </div>
                )}
                
                {tab.error ? (
                    <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center p-8 text-center font-mono">
                        <AlertTriangle size={48} className="text-red-500 mb-4" />
                        <h2 className="text-xl font-bold text-red-500 mb-2">CONNECTION_REFUSED</h2>
                        <p className="text-xs text-slate-500 max-w-md mb-6 border border-red-900/30 p-4 bg-red-900/10">
                            The destination server refused the connection. This often happens if the site blocks embedding (X-Frame-Options).
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => window.open(tab.activeUrl, '_blank')}
                                className="px-6 py-2 bg-red-600 text-black font-bold text-sm hover:bg-red-500"
                            >
                                FORCE_OPEN_EXTERNAL
                            </button>
                            <button 
                                onClick={() => navigate(tab.id, tab.activeUrl)}
                                className="px-6 py-2 border border-slate-700 text-slate-400 text-sm hover:bg-slate-800"
                            >
                                RETRY_PACKET
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <iframe 
                            src={finalUrl}
                            className={`w-full h-full border-0 bg-white ${showSource ? 'hidden' : 'block'}`}
                            title={tab.title}
                            onLoad={() => handleIframeLoad(tab.id)}
                            onError={() => handleIframeError(tab.id)}
                            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-pointer-lock allow-modals"
                        />
                        {/* Fake View Source Mode */}
                        {showSource && (
                            <div className="w-full h-full bg-[#1e1e1e] text-slate-300 font-mono text-xs p-4 overflow-auto whitespace-pre-wrap">
                                <div className="text-green-500 mb-2">// Source from: {tab.activeUrl}</div>
                                {`<!DOCTYPE html>
<html lang="en">
<!-- Connection Type: Direct/Tor -->
<!-- Security Level: ${tab.securityLevel} -->
<head>
    <meta charset="utf-8">
    <title>${tab.title}</title>
    ...
    [Standard HTTP Response]
    ...
</html>`}
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const active = getActiveTab();
    if (!active) return null;

    return (
        <div className="h-full w-full flex flex-col bg-[#0f0f0f] border border-slate-800 shadow-2xl overflow-hidden text-slate-200">
            {/* Chromium / Linux Toolbar */}
            <div className="h-14 bg-[#1a1a1a] flex items-center px-2 gap-2 shrink-0 border-b border-black">
                {/* Nav */}
                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => active.historyIndex > 0 && navigate(active.id, active.history[active.historyIndex - 1])}
                        disabled={active.historyIndex === 0}
                        className="p-2 hover:bg-white/10 rounded disabled:opacity-30"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <button 
                        onClick={() => navigate(active.id, active.activeUrl)}
                        className="p-2 hover:bg-white/10 rounded"
                    >
                        <RotateCcw size={14} className={active.loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-center px-2 h-8 bg-black/40 rounded border border-white/5 mr-1" title="Connection Mode">
                    {active.mode === 'tor' ? (
                        <Ghost size={14} className="text-purple-500" />
                    ) : (
                        <Globe size={14} className="text-blue-500" />
                    )}
                </div>

                {/* Omnibox */}
                <form 
                    className="flex-1"
                    onSubmit={(e) => { 
                        e.preventDefault(); 
                        navigate(active.id, active.urlInput); 
                    }}
                >
                    <div className={`h-9 flex items-center px-3 border transition-colors relative group
                        ${active.mode === 'tor' ? 'bg-[#1a0526] border-purple-900/50' : 'bg-[#0f0f0f] border-slate-800 group-hover:border-slate-600'}
                    `}>
                        {active.activeUrl.startsWith('https') && <Lock size={10} className="text-slate-500 mr-2" />}
                        <input 
                            className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none font-mono"
                            value={active.urlInput}
                            onChange={(e) => updateTab(active.id, { urlInput: e.target.value })}
                            onFocus={(e) => e.target.select()}
                            placeholder="url / search"
                        />
                        {active.mode === 'tor' && <span className="text-[9px] text-purple-500 font-bold px-1 tracking-wider">ONION_GW</span>}
                    </div>
                </form>

                {/* Menu */}
                <div className="relative">
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className={`p-2 rounded text-slate-400 transition-colors ${showMenu ? 'bg-slate-800 text-white' : 'hover:bg-white/5'}`}
                    >
                        <MoreVertical size={16} />
                    </button>

                    {showMenu && (
                        <div className="absolute top-full right-0 mt-2 w-64 bg-[#1a1a1a] border border-slate-800 shadow-2xl py-2 z-50 text-slate-200 animate-in fade-in slide-in-from-top-2 font-mono">
                             <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between border-b border-slate-800 mb-1">
                                 <span>Connection Settings</span>
                             </div>

                             <button 
                                onClick={() => { updateTab(active.id, { mode: 'direct' }); setShowMenu(false); navigate(active.id, active.activeUrl); }}
                                className="w-full text-left px-4 py-2 hover:bg-blue-900/20 flex items-center gap-3"
                             >
                                 <Globe size={14} className={active.mode === 'direct' ? 'text-blue-500' : 'text-slate-600'} />
                                 <div>
                                     <div className="text-xs font-bold text-slate-300">Direct Connect</div>
                                     <div className="text-[9px] text-slate-500">Standard HTTPS</div>
                                 </div>
                             </button>

                             <button 
                                onClick={() => { updateTab(active.id, { mode: 'tor' }); setShowMenu(false); navigate(active.id, active.activeUrl); }}
                                className="w-full text-left px-4 py-2 hover:bg-purple-900/20 flex items-center gap-3"
                             >
                                 <Ghost size={14} className={active.mode === 'tor' ? 'text-purple-500' : 'text-slate-600'} />
                                 <div>
                                     <div className="text-xs font-bold text-slate-300">Onion Gateway</div>
                                     <div className="text-[9px] text-slate-500">Tor2Web Routing</div>
                                 </div>
                             </button>

                             <div className="border-t border-slate-800 my-1" />
                             
                             <button 
                                onClick={() => { setShowSource(!showSource); setShowMenu(false); }}
                                className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-3 text-xs"
                             >
                                 <Code size={14} /> Toggle Source View
                             </button>

                             <button 
                                onClick={() => {
                                    const t = createTabObj('cloud://newtab');
                                    setTabs([...tabs, t]);
                                    setActiveTabId(t.id);
                                    setShowMenu(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center gap-3 text-xs"
                             >
                                 <Plus size={14} /> New Session
                             </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Bar (Desktop style) */}
            {tabs.length > 0 && (
                <div className="flex bg-[#0f0f0f] px-2 gap-px overflow-x-auto scrollbar-hide shrink-0 border-b border-black">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTabId(t.id)}
                            className={`
                                max-w-[140px] flex-1 py-1 px-3 text-[10px] font-medium flex items-center gap-2 truncate transition-colors border-r border-slate-800
                                ${t.id === activeTabId ? 'bg-[#1a1a1a] text-white' : 'bg-[#0f0f0f] text-slate-500 hover:bg-[#151515]'}
                            `}
                        >
                            <span className="truncate flex-1 text-left">{t.title}</span>
                            <div onClick={(e) => {
                                e.stopPropagation();
                                const rem = tabs.filter(x => x.id !== t.id);
                                setTabs(rem);
                                if(t.id === activeTabId && rem.length) setActiveTabId(rem[rem.length-1].id);
                                if(!rem.length) onClose();
                            }} className="hover:text-red-400"><X size={10} /></div>
                        </button>
                    ))}
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 relative bg-[#0a0a0a]">
                {tabs.map(t => (
                    <div key={t.id} className="absolute inset-0 w-full h-full" style={{ display: activeTabId === t.id ? 'block' : 'none' }}>
                        {renderContent(t)}
                    </div>
                ))}
            </div>
            
            {/* Linux Status Bar */}
            <div className="h-5 bg-[#0a0a0a] border-t border-slate-800 flex items-center px-2 justify-between text-[9px] text-slate-600 font-mono select-none">
                <div className="flex gap-3">
                    <span className="flex items-center gap-1"><Wifi size={8}/> CONNECTED</span>
                    <span>MEM: {Math.floor(Math.random() * 400 + 200)}MB</span>
                    <span>CPU: {Math.floor(Math.random() * 10 + 1)}%</span>
                </div>
                <div>CLOUD_OS_V3 :: {active.mode.toUpperCase()}</div>
            </div>
        </div>
    );
};