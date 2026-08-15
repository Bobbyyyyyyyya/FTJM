import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected';

export interface CallData {
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  targetId: string;
  targetName?: string;
  targetAvatar?: string;
  room?: string;
  isVideo?: boolean;
}

export type CallLayout = 'compact' | 'large';

export function useVoiceCall(user: any, profile: any, supabaseClient: any) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCall, setActiveCall] = useState<CallData | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isRemoteVideoMuted, setIsRemoteVideoMuted] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [layout, setLayout] = useState<CallLayout>('large');
  const [isInitiator, setIsInitiator] = useState(false);
  const [callCooldownUntil, setCallCooldownUntil] = useState<number | null>(null);
  const [subVersion, setSubVersion] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteScreenSharing, setIsRemoteScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Auto-refresh signaling connection on focus or visibility change to bypass mobile/PWA background socket throttling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Realtime] App/Tab became visible. Verifying Supabase Realtime Socket...');
        if (supabaseClient.realtime && typeof supabaseClient.realtime.isConnected === 'function') {
          if (!supabaseClient.realtime.isConnected() && typeof supabaseClient.realtime.connect === 'function') {
            console.warn('[Realtime] Socket was disconnected. Forcing immediate reconnection.');
            supabaseClient.realtime.connect();
          }
        }
        setSubVersion(prev => prev + 1);
      }
    };

    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('focus', handleFocusOrVisible);

    return () => {
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
    };
  }, [supabaseClient]);
  
  const callStartTimeRef = useRef<number | 0>(0);
  const callAttemptHistoryRef = useRef<number[]>([]);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null); // Inbound channel
  const outboundChannelRef = useRef<any>(null); // Outbound channel
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const dialingSoundRef = useRef<HTMLAudioElement | null>(null);

  // We need an audio element to play the remote stream
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const incomingSoundRef = useRef<HTMLAudioElement | null>(null);
  const endCallSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const defaultRingtone = '/audio/ringtones/skype_ringtone_new.mp3';
    const ringtoneUrl = profile?.notification_settings?.ringtone_url || defaultRingtone;
    
    if (incomingSoundRef.current) {
      incomingSoundRef.current.pause();
    }
    
    incomingSoundRef.current = new Audio(ringtoneUrl);
    incomingSoundRef.current.loop = true;
    
    dialingSoundRef.current = new Audio('/audio/calls/dialing.mp3');
    dialingSoundRef.current.loop = true;

    endCallSoundRef.current = new Audio('/audio/calls/end_call.mp3');
    
    return () => {
      [incomingSoundRef, dialingSoundRef, endCallSoundRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current = null;
        }
      });
    };
  }, [profile?.notification_settings?.ringtone_url]);

  const cleanupCall = (shouldPlayEndSound = true) => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      screenStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsVideoCall(false);
    setIsVideoMuted(false);
    setIsRemoteVideoMuted(false);
    setIsScreenSharing(false);
    setIsRemoteScreenSharing(false);
    (window as any)._originalCameraTrack = null;

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsInitiator(false);
    
    if (incomingSoundRef.current) {
      incomingSoundRef.current.pause();
      incomingSoundRef.current.currentTime = 0;
    }
    if (dialingSoundRef.current) {
      dialingSoundRef.current.pause();
      dialingSoundRef.current.currentTime = 0;
    }

    if (shouldPlayEndSound && endCallSoundRef.current) {
       endCallSoundRef.current.currentTime = 0;
       endCallSoundRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (outboundChannelRef.current) {
      supabaseClient.removeChannel(outboundChannelRef.current);
      outboundChannelRef.current = null;
    }
    lastIncomingOfferRef.current = null;

    // Check for spam behavior (calling and hanging up too fast)
    const now = Date.now();
    const duration = callStartTimeRef.current > 0 ? (now - callStartTimeRef.current) / 1000 : 0;
    
    // If call was in calling/ringing state or connected for less than 3 seconds
    if (isInitiator && (callState === 'calling' || callState === 'ringing' || (callState === 'connected' && duration < 3))) {
      const recentAttempts = callAttemptHistoryRef.current.filter(t => now - t < 30000);
      recentAttempts.push(now);
      callAttemptHistoryRef.current = recentAttempts;

      if (recentAttempts.length >= 3) {
        const timeout = now + 60000; // 1 minute timeout
        setCallCooldownUntil(timeout);
        toast.error('Je belt te vaak achter elkaar. Wacht een minuut.', { icon: '⏳' });
      }
    }

    callStartTimeRef.current = 0;
    setCallState('idle');
    setActiveCall(null);
    setIsMuted(false);
  };

  const outboundChannelPromiseRef = useRef<Promise<any> | null>(null);
  const processedSignalsRef = useRef<Set<string>>(new Set());

  // Cleanup processed signals periodically
  useEffect(() => {
    const interval = setInterval(() => {
      processedSignalsRef.current.clear();
    }, 30000); // Clear every 30s
    return () => clearInterval(interval);
  }, []);

  const getOutboundChannel = async (targetId: string) => {
    const topic = `calls:${targetId}`;

    // Force connect socket if disconnected
    if (supabaseClient.realtime && typeof supabaseClient.realtime.isConnected === 'function') {
      if (!supabaseClient.realtime.isConnected() && typeof supabaseClient.realtime.connect === 'function') {
        console.warn('[Realtime] Realtime socket disconnected during outbound call creation. Reconnecting instantly...');
        supabaseClient.realtime.connect();
      }
    }

    if (outboundChannelRef.current && (outboundChannelRef.current.topic === topic || outboundChannelRef.current.topic === `realtime:${topic}`)) {
      return outboundChannelRef.current;
    }

    if (outboundChannelRef.current) {
      supabaseClient.removeChannel(outboundChannelRef.current);
      outboundChannelRef.current = null;
    }

    console.log(`[Realtime] Creating outbound channel: ${topic}`);
    const channel = supabaseClient.channel(topic, {
      config: {
        broadcast: { self: false, ack: false }
      }
    });

    outboundChannelRef.current = channel;

    return new Promise<any>((resolve) => {
      let resolved = false;
      channel.subscribe((status: string) => {
        console.log(`[Realtime] Outbound channel ${topic} status: ${status}`);
        if (status === 'SUBSCRIBED' && !resolved) {
          resolved = true;
          resolve(channel);
        }
      });
      // Safety timeout so we don't stick forever if subscription stalls
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(channel);
        }
      }, 1500);
    });
  };

  const sendSignalingMessage = async (targetId: string, event: string, payload: any, retryCount = 0) => {
    try {
      const msgId = `${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const channel: any = await getOutboundChannel(targetId);
      
      const response = await channel.send({
        type: 'broadcast',
        event: event,
        payload: { ...payload, msgId, senderId: user?.uid }
      });

      if (response === 'ok') {
        console.log(`Signaling [${event}] sent successfully, msgId: ${msgId}`);
      } else {
        console.warn(`Signaling [${event}] failed with status: ${response}. Retry: ${retryCount}/3`);
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 500));
          return sendSignalingMessage(targetId, event, payload, retryCount + 1);
        }
      }
    } catch (err) {
      console.error(`Failed to send signaling message [${event}]`, err);
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return sendSignalingMessage(targetId, event, payload, retryCount + 1);
      }
    }
  };

  const setupPeerConnection = (targetUserId: string, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all',
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Candidate type:', event.candidate.type, 'Protocol:', event.candidate.protocol);
        // Send under both event names for maximum client compatibility
        sendSignalingMessage(targetUserId, 'ice_candidate', {
          targetId: targetUserId,
          senderId: user.uid,
          candidate: event.candidate
        });
        sendSignalingMessage(targetUserId, 'candidate', {
          targetId: targetUserId,
          senderId: user.uid,
          candidate: event.candidate
        });
      } else {
        console.log('ICE gathering complete for this description');
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('ICE Gathering State:', pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        console.warn('ICE Connection failed. Attempting to restart ICE...');
        pc.restartIce();
        
        // Give it 5 seconds to recover before closing
        setTimeout(() => {
          if (pc.iceConnectionState === 'failed') {
            console.error('ICE Connection failed permanently.');
            toast.error('Verbinding mislukt (Netwerk beperking)');
            cleanupCall();
          }
        }, 5000);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Peer Connection State:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        console.log('Voice call established successfully!');
        toast.success('Verbonden');
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind, 'ReadyState:', event.track.readyState);
      
      let stream = event.streams[0];
      
      // We reconstruct a new MediaStream instance combining all received tracks.
      // This forces React to perceive a reference change, which in turn causes the
      // remote VideoStream component to re-render and play the stream correctly.
      const tracks = stream ? stream.getTracks() : [event.track];
      if (tracks.indexOf(event.track) === -1) {
        tracks.push(event.track);
      }
      const freshStream = new MediaStream(tracks);
      
      remoteStreamRef.current = freshStream;
      setRemoteStream(freshStream);
      
      // Auto-enable video UI if a video track is discovered in the stream
      const hasVideo = freshStream.getVideoTracks().length > 0;
      if (hasVideo) {
        setIsVideoCall(true);
      }
      
      if (remoteAudioRef.current) {
        const audioElement = remoteAudioRef.current;
        console.log('Attaching stream to audio element');
        
        if (audioElement.srcObject !== freshStream) {
          audioElement.srcObject = freshStream;
        }
        
        audioElement.muted = false;
        audioElement.volume = 1.0;

        // Force enable tracks
        freshStream.getAudioTracks().forEach(track => {
          track.enabled = true;
        });

        const playAudio = async () => {
          try {
            await audioElement.play();
            console.log('Audio playback started');
          } catch (e) {
            console.warn('Audio playback failed:', e);
          }
        };
        playAudio();
      }
    };

    if (localStreamRef.current) {
      console.log('Adding local tracks to PeerConnection');
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          console.log('Adding local track:', track.kind);
          pc.addTrack(track, localStreamRef.current);
        }
      });
    } else {
      console.warn('No local stream found when setting up PeerConnection');
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const callStateRef = useRef(callState);
  const activeCallRef = useRef(activeCall);
  const lastIncomingOfferRef = useRef<string | null>(null);
  
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // Subscribe to incoming calls and signaling
  useEffect(() => {
    if (!user) return;

    // Force connect socket if disconnected
    if (supabaseClient.realtime && typeof supabaseClient.realtime.isConnected === 'function') {
      if (!supabaseClient.realtime.isConnected() && typeof supabaseClient.realtime.connect === 'function') {
        console.warn('[Realtime] Inbound connection is disconnected. Reconnecting instantly...');
        supabaseClient.realtime.connect();
      }
    }

    const channel = supabaseClient.channel(`calls:${user.uid}`, {
      config: {
        broadcast: { self: false, ack: false }
      }
    });

    channel.on('broadcast', { event: 'call_offer' }, async (eventObj) => {
      console.log('Received broadcast [call_offer] eventObj:', eventObj);
      try {
        const payload = eventObj.payload || eventObj;
        if (!payload) return;
        
        // Signaling deduplication & Self-filter
        if (payload.senderId === user.uid) return;
        if (payload.msgId && processedSignalsRef.current.has(payload.msgId)) return;
        if (payload.msgId) processedSignalsRef.current.add(payload.msgId);

        if (lastIncomingOfferRef.current === payload.msgId && callStateRef.current !== 'idle') {
            return;
        }
        lastIncomingOfferRef.current = payload.msgId;

        if (callStateRef.current !== 'idle') {
          const currentActiveCall = activeCallRef.current;
          if (currentActiveCall && currentActiveCall.callerId === payload.callerId) {
            console.log('Ignored duplicate call offer from same caller');
            return; // Ignore duplicate
          }
          
          console.log('User is busy, sending call_busy. Current state:', callStateRef.current);
          // Busy
          sendSignalingMessage(payload.callerId, 'call_busy', {
            callerId: payload.callerId,
            targetId: user.uid
          });
          return;
        }

        pendingCandidatesRef.current = [];
        setIsVideoCall(!!payload.isVideo);
        setActiveCall({
          callerId: payload.callerId,
          callerName: payload.callerName,
          callerAvatar: payload.callerAvatar,
          targetId: user.uid,
          isVideo: !!payload.isVideo
        });
        setCallState('ringing');
        setLayout('large'); // Always start incoming calls in large layout
        setIsInitiator(false);
        
        if (incomingSoundRef.current) {
          incomingSoundRef.current.currentTime = 0;
          incomingSoundRef.current.play().catch(e => console.warn('Incoming sound failed to play auto-unlocked:', e));
        }
        
        // Store the offer to be processed when accepted
        (window as any)._pendingCallOffer = payload.offer || payload;
      } catch (err) {
        console.error('Error in call_offer handler:', err);
      }
    })
    .on('broadcast', { event: 'incoming_call' }, async (eventObj) => {
      console.log('Received broadcast [incoming_call] eventObj:', eventObj);
      try {
        const payload = eventObj.payload || eventObj;
        if (!payload) return;

        // Compatibility with other app
        const callerId = payload.callerId || payload.senderId;
        if (!callerId) {
          console.warn('No callerId found in incoming_call:', payload);
          return;
        }
        if (callerId === user.uid) return;
        if (payload.msgId && processedSignalsRef.current.has(payload.msgId)) return;
        if (payload.msgId) processedSignalsRef.current.add(payload.msgId);

        console.log('Handling incoming_call event with payload:', payload);
        toast.success(`Inkomend gesprek gedetecteerd van: ${payload.callerName || 'Onbekende Beller'}`);

        if (callStateRef.current !== 'idle') {
          const currentActiveCall = activeCallRef.current;
          if (currentActiveCall && currentActiveCall.callerId === callerId) {
            console.log('Ignored duplicate incoming_call from same caller');
            return;
          }
          console.log('User is busy, sending call_busy/busy. Current state:', callStateRef.current);
          sendSignalingMessage(callerId, 'call_busy', { callerId, targetId: user.uid });
          sendSignalingMessage(callerId, 'busy', { callerId, targetId: user.uid });
          return;
        }

        pendingCandidatesRef.current = [];
        setIsVideoCall(!!payload.isVideo);
        setActiveCall({
          callerId: callerId,
          callerName: payload.callerName || 'Onbekende Beller',
          callerAvatar: payload.callerAvatar,
          targetId: user.uid,
          isVideo: !!payload.isVideo,
          room: payload.roomId
        });
        setCallState('ringing');
        setLayout('large');
        setIsInitiator(false);

        if (incomingSoundRef.current) {
          incomingSoundRef.current.currentTime = 0;
          incomingSoundRef.current.play().catch(e => console.warn('Incoming sound failed to play for incoming_call:', e));
        }

        // Store any embedded WebRTC offer or SDP from incoming_call
        if (payload.offer || payload.sdp || payload.type === 'offer') {
          (window as any)._pendingCallOffer = payload.offer || payload;
          console.log('Stored embedded WebRTC description from incoming_call:', (window as any)._pendingCallOffer);
        }
      } catch (err) {
        console.error('Error in incoming_call handler:', err);
      }
    })
    .on('broadcast', { event: 'offer' }, async (eventObj) => {
      console.log('Received broadcast [offer] eventObj:', eventObj);
      try {
        const payload = eventObj.payload || eventObj;
        if (!payload) return;

        // Compatibility with other app (SDP Offer)
        const senderId = payload.senderId || payload.callerId;
        if (senderId === user.uid) return;
        if (payload.msgId && processedSignalsRef.current.has(payload.msgId)) return;
        if (payload.msgId) processedSignalsRef.current.add(payload.msgId);

        console.log('Received WebRTC [offer] event:', payload);
        
        const pc = peerConnectionRef.current;
        if (pc && callStateRef.current === 'connected') {
          console.log('In-call renegotiation offer received! Processing immediately...');
          const sdpOffer = payload.offer || payload;
          await pc.setRemoteDescription(new RTCSessionDescription(sdpOffer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          sendSignalingMessage(senderId, 'answer', {
            answer,
            senderId: user.uid,
            targetId: senderId
          });

          // Check if video is active after renegotiation finishes
          setTimeout(() => {
            const hasVideo = pc.getReceivers().some(r => r.track && r.track.kind === 'video' && r.track.readyState === 'live');
            setIsVideoCall(hasVideo);
          }, 500);
          return;
        }

        toast.info('RTC sdp-aanbod (offer) ontvangen van beller...');
        // Store the offer (payload itself might be the description, or inside payload.offer)
        (window as any)._pendingCallOffer = payload.offer || payload;
      } catch (err) {
        console.error('Error in offer handler:', err);
      }
    })
    .on('broadcast', { event: 'call_answer' }, async (eventObj) => {
      console.log('Received broadcast [call_answer] eventObj:', eventObj);
      try {
        const payload = eventObj.payload || eventObj;
        if (!payload) return;
        if (payload.senderId === user.uid) return;
        if (payload.msgId && processedSignalsRef.current.has(payload.msgId)) return;
        if (payload.msgId) processedSignalsRef.current.add(payload.msgId);

        console.log('Received call_answer. SignalingState:', peerConnectionRef.current?.signalingState);
        const pc = peerConnectionRef.current;
        
        if (!pc) {
          console.warn('Received call_answer but no PeerConnection exists');
          return;
        }

        if (pc.signalingState === 'have-local-offer' || pc.signalingState === 'have-remote-pranswer') {
          console.log('Setting remote description (answer)');
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer || payload));
          setCallState('connected');
          callStartTimeRef.current = Date.now();
          
          if (dialingSoundRef.current) {
            dialingSoundRef.current.pause();
            dialingSoundRef.current.currentTime = 0;
          }
          
          // Wait briefly for candidates from the answer side
          await new Promise(resolve => setTimeout(resolve, 300));

          // Apply queued candidates
          const candidates = [...pendingCandidatesRef.current];
          console.log(`Applying ${candidates.length} queued ICE candidates (initiator side)`);
          pendingCandidatesRef.current = [];
          for (const c of candidates) {
            try {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(c));
              }
            } catch (e) {
              console.error('Failed to add queued candidate on initiator side', e);
            }
          }
        } else if (pc.signalingState === 'stable') {
          console.log('Connection already stable, answer ignored');
        } else {
          console.warn('Received call_answer but PeerConnection in state:', pc.signalingState);
        }
      } catch (err) {
        console.error("Error setting remote answer", err);
      }
    })
    .on('broadcast', { event: 'answer' }, async (eventObj) => {
      console.log('Received broadcast [answer] eventObj:', eventObj);
      try {
        const payload = eventObj.payload || eventObj;
        if (!payload) return;
        if (payload.senderId === user.uid) return;
        if (payload.msgId && processedSignalsRef.current.has(payload.msgId)) return;
        if (payload.msgId) processedSignalsRef.current.add(payload.msgId);

        console.log('Received external [answer] event:', payload);
        const pc = peerConnectionRef.current;
        if (!pc) {
          console.warn('Received answer but no PeerConnection exists');
          return;
        }

        if (pc.signalingState === 'have-local-offer' || pc.signalingState === 'have-remote-pranswer') {
          const sdpObj = payload.answer || payload;
          await pc.setRemoteDescription(new RTCSessionDescription(sdpObj));
          setCallState('connected');
          callStartTimeRef.current = Date.now();

          if (dialingSoundRef.current) {
            dialingSoundRef.current.pause();
            dialingSoundRef.current.currentTime = 0;
          }

          await new Promise(resolve => setTimeout(resolve, 300));
          const candidates = [...pendingCandidatesRef.current];
          pendingCandidatesRef.current = [];
          for (const c of candidates) {
            try {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(c));
              }
            } catch (e) {
              console.error('Failed to add queued candidate on initiator side (alternative answer)', e);
            }
          }
        }
      } catch (err) {
        console.error('Error setting remote answer (alternative)', err);
      }
    })
    .on('broadcast', { event: 'ice_candidate' }, async (eventObj) => {
      console.log('Received broadcast [ice_candidate] eventObj:', eventObj);
      try {
        const payload = eventObj.payload || eventObj;
        if (!payload) return;
        if (payload.senderId === user.uid) return;
        if (payload.msgId && processedSignalsRef.current.has(payload.msgId)) return;
        if (payload.msgId) processedSignalsRef.current.add(payload.msgId);
        
        console.log('Received ICE candidate from peer');
        const candidateObj = payload.candidate || payload;
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type && pc.signalingState !== 'closed') {
          await pc.addIceCandidate(new RTCIceCandidate(candidateObj));
          console.log('ICE candidate applied successfully');
        } else {
          console.log('ICE candidate queued (Waiting for remote description)');
          pendingCandidatesRef.current.push(candidateObj);
        }
      } catch (err) {
        console.error("Error adding ice candidate", err);
      }
    })
    .on('broadcast', { event: 'candidate' }, async (eventObj) => {
      console.log('Received broadcast [candidate] eventObj:', eventObj);
      try {
        const payload = eventObj.payload || eventObj;
        if (!payload) return;
        if (payload.senderId === user.uid) return;
        if (payload.msgId && processedSignalsRef.current.has(payload.msgId)) return;
        if (payload.msgId) processedSignalsRef.current.add(payload.msgId);

        console.log('Received external [candidate] event:', payload);
        const candidateObj = payload.candidate || payload;
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type && pc.signalingState !== 'closed') {
          await pc.addIceCandidate(new RTCIceCandidate(candidateObj));
          console.log('Alternative ICE candidate applied successfully');
        } else {
          console.log('Alternative ICE candidate queued (Waiting for remote description)');
          pendingCandidatesRef.current.push(candidateObj);
        }
      } catch (err) {
        console.error("Error adding ice candidate (candidate)", err);
      }
    })
    .on('broadcast', { event: 'call_rejected' }, (eventObj) => {
      console.log('Received broadcast [call_rejected] eventObj:', eventObj);
      const payload = eventObj?.payload || eventObj || {};
      if (payload.senderId === user.uid) return;
      toast.error('Oproep geweigerd');
      cleanupCall();
    })
    .on('broadcast', { event: 'reject' }, (eventObj) => {
      console.log('Received broadcast [reject] eventObj:', eventObj);
      const payload = eventObj?.payload || eventObj || {};
      if (payload.senderId === user.uid) return;
      toast.error('Oproep geweigerd');
      cleanupCall();
    })
    .on('broadcast', { event: 'call_busy' }, (eventObj) => {
      console.log('Received broadcast [call_busy] eventObj:', eventObj);
      const payload = eventObj?.payload || eventObj || {};
      if (payload.senderId === user.uid) return;
      toast.error('Gebruiker is in gesprek');
      cleanupCall();
    })
    .on('broadcast', { event: 'busy' }, (eventObj) => {
      console.log('Received broadcast [busy] eventObj:', eventObj);
      const payload = eventObj?.payload || eventObj || {};
      if (payload.senderId === user.uid) return;
      toast.error('Gebruiker is in gesprek');
      cleanupCall();
    })
    .on('broadcast', { event: 'call_ended' }, (eventObj) => {
      console.log('Received broadcast [call_ended] eventObj:', eventObj);
      const payload = eventObj?.payload || eventObj || {};
      if (payload.senderId === user.uid) return;
      toast.info('Gesprek beëindigd');
      cleanupCall();
    })
    .on('broadcast', { event: 'ended' }, (eventObj) => {
      console.log('Received broadcast [ended] eventObj:', eventObj);
      const payload = eventObj?.payload || eventObj || {};
      if (payload.senderId === user.uid) return;
      toast.info('Gesprek beëindigd');
      cleanupCall();
    })
    .on('broadcast', { event: 'hangup' }, (eventObj) => {
      console.log('Received broadcast [hangup] eventObj:', eventObj);
      const payload = eventObj?.payload || eventObj || {};
      if (payload.senderId === user.uid) return;
      toast.info('Gesprek beëindigd');
      cleanupCall();
    })
    .on('broadcast', { event: 'video_status' }, (eventObj) => {
      console.log('Received broadcast [video_status] eventObj:', eventObj);
      const payload = eventObj?.payload || eventObj || {};
      if (payload.senderId === user.uid) return;
      setIsRemoteVideoMuted(!!payload.isVideoMuted);
    })
    .on('broadcast', { event: 'screenshare_status' }, (eventObj) => {
      console.log('Received broadcast [screenshare_status] eventObj:', eventObj);
      const payload = eventObj?.payload || eventObj || {};
      if (payload.senderId === user.uid) return;
      const sharing = !!payload.isScreenSharing;
      setIsRemoteScreenSharing(sharing);
      if (sharing) {
        setIsVideoCall(true);
        toast.info(`Beller deelt nu het scherm`);
      } else {
        toast.info(`Beller is gestopt met scherm delen`);
      }
    })
    .subscribe((status: string, err?: any) => {
      console.log(`[Realtime] Inbound channel status: ${status}`, err ? err : '');
      if (status === 'CHANNEL_ERROR') {
        console.info('[Realtime] WebSocket connection failed. Signaling will fallback to REST (slower).');
      }
    });

    channelRef.current = channel;

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user, supabaseClient, subVersion]);

  const initiateCall = async (targetId: string, targetName: string, targetAvatar?: string, isVideo = false) => {
    try {
      const now = Date.now();
      if (callCooldownUntil && now < callCooldownUntil) {
        const remaining = Math.ceil((callCooldownUntil - now) / 1000);
        toast.error(`Wacht nog ${remaining} seconden voordat je weer belt.`, { icon: '⏳' });
        return;
      }

      console.log('Initiating call to:', targetId, 'isVideo:', isVideo);
      setIsVideoCall(isVideo);
      setIsVideoMuted(false);

      // Safari Autoplay Fix: Unlock audio element early
      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(() => {});
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Bellen is niet ondersteund in deze browser of via een onbeveiligde verbinding r.o. HTTP.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: isVideo ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } : false
      });
      
      console.log('Local stream captured. Tracks:', stream.getTracks().length);
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      setCallState('calling');
      callStartTimeRef.current = Date.now();
      if (dialingSoundRef.current) {
        dialingSoundRef.current.currentTime = 0;
        dialingSoundRef.current.play().catch(e => console.warn('Dialing sound failed:', e));
      }

      setActiveCall({
        callerId: user.uid,
        callerName: (profile?.display_name || user?.displayName || 'Anoniem').trim(),
        callerAvatar: profile?.photo_url || user?.photoURL,
        targetId,
        targetName,
        targetAvatar,
        isVideo
      });
      setLayout('compact'); // Start outgoing calls in compact layout by default
      setIsInitiator(true);
      
      const pc = setupPeerConnection(targetId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('Local offer created and set. SignalingState:', pc.signalingState);

      sendSignalingMessage(targetId, 'call_offer', {
        callerId: user.uid,
        callerName: (profile?.display_name || user?.displayName || 'Anoniem').trim(),
        callerAvatar: profile?.photo_url || user?.photoURL,
        offer,
        isVideo
      });
    } catch (err) {
      console.error("Error initiating call:", err);
      toast.error("Kan camera of microfoon niet openen. Controleer permissies.");
      cleanupCall();
    }
  };

  const acceptCall = async () => {
    if (!activeCall) return;
    
    // Stop ringing sound immediately
    if (incomingSoundRef.current) {
      incomingSoundRef.current.pause();
      incomingSoundRef.current.currentTime = 0;
    }

    try {
      console.log('Accepting call from:', activeCall.callerId, 'isVideo:', activeCall.isVideo);
      const isVideo = !!activeCall.isVideo;
      setIsVideoCall(isVideo);
      setIsVideoMuted(false);
      
      // Safari Autoplay Fix: Play the audio element during user interaction to unlock it
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        const unlockPlay = remoteAudioRef.current.play();
        if (unlockPlay !== undefined) {
          unlockPlay.catch(() => {
            console.log('Audio element wait for unlock');
          });
        }
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Kan microfoon niet openen. WebRTC bellen is niet ondersteund.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: isVideo ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        } : false
      });
      
      console.log('Local stream captured on receiver side. Tracks:', stream.getTracks().length);
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      const pc = setupPeerConnection(activeCall.callerId, false);
      let offer = (window as any)._pendingCallOffer;
      console.log('Inspecting pending call offer:', offer);
      if (offer) {
        if (typeof offer === 'string') {
          offer = { type: 'offer', sdp: offer };
        } else if (offer.sdp && offer.type) {
          offer = { type: offer.type.toLowerCase(), sdp: offer.sdp };
        } else if (offer.sdp && !offer.type) {
          offer = { type: 'offer', sdp: offer.sdp };
        } else if (offer.offer) {
          if (typeof offer.offer === 'string') {
            offer = { type: 'offer', sdp: offer.offer };
          } else if (offer.offer.sdp) {
            offer = { type: offer.offer.type ? offer.offer.type.toLowerCase() : 'offer', sdp: offer.offer.sdp };
          }
        }

        console.log('Setting remote description (offer). Current SignalingState:', pc.signalingState);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('Remote description set. New SignalingState:', pc.signalingState);
        
        // Wait for a bit more candidates to arrive and for things to settle
        await new Promise(resolve => setTimeout(resolve, 300));

        // Apply queued candidates
        const candidates = [...pendingCandidatesRef.current];
        console.log(`Applying ${candidates.length} queued ICE candidates`);
        pendingCandidatesRef.current = [];
        for (const c of candidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {
            console.error('Failed to add queued candidate', e);
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('Local answer created and set. Final SignalingState:', pc.signalingState);

        const answerPayload = {
          answer,
          senderId: user.uid,
          targetId: activeCall.callerId
        };

        // Send under both event names for maximum client compatibility
        sendSignalingMessage(activeCall.callerId, 'call_answer', answerPayload);
        sendSignalingMessage(activeCall.callerId, 'answer', {
          ...answerPayload,
          type: answer.type,
          sdp: answer.sdp
        });
        
        setCallState('connected');
        callStartTimeRef.current = Date.now();
        (window as any)._pendingCallOffer = null;
      }
    } catch (err) {
      console.error("Error accepting call:", err);
      toast.error("Kan camera of microfoon niet openen. Controleer permissies.");
      rejectCall();
    }
  };

  const rejectCall = async () => {
    if (!activeCall) return;
    
    const targetId = activeCall.callerId === user.uid ? activeCall.targetId : activeCall.callerId;
    sendSignalingMessage(targetId, 'call_rejected', { senderId: user.uid });
    sendSignalingMessage(targetId, 'reject', { senderId: user.uid });
    
    cleanupCall();
  };

  const endCall = async () => {
    if (!activeCall) return;
    
    const targetId = activeCall.callerId === user.uid ? activeCall.targetId : activeCall.callerId;
    sendSignalingMessage(targetId, 'call_ended', { senderId: user.uid });
    sendSignalingMessage(targetId, 'ended', { senderId: user.uid });
    sendSignalingMessage(targetId, 'hangup', { senderId: user.uid });
    
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStreamRef.current.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      const newMuted = !isVideoMuted;
      setIsVideoMuted(newMuted);
      
      const targetId = activeCallRef.current?.callerId === user.uid ? activeCallRef.current?.targetId : activeCallRef.current?.callerId;
      if (targetId) {
        sendSignalingMessage(targetId, 'video_status', { isVideoMuted: newMuted });
      }
    }
  };

  const startScreenShare = async () => {
    if (callState !== 'connected' || !activeCall) {
      toast.error('Je kunt alleen het scherm delen tijdens een actief gesprek.');
      return;
    }

    try {
      console.log('Starting screen share via getDisplayMedia...');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor",
          logicalSurface: true
        } as any,
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      setLayout('compact');
      
      const screenVideoTrack = stream.getVideoTracks()[0];
      
      screenVideoTrack.onended = () => {
        console.log('Screenshare ended natively from browser control');
        stopScreenShare();
      };

      const pc = peerConnectionRef.current;
      if (pc) {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');

        if (videoSender) {
          if (localStreamRef.current) {
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            if (camTrack) {
              (window as any)._originalCameraTrack = camTrack;
            }
          }
          await videoSender.replaceTrack(screenVideoTrack);
          console.log('Replaced local camera track with screen share track');
          
          const audioTrack = localStreamRef.current?.getAudioTracks()[0];
          const newLocalStream = new MediaStream([screenVideoTrack]);
          if (audioTrack) newLocalStream.addTrack(audioTrack);
          setLocalStream(newLocalStream);
        } else {
          console.log('No camera track found. Upgrading call with new screen share video track...');
          pc.addTrack(screenVideoTrack, stream);
          
          const audioTrack = localStreamRef.current?.getAudioTracks()[0];
          const newLocalStream = new MediaStream([screenVideoTrack]);
          if (audioTrack) newLocalStream.addTrack(audioTrack);
          setLocalStream(newLocalStream);
          setIsVideoCall(true);

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          const targetId = activeCall.callerId === user.uid ? activeCall.targetId : activeCall.callerId;
          sendSignalingMessage(targetId, 'offer', {
            offer,
            senderId: user.uid,
            targetId,
            isVideo: true
          });
        }
        
        const targetId = activeCall.callerId === user.uid ? activeCall.targetId : activeCall.callerId;
        sendSignalingMessage(targetId, 'screenshare_status', { isScreenSharing: true });
      }
      toast.success('Scherm delen gestart');
    } catch (err) {
      console.error('Error starting screen share:', err);
      toast.error('Scherm delen mislukt of geannuleerd');
      setIsScreenSharing(false);
    }
  };

  const stopScreenShare = async () => {
    console.log('Stopping screen share...');
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    setLayout('large');

    const pc = peerConnectionRef.current;
    if (pc) {
      const senders = pc.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      const originalCamTrack = (window as any)._originalCameraTrack;

      if (videoSender && originalCamTrack && originalCamTrack.readyState === 'live') {
        await videoSender.replaceTrack(originalCamTrack);
        console.log('Restored original camera track');
        
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        const newLocalStream = new MediaStream([originalCamTrack]);
        if (audioTrack) newLocalStream.addTrack(audioTrack);
        setLocalStream(newLocalStream);
      } else {
        console.log('Removing screenshare track, restoring audio-only mode');
        if (videoSender) {
          try {
            pc.removeTrack(videoSender);
          } catch (e) {
            console.warn('Failed to remove track:', e);
          }
        }
        
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack) {
          const newLocalStream = new MediaStream([audioTrack]);
          setLocalStream(newLocalStream);
        } else {
          setLocalStream(null);
        }
        
        if (!originalCamTrack) {
          setIsVideoCall(false);
        }

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        const targetId = activeCallRef.current?.callerId === user.uid ? activeCallRef.current?.targetId : activeCallRef.current?.callerId;
        if (targetId) {
          sendSignalingMessage(targetId, 'offer', {
            offer,
            senderId: user.uid,
            targetId,
            isVideo: !!originalCamTrack
          });
        }
      }

      const targetId = activeCallRef.current?.callerId === user.uid ? activeCallRef.current?.targetId : activeCallRef.current?.callerId;
      if (targetId) {
        sendSignalingMessage(targetId, 'screenshare_status', { isScreenSharing: false });
      }
    }
    (window as any)._originalCameraTrack = null;
    toast.info('Scherm delen beëindigd');
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  return {
    callState,
    activeCall,
    isMuted,
    isVideoMuted,
    isRemoteVideoMuted,
    isVideoCall,
    localStream,
    remoteStream,
    remoteAudioRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    layout,
    setLayout,
    isInitiator,
    callCooldownUntil,
    isScreenSharing,
    isRemoteScreenSharing,
    toggleScreenShare
  };
}
