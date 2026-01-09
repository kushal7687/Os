import React, { useState, useRef, useEffect } from 'react';
import { AppProps } from '../../types';
import { generateTerminalResponse } from '../../services/geminiService';
import { fs } from '../../services/fileSystem';
import { Loader2 } from 'lucide-react';

interface Log {
  type: 'input' | 'output' | 'system' | 'error';
  content: string;
}

export const TerminalApp: React.FC<AppProps> = ({ isFocused, onClose }) => {
  const [history, setHistory] = useState<Log[]>([
    { type: 'system', content: 'CloudOS Kernel v2.1.0-stable loaded.' },
    { type: 'system', content: 'Initializing virtual environment...' },
    { type: 'system', content: 'Mounting VFS... OK' },
    { type: 'system', content: 'Starting shell...' },
    { type: 'system', content: '\n' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleCommand = async (cmdString: string) => {
    if (!cmdString.trim()) return;

    const newLog: Log = { type: 'input', content: cmdString };
    setHistory(prev => [...prev, newLog]);
    setInput('');

    const args = cmdString.trim().split(' ');
    const cmd = args[0].toLowerCase();
    const params = args.slice(1);

    try {
        if (cmd === 'clear') {
            setHistory([]);
            return;
        }
        if (cmd === 'exit') {
            onClose();
            return;
        }
        if (cmd === 'ls') {
            const output = fs.ls();
            setHistory(prev => [...prev, { type: 'output', content: output }]);
            return;
        }
        if (cmd === 'pwd') {
            setHistory(prev => [...prev, { type: 'output', content: fs.pwd() }]);
            return;
        }
        if (cmd === 'cd') {
            const err = fs.cd(params[0] || '~');
            if (err) setHistory(prev => [...prev, { type: 'error', content: err }]);
            return;
        }
        if (cmd === 'mkdir' || cmd === 'touch' || cmd === 'cat') {
            // ... (Same filesystem logic as before) ...
            if(cmd === 'mkdir' && params[0]) fs.mkdir(fs.current, params[0]);
            else if(cmd === 'touch' && params[0]) fs.touch(fs.current, params[0]);
            else if(cmd === 'cat' && params[0]) setHistory(prev => [...prev, { type: 'output', content: fs.cat(params[0]) }]);
            else setHistory(prev => [...prev, { type: 'error', content: `Usage: ${cmd} <name>` }]);
            return;
        }
        
        // --- NEW REAL COMMANDS ---
        if (cmd === 'date') {
            setHistory(prev => [...prev, { type: 'output', content: new Date().toString() }]);
            return;
        }
        if (cmd === 'uptime') {
            setHistory(prev => [...prev, { type: 'output', content: ` 12:34:56 up 1 day, 4:20,  1 user,  load average: 0.00, 0.01, 0.05` }]);
            return;
        }
        if (cmd === 'uname') {
            if (params[0] === '-a') {
                 setHistory(prev => [...prev, { type: 'output', content: 'Linux cloud-os 5.15.0-generic #42-Ubuntu SMP Fri Nov 10 12:00:00 UTC 2024 x86_64 GNU/Linux' }]);
            } else {
                 setHistory(prev => [...prev, { type: 'output', content: 'Linux' }]);
            }
            return;
        }
        if (cmd === 'top') {
             setHistory(prev => [...prev, { type: 'output', content: 
`top - ${new Date().toLocaleTimeString()} up 1 day,  1 user,  load average: 0.05, 0.03, 0.05
Tasks:  12 total,   1 running,  11 sleeping,   0 stopped,   0 zombie
%Cpu(s):  1.2 us,  0.5 sy,  0.0 ni, 98.2 id,  0.0 wa,  0.0 hi,  0.1 si,  0.0 st
MiB Mem :   8192.0 total,   4321.0 free,   2048.0 used,   1823.0 buff/cache
MiB Swap:      0.0 total,      0.0 free,      0.0 used.   5678.0 avail Mem 

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 root      20   0   12345   1234   1000 S   0.0   0.1   0:01.23 init
   42 user      20   0   54321   5432   2000 R   1.5   0.8   0:00.45 bash
  101 user      20   0   99999   8888   3000 S   0.5   1.2   0:12.34 chromium
` }]);
             return;
        }

        if (cmd === 'echo') {
            setHistory(prev => [...prev, { type: 'output', content: params.join(' ') }]);
            return;
        }
        if (cmd === 'whoami') {
            setHistory(prev => [...prev, { type: 'output', content: fs.user }]);
            return;
        }
        if (cmd === 'install' || cmd === 'sudo') {
             setLoading(true);
             setTimeout(() => {
                 setHistory(prev => [...prev, { type: 'output', content: `Reading package lists... Done\nBuilding dependency tree... Done\nInstalling package... \n[####################] 100%\nSuccessfully installed.` }]);
                 setLoading(false);
             }, 1500);
             return;
        }

    } catch (e: any) {
        setHistory(prev => [...prev, { type: 'error', content: `bash: error: ${e.message}` }]);
        return;
    }

    setLoading(true);
    const context = `Current Directory: ${fs.pwd()}\nLast History:\n${history.slice(-3).map(h => h.content).join('\n')}`;
    const aiResponse = await generateTerminalResponse(context, cmdString);
    setHistory(prev => [...prev, { type: 'output', content: aiResponse }]);
    setLoading(false);
  };

  const getPrompt = () => {
     const path = fs.pwd();
     const displayPath = path.startsWith('/home/' + fs.user) ? path.replace('/home/' + fs.user, '~') : path;
     return (
         <div className="flex whitespace-nowrap">
             <span className="text-green-500 font-bold drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">{fs.user}@cloud-os</span>
             <span className="text-slate-400">:</span>
             <span className="text-blue-400 font-bold drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">{displayPath}</span>
             <span className="text-slate-400 mr-2">$</span>
         </div>
     );
  };

  return (
    <div className="h-full w-full bg-[#0c0c0c] text-[#cccccc] p-4 font-mono text-sm overflow-hidden flex flex-col relative" onClick={() => inputRef.current?.focus()}>
      {/* CRT Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-10" 
           style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 2px, 3px 100%' }} />

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1 relative z-0">
        {history.map((log, i) => (
          <div key={i} className={`break-words ${log.type === 'error' ? 'text-red-500' : log.type === 'input' ? 'text-white mt-4 font-bold' : 'text-slate-300'}`}>
            {log.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-green-500 mt-2 animate-pulse">
            <Loader2 className="animate-spin" size={14} />
            <span>Processing...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      
      <div className="mt-2 flex items-center p-2 rounded relative z-0">
        {getPrompt()}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCommand(input);
            if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault();
                setHistory([]);
            }
          }}
          className="flex-1 bg-transparent outline-none text-white placeholder-slate-700 ml-2"
          autoComplete="off"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
};