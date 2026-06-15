import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, Clock, ChevronLeft } from 'lucide-react';
import { NEWS_ITEMS } from '../constants';

interface NewsViewProps {
  expandedNewsId: number | null;
  setExpandedNewsId: (id: number | null) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ expandedNewsId, setExpandedNewsId }) => {
  return (
    <div className="space-y-12 max-w-5xl mx-auto py-8">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b-4 border-app-ink pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <motion.div 
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="w-8 h-8 bg-app-ink rounded-full flex items-center justify-center"
            >
              <Newspaper className="w-4 h-4 text-app-bg" />
            </motion.div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-app-muted">Intelligence Feed</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold text-app-ink tracking-tight">
            The Wire
          </h2>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold uppercase tracking-wider text-app-ink">Update log v2.3.0</p>
          <p className="text-[10px] font-semibold text-app-muted uppercase tracking-wider mt-1">Status: Operational</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {NEWS_ITEMS.map((item, index) => (
          <motion.article 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-8 items-start">
              <div className="flex flex-col gap-4 lg:sticky lg:top-32">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-app-ink/10">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="h-px flex-grow bg-app-ink/10 lg:hidden" />
                </div>
                <div className="space-y-4">
                  <span className="inline-block px-4 py-2 bg-app-ink text-app-bg rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2 text-app-muted text-[10px] font-bold uppercase tracking-wider">
                    <Clock className="w-3 h-3" />
                    <span>{item.date}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-3xl sm:text-4xl font-bold text-app-ink leading-tight tracking-tight group-hover:text-[#004276] transition-colors cursor-pointer" onClick={() => setExpandedNewsId(expandedNewsId === item.id ? null : item.id)}>
                  {item.title}
                </h3>
                
                <div className="relative">
                  <p className={`text-app-muted leading-relaxed font-medium transition-all duration-500 ${expandedNewsId === item.id ? 'text-lg text-app-ink' : 'line-clamp-3 text-base'}`}>
                    {item.content}
                  </p>
                  
                  <div className="pt-8 flex items-center gap-6">
                    <button 
                      onClick={() => setExpandedNewsId(expandedNewsId === item.id ? null : item.id)}
                      className="px-8 py-3 bg-app-bg border-2 border-app-ink text-app-ink rounded-full font-bold text-[10px] uppercase tracking-wider hover:bg-app-ink hover:text-app-bg transition-all active:scale-95 shadow-xl shadow-app-ink/5"
                    >
                      {expandedNewsId === item.id ? 'Inklappen' : 'Lees meer'}
                    </button>
                    
                    <div className="h-0.5 flex-grow bg-app-ink/5" />
                    
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-app-ink/10" />
                      <div className="w-2 h-2 rounded-full bg-app-ink/10" />
                      <div className="w-2 h-2 rounded-full bg-app-ink/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 h-px bg-app-ink/10" />
          </motion.article>
        ))}
      </div>

      <footer className="pt-12 text-center border-t-2 border-app-ink/5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-app-muted animate-pulse">End of Feed</p>
      </footer>
    </div>
  );
};
