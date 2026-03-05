
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { chatWithDataStream } from '../services/geminiService';
import { StorageService } from '../services/storage';
import { ChatMessage } from '../types';

const DataChat: React.FC = () => {
  const isAuthMode = StorageService.getDataMode() === 'backend';
  const hasGeminiKey = Boolean(localStorage.getItem('GEMINI_API_KEY'));
  const hasTrustedData = StorageService.getMetrics().length > 0 || StorageService.getTransactions().length > 0;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: isAuthMode
        ? !hasGeminiKey
          ? 'Data Chat is blocked in Auth Login until a Gemini API key is configured in Integrations.'
          : !hasTrustedData
            ? 'Data Chat is blocked in Auth Login until trusted data is available. Next step: import transactions or connect a live integration.'
            : 'Data Chat is ready. Ask about your trusted business data.'
        : 'Hello! I can analyze your business data in real-time. Ask me anything.',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    if (!StorageService.hasCredits(1)) {
        setMessages(prev => [...prev, { id: 'error', role: 'model', text: 'Out of credits.', timestamp: Date.now() }]);
        return;
    }

    StorageService.updateCredits(1, 'AI Streaming Chat');
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const context = { metrics: StorageService.getMetrics(), transactions: StorageService.getTransactions().slice(0, 10) };
    
    // Create a placeholder for streaming
    const streamId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: streamId, role: 'model', text: '', timestamp: Date.now(), isStreaming: true }]);

    await chatWithDataStream(userMsg.text, context, (text) => {
        setMessages(prev => prev.map(m => m.id === streamId ? { ...m, text } : m));
    });
    
    setMessages(prev => prev.map(m => m.id === streamId ? { ...m, isStreaming: false } : m));
    setIsTyping(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
        <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Bot className="w-5 h-5 text-primary-600" /> AI Streaming Assistant</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        {msg.role === 'user' ? <UserIcon className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'}`}>
                        {msg.text || (msg.isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : "...")}
                    </div>
                </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSend} className="relative">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="w-full pl-4 pr-12 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none" />
            <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"><Send className="w-4 h-4" /></button>
        </form>
      </div>
    </div>
  );
};

export default DataChat;
