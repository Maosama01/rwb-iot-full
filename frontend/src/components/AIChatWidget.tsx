import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AIChatWidgetProps {
  greeting?: string;
  className?: string;
}

export default function AIChatWidget({ 
  greeting = "Hi! I'm your Rawbin AI assistant. Ask me anything about your compost health or what you can put in the bin!",
  className = ""
}: AIChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: greeting }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedDevice } = useDevices();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedDevice) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.aiAsk(selectedDevice.id, userMessage);
      setMessages(prev => [...prev, { role: 'ai', content: response.answer }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col bg-white rounded-3xl shadow-organic-sm border border-border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-leaf-600 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-full">
            <Bot size={22} />
          </div>
          <h3 className="font-serif font-bold text-lg">Ask Rawbin</h3>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream-50 min-h-[300px]">
        {!selectedDevice ? (
          <div className="text-center text-compost-500 text-sm mt-10">
            Please select a device to use the AI assistant.
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-leaf-600 text-white rounded-tr-sm' : 'bg-white border border-border text-compost-900 rounded-tl-sm'}`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3.5 rounded-2xl text-sm bg-white border border-border text-compost-900 rounded-tl-sm flex items-center gap-2 shadow-sm">
              <Loader2 size={16} className="animate-spin text-leaf-600" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-border shrink-0">
        <div className="flex items-center gap-2 relative">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={loading || !selectedDevice}
            placeholder={selectedDevice ? "Ask about your compost..." : "Select a device..."}
            className="w-full bg-cream-50 border border-border rounded-full py-3 pl-5 pr-12 text-sm text-compost-900 focus:outline-none focus:border-leaf-400 focus:ring-4 focus:ring-leaf-100 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim() || !selectedDevice}
            className="absolute right-1.5 w-9 h-9 flex items-center justify-center bg-leaf-600 text-white rounded-full hover:bg-leaf-900 disabled:opacity-50 disabled:hover:bg-leaf-600 transition-colors"
          >
            <Send size={16} className="mr-0.5 mt-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
