
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, X, Send, Loader, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { getConstants } from '../constants';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'model';
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: 'Chibai! Bethel Kohhran AI Assistant ka ni e. Engtin nge ka puih theih che? (Hello! I am the Bethel Church AI Assistant. How can I help you?)', 
      sender: 'model',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini with Church Context
  useEffect(() => {
    const initChat = async () => {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("API Key missing for Chatbot");
            setError("Service unavailable (Config Error)");
            return;
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Prepare context from constants
        const constants = getConstants('en'); // Use English constants for the system prompt base
        
        // Context Builders
        const scheduleStr = constants.weeklyDuty.weekRange 
            ? `Current Week: ${constants.weeklyDuty.weekRange}` 
            : 'Check "Weekly Duties" section for latest updates.';
        
        const programsStr = JSON.stringify(constants.weeklyDuty.serviceTimes);
        
        const pastorsStr = constants.pastors.map(p => `${p.name} (${p.role})`).join(", ");
        
        const eldersStr = constants.elders.map(e => e.name).join(", ");
        
        const ministriesStr = constants.ministries.map(m => `${m.name} (${m.acronym || ''}) - Leader: ${m.leader}`).join("; ");
        
        const announcementsStr = constants.announcements.slice(0, 3).map(a => `[${a.date}] ${a.title}: ${a.content}`).join("\n");

        const systemPrompt = `
          You are a helpful and polite AI assistant for the "Champhai Bethel Kohhran" website.
          
          CONTEXT:
          - Church Name: Champhai Bethel Kohhran.
          - Location: Bethel Veng, Champhai, Mizoram.
          - Service Times: ${programsStr}
          - Current Week Info: ${scheduleStr}
          
          LEADERSHIP:
          - Pastors: ${pastorsStr}
          - Elders (Upa): ${eldersStr}
          
          MINISTRIES & FELLOWSHIPS:
          - ${ministriesStr}
          
          LATEST ANNOUNCEMENTS (Summary):
          ${announcementsStr}
          
          GUIDELINES:
          - Answer questions about church timings, leaders, ministries, and general Christian faith queries.
          - If asked about specific dynamic data (like who is Usher today) that is not in your context, politely say you don't have that real-time info but suggest checking the "Weekly Duties" section.
          - Be respectful and use a tone appropriate for a church setting.
          - You can understand and reply in both English and Mizo. If the user speaks Mizo, reply in Mizo.
          - Keep responses concise and easy to read on a mobile chat interface.
        `;

        const chat = ai.chats.create({
          model: 'gemini-3-pro-preview',
          config: {
            systemInstruction: systemPrompt,
          }
        });
        
        chatSessionRef.current = chat;
      } catch (e) {
        console.error("Failed to init chatbot", e);
        setError("Failed to connect to AI service.");
      }
    };

    initChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatSessionRef.current || isLoading) return;

    const userText = input.trim();
    const userMsg: Message = { 
        id: Date.now().toString(), 
        text: userText, 
        sender: 'user',
        timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userText });
      const text = result.text;
      
      const botMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          text: text, 
          sender: 'model',
          timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          text: "Ka tihpalh, harsatna ka tawk tlat mai. Khawngaihin nakinah min zawt nawn leh rawh. (Sorry, I encountered an error. Please ask again later.)", 
          sender: 'model',
          timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[60] p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center ${
          isOpen ? 'bg-slate-800 rotate-90' : 'bg-church-600 hover:bg-church-700'
        } text-white`}
        aria-label="Toggle Chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-6 z-[60] w-[90vw] md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
        style={{ maxHeight: 'calc(100vh - 140px)', height: '500px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-church-700 to-church-600 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
                <Sparkles size={18} />
            </div>
            <div>
                <h3 className="font-bold text-sm">Bethel Assistant</h3>
                <p className="text-[10px] text-church-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online
                </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded transition">
            <Minimize2 size={16} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-church-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text}
                <div className={`text-[9px] mt-1 text-right ${msg.sender === 'user' ? 'text-church-200' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                <Loader size={16} className="animate-spin text-church-500" />
                <span className="text-xs text-slate-500">Thinking...</span>
              </div>
            </div>
          )}
          {error && (
             <div className="flex justify-center">
                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">{error}</span>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about service times..."
              className="flex-1 bg-slate-100 text-slate-900 placeholder-slate-500 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-church-500 focus:bg-white transition-all outline-none"
              disabled={isLoading || !!error}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !!error}
              className="p-3 bg-church-600 text-white rounded-xl hover:bg-church-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[9px] text-slate-400">
                Powered by Gemini AI • Responses may vary
            </p>
          </div>
        </form>
      </div>
    </>
  );
};

export default Chatbot;
