
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageCircle, X, Send, Loader, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { getConstants } from '../constants';
import { db } from '../services/firebase';

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
  
  const [dbContext, setDbContext] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load some important collections from Firestore to augment context
    const loadDbData = async () => {
      try {
        if (!db || !db.collection) return;
        let contextText = "\\n--- FIRESTORE APP DATA ---\\n";
        
        // Load Weekly Duties
        try {
           const sumDoc = await db.collection('weeklyDuties').doc('current').get();
           if (sumDoc.exists) contextText += `== Weekly Duties ==\\n${JSON.stringify(sumDoc.data())}\\n`;
        } catch(e) {}

        // Load Events
        try {
           const evSnap = await db.collection('events').limit(10).get();
           if (!evSnap.empty) {
               const evMap = evSnap.docs.map((d: any) => d.data());
               contextText += `== Upcoming Events ==\\n${JSON.stringify(evMap)}\\n`;
           }
        } catch(e) {}
        
        // Load Announcements
        try {
           const anSnap = await db.collection('announcements').limit(10).get();
           if (!anSnap.empty) {
               const anMap = anSnap.docs.map((d: any) => d.data());
               contextText += `== Announcements ==\\n${JSON.stringify(anMap)}\\n`;
           }
        } catch(e) {}

        // Load Committees
        try {
           const coSnap = await db.collection('committees').limit(20).get();
           if (!coSnap.empty) {
               const coMap = coSnap.docs.map((d: any) => d.data());
               contextText += `== Committees ==\\n${JSON.stringify(coMap)}\\n`;
           }
        } catch(e) {}

        // Load Directories
        try {
           const pSnap = await db.collection('pastors').get();
           if (!pSnap.empty) contextText += `== Pastors ==\\n${JSON.stringify(pSnap.docs.map((d: any) => d.data()))}\\n`;
           
           const eSnap = await db.collection('elders').get();
           if (!eSnap.empty) contextText += `== Elders ==\\n${JSON.stringify(eSnap.docs.map((d: any) => d.data()))}\\n`;

           const mSnap = await db.collection('ministries').get();
           if (!mSnap.empty) contextText += `== Ministries Info ==\\n${JSON.stringify(mSnap.docs.map((d: any) => d.data()))}\\n`;
           
           const kSnap = await db.collection('ktpLeaders').get();
           if (!kSnap.empty) contextText += `== KTP Leaders ==\\n${JSON.stringify(kSnap.docs.map((d: any) => d.data()))}\\n`;
           
           const recSnap = await db.collection('records').limit(100).get();
           if (!recSnap.empty) contextText += `== Records (Baptism, Wedding, etc.) ==\\n${JSON.stringify(recSnap.docs.map((d: any) => d.data()))}\\n`;
        } catch(e) {}

        setDbContext(contextText);
      } catch (err) {
        console.error("Failed to load db context for chatbot:", err);
      }
    };
    loadDbData();
  }, []);

  // Initialize Gemini Context
  const systemInstruction = useMemo(() => {
    const constants = getConstants('en'); // Use English constants for the system prompt base
    
    // Context Builders
    const scheduleStr = constants.weeklyDuty.weekRange 
        ? `Current Week: ${constants.weeklyDuty.weekRange}` 
        : 'Check "Weekly Duties" section for latest updates.';
    
    const programsStr = JSON.stringify(constants.weeklyDuty.serviceTimes);
    
    const pastorsStr = constants.pastors.map(p => `${p.name} (${p.role})`).join(", ");
    
    const eldersStr = constants.elders.map(e => e.name).join(", ");
    
    const ministriesStr = constants.ministries.map(m => `${m.name} (${m.acronym || ''})${m.leader ? ` - Leader: ${m.leader}` : ''}`).join("; ");
    
    const announcementsStr = constants.announcements.slice(0, 3).map(a => `[${a.date}] ${a.title}: ${a.content}`).join("\\n");

    return `
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
      
      ${dbContext}

      GUIDELINES:
      - Answer questions about church timings, leaders, ministries, and general Christian faith queries.
      - If users ask about dynamic data like who is Usher today, check the "FIRESTORE APP DATA" Context above. If not there, politely say you don't have that real-time info.
      - Be respectful and use a tone appropriate for a church setting.
      - You can understand and reply in both English and Mizo. If the user speaks Mizo, reply in Mizo.
      - Keep responses concise and easy to read on a mobile chat interface.
    `;
  }, [dbContext]);

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
    if (!input.trim() || isLoading) return;

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
      // Build history for the API
      const history = messages.slice(1).map(m => ({ // Skip the first greeting message
        role: m.sender,
        parts: [{ text: m.text }]
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userText,
          history,
          systemInstruction
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }
      
      const botMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          text: data.text, 
          sender: 'model',
          timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error: any) {
      const errorMessage = (error.message === "Service unavailable (Config Error)" || error.message === "Invalid API Key provided")
          ? "Invalid API Key provided. Please check Settings."
          : null;

      if (!errorMessage) {
        console.error("Chat error:", error);
      }

      if (errorMessage) {
          setError(errorMessage);
      } else {
        setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            text: "Ka tihpalh, harsatna ka tawk tlat mai. Khawngaihin nakinah min zawt nawn leh rawh. (Sorry, I encountered an error. Please ask again later.)", 
            sender: 'model',
            timestamp: new Date()
        }]);
      }
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
