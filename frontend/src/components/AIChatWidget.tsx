import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useDevices } from '../context/DeviceContext';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AIChatWidgetProps {
  inline?: boolean;
}

export default function AIChatWidget({ inline = false }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(inline);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hi! I'm your Rawbin AI assistant. Ask me anything about your compost health or what you can put in the bin!" }
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
      const response = await api.aiAsk(selectedDevice.id, userMessage);
      setMessages(prev => [...prev, { role: 'ai', content: response.answer }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const chatInterface = (
    <div className={`flex flex-col h-full bg-white ${inline ? 'rounded-3xl shadow-organic-sm border border-border h-[400px]' : 'rounded-2xl shadow-organic-lg border border-border h-[500px] w-[350px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]'}`}>
      {/* Header */}
      <div className="bg-leaf-600 text-white p-4 rounded-t-3xl flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-full">
            <Bot size={22} />
          </div>
          <h3 className="font-serif font-bold text-lg">Ask Rawbin</h3>
        </div>
        {!inline && (
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream-50">
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
      <div className="p-3 bg-white border-t border-border rounded-b-3xl shrink-0">
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

  if (inline) {
    return chatInterface;
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-28 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-leaf-600 hover:bg-leaf-900 text-white rounded-full shadow-organic-md flex items-center justify-center transition-transform hover:scale-110 z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Bot size={28} />
      </button>

      <div className={`fixed bottom-28 right-4 md:bottom-10 md:right-10 z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-50 opacity-0 pointer-events-none'}`}>
        {chatInterface}
      </div>
    </>
  );
}
