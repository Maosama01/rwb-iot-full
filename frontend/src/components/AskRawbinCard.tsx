import { useState } from 'react';
import { Bot, ChevronRight, X } from 'lucide-react';
import AIChatWidget from './AIChatWidget';

export interface AskRawbinCardProps {
  title?: string;
  subtitle?: string;
  greeting?: string;
  className?: string;
}

export default function AskRawbinCard({
  title = 'Ask Rawbin AI',
  subtitle = 'Chat about your compost',
  greeting,
  className = ''
}: AskRawbinCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`w-full group organic-card p-4 md:p-6 flex items-center justify-between text-left hover:border-leaf-600 hover:shadow-organic transition-all bg-white ${className}`}
      >
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-leaf-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg md:text-xl text-compost-900 group-hover:text-leaf-700 transition-colors">
              {title}
            </h3>
            <p className="text-sm md:text-base text-compost-500 mt-1">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-cream-50 flex items-center justify-center text-leaf-600 group-hover:bg-leaf-50 transition-colors shrink-0">
          <ChevronRight size={20} />
        </div>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 bg-compost-900/40 backdrop-blur-sm animate-fade-in">
          {/* Dismiss background */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-lg mx-auto z-10 h-[600px] max-h-[85vh] flex flex-col shadow-2xl animate-fade-in-up">
            {/* Close Button on top of widget */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 md:-right-12 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={28} />
            </button>
            <AIChatWidget 
              greeting={greeting} 
              className="h-full w-full shadow-2xl" 
            />
          </div>
        </div>
      )}
    </>
  );
}
