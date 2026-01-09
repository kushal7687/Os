import React, { useState, useEffect } from 'react';
import { AppProps } from '../../types';
import { 
    ArrowLeft, RotateCcw, Lock, Globe, MoreVertical, X, Plus, 
    Wifi, Search, Cpu, ShieldAlert, Eye
} from 'lucide-react';
import { simulateBrowserRequest } from '../../services/geminiService';

interface Tab {
    id: string;
    title: string;
    urlInput: string;
    activeUrl: string;
    loading: boolean;
    content: string | null; // null = iframe mode, string = AI render mode
    mode: 'iframe' | 'cloud_render';
}

export const BrowserApp: React.FC<AppProps> = ({ args, onClose, isHackerMode }) => {
    const [tabs, setTabs] = useState<Tab[]>([]);
    const [activeTabId, setActiveTabId] = useState<string>('');

    useEffect(() => {
        const initialUrl = args?.url || 'cloud://newtab';
        createNewTab(initialUrl);
    }, []);

    const createNewTab = (url: string) => {
        const id = `tab-${Date.now()}`;
        const isInternal = url.startsWith('cloud://');
        const newTab: Tab = {
            id,
            title: isInternal ? 'New Tab' : 'Loading...',
            urlInput: isInternal ? '' : url,
            activeUrl: url,
            loading: !isInternal,
            content: null,
            mode: 'cloud_render' // Default to Cloud Render for reliability
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(id);
        if (!isInternal) loadUrl(id, url);
    };

    const loadUrl = async (tabId: string, url: string) => {
        // Normalize URL
        let finalUrl = url;
        if (!url.startsWith('http') && !url.startsWith('cloud://')) {
            if (url.includes('.')) finalUrl = `https://${url}`;
            else finalUrl = `https://duckduckgo.com/?q=${encodeURIComponent(url)}`;
        }

        // Update Tab State
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, activeUrl: finalUrl, urlInput: finalUrl, loading: true, title: finalUrl } : t));

        const tab = tabs.find(t => t.id === tabId);
        const mode = tab?.mode || 'cloud_render';

        if (finalUrl.startsWith('cloud://')) {
            setTabs(prev => prev.map(t => t.id === tabId ? { ...t, loading: false, title: 'New Tab', content: null } : t));
            return;
        }

        if (mode === 'cloud_render') {
            // Use AI to render
            const html = await simulateBrowserRequest(finalUrl);
            setTabs(prev => prev.map(t => t.id === tabId ? { ...t, loading: false, content: html, title: finalUrl } : t));
        } else {
            // Iframe mode (Direct)
            setTabs(prev => prev.map(t => t.id === tabId ? { ...t, loading: false, content: null } : t));
        }
    };

    const activeTab = tabs.find(t => t.id === activeTabId);

    const closeTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== id);
        if (newTabs.length === 0) onClose();
        else {
            setTabs(newTabs);
            if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const toggleMode = () => {
        if (!activeTab) return;
        const newMode = activeTab.mode === 'iframe' ? 'cloud_render' : 'iframe';
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, mode: newMode } : t));
        loadUrl(activeTabId, activeTab.activeUrl);
    };

    if (!activeTab) return null;

    return (
        <div className={`h-full w-full flex flex-col ${isHackerMode ? 'bg-black text-green-500 font-mono' : 'bg-slate-900 text-slate-200'}`}>
            
            {/* Toolbar */}
            <div className={`h-14 flex items-center px-2 gap-2 border-b ${isHackerMode ? 'border-green-900 bg-black' : 'border-slate-800 bg-slate-950'}`}>
                <div className="flex gap-1">
                    <button onClick={() => {}} className={`p-2 rounded hover:bg-white/10 ${isHackerMode ? 'text-green-500' : 'text-slate-400'}`}>
                        <ArrowLeft size={16} />
                    </button>
                    <button onClick={() => loadUrl(activeTabId, activeTab.activeUrl)} className={`p-2 rounded hover:bg-white/10 ${isHackerMode ? 'text-green-500' : 'text-slate-400'}`}>
                        <RotateCcw size={16} />
                    </button>
                </div>

                {/* Omnibox */}
                <form 
                    className="flex-1"
                    onSubmit={(e) => { e.preventDefault(); loadUrl(activeTabId, activeTab.urlInput); }}
                >
                    <div className={`flex items-center px-3 py-1.5 rounded-md border ${isHackerMode ? 'bg-green-900/10 border-green-800' : 'bg-slate-900 border-slate-700'}`}>
                        {activeTab.mode === 'cloud_render' ? <Cpu size={14} className="mr-2 opacity-70" /> : <Globe size={14} className="mr-2 opacity-70" />}
                        <input 
                            className={`flex-1 bg-transparent outline-none text-sm ${isHackerMode ? 'text-green-400 placeholder-green-800' : 'text-slate-200 placeholder-slate-600'}`}
                            value={activeTab.urlInput}
                            onChange={(e) => setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, urlInput: e.target.value } : t))}
                            placeholder="Enter URL..."
                        />
                    </div>
                </form>

                {/* Mode Toggle */}
                <button 
                    onClick={toggleMode}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold border transition-colors
                    ${activeTab.mode === 'cloud_render' 
                        ? (isHackerMode ? 'bg-green-900/20 border-green-600 text-green-400' : 'bg-indigo-600 border-indigo-500 text-white')
                        : (isHackerMode ? 'border-green-900 text-green-700' : 'border-slate-700 text-slate-500')
                    }`}
                >
                    {activeTab.mode === 'cloud_render' ? 'NEURAL' : 'DIRECT'}
                </button>

                <button onClick={() => createNewTab('cloud://newtab')} className="p-2 hover:bg-white/10 rounded">
                    <Plus size={18} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 relative overflow-hidden bg-white">
                {activeTab.activeUrl === 'cloud://newtab' ? (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center ${isHackerMode ? 'bg-black' : 'bg-slate-900'}`}>
                        <div className={`p-6 rounded-full border-2 mb-6 ${isHackerMode ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-slate-700 text-slate-500 bg-slate-800'}`}>
                            <Globe size={48} />
                        </div>
                        <h1 className={`text-2xl font-bold mb-8 ${isHackerMode ? 'text-green-500 tracking-widest' : 'text-slate-300'}`}>
                            {isHackerMode ? 'SECURE_UPLINK_ESTABLISHED' : 'Cloud Browser'}
                        </h1>
                        <div className="flex flex-wrap justify-center gap-4">
                            {['Google', 'YouTube', 'GitHub', 'Reddit'].map(site => (
                                <button 
                                    key={site}
                                    onClick={() => loadUrl(activeTabId, site.toLowerCase() + '.com')}
                                    className={`px-6 py-3 rounded-lg border font-medium transition-all ${isHackerMode ? 'border-green-800 text-green-600 hover:bg-green-900/20' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    {site}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : activeTab.loading ? (
                    <div className={`absolute inset-0 flex flex-col items-center justify-center ${isHackerMode ? 'bg-black text-green-500' : 'bg-slate-900 text-white'}`}>
                        <div className="animate-spin w-8 h-8 border-4 border-current border-t-transparent rounded-full mb-4" />
                        <span className="font-mono text-sm">{isHackerMode ? 'DECRYPTING_PACKETS...' : 'Loading content...'}</span>
                    </div>
                ) : activeTab.mode === 'cloud_render' && activeTab.content ? (
                    <div className="h-full w-full overflow-auto bg-white text-black p-4">
                        <div dangerouslySetInnerHTML={{ __html: activeTab.content }} className="prose max-w-none" />
                    </div>
                ) : (
                    <iframe 
                        src={activeTab.activeUrl} 
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                )}
            </div>
            
            {/* Status Bar */}
            <div className={`h-6 flex items-center justify-between px-3 text-[10px] uppercase font-mono border-t ${isHackerMode ? 'bg-black border-green-900 text-green-700' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                <span>Mode: {activeTab.mode}</span>
                <span>Security: {isHackerMode ? 'MAXIMUM' : 'Standard'}</span>
            </div>
        </div>
    );
};