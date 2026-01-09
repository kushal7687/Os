import React, { useState, useRef, useEffect } from 'react';
import { AppProps } from '../../types';
import { generateTerminalResponse } from '../../services/geminiService';
import { fs } from '../../services/fileSystem';
import { Loader2, Terminal as TerminalIcon, Cpu, ShieldAlert, Wifi, Battery } from 'lucide-react';

interface Log {
  type: 'input' | 'output' | 'system' | 'error' | 'success';
  content: string | React.ReactNode;
}

const Typewriter: React.FC<{ text: string; speed?: number }> = ({ text, speed = 1 }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    // Instant render for long outputs to maintain "power user" speed
    if (text.length > 500) {
        setDisplayedText(text);
        return;
    }

    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};

export const TerminalApp: React.FC<AppProps> = ({ isFocused, onClose, isHackerMode }) => {
  const [history, setHistory] = useState<Log[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [booted, setBooted] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!booted) {
        const bootSequence = async () => {
            const lines = [
                "Initialising CloudOS Kernel v3.0.0...",
                "Loading drivers... [OK]",
                "Mounting virtual filesystem... [OK]",
                "Checking network interfaces... [OK]",
                "Establishing secure uplink... [CONNECTED]",
                "--------------------------------------------------",
                "WARNING: BROWSER SANDBOX ACTIVE",
                "Direct hardware access (Monitor Mode, RF Jamming) is",
                "restricted by modern browser security policies.",
                "Network tools will run in SIMULATION/EDUCATIONAL mode.",
                "--------------------------------------------------",
                "Welcome to CloudOS Shell. Type 'help' for commands.",
            ];
            
            for (const line of lines) {
                setHistory(prev => [...prev, { type: 'system', content: line }]);
                await new Promise(r => setTimeout(r, 150));
            }
            setBooted(true);
        };
        bootSequence();
    }
  }, [booted]);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (historyIndex < commandHistory.length - 1) {
              const newIndex = historyIndex + 1;
              setHistoryIndex(newIndex);
              setInput(commandHistory[commandHistory.length - 1 - newIndex]);
          }
      } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex > 0) {
              const newIndex = historyIndex - 1;
              setHistoryIndex(newIndex);
              setInput(commandHistory[commandHistory.length - 1 - newIndex]);
          } else if (historyIndex === 0) {
              setHistoryIndex(-1);
              setInput('');
          }
      } else if (e.key === 'c' && e.ctrlKey) {
          setHistory(prev => [...prev, { type: 'system', content: '^C' }]);
          setActiveTool(null);
          setInput('');
      }
  };

  const getRealSystemInfo = async () => {
      // Fetch actual browser environment data
      const nav = window.navigator as any;
      const battery = nav.getBattery ? await nav.getBattery() : null;
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

      return `
[SYSTEM INFO]
-------------------------
Platform: ${nav.platform}
User Agent: ${nav.userAgent}
Language: ${nav.language}
Cores: ${nav.hardwareConcurrency || 'Unknown'}
Memory: ${nav.deviceMemory ? nav.deviceMemory + ' GB' : 'Unknown'}
Online: ${nav.onLine ? 'YES' : 'NO'}
Connection: ${conn ? conn.effectiveType.toUpperCase() : 'Unknown'}
Battery: ${battery ? Math.round(battery.level * 100) + '%' : 'Unknown'} ${battery?.charging ? '(Charging)' : ''}
Resolution: ${window.innerWidth}x${window.innerHeight}
`;
  };

  const executeCommand = async (inputStr: string) => {
    if (!inputStr.trim()) return;

    const originalInput = inputStr;
    setCommandHistory(prev => [...prev, originalInput]);
    setHistoryIndex(-1);

    // --- 1. NLP TRANSLATION ---
    let processedCmd = inputStr;
    let nlpDetected = false;
    
    if (!activeTool) {
        const lower = inputStr.toLowerCase();
        
        // Translate "real" intent to simulated tools
        if (lower.match(/hack.*wifi|scan.*network|crack.*pass/)) {
            processedCmd = 'wifite'; 
            nlpDetected = true;
        } else if (lower.match(/jam|block.*signal/)) {
            processedCmd = 'blue-jam';
            nlpDetected = true;
        } else if (lower.match(/my.*ip|info|system/)) {
            processedCmd = 'sysinfo';
            nlpDetected = true;
        } else if (lower.match(/control.*device|monitor|gui|interface/)) {
            processedCmd = 'monitor';
            nlpDetected = true;
        }
    }

    setHistory(prev => [
        ...prev, 
        { 
            type: 'input', 
            content: (
                <div className="flex flex-col">
                    <div className="flex gap-2 items-center">
                        {getPromptDisplay()} <span className="font-bold">{originalInput}</span>
                    </div>
                    {nlpDetected && (
                        <div className="text-xs text-blue-400 flex items-center gap-1 mt-1 opacity-80">
                            <Cpu size={10} />
                            <span>Translating to shell: </span>
                            <span className="font-mono font-bold text-green-400">{processedCmd}</span>
                        </div>
                    )}
                </div>
            )
        }
    ]);
    setInput('');

    const args = processedCmd.trim().split(' ');
    const cmd = args[0].toLowerCase();
    const rest = args.slice(1).join(' ');

    // --- 2. LOCAL COMMANDS ---
    if (!activeTool) {
        if (cmd === 'clear') {
            setHistory([]);
            return;
        }
        if (cmd === 'exit') {
            onClose();
            return;
        }

        // GUI Launchers
        if (cmd === 'monitor' || cmd === 'netmon' || cmd === 'scan') {
             setHistory(prev => [...prev, { type: 'success', content: 'Launching Net Monitor GUI...' }]);
             // In a real OS this would spawn process, here we rely on user manually opening app or we could add a prop to auto open.
             // For now, we just tell them to open it or it simulates the launch text.
             setHistory(prev => [...prev, { type: 'system', content: '[TIP] Open "Net Monitor" from the app grid for GUI controls.' }]);
             return;
        }

        // Real System Info
        if (cmd === 'sysinfo' || cmd === 'ifconfig' || cmd === 'ip') {
            const info = await getRealSystemInfo();
            setHistory(prev => [...prev, { type: 'output', content: info }]);
            return;
        }
        
        // Educational Guides
        if (cmd === 'guide') {
            const topic = args[1] || 'wifi';
            let guideText = '';
            
            if (topic.includes('wifi')) {
                guideText = `
[EDUCATIONAL SIMULATION] WiFi Security Auditing
-----------------------------------------------
In a real environment (Kali Linux on bare metal), 'wifite' uses:
1. airmon-ng: Puts network card into MONITOR mode.
2. airodump-ng: Captures raw 802.11 packets.
3. aireplay-ng: Injects de-auth packets to force handshakes.

BROWSER LIMITATION:
Web browsers CANNOT access network cards in monitor mode.
They cannot inject raw packets. This tool simulates the output
of a successful audit for training purposes.
`;
            } else {
                guideText = "Usage: guide <wifi|jammer>\nExplains the real-world mechanics vs browser simulation.";
            }
            setHistory(prev => [...prev, { type: 'output', content: <Typewriter text={guideText} speed={0} /> }]);
            return;
        }

        if (['ls', 'pwd', 'cd', 'mkdir', 'rm', 'cat'].includes(cmd)) {
            let output = '';
            if (cmd === 'ls') output = fs.ls(rest);
            else if (cmd === 'pwd') output = fs.pwd();
            else if (cmd === 'cd') output = fs.cd(args[1] || '~') || '';
            else if (cmd === 'mkdir') fs.mkdir(fs.current, args[1] || 'new_dir');
            else if (cmd === 'rm') output = fs.rm(args[1] || '') || '';
            else if (cmd === 'cat') output = fs.readFile(args[1] || '') || `cat: ${args[1]}: No such file`;
            
            if (output) setHistory(prev => [...prev, { type: cmd === 'cd' || cmd === 'mkdir' ? 'error' : 'output', content: output }]);
            return;
        }

        // Tools
        if (cmd === 'wifite') {
             setActiveTool('wifite');
             setHistory(prev => [...prev, { type: 'output', content: 
`   .               .    
 .´  ·  .     .  ·  .  
 :  :  :  (¯)  :  :  : 
 .  ·  .  ' '  .  ·  . 
   '   '   wifite   '   ' 

 [!] SIMULATION MODE ENGAGED (Browser Sandbox)
 [!] Scanning for nearby networks (simulated)...
` }]);
             setTimeout(() => {
                 if (true) { 
                     setHistory(prev => [...prev, { type: 'output', content: 
` [+] found 3 targets (SIMULATED):
  NUM  ESSID              CH  ENCR  POWER  WPS?  CLIENT
  ---  -----------------  --  ----  -----  ----  ------
   1   NETGEAR-5G         11  WPA2  45db   no    2
   2   Starbucks_WiFi      6  OPEN  70db   no    15
   3   Xfinity_Home_34     1  WPA2  20db   yes   0

 [+] select target(s) (1-3) to simulate audit:` }]);
                 }
             }, 1500);
             return;
        }

        if (cmd === 'blue-jam') {
            setActiveTool('blue-jam');
            setHistory(prev => [...prev, { type: 'output', content: `[!] Hardware radio access denied (Browser Sandbox).\n[!] Starting VIRTUAL jammer for educational demonstration.\n[+] Hopping frequencies (Virtual)...` }]);
            return;
        }
    }

    // --- 3. AI EXECUTION (Simulated Logic) ---
    setLoading(true);
    const fsContext = fs.getAIContext();
    const previousLog = history.slice(-5).map(h => typeof h.content === 'string' ? h.content : '').join('\n');
    let promptContext = activeTool ? `[TOOL: ${activeTool}] ` : '';
    
    if (activeTool === 'wifite' && (cmd === '1' || cmd === '2' || cmd === '3')) {
        promptContext += `[USER SELECTED TARGET ${cmd}. GENERATE REALISTIC AUDIT LOG. SHOW HANDSHAKE CAPTURE.]`;
    }

    const response = await generateTerminalResponse(previousLog, promptContext + processedCmd, fsContext);
    setHistory(prev => [...prev, { type: 'output', content: <Typewriter text={response} speed={1} /> }]);
    setLoading(false);

    if (activeTool === 'wifite' && (response.includes('Key Found') || response.includes('Stopping'))) {
        setTimeout(() => {
            setActiveTool(null);
             setHistory(prev => [...prev, { type: 'system', content: '[+] Job complete. Returning to shell.' }]);
        }, 3000);
    }
  };

  const getPromptDisplay = () => {
     if (activeTool === 'wifite') return <span className="font-bold text-red-500">wifite &gt;</span>;
     if (activeTool === 'blue-jam') return <span className="font-bold text-blue-400">jam &gt;</span>;

     const path = fs.pwd().replace('/root', '~');
     return (
         <div className="inline-flex flex-col leading-none mb-0.5 whitespace-nowrap">
             <div className="flex">
                 <span className="text-blue-500 font-bold">┌──(</span>
                 <span className="text-red-500 font-bold">root💀kali</span>
                 <span className="text-blue-500 font-bold">)-[</span>
                 <span className="text-white font-bold">{path}</span>
                 <span className="text-blue-500 font-bold">]</span>
             </div>
             <div className="flex">
                 <span className="text-blue-500 font-bold">└─</span>
                 <span className="text-red-500 font-bold">#</span>
             </div>
         </div>
     );
  };

  const bgColor = isHackerMode ? 'bg-black' : 'bg-[#0d0d0d]';
  const textColor = isHackerMode ? 'text-green-500' : 'text-[#e0e0e0]';
  const glowClass = isHackerMode ? 'text-shadow-glow' : '';

  return (
    <div 
        className={`h-full w-full ${bgColor} ${textColor} p-2 font-mono text-sm overflow-hidden flex flex-col relative`} 
        onClick={() => inputRef.current?.focus()}
    >
      <style>{`
        .text-shadow-glow { text-shadow: 0 0 5px rgba(0, 255, 0, 0.5); }
        .scanline {
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
        }
      `}</style>

      {isHackerMode && <div className="absolute inset-0 scanline z-20 opacity-30"></div>}
      
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.05]">
          <TerminalIcon size={400} />
      </div>

      <div className={`flex-1 overflow-y-auto scrollbar-hide space-y-1 relative z-10 p-2 ${glowClass}`}>
        {history.map((log, i) => (
          <div key={i} className={`break-words leading-tight ${
              log.type === 'error' ? 'text-red-500 font-bold' : 
              log.type === 'success' ? 'text-green-400 font-bold' :
              log.type === 'input' ? 'mt-4 mb-2' : 
              isHackerMode ? 'text-green-500' : 'text-slate-300'
          }`}>
            {log.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 mt-2 opacity-80">
            <Loader2 className="animate-spin" size={14} />
            <span className="text-xs animate-pulse">KERNEL_PROCESSING...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      
      <div className={`mt-2 flex items-end p-2 rounded relative z-10 ${bgColor}`}>
        <div className="shrink-0 mb-1.5 mr-2">{getPromptDisplay()}</div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
              if (e.key === 'Enter') executeCommand(input);
              handleKeyDown(e);
          }}
          className={`flex-1 bg-transparent outline-none font-bold mb-1.5 min-w-[50px] ${textColor} ${glowClass}`}
          autoComplete="off"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
};