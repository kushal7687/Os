import React, { useState, useRef, useEffect } from 'react';
import { AppProps } from '../../types';
import { chatWithAssistant } from '../../services/geminiService';
import { Send, Bot, User as UserIcon, Loader } from 'lucide-react';

export const AssistantApp: React.FC<AppProps> = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: "Hello! I'm your CloudOS assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    const reply = await chatWithAssistant(userMsg);
    
    setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    setLoading(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="h-full w-full bg-white dark:bg-slate-900 flex flex-col">
       <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'ai' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      {m.role === 'ai' ? <Bot size={18} /> : <UserIcon size={18} />}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700'
                  }`}>
                      {m.content}
                  </div>
              </div>
          ))}
          {loading && (
             <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                     <Bot size={18} />
                 </div>
                 <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 rounded-tl-sm flex items-center">
                     <Loader className="animate-spin text-slate-500" size={16} />
                 </div>
             </div>
          )}
          <div ref={bottomRef} />
       </div>

       <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
           <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-full border border-slate-200 dark:border-slate-700">
               <input 
                 type="text" 
                 className="flex-1 bg-transparent px-3 outline-none text-slate-800 dark:text-white placeholder-slate-400 text-sm"
                 placeholder="Message Assistant..."
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
               />
               <button 
                 onClick={sendMessage}
                 disabled={loading || !input.trim()}
                 className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
               >
                   <Send size={16} />
               </button>
           </div>
       </div>
    </div>
  );
};