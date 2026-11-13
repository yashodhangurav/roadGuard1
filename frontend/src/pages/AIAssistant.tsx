import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Send,
  Sparkles,
  Wrench,
  FileText,
  User,
} from 'lucide-react';
import { EASE_SWIFT } from '../styles/motion';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am RoadSentinel AI, your local civil infrastructure assistant powered by Gemma 3:1B. I can explain road damage patterns, provide ASTM D6433 Pavement Condition Index interpretations, and generate asphalt repair schedules based on verified detections.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<string>('Checking...');
  const [isOllamaReady, setIsOllamaReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Check backend and Ollama status
    const checkStatus = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/health');
        if (res.ok) {
          const data = await res.json();
          setOllamaStatus(data.ollama?.status || 'Online');
          setIsOllamaReady(data.ollama?.ready || false);
        } else {
          setOllamaStatus('Backend Offline');
        }
      } catch {
        setOllamaStatus('Backend Offline');
      }
    };
    checkStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Failed to fetch from AI endpoint');
      }
    } catch {
      const fallbackMsg: Message = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: 'I am currently unable to query Ollama Gemma 3:1B. However, our YOLO detection model remains fully operational for automated distress detection and ASTM D6433 PCI scoring.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    {
      label: 'Explain Pothole Severity Formula',
      query: 'Explain how RoadSentinel AI calculates deterministic pothole severity using size, darkness, and texture contrast.',
      icon: Sparkles,
    },
    {
      label: 'Hot-Mix Patch Specifications',
      query: 'What engineering standards and material mix are recommended for repairing high-severity roadway cavities?',
      icon: Wrench,
    },
    {
      label: 'PCI vs Hazard Index',
      query: 'What is the relationship between the ASTM D6433 Pavement Condition Index (PCI) and the road hazard score?',
      icon: FileText,
    },
  ];

  return (
    <div className="py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-xs font-mono text-amber-400 mb-3 shadow-sm">
              <Bot className="w-3.5 h-3.5" />
              <span>Local Ollama LLM · Gemma 3:1B</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-white">
              AI Highway Assistant
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 mt-1">
              Grounded infrastructure intelligence without hallucination or third-party cloud streaming.
            </p>
          </div>

          {/* Model Status Pill */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md self-start sm:self-auto text-xs font-mono">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOllamaReady
                  ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-neutral-300">Gemma 3:1B:</span>
            <span className={isOllamaReady ? 'text-emerald-300 font-semibold' : 'text-amber-300'}>
              {ollamaStatus}
            </span>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
          {QUICK_PROMPTS.map((p, idx) => {
            const Icon = p.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.query)}
                disabled={isLoading}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-500/40 text-left transition cursor-pointer group text-xs"
              >
                <Icon className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-neutral-300 group-hover:text-white font-medium">
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chat Log Glassmorphic Console */}
        <div className="rounded-2xl border border-white/10 bg-[#0d0e12]/95 shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex flex-col h-[560px] overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((m) => {
              const isAi = m.sender === 'assistant';
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_SWIFT }}
                  className={`flex gap-3 max-w-[85%] ${isAi ? 'self-start' : 'ml-auto flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAi
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                        : 'bg-neutral-800 text-neutral-300 border border-white/10'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div>
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isAi
                          ? 'bg-[#161822] border border-white/10 text-neutral-200'
                          : 'bg-amber-600 text-white shadow-md'
                      }`}
                    >
                      {m.text}
                    </div>
                    <div
                      className={`text-[10px] text-neutral-500 mt-1 font-mono ${
                        isAi ? 'text-left' : 'text-right'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 max-w-[85%] self-start"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-[#161822] border border-white/10 text-neutral-400 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Gemma 3:1B is evaluating road parameters...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-[#121319]/90">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask Gemma about pothole repairs, ASTM standards, or scan results..."
                disabled={isLoading}
                className="flex-1 bg-white/[0.04] border border-white/10 focus:border-amber-500/80 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-white font-medium flex items-center justify-center transition cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
