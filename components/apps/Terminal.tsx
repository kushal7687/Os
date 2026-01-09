import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { AppProps } from '../../types';
import { fs } from '../../services/fileSystem';
import { SimulatedShell } from '../../services/simulatedShell';
import { Terminal as TerminalIcon } from 'lucide-react';

interface Log {
  type: 'input' | 'output' | 'system' | 'error' | 'success';
  content: string | React.ReactNode;
}

export const TerminalApp: React.FC<AppProps> = ({ isFocused, onClose, isHackerMode }) => {
  const [history, setHistory] = useState<Log[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [booted, setBooted] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<SimulatedShell>(new SimulatedShell(fs));

  // Boot Sequence
  useEffect(() => {
    if (!booted) {
        const bootSequence = async () => {
            const lines = [
                { text: "Kali GNU/Linux Rolling kali tty1", delay: 100 },
                { text: "", delay: 100 },
                { text: "kali login: root", delay: 400 },
                { text: "Password: ", delay: 800 },
                { text: "\nLast login: " + new Date().toUTCString() + " from 192.168.1.1 on pts/0", delay: 200 },
                { text: "Linux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 2024.1", delay: 100 },
                { text: "", delay: 50 },
            ];
            
            for (const line of lines) {
                if (line.text.includes("Password")) {
                     await new Promise(r => setTimeout(r, 600));
                }
                setHistory(prev => [...prev, { type: 'system', content: line.text }]);
                await new Promise(r => setTimeout(r, line.delay));
            }
            setBooted(true);
        };
        bootSequence();
    }
  }, [booted]);

  // Focus
  useEffect(() => {
    if (isFocused && inputRef.current && booted) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isFocused, booted]);

  // Scroll Behavior - ONLY scroll when history actually changes to prevent jumping while typing
  useLayoutEffect(() => {
    if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history.length, loading, booted]); 

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
      } else if (e.key === 'Tab') {
          e.preventDefault();
          const parts = input.split(' ');
          const lastPart = parts[parts.length - 1];
          
          let options: string[] = [];
          if (parts.length === 1) {
             const bin = fs.resolvePath('/bin');
             const usrBin = fs.resolvePath('/usr/bin');
             if (bin?.children) options.push(...Object.keys(bin.children));
             if (usrBin?.children) options.push(...Object.keys(usrBin.children));
          }
          
          const currentDir = fs.current;
          if (currentDir.children) options.push(...Object.keys(currentDir.children));

          const matches = [...new Set(options)].filter(o => o.startsWith(lastPart));
          
          if (matches.length === 1) {
              parts[parts.length - 1] = matches[0];
              setInput(parts.join(' '));
          }
      } else if (e.key === 'c' && e.ctrlKey) {
          // Interrupt Signal
          setHistory(prev => [...prev, { type: 'input', content: (
             <div className="flex gap-2">
                 {getPromptDisplay()} <span className="opacity-50">{input}^C</span>
             </div>
          )}]);
          setInput('');
          // NOTE: We can't easily kill the async generator from here without an abort controller structure in the Shell class,
          // but clearing the input effectively resets the user loop.
          setLoading(false); 
      }
  };

  const executeCommand = async (inputStr: string) => {
    if (!inputStr.trim()) return;

    const originalInput = inputStr;
    setCommandHistory(prev => [...prev, originalInput]);
    setHistoryIndex(-1);
    setInput('');

    setHistory(prev => [
        ...prev, 
        { 
            type: 'input', 
            content: (
                <div className="flex flex-wrap gap-x-2 items-center">
                    {getPromptDisplay()} <span className="font-bold">{originalInput}</span>
                </div>
            )
        }
    ]);

    if (inputStr.trim().toLowerCase() === 'exit') {
        onClose();
        return;
    }

    setLoading(true);
    
    // Process async execution
    setTimeout(async () => {
        try {
            const generator = shellRef.current.execute(originalInput);
            
            for await (const line of generator) {
                if (line === 'CLEAR_SIGNAL') {
                    setHistory([]);
                } else {
                    setHistory(prev => [...prev, { type: 'output', content: line }]);
                }
            }
        } catch (e) {
            setHistory(prev => [...prev, { type: 'error', content: 'bash: system error: kernel panic' }]);
        } finally {
            setLoading(false);
        }
    }, 10);
  };

  const getPromptDisplay = () => {
     const path = fs.pwd().replace('/root', '~');
     return (
         <div className="inline-flex flex-wrap items-center gap-0 leading-tight whitespace-nowrap">
             <span className="text-blue-500 font-bold">┌──(</span>
             <span className="text-red-600 font-bold">root💀kali</span>
             <span className="text-blue-500 font-bold">)-[</span>
             <span className="text-white font-bold">{path}</span>
             <span className="text-blue-500 font-bold">]</span>
             <span className="w-full"></span> 
             <span className="text-blue-500 font-bold">└─</span>
             <span className="text-red-600 font-bold mr-2">#</span>
         </div>
     );
  };

  // Styles
  const bgColor = 'bg-[#0a0a0a]'; 
  const textColor = 'text-gray-300';
  
  return (
    <div 
        className={`h-full w-full ${bgColor} ${textColor} p-4 font-mono text-sm overflow-hidden relative cursor-text`} 
        onClick={() => inputRef.current?.focus()}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        .terminal-font { font-family: 'JetBrains Mono', monospace; }
        
        .scanlines {
            background: linear-gradient(
                to bottom,
                rgba(255,255,255,0),
                rgba(255,255,255,0) 50%,
                rgba(0,0,0,0.2) 50%,
                rgba(0,0,0,0.2)
            );
            background-size: 100% 4px;
        }
        
        .glow-text {
            text-shadow: 0 0 2px rgba(50, 255, 50, 0.2); 
        }

        .cmd-input {
            caret-color: #00ff00;
            outline: none;
            background: transparent;
            width: 100%;
            border: none;
            color: inherit;
            font-family: inherit;
            font-weight: bold;
            padding: 0;
            margin: 0;
        }
      `}</style>

      {/* CRT Effects */}
      <div className="absolute inset-0 scanlines opacity-10 pointer-events-none z-20"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30 pointer-events-none z-10"></div>

      {/* Main Content Scroll Container */}
      <div className="h-full w-full overflow-y-auto scrollbar-hide relative z-10 terminal-font glow-text pr-2">
        
        {!booted && (
             <div className="flex items-center justify-center h-full text-blue-500 opacity-50">
                <TerminalIcon size={64} />
             </div>
        )}

        {/* History Log */}
        {history.map((log, i) => (
          <div key={i} className={`mb-0.5 break-words leading-snug whitespace-pre-wrap ${
              log.type === 'error' ? 'text-red-500' : 
              log.type === 'success' ? 'text-green-400' :
              log.type === 'input' ? 'mt-2 mb-1 text-white' : 
              'text-gray-300'
          }`}>
            {log.content}
          </div>
        ))}
        
        {loading && (
            <div className="my-1">
                <span className="inline-block w-2 h-4 bg-gray-500 animate-pulse"></span>
            </div>
        )}

        {/* Prompt & Input Line (Active) */}
        {!loading && booted && (
            <div className="mt-2 flex flex-col md:flex-row md:items-center items-start">
                 <div className="shrink-0 mr-0">{getPromptDisplay()}</div>
                 <div className="flex-1 w-full relative">
                     <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') executeCommand(input);
                            handleKeyDown(e);
                        }}
                        className="cmd-input"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        autoFocus
                     />
                 </div>
            </div>
        )}
        
        {/* Invisible anchor to scroll to */}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};