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
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-app-ink rounded-2xl flex items-center justify-center shadow-lg">
          <Newspaper className="w-6 h-6 text-app-bg" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-app-ink tracking-tight uppercase">Laatste Nieuws</h2>
          <p className="text-app-muted text-sm font-medium">Blijf op de hoogte van updates en aankondigingen.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {NEWS_ITEMS.map((item) => (
          <motion.div 
            key={item.id}
            layout
            className={`bg-app-card rounded-[2rem] border border-app-border shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-app-ink/20 ${expandedNewsId === item.id ? 'ring-2 ring-app-ink' : ''}`}
          >
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-6">
                <span className="px-4 py-1.5 bg-app-accent text-app-ink rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-app-border/50">
                  {item.category}
                </span>
                <div className="flex items-center gap-2 text-app-muted">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{item.date}</span>
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-app-ink mb-4 leading-tight uppercase">{item.title}</h3>
              
              <AnimatePresence mode="wait">
                {expandedNewsId === item.id ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-app-muted leading-relaxed mb-8 text-lg font-medium">
                      {item.content}
                    </p>
                    <button 
                      onClick={() => setExpandedNewsId(null)}
                      className="flex items-center gap-2 text-app-ink font-black text-xs uppercase tracking-widest hover:gap-3 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Minder lezen
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="text-app-muted leading-relaxed mb-8 line-clamp-2 font-medium">
                      {item.content}
                    </p>
                    <button 
                      onClick={() => setExpandedNewsId(item.id)}
                      className="flex items-center gap-2 text-app-ink font-black text-xs uppercase tracking-widest hover:gap-3 transition-all"
                    >
                      Lees het volledige artikel
                      <ChevronLeft className="w-4 h-4 rotate-180" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
