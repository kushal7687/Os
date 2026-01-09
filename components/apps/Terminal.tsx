import React, { useState, useRef, useEffect } from 'react';
import { AppProps } from '../../types';
import { fs } from '../../services/fileSystem';
import { SimulatedShell } from '../../services/simulatedShell';
import { Loader2, Terminal as TerminalIcon } from 'lucide-react';

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
                "CloudOS Shell [Version 3.0.0-kali]",
                "(c) 2024 CloudOS Security. All rights reserved.",
                "Type 'help' for a list of available commands.",
                "--------------------------------------------------",
            ];
            
            for (const line of lines) {
                setHistory(prev => [...prev, { type: 'system', content: line }]);
                await new Promise(r => setTimeout(r, 100));
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
          setInput('');
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
                <div className="flex gap-2 items-center">
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
        setHistory(prev => [...prev, { type: 'error', content: 'bash: system error: execution halted' }]);
    } finally {
        setLoading(false);
    }
  };

  const getPromptDisplay = () => {
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
          <div key={i} className={`break-words leading-tight whitespace-pre-wrap ${
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