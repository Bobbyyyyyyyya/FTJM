import React, { useState, useEffect } from 'react';
import { AudioLog } from '../types';
import { formatTime, localAudioLogs } from '../utils/helpers';
import { motion } from 'motion/react';
import { Volume2, AlertCircle, CheckCircle, RefreshCw, Clock, User, Link as LinkIcon } from 'lucide-react';

export const AudioLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AudioLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    setLogs([...localAudioLogs]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    const handleNewLog = (event: Event) => {
      const customEvent = event as CustomEvent<AudioLog>;
      if (customEvent.detail) {
        setLogs(prev => [customEvent.detail, ...prev].slice(0, 100));
      }
    };

    window.addEventListener('audio-log-added', handleNewLog);
    return () => window.removeEventListener('audio-log-added', handleNewLog);
  }, []);

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-500" />
            Audio Logs
          </h2>
          <p className="text-xs text-zinc-500">Real-time overzicht van audio gebeurtenissen</p>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 && !loading ? (
          <div className="text-center py-10 text-zinc-500">
            Geen logs gevonden.
          </div>
        ) : (
          logs.map((log) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={log.id}
              className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 p-1.5 rounded-full ${
                  log.status === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                  log.status === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {log.status === 'success' ? <CheckCircle className="w-4 h-4" /> :
                   log.status === 'error' ? <AlertCircle className="w-4 h-4" /> :
                   <AlertCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm truncate">
                      {log.message}
                    </span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 whitespace-nowrap ml-2">
                      <Clock className="w-3 h-3" />
                      {formatTime(log.created_at)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <User className="w-3 h-3" />
                      {log.user_name || 'Anoniem'}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 truncate max-w-[200px]">
                      <LinkIcon className="w-3 h-3" />
                      <span className="truncate" title={log.url}>{log.url}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
