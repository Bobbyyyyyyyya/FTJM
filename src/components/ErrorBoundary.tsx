import React, { ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RefreshCw, Shield, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Er is een onverwachte fout opgetreden.';
      try {
        const parsedError = JSON.parse(this.state.error?.message || '');
        if (parsedError.error) {
          errorMessage = `Systeemfout: ${parsedError.error} (${parsedError.operationType})`;
        }
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f4f5] p-6 font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-xl w-full bg-white rounded-[2.5rem] shadow-2xl p-10 sm:p-16 border border-zinc-200 text-center relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
            
            <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Systeemfout</h2>
            </div>
            
            <p className="text-zinc-500 mb-10 leading-relaxed font-medium text-lg">
              {errorMessage}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-3 py-4 px-6 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-900/20"
              >
                <RefreshCw className="w-5 h-5" />
                Opnieuw Laden
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center justify-center gap-3 py-4 px-6 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all active:scale-95"
              >
                <Home className="w-5 h-5" />
                Naar Home
              </button>
            </div>
            
            <p className="mt-12 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">
              FTJM Enterprise Security
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
