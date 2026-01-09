import React, { useState, useEffect, useRef } from 'react';
import { AppProps } from '../../types';
import { Map, Activity, Bluetooth, Wifi, Navigation, Shield, Zap, Signal, Globe, Cpu } from 'lucide-react';

interface Telemetry {
    lat: number;
    lng: number;
    accuracy: number;
    heading: number | null;
    speed: number | null;
    altitude: number | null;
}

interface ConnectionStats {
    type: string;
    rtt: number;
    downlink: number;
}

export const MonitorApp: React.FC<AppProps> = ({ isHackerMode }) => {
    const [activeTab, setActiveTab] = useState<'status' | 'env' | 'comms'>('status');
    const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
    const [connStats, setConnStats] = useState<ConnectionStats>({ type: 'unknown', rtt: 0, downlink: 0 });
    const [pairedDevices, setPairedDevices] = useState<any[]>([]);
    
    // --- 1. REAL SENSOR FUSION ---
    useEffect(() => {
        // Geolocation
        if (navigator.geolocation) {
            const id = navigator.geolocation.watchPosition(
                (pos) => {
                    setTelemetry({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        heading: pos.coords.heading,
                        speed: pos.coords.speed,
                        altitude: pos.coords.altitude
                    });
                },
                (err) => console.warn("GPS Denied"),
                { enableHighAccuracy: true, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(id);
        }
    }, []);

    // Network Information API
    useEffect(() => {
        const updateConn = () => {
            const nav = navigator as any;
            if (nav.connection) {
                setConnStats({
                    type: nav.connection.effectiveType || '4g',
                    rtt: nav.connection.rtt || 0,
                    downlink: nav.connection.downlink || 0
                });
            }
        };
        updateConn();
        const nav = navigator as any;
        if (nav.connection) {
            nav.connection.addEventListener('change', updateConn);
            return () => nav.connection.removeEventListener('change', updateConn);
        }
    }, []);

    // --- 2. AUTHORIZED HARDWARE ACCESS ---
    const requestBluetooth = async () => {
        try {
            // Browser Security: Must be triggered by user gesture
            // Browser Security: Only shows devices in pairing mode
            const device = await (navigator as any).bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service']
            });
            setPairedDevices(prev => [...prev, device]);
        } catch (e) {
            console.log("BLE Pairing Cancelled or Not Supported");
        }
    };

    const bgColor = isHackerMode ? 'bg-black' : 'bg-slate-950';
    const textColor = isHackerMode ? 'text-green-500' : 'text-slate-200';
    const borderColor = isHackerMode ? 'border-green-900' : 'border-slate-800';

    return (
        <div className={`h-full w-full flex flex-col font-mono ${bgColor} ${textColor} select-none`}>
            
            {/* Header */}
            <div className={`h-14 flex items-center justify-between px-4 border-b ${borderColor} bg-opacity-50 backdrop-blur-md`}>
                <div className="flex items-center gap-2">
                    <Shield className={isHackerMode ? 'animate-pulse text-green-500' : 'text-blue-500'} size={20} />
                    <div>
                        <div className="font-bold text-sm tracking-widest">FIELD_OPS_DASHBOARD</div>
                        <div className="text-[9px] opacity-60">UNIT: {isHackerMode ? 'CYBER_BURO_01' : 'LOCAL_01'}</div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-bold">{telemetry ? 'GPS LOCK: ACTIVE' : 'GPS: SEARCHING'}</div>
                    <div className="text-[9px] opacity-60">{new Date().toLocaleTimeString()}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 text-[10px] md:text-xs">
                <button onClick={() => setActiveTab('status')} className={`flex-1 py-3 font-bold border-r border-white/5 ${activeTab === 'status' ? 'bg-white/5' : 'opacity-50'}`}>STATUS</button>
                <button onClick={() => setActiveTab('env')} className={`flex-1 py-3 font-bold border-r border-white/5 ${activeTab === 'env' ? 'bg-white/5' : 'opacity-50'}`}>ENVIRONMENT</button>
                <button onClick={() => setActiveTab('comms')} className={`flex-1 py-3 font-bold ${activeTab === 'comms' ? 'bg-white/5' : 'opacity-50'}`}>COMMS</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* --- TAB: SYSTEM STATUS --- */}
                {activeTab === 'status' && (
                    <>
                        <div className={`p-4 rounded border ${borderColor} bg-opacity-20`}>
                            <h3 className="text-xs font-bold uppercase mb-4 flex items-center gap-2">
                                <Cpu size={14} /> Local Diagnostics
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <div className="opacity-50 mb-1">NETWORK LATENCY</div>
                                    <div className="text-lg font-bold">{connStats.rtt} ms</div>
                                </div>
                                <div>
                                    <div className="opacity-50 mb-1">DOWNLINK SPEED</div>
                                    <div className="text-lg font-bold">{connStats.downlink} Mbps</div>
                                </div>
                                <div>
                                    <div className="opacity-50 mb-1">CONNECTION TYPE</div>
                                    <div className="text-lg font-bold uppercase">{connStats.type}</div>
                                </div>
                                <div>
                                    <div className="opacity-50 mb-1">CORES / MEMORY</div>
                                    <div className="text-lg font-bold">{navigator.hardwareConcurrency} / {(navigator as any).deviceMemory || '?'}GB</div>
                                </div>
                            </div>
                        </div>

                         <div className={`p-4 rounded border ${borderColor} bg-opacity-20`}>
                            <h3 className="text-xs font-bold uppercase mb-4 flex items-center gap-2">
                                <Activity size={14} /> Security Status
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="opacity-70">BROWSER SANDBOX</span>
                                    <span className="text-green-500 font-bold">ENFORCED</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="opacity-70">HTTPS ENCRYPTION</span>
                                    <span className="text-green-500 font-bold">{window.location.protocol === 'https:' ? 'ACTIVE' : 'INACTIVE'}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* --- TAB: ENVIRONMENT (GPS) --- */}
                {activeTab === 'env' && (
                    <div className={`h-full flex flex-col rounded border ${borderColor} overflow-hidden relative`}>
                        <div className="absolute inset-0 bg-black opacity-50" 
                             style={{backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px'}} />
                        
                        <div className="relative z-10 p-4 space-y-4 text-xs">
                            <div className="flex items-center gap-2 text-lg font-bold">
                                <Navigation size={20} className={telemetry ? 'text-blue-500' : 'animate-pulse text-yellow-500'} />
                                <span>{telemetry ? 'COORDINATES ACQUIRED' : 'TRIANGULATING...'}</span>
                            </div>
                            
                            {telemetry && (
                                <div className="space-y-2 font-mono">
                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                        <span>LATITUDE</span>
                                        <span>{telemetry.lat.toFixed(6)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                        <span>LONGITUDE</span>
                                        <span>{telemetry.lng.toFixed(6)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                        <span>ALTITUDE</span>
                                        <span>{telemetry.altitude ? telemetry.altitude.toFixed(1) + 'm' : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-1">
                                        <span>ACCURACY</span>
                                        <span>±{telemetry.accuracy.toFixed(1)}m</span>
                                    </div>
                                    <div className="flex justify-between pb-1">
                                        <span>SPEED</span>
                                        <span>{telemetry.speed ? (telemetry.speed * 3.6).toFixed(1) + ' km/h' : 'STATIONARY'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Radar Visual */}
                        <div className="absolute bottom-4 right-4 w-24 h-24 border-2 border-green-500/30 rounded-full flex items-center justify-center animate-pulse">
                            <div className="w-1 h-1 bg-green-500 rounded-full" />
                            <div className="absolute inset-0 border border-green-500/10 rounded-full animate-ping" />
                        </div>
                    </div>
                )}

                {/* --- TAB: COMMS (BLUETOOTH) --- */}
                {activeTab === 'comms' && (
                    <div className="space-y-4">
                        <button 
                            onClick={requestBluetooth}
                            className={`w-full py-4 border-2 border-dashed ${isHackerMode ? 'border-green-800 hover:bg-green-900/20' : 'border-slate-700 hover:bg-slate-800'} rounded-lg flex flex-col items-center justify-center gap-2 transition-all`}
                        >
                            <Bluetooth size={24} />
                            <span className="text-xs font-bold">INITIATE DEVICE PAIRING</span>
                            <span className="text-[9px] opacity-50">SCANS FOR DEVICES IN PAIRING MODE</span>
                        </button>

                        <div className="space-y-2">
                            <div className="text-xs font-bold opacity-50 uppercase">Paired Devices ({pairedDevices.length})</div>
                            {pairedDevices.length === 0 ? (
                                <div className="text-center p-4 opacity-30 text-xs">No authorized devices connected.</div>
                            ) : (
                                pairedDevices.map((d, i) => (
                                    <div key={i} className={`p-3 rounded border ${borderColor} flex items-center justify-between`}>
                                        <div className="flex items-center gap-3">
                                            <Bluetooth size={16} />
                                            <span className="font-bold text-sm">{d.name || 'Unknown Device'}</span>
                                        </div>
                                        <div className="text-[9px] bg-green-500/20 text-green-500 px-2 py-1 rounded">CONNECTED</div>
                                    </div>
                                ))
                            )}
                        </div>
                        
                        <div className={`p-3 rounded text-[10px] leading-relaxed border ${borderColor} bg-opacity-20 opacity-70`}>
                            <p className="mb-2 font-bold"><Shield size={10} className="inline mr-1"/> SECURITY PROTOCOL:</p>
                            Browser security policy restricts access to unauthorized hardware. Only devices that physically accept the pairing request can be accessed.
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
