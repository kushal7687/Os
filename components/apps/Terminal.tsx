import React, { useState, useRef, useEffect } from 'react';
import { AppProps } from '../../types';
import { generateTerminalResponse } from '../../services/geminiService';
import { fs } from '../../services/fileSystem';
import { Loader2 } from 'lucide-react';

interface Log {
  type: 'input' | 'output' | 'system' | 'error';
  content: string | React.ReactNode;
}

export const TerminalApp: React.FC<AppProps> = ({ isFocused, onClose }) => {
  const [history, setHistory] = useState<Log[]>([
    { type: 'system', content: 'Kali GNU/Linux Rolling [Version 2024.1]' },
    { type: 'system', content: 'Kernel 6.6.9-amd64 on an x86_64\n' },
    { type: 'system', content: 'No mail.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
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

    // 1. Display User Input
    const promptEl = getPromptDisplay();
    setHistory(prev => [...prev, { 
        type: 'input', 
        content: <div className="flex gap-2">{promptEl} <span className="text-white font-bold">{cmdString}</span></div> 
    }]);
    setInput('');

    // 2. Parse Command
    const args = cmdString.trim().split(' ');
    const cmd = args[0];
    const rest = args.slice(1).join(' ');

    // 3. Handle Local Shell Built-ins (Fast & Real)
    if (!activeTool) {
        if (cmd === 'clear') {
            setHistory([]);
            return;
        }
        if (cmd === 'exit') {
            onClose();
            return;
        }
        if (cmd === 'ls') {
            setHistory(prev => [...prev, { type: 'output', content: fs.ls(rest) }]);
            return;
        }
        if (cmd === 'pwd') {
            setHistory(prev => [...prev, { type: 'output', content: fs.pwd() }]);
            return;
        }
        if (cmd === 'cd') {
            const err = fs.cd(args[1] || '~');
            if (err) setHistory(prev => [...prev, { type: 'error', content: err }]);
            return;
        }
        if (cmd === 'mkdir') {
            if (args[1]) {
                fs.mkdir(fs.current, args[1]);
            } else {
                setHistory(prev => [...prev, { type: 'error', content: 'mkdir: missing operand' }]);
            }
            return;
        }
        if (cmd === 'touch') {
            if (args[1]) {
                fs.writeFile(fs.current, args[1], '');
            } else {
                setHistory(prev => [...prev, { type: 'error', content: 'touch: missing file operand' }]);
            }
            return;
        }
        if (cmd === 'rm') {
             if (args[1]) {
                const err = fs.rm(args[1]);
                if (err) setHistory(prev => [...prev, { type: 'error', content: err }]);
             } else {
                setHistory(prev => [...prev, { type: 'error', content: 'rm: missing operand' }]);
             }
             return;
        }
        if (cmd === 'cat') {
            if (args[1]) {
                const content = fs.readFile(args[1]);
                if (content !== null) {
                    setHistory(prev => [...prev, { type: 'output', content: content }]);
                } else {
                    setHistory(prev => [...prev, { type: 'error', content: `cat: ${args[1]}: No such file or directory` }]);
                }
            }
            return;
        }
        if (cmd === 'echo') {
            // Support: echo "content" > file.txt
            if (cmdString.includes('>')) {
                const parts = cmdString.split('>');
                const content = parts[0].replace('echo', '').trim().replace(/^"|"$/g, '');
                const fileName = parts[1].trim();
                fs.writeFile(fs.current, fileName, content);
                return;
            }
            // Standard echo
            setHistory(prev => [...prev, { type: 'output', content: rest.replace(/^"|"$/g, '') }]);
            return;
        }
        
        // --- Interactive Tools Triggers ---
        if (cmd === 'msfconsole' || cmd === 'python' || cmd === 'python3') {
            setActiveTool(cmd);
            // Fallthrough to AI to generate banner
        }
    } else {
        // Inside a tool
        if (cmd === 'exit') {
            setActiveTool(null);
            return;
        }
    }

    // 4. Send Complex Logic to Neural Kernel
    setLoading(true);
    
    // Gather Context (Real files from our virtual FS)
    const fsContext = fs.getAIContext();
    const previousLog = history.slice(-3).map(h => typeof h.content === 'string' ? h.content : '').join('\n');
    
    // Construct prompt context
    let promptContext = activeTool ? `[INSIDE TOOL: ${activeTool}] ` : '';
    
    const response = await generateTerminalResponse(previousLog, promptContext + cmdString, fsContext);
    
    setHistory(prev => [...prev, { type: 'output', content: response }]);
    setLoading(false);
  };

  const getPromptDisplay = () => {
     if (activeTool === 'msfconsole') {
         return <span className="font-bold underline text-white">msf6 &gt;</span>;
     }
     if (activeTool === 'python' || activeTool === 'python3') {
         return <span className="font-bold text-white">&gt;&gt;&gt;</span>;
     }

     // Kali Prompt Construction
     const path = fs.pwd();
     // Replace /root with ~ for display
     const displayPath = path.startsWith('/root') ? path.replace('/root', '~') : path;
     
     return (
         <div className="inline-flex flex-col leading-none mb-0.5 whitespace-nowrap">
             <div className="flex">
                 <span className="text-blue-500 font-bold">┌──(</span>
                 <span className="text-red-500 font-bold">root💀kali</span>
                 <span className="text-blue-500 font-bold">)-[</span>
                 <span className="text-white font-bold">{displayPath}</span>
                 <span className="text-blue-500 font-bold">]</span>
             </div>
             <div className="flex">
                 <span className="text-blue-500 font-bold">└─</span>
                 <span className="text-red-500 font-bold">#</span>
             </div>
         </div>
     );
  };

  return (
    <div 
        className="h-full w-full bg-[#0d0d0d] text-[#e0e0e0] p-2 font-mono text-sm overflow-hidden flex flex-col relative" 
        onClick={() => inputRef.current?.focus()}
    >
      {/* Background Branding */}
      <div className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03]">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-96 h-96 text-white">
              <path d="M12 0L1.5 6V18L12 24L22.5 18V6L12 0ZM12 21.6L3.9 16.9V7.1L12 2.4L20.1 7.1V16.9L12 21.6Z"/>
          </svg>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-0.5 relative z-10 p-2">
        {history.map((log, i) => (
          <div key={i} className={`break-words ${log.type === 'error' ? 'text-red-400 font-bold' : log.type === 'input' ? 'mt-3 mb-1' : 'text-slate-300 whitespace-pre-wrap leading-tight'}`}>
            {log.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-blue-500 mt-2">
            <Loader2 className="animate-spin" size={14} />
            <span className="text-xs animate-pulse">EXECUTING_KERNEL_THREAD...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      
      <div className="mt-2 flex items-end p-2 rounded relative z-10 bg-[#0d0d0d]">
        <div className="shrink-0 mb-1.5 mr-2">{getPromptDisplay()}</div>
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
          className="flex-1 bg-transparent outline-none text-white font-bold mb-1.5 min-w-[50px]"
          autoComplete="off"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
};