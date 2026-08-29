/**
 * Client-Side Video Compressor & Optimizer
 * Uses HTML5 Canvas, MediaStream capture, and MediaRecorder with custom bitrates and frame rates
 * to dramatically reduce video file sizes (typically 80-90% reduction) before uploading/syncing.
 */

export interface VideoCompressionOptions {
  maxDuration?: number; // In seconds (e.g., 5s)
  maxDimension?: number; // In pixels (e.g., 640px)
  videoBitrate?: number; // In bps (e.g., 700,000 = 700kbps)
  audioBitrate?: number; // In bps (e.g., 64,000 = 64kbps)
  fps?: number; // Frames per second (e.g., 24)
  startTime?: number; // In seconds (e.g., 0)
}

/**
 * Compresses a video File, Blob, or data:video Data URL.
 * Returns an optimized data:video URL.
 */
export const compressVideo = async (
  input: File | Blob | string,
  options: VideoCompressionOptions = {}
): Promise<string> => {
  const {
    maxDuration = 5,
    maxDimension = 640,
    videoBitrate = 700_000,
    audioBitrate = 64_000,
    fps = 24,
    startTime = 0,
  } = options;

  return new Promise(async (resolve) => {
    let objectUrlToRevoke: string | null = null;
    let videoSrc = '';

    if (typeof input === 'string') {
      videoSrc = input;
    } else {
      objectUrlToRevoke = URL.createObjectURL(input);
      videoSrc = objectUrlToRevoke;
    }

    const cleanup = () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
        objectUrlToRevoke = null;
      }
    };

    // Safe fallback helper to return original as data URL
    const fallbackOriginal = () => {
      cleanup();
      if (typeof input === 'string') {
        resolve(input);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(typeof reader.result === 'string' ? reader.result : '');
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(input);
      }
    };

    // If MediaRecorder is not supported in the environment, fallback
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
      fallbackOriginal();
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.playsInline = true;
    video.muted = true;
    video.src = videoSrc;

    // Safety timeout: max 15 seconds to compress or fallback
    const timeoutTimer = setTimeout(() => {
      console.warn('Video compression timed out, falling back to original');
      fallbackOriginal();
    }, 15000);

    video.onloadedmetadata = async () => {
      try {
        const origWidth = video.videoWidth || 640;
        const origHeight = video.videoHeight || 360;
        const duration = video.duration || 5;

        // Calculate scaled dimensions (maintaining aspect ratio)
        let targetWidth = origWidth;
        let targetHeight = origHeight;

        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          if (targetWidth >= targetHeight) {
            targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
            targetWidth = maxDimension;
          } else {
            targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
            targetHeight = maxDimension;
          }
        }

        // Ensure even dimensions for video codecs
        targetWidth = Math.max(2, targetWidth - (targetWidth % 2));
        targetHeight = Math.max(2, targetHeight - (targetHeight % 2));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx) {
          clearTimeout(timeoutTimer);
          fallbackOriginal();
          return;
        }

        // Capture stream from canvas
        let stream: MediaStream | null = null;
        if (canvas.captureStream) {
          stream = canvas.captureStream(fps);
        } else if ((video as any).captureStream) {
          stream = (video as any).captureStream();
        } else if ((video as any).mozCaptureStream) {
          stream = (video as any).mozCaptureStream();
        }

        if (!stream) {
          clearTimeout(timeoutTimer);
          fallbackOriginal();
          return;
        }

        // Attempt to connect audio track from video
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const audioCtx = new AudioCtx();
            const source = audioCtx.createMediaElementSource(video);
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest);
            source.connect(audioCtx.destination);
            dest.stream.getAudioTracks().forEach((track) => stream?.addTrack(track));
          }
        } catch (audioErr) {
          console.warn('Audio capture note in compressVideo:', audioErr);
        }

        // Select optimal MIME type
        const mimeCandidates = [
          'video/mp4;codecs=avc1',
          'video/mp4',
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=h264',
          'video/webm',
          '',
        ];

        let selectedMime = '';
        if (MediaRecorder.isTypeSupported) {
          for (const m of mimeCandidates) {
            if (!m) break;
            if (MediaRecorder.isTypeSupported(m)) {
              selectedMime = m;
              break;
            }
          }
        }

        const recorderOptions: MediaRecorderOptions = {
          mimeType: selectedMime || undefined,
          videoBitsPerSecond: videoBitrate,
          audioBitsPerSecond: audioBitrate,
        };

        const mediaRecorder = new MediaRecorder(stream, recorderOptions);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          clearTimeout(timeoutTimer);
          cleanup();
          const outputMime = selectedMime.includes('mp4') ? 'video/mp4' : 'video/webm';
          const blob = new Blob(chunks, { type: outputMime });
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              fallbackOriginal();
            }
          };
          reader.onerror = () => fallbackOriginal();
          reader.readAsDataURL(blob);
        };

        const trimDuration = Math.min(maxDuration, Math.max(0.5, duration - startTime));

        let animationFrameId: number;
        const drawFrameLoop = () => {
          if (ctx && video && !video.paused && !video.ended) {
            try {
              ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            } catch {}
          }
          animationFrameId = requestAnimationFrame(drawFrameLoop);
        };

        video.currentTime = startTime;
        video.muted = true;

        const onSeekedForRecord = () => {
          video.removeEventListener('seeked', onSeekedForRecord);
          drawFrameLoop();
          mediaRecorder.start(100);
          video.play().catch(() => {});

          setTimeout(() => {
            cancelAnimationFrame(animationFrameId);
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
            video.pause();
            video.muted = false;
          }, trimDuration * 1000);
        };

        video.addEventListener('seeked', onSeekedForRecord);
      } catch (err) {
        clearTimeout(timeoutTimer);
        console.warn('Error during video compression processing:', err);
        fallbackOriginal();
      }
    };

    video.onerror = () => {
      clearTimeout(timeoutTimer);
      fallbackOriginal();
    };
  });
};
