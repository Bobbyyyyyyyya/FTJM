import React, { useState, useRef, useEffect } from 'react';
import { X, Scissors, Play, Pause, Film, Clock, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { compressVideo } from '../utils/videoCompressor';
import { ThemedSpinner } from './ThemedLoadingScreen';

interface VideoTrimmerModalProps {
  file: File;
  onTrimmed: (trimmedDataUrl: string) => void;
  onCancel: () => void;
}

export const VideoTrimmerModal: React.FC<VideoTrimmerModalProps> = ({ file, onTrimmed, onCancel }) => {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  // Generate visual frame thumbnails across duration
  useEffect(() => {
    if (!duration || duration <= 0 || !videoUrl) return;

    let isMounted = true;
    setIsGeneratingThumbnails(true);

    const tempVideo = document.createElement('video');
    tempVideo.src = videoUrl;
    tempVideo.muted = true;
    tempVideo.playsInline = true;

    const count = 10;
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 68;
    const ctx = canvas.getContext('2d');

    const generated: string[] = [];

    const captureFrame = (index: number) => {
      if (!isMounted) return;
      if (index >= count) {
        if (isMounted) {
          setThumbnails(generated);
          setIsGeneratingThumbnails(false);
        }
        return;
      }

      const time = (index / (count - 1 || 1)) * duration;
      tempVideo.currentTime = time;

      const onSeeked = () => {
        tempVideo.removeEventListener('seeked', onSeeked);
        if (ctx && isMounted) {
          try {
            ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
            generated.push(canvas.toDataURL('image/jpeg', 0.6));
          } catch (e) {
            console.warn('Failed to draw thumbnail frame:', e);
          }
        }
        captureFrame(index + 1);
      };

      tempVideo.addEventListener('seeked', onSeeked);
    };

    tempVideo.onloadedmetadata = () => {
      captureFrame(0);
    };

    tempVideo.onerror = () => {
      if (isMounted) setIsGeneratingThumbnails(false);
    };

    return () => {
      isMounted = false;
    };
  }, [duration, videoUrl]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      if (cur >= startTime + 5) {
        videoRef.current.pause();
        videoRef.current.currentTime = startTime;
        setIsPlaying(false);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.currentTime = startTime;
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const updateStartTimeFromTimeline = (clientX: number) => {
    if (!timelineRef.current || duration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const ratio = clickX / rect.width;
    const maxStart = Math.max(0, duration - 5);
    const newStart = Math.min(maxStart, Math.max(0, ratio * duration));
    
    setStartTime(newStart);
    setCurrentTime(newStart);
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
  };

  const handleTimelineMouseDown = (e: React.MouseEvent) => {
    if (isProcessing || duration <= 5) return;
    isDraggingRef.current = true;
    updateStartTimeFromTimeline(e.clientX);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (isDraggingRef.current) {
        updateStartTimeFromTimeline(moveEvent.clientX);
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTimelineTouchStart = (e: React.TouchEvent) => {
    if (isProcessing || duration <= 5 || !e.touches[0]) return;
    isDraggingRef.current = true;
    updateStartTimeFromTimeline(e.touches[0].clientX);

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (isDraggingRef.current && moveEvent.touches[0]) {
        updateStartTimeFromTimeline(moveEvent.touches[0].clientX);
      }
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);
  };

  const handleProcess = async () => {
    setIsProcessing(true);

    try {
      // Use compressVideo with 700kbps bitrate and max 640px dimensions
      // to ensure huge 10MB+ video files are converted to ~350-500KB clips
      const compressedDataUrl = await compressVideo(file, {
        startTime: startTime,
        maxDuration: 5,
        maxDimension: 640,
        videoBitrate: 700_000,
        audioBitrate: 64_000,
        fps: 24,
      });

      if (compressedDataUrl) {
        onTrimmed(compressedDataUrl);
      } else {
        // Fallback to FileReader
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onTrimmed(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error: any) {
      console.warn("Video compression fallback:", error);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onTrimmed(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Math calculations for visual timeline overlay
  const maxStart = Math.max(0, duration - 5);
  const trimWindowDuration = Math.min(5, duration > 0 ? duration : 5);
  const windowLeftPct = duration > 0 ? (startTime / duration) * 100 : 0;
  const windowWidthPct = duration > 0 ? (trimWindowDuration / duration) * 100 : 100;
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-app-card w-full max-w-xl rounded-[2.5rem] border border-app-border overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-app-border flex items-center justify-between bg-app-card/60 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-app-ink tracking-tight flex items-center gap-2">
                Video Knippen & Comprimeren
              </h3>
              <p className="text-xs font-medium text-app-muted">Max. 5 seconden fragment • Automatische datacompressie</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            disabled={isProcessing}
            className="w-10 h-10 rounded-2xl bg-app-accent flex items-center justify-center text-app-muted hover:text-app-ink transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Video Preview Frame */}
          <div className="relative rounded-3xl overflow-hidden bg-black aspect-video flex items-center justify-center group ring-1 ring-app-border/80 shadow-inner">
            {videoUrl ? (
              <video 
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                className="max-w-full max-h-full object-contain"
                playsInline
              />
            ) : (
              <div className="flex items-center justify-center text-zinc-400 gap-2.5 text-xs font-medium">
                <ThemedSpinner size="sm" color="#06b6d4" />
                <span className="tracking-wide font-mono text-[11px]">Video inladen...</span>
              </div>
            )}
            
            {!isProcessing && videoUrl && (
              <button 
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-16 h-16 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 shadow-xl cursor-pointer"
              >
                {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 ml-1 fill-current" />}
              </button>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white gap-4 p-6 z-30 animate-in fade-in">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full bg-cyan-500/20 animate-ping opacity-60 pointer-events-none" />
                  <ThemedSpinner size="lg" color="#06b6d4" />
                  <Zap className="w-5 h-5 text-amber-400 absolute animate-pulse" />
                </div>
                <div className="text-center space-y-1.5">
                  <p className="font-black text-sm tracking-widest uppercase text-cyan-400 flex items-center justify-center gap-1.5">
                    Video Comprimeren & Knippen
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  </p>
                  <p className="text-xs text-white/80">Bestandsgrootte wordt met ~85% verkleind voor supersnelle verzending</p>
                  <p className="text-[11px] text-cyan-300/70 font-mono">700 kbps • 24 FPS • 640p geoptimaliseerd</p>
                </div>
              </div>
            )}
          </div>

          {/* Compression Badge */}
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-500 shrink-0" />
              <div>
                <span className="font-bold text-app-ink">Automatische Video Compressie Actief</span>
                <p className="text-[11px] text-app-muted">Zware 10MB+ video's worden gecomprimeerd naar lichte ~400KB clips</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-500 px-2 py-0.5 rounded-full border border-cyan-500/30 whitespace-nowrap">
              -85% Data
            </span>
          </div>

          {/* VISUAL TIMELINE STRIP */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-app-muted px-1">
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                Start: <strong className="text-app-ink">{startTime.toFixed(1)}s</strong>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
                Clip Duur: {trimWindowDuration.toFixed(1)}s
              </span>
              <span className="font-mono">
                Eind: <strong className="text-app-ink">{(startTime + trimWindowDuration).toFixed(1)}s</strong>
              </span>
            </div>

            {/* Interactive Timeline Track */}
            <div 
              ref={timelineRef}
              onMouseDown={handleTimelineMouseDown}
              onTouchStart={handleTimelineTouchStart}
              className="relative w-full h-16 bg-zinc-950 rounded-2xl overflow-hidden border border-app-border cursor-pointer select-none ring-1 ring-white/5"
            >
              {/* Frame Thumbnails Background */}
              <div className="absolute inset-0 flex items-center">
                {isGeneratingThumbnails ? (
                  <div className="w-full h-full flex items-center justify-center gap-2 bg-app-card/40 text-app-muted text-xs font-medium">
                    <ThemedSpinner size="xs" color="#06b6d4" />
                    <span className="font-mono text-[11px] tracking-wide">Tijdbalk genereren...</span>
                  </div>
                ) : thumbnails.length > 0 ? (
                  <div className="grid grid-cols-10 w-full h-full">
                    {thumbnails.map((thumb, idx) => (
                      <div key={idx} className="w-full h-full overflow-hidden border-r border-black/20">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-full h-full object-cover opacity-80" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                    Videoframes
                  </div>
                )}
              </div>

              {/* Dark Overlay for Outside-Trim Regions */}
              <div 
                className="absolute top-0 bottom-0 left-0 bg-black/70 backdrop-blur-[1px] transition-all duration-75"
                style={{ width: `${windowLeftPct}%` }}
              />
              <div 
                className="absolute top-0 bottom-0 right-0 bg-black/70 backdrop-blur-[1px] transition-all duration-75"
                style={{ left: `${windowLeftPct + windowWidthPct}%` }}
              />

              {/* Glowing Active 5-second Trim Window */}
              <div 
                className="absolute top-0 bottom-0 border-2 border-cyan-400 bg-cyan-500/15 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-between pointer-events-none transition-all duration-75 z-10"
                style={{
                  left: `${windowLeftPct}%`,
                  width: `${windowWidthPct}%`
                }}
              >
                {/* Left Trim Handle */}
                <div className="w-2.5 h-full bg-cyan-400 rounded-l-md flex items-center justify-center">
                  <div className="w-0.5 h-4 bg-zinc-950/80 rounded-full" />
                </div>

                {/* Center Badge */}
                <span className="text-[9px] font-black uppercase text-white bg-cyan-600/90 backdrop-blur-md px-2 py-0.5 rounded-md shadow-md tracking-wider select-none">
                  5.0s Clip
                </span>

                {/* Right Trim Handle */}
                <div className="w-2.5 h-full bg-cyan-400 rounded-r-md flex items-center justify-center">
                  <div className="w-0.5 h-4 bg-zinc-950/80 rounded-full" />
                </div>
              </div>

              {/* Moving Red Playhead Indicator */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-red-500 z-20 shadow-[0_0_8px_rgba(239,68,68,0.8)] pointer-events-none transition-all duration-75"
                style={{ left: `${playheadPct}%` }}
              >
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-0.75 -mt-1 shadow-md" />
              </div>
            </div>

            {/* Precision Slider Control */}
            <div className="pt-2">
              <input 
                type="range" 
                min={0} 
                max={maxStart} 
                step={0.1}
                value={startTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setStartTime(val);
                  setCurrentTime(val);
                  if (videoRef.current) {
                    videoRef.current.currentTime = val;
                  }
                }}
                disabled={isProcessing || duration <= 5}
                className="w-full accent-cyan-500 h-2 bg-app-accent rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
              />
            </div>
            
            {duration <= 5 && duration > 0 && (
              <p className="text-xs text-center font-bold text-emerald-500 flex items-center justify-center gap-1.5 pt-1">
                <Sparkles className="w-3.5 h-3.5" />
                Deze video is al 5 seconden of korter. Er hoeft niks afgeknipt te worden!
              </p>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-5 border-t border-app-border bg-app-card/60 backdrop-blur-xl flex justify-end gap-3 shrink-0">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-2xl font-bold text-xs text-app-muted hover:text-app-ink transition-colors disabled:opacity-50 cursor-pointer"
          >
            Annuleren
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleProcess}
            disabled={isProcessing}
            className="px-7 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <ThemedSpinner size="xs" color="#ffffff" />
            ) : (
              <Scissors className="w-4 h-4" />
            )}
            {isProcessing ? 'Knippen...' : 'Gebruik deze 5s clip'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
