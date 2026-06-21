import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hi! I'm your Rawbin AI assistant. Ask me anything about your compost health or telemetry!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedDevice } = useDevices();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !selectedDevice) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Assuming we expose an aiAsk method in api/client.ts
      const response = await api.aiAsk(selectedDevice.id, userMessage);
      setMessages(prev => [...prev, { role: 'ai', content: response.answer }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Bot size={28} />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-4 right-4 md:bottom-10 md:right-10 w-[350px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-2rem)] bg-white dark:bg-surface border border-border shadow-2xl rounded-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-50 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="bg-emerald-500 text-white p-4 rounded-t-2xl flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Bot size={24} />
            <h3 className="font-bold">Rawbin AI</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
          {!selectedDevice ? (
            <div className="text-center text-text-muted text-sm mt-10">
              Please select a device to use the AI assistant.
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-white dark:bg-surface border border-border text-text-primary rounded-tl-sm shadow-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] p-3 rounded-2xl text-sm bg-white dark:bg-surface border border-border text-text-primary rounded-tl-sm flex items-center gap-2 shadow-sm">
                <Loader2 size={16} className="animate-spin text-emerald-500" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-surface border-t border-border rounded-b-2xl shrink-0">
          <div className="flex items-center gap-2 relative">
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              disabled={loading || !selectedDevice}
              placeholder={selectedDevice ? "Ask about your compost..." : "Select a device first..."}
              className="w-full bg-background border border-border rounded-full py-2.5 pl-4 pr-12 text-sm text-text-primary focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim() || !selectedDevice}
              className="absolute right-1 w-8 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 transition-colors"
            >
              <Send size={14} className="mr-0.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
