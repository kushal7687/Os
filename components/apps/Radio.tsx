import React, { useState, useRef, useEffect } from 'react';
import { AppProps } from '../../types';
import { Radio as RadioIcon, Play, Pause, Volume2, Globe, Music2, Search, AlertCircle, MapPin } from 'lucide-react';

interface Station {
    stationuuid: string;
    name: string;
    url_resolved: string;
    homepage: string;
    tags: string;
    country: string;
    favicon: string;
    state: string; // country state
}

interface Country {
    name: string;
    iso_3166_1: string;
    stationcount: number;
}

// Reliable Fallbacks
const FALLBACK_STATIONS: Station[] = [
    { stationuuid: 'fb1', name: 'Lofi Girl Radio', url_resolved: 'https://play.streamafrica.net/lofiradio', homepage: '', tags: 'lofi,chill', country: 'France', favicon: 'https://i.scdn.co/image/ab67616d0000b273574945789f6606f71d53347b', state: '' },
    { stationuuid: 'fb2', name: 'Nightwave Plaza', url_resolved: 'https://radio.plaza.one/mp3', homepage: '', tags: 'vaporwave', country: 'Virtual', favicon: 'https://plaza.one/img/cover.jpg', state: '' },
    { stationuuid: 'fb3', name: 'BBC World Service', url_resolved: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service', homepage: '', tags: 'news', country: 'UK', favicon: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/BBC_World_Service_2022.svg', state: '' },
];

export const RadioApp: React.FC<AppProps> = () => {
    // State
    const [viewMode, setViewMode] = useState<'stations' | 'countries'>('stations');
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Data
    const [stations, setStations] = useState<Station[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [currentStation, setCurrentStation] = useState<Station | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null); // If filtering by country

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- INIT ---
    useEffect(() => {
        // Load top stations initially
        loadTopStations();
    }, []);

    // --- API CALLS ---

    const loadTopStations = async () => {
        setLoading(true);
        setViewMode('stations');
        setSelectedCountry(null);
        try {
            const res = await fetch('https://de1.api.radio-browser.info/json/stations/search?limit=40&order=clickcount&reverse=true&is_https=true&tag=music');
            const data = await res.json();
            setStations(data.length ? data : FALLBACK_STATIONS);
            if (!currentStation && data.length) setCurrentStation(data[0]);
        } catch (e) {
            setStations(FALLBACK_STATIONS);
        } finally {
            setLoading(false);
        }
    };

    const loadCountries = async () => {
        setLoading(true);
        setViewMode('countries');
        try {
            // Get countries with at least 10 stations
            const res = await fetch('https://de1.api.radio-browser.info/json/countries?order=stationcount&reverse=true');
            const data = await res.json();
            setCountries(data.filter((c: Country) => c.stationcount > 10));
        } catch (e) {
            setError('Could not load country list.');
        } finally {
            setLoading(false);
        }
    };

    const loadStationsByCountry = async (countryCode: string, countryName: string) => {
        setLoading(true);
        setViewMode('stations');
        setSelectedCountry(countryName);
        try {
            const res = await fetch(`https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/${countryCode}?limit=50&order=clickcount&reverse=true&is_https=true`);
            const data = await res.json();
            setStations(data);
        } catch (e) {
            setError(`Failed to load stations for ${countryName}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const term = searchTerm.trim();
        if (!term) return;

        setLoading(true);
        setViewMode('stations');
        setSelectedCountry(`Search: "${term}"`);
        setError('');
        setStations([]); // Clear previous results immediately

        const q = encodeURIComponent(term);
        const limit = 40; 

        try {
            // Parallel search: By Country (Primary), By Name (Secondary), By Tag (Tertiary)
            const [countryRes, nameRes, tagRes] = await Promise.all([
                fetch(`https://de1.api.radio-browser.info/json/stations/search?country=${q}&limit=${limit}&order=clickcount&reverse=true&is_https=true`).then(r => r.json()).catch(() => []),
                fetch(`https://de1.api.radio-browser.info/json/stations/search?name=${q}&limit=${limit}&order=clickcount&reverse=true&is_https=true`).then(r => r.json()).catch(() => []),
                fetch(`https://de1.api.radio-browser.info/json/stations/search?tag=${q}&limit=${limit}&order=clickcount&reverse=true&is_https=true`).then(r => r.json()).catch(() => [])
            ]);

            // Combine and Deduplicate (Prioritizing Country matches)
            const allRaw = [...countryRes, ...nameRes, ...tagRes];
            const seen = new Set();
            const uniqueStations: Station[] = [];
            
            for (const s of allRaw) {
                if (!seen.has(s.stationuuid)) {
                    seen.add(s.stationuuid);
                    uniqueStations.push(s);
                }
            }

            if (uniqueStations.length === 0) {
                setError(`No stations found for "${term}".`);
            } else {
                setStations(uniqueStations);
            }
        } catch (err) {
            // console.error(err);
            setError('Search failed. Check connection.');
        } finally {
            setLoading(false);
        }
    };

    // --- PLAYER LOGIC ---

    const togglePlay = () => {
        if (!audioRef.current || !currentStation) return;
        
        if (playing) {
            audioRef.current.pause();
            setPlaying(false);
        } else {
            const p = audioRef.current.play();
            if (p !== undefined) {
                p.then(() => setPlaying(true)).catch((e) => {
                    // Ignore abort errors caused by rapid toggling
                    if (e.name === 'AbortError') return;
                    setError('Stream error. Try another.');
                    setPlaying(false);
                });
            }
        }
    };

    const playStation = (s: Station) => {
        setCurrentStation(s);
        setPlaying(false);
        setError('');
        
        // Small timeout to allow audio tag src update
        setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.load();
                const playPromise = audioRef.current.play();
                
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => setPlaying(true))
                        .catch((e) => {
                            if (e.name === 'AbortError') {
                                // Expected when switching stations rapidly
                                return; 
                            }
                            // Do not console.error(e) here to avoid circular structure issues in some consoles
                            if (e.name === 'NotAllowedError') {
                                setError('Click play to start.');
                            } else {
                                setError('Stream unavailable/Offline.');
                            }
                            setPlaying(false);
                        });
                }
            }
        }, 100);
    };

    // Volume Control
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    return (
        <div className="h-full w-full bg-slate-950 text-white flex flex-col font-sans select-none">
            
            {/* 1. HEADER & SEARCH */}
            <div className="h-16 bg-gradient-to-r from-violet-900 via-slate-900 to-slate-900 flex items-center px-4 gap-4 shrink-0 z-20 shadow-xl border-b border-white/5">
                <div className="bg-violet-600 p-2 rounded-lg shadow-lg shadow-violet-500/20">
                    <RadioIcon size={20} className="text-white" />
                </div>
                
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search stations, countries..."
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-full py-1.5 pl-9 pr-4 text-sm focus:border-violet-500 outline-none transition-all placeholder-slate-500 focus:bg-slate-800"
                    />
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </form>
            </div>

            {/* 2. VISUALIZER / INFO (Top Half) */}
            <div className="relative h-[40%] min-h-[200px] shrink-0 bg-slate-900 overflow-hidden flex flex-col items-center justify-center text-center p-6">
                {/* Dynamic BG */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl transition-all duration-1000 scale-110"
                    style={{ backgroundImage: currentStation?.favicon ? `url(${currentStation.favicon})` : 'none' }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 to-slate-950" />

                <div className="z-10 flex flex-col items-center max-w-full">
                    <div className="relative group">
                        <div className={`w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-slate-800 shadow-2xl border-4 border-slate-800/50 flex items-center justify-center overflow-hidden mb-6 transition-all duration-500 ${playing ? 'scale-105 shadow-violet-500/20' : ''}`}>
                            {currentStation?.favicon ? (
                                <img src={currentStation.favicon} alt="Logo" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLElement).style.display = 'none'} />
                            ) : (
                                <Music2 size={48} className="text-slate-600" />
                            )}
                            
                            {/* Animated Bars */}
                            {playing && (
                                <div className="absolute inset-0 bg-black/20 flex items-end justify-center gap-1 pb-2">
                                    {[1,2,3,4,5].map(i => (
                                        <div key={i} className="w-1.5 bg-white shadow-[0_0_10px_white] animate-[bounce_0.6s_infinite]" style={{ animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold truncate max-w-md drop-shadow-md mb-1">{currentStation?.name || "Select a Station"}</h1>
                    
                    <div className="flex items-center gap-2 text-violet-300 text-sm font-medium bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
                        <Globe size={12} />
                        <span>{currentStation?.country || "Global"}</span>
                        {currentStation?.state && <span className="text-slate-500">• {currentStation.state}</span>}
                    </div>

                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-500/20 text-xs animate-in slide-in-from-bottom-2">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. NAVIGATION TABS */}
            <div className="h-10 shrink-0 flex items-center bg-slate-950 border-b border-slate-800 px-4 gap-2">
                <button 
                    onClick={loadTopStations}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${viewMode === 'stations' && !selectedCountry ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5'}`}
                >
                    Featured
                </button>
                <button 
                    onClick={loadCountries}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors ${viewMode === 'countries' ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5'}`}
                >
                    Countries
                </button>
                {selectedCountry && (
                    <div className="flex items-center gap-1 text-xs text-violet-400 font-bold ml-auto animate-in fade-in">
                        <MapPin size={12} />
                        <span className="truncate max-w-[120px]">{selectedCountry}</span>
                    </div>
                )}
            </div>

            {/* 4. MAIN CONTENT (List or Grid) */}
            <div className="flex-1 overflow-y-auto bg-slate-950 scrollbar-hide">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs tracking-widest uppercase">Tuning frequencies...</span>
                    </div>
                ) : viewMode === 'countries' ? (
                    // COUNTRY GRID
                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {countries.map((c) => (
                            <button 
                                key={c.iso_3166_1}
                                onClick={() => loadStationsByCountry(c.iso_3166_1, c.name)}
                                className="bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800 p-3 rounded-xl flex items-center gap-3 transition-all group text-left"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg shadow-inner">
                                    <span className="opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform">🌍</span>
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm text-slate-200 truncate">{c.name}</div>
                                    <div className="text-[10px] text-slate-500">{c.stationcount} Stations</div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    // STATION LIST
                    <div className="flex flex-col">
                        {stations.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">No stations found. Try a broader search.</div>
                        ) : (
                            stations.map((s, i) => (
                                <button
                                    key={s.stationuuid + i}
                                    onClick={() => playStation(s)}
                                    className={`flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
                                        currentStation?.stationuuid === s.stationuuid ? 'bg-white/5 border-l-4 border-l-violet-500' : 'border-l-4 border-l-transparent'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative shadow-sm">
                                        {s.favicon ? (
                                            <img src={s.favicon} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLElement).style.display='none'} />
                                        ) : <RadioIcon size={16} className="text-slate-600" />}
                                        
                                        {/* Overlay Play Icon if Active */}
                                        {currentStation?.stationuuid === s.stationuuid && playing && (
                                            <div className="absolute inset-0 bg-violet-600/80 flex items-center justify-center backdrop-blur-[1px]">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 text-left min-w-0">
                                        <div className={`text-sm font-semibold truncate ${currentStation?.stationuuid === s.stationuuid ? 'text-violet-300' : 'text-slate-200'}`}>
                                            {s.name}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                                            <span>{s.country}</span>
                                            {s.tags && <span className="opacity-50">• {s.tags.split(',').slice(0, 2).join(', ')}</span>}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* 5. FOOTER PLAYER */}
            <div className="h-20 bg-slate-900 border-t border-white/10 shrink-0 flex items-center px-6 gap-6 z-30">
                <button 
                    onClick={togglePlay}
                    disabled={!currentStation}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:grayscale ${
                        playing ? 'bg-violet-500 text-white shadow-violet-500/40' : 'bg-white text-slate-900'
                    }`}
                >
                    {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        {playing ? <span className="text-green-400 animate-pulse">● LIVE ON AIR</span> : "READY TO PLAY"}
                    </div>
                    <div className="text-sm font-medium text-white truncate">
                        {currentStation?.name || "Select a station"}
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2 w-32 group">
                    <Volume2 size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                    />
                </div>
            </div>

            {/* Hidden Audio Element */}
            <audio 
                ref={audioRef} 
                src={currentStation?.url_resolved || undefined} 
                crossOrigin="anonymous"
                onError={() => {
                    // Do NOT log the 'e' object
                    setError('Connection lost or format unsupported.');
                    setPlaying(false);
                }}
                onEnded={() => setPlaying(false)}
            />
        </div>
    );
};