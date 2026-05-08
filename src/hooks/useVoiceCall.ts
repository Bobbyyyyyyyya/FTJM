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
}

export type CallLayout = 'compact' | 'large';

export function useVoiceCall(user: any, profile: any, supabaseClient: any) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [activeCall, setActiveCall] = useState<CallData | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [layout, setLayout] = useState<CallLayout>('large');
  const [isInitiator, setIsInitiator] = useState(false);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null); // Inbound channel
  const outboundChannelRef = useRef<any>(null); // Outbound channel
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // We need an audio element to play the remote stream
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const incomingSoundRef = useRef<HTMLAudioElement | null>(null);
  const endCallSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    incomingSoundRef.current = new Audio('https://www.image2url.com/r2/default/audio/1778154498754-b7ccab40-dfb2-4e0d-9748-a6edc19e720f.mp3');
    incomingSoundRef.current.loop = true;
    
    endCallSoundRef.current = new Audio('https://www.image2url.com/r2/default/audio/1778154897391-0eb0695d-b4bc-41be-bf5d-a09441cc3af6.mp3');
    
    return () => {
      if (incomingSoundRef.current) {
        incomingSoundRef.current.pause();
        incomingSoundRef.current = null;
      }
      if (endCallSoundRef.current) {
        endCallSoundRef.current.pause();
        endCallSoundRef.current = null;
      }
    };
  }, []);

  const cleanupCall = (shouldPlayEndSound = true) => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsInitiator(false);
    if (incomingSoundRef.current) {
      incomingSoundRef.current.pause();
      incomingSoundRef.current.currentTime = 0;
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
    if (outboundChannelRef.current && (outboundChannelRef.current.topic === topic || outboundChannelRef.current.topic === `realtime:${topic}`)) {
      return outboundChannelRef.current;
    }

    if (outboundChannelPromiseRef.current) {
      return outboundChannelPromiseRef.current;
    }

    if (outboundChannelRef.current) {
      supabaseClient.removeChannel(outboundChannelRef.current);
      outboundChannelRef.current = null;
    }

    const channel = supabaseClient.channel(topic, {
      config: {
        broadcast: { self: false, ack: true }
      }
    });
    outboundChannelPromiseRef.current = new Promise((resolve) => {
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Outbound channel subscribed: ${topic}`);
          outboundChannelRef.current = channel;
          resolve(channel);
        }
      });
      // Safety timeout
      setTimeout(() => {
        if (!outboundChannelRef.current) {
          console.warn(`[Realtime] Outbound subscription timed out for ${topic}, proceeding with fallback`);
          resolve(channel);
        }
      }, 2000);
    });

    try {
      return await outboundChannelPromiseRef.current;
    } finally {
      outboundChannelPromiseRef.current = null;
    }
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
        sendSignalingMessage(targetUserId, 'ice_candidate', {
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
        console.error('ICE Connection failed. Check network/firewall.');
        toast.error('Verbinding mislukt (Netwerk beperking)');
        cleanupCall();
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
      
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
      
      if (remoteStreamRef.current?.id !== stream.id) {
        console.log('New remote stream established');
        remoteStreamRef.current = stream;
      }
      
      if (remoteAudioRef.current) {
        console.log('Attaching stream to audio element. Track:', event.track.kind);
        const audioElement = remoteAudioRef.current;
        
        if (audioElement.srcObject !== stream) {
          audioElement.srcObject = stream;
        }
        
        audioElement.muted = false;
        audioElement.volume = 1.0;

        // Ensure tracks are enabled
        stream.getAudioTracks().forEach(track => {
          console.log('Remote audio track enabled state:', track.enabled);
          track.enabled = true;
        });

        const playAudio = async () => {
          try {
            await audioElement.play();
            console.log('Audio playback started successfully');
          } catch (e) {
            console.warn('Audio playback failed, possibly autoplay policy:', e);
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

    const channel = supabaseClient.channel(`calls:${user.uid}`);
    
    channel.subscribe((status: string, err?: any) => {
      console.log(`[Realtime] Inbound channel status: ${status}`, err ? err : '');
      if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] WebSocket connection failed. Signaling will fallback to REST (slower).');
      }
    });

    channel.on('broadcast', { event: 'call_offer' }, async ({ payload }) => {
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
      setActiveCall({
        callerId: payload.callerId,
        callerName: payload.callerName,
        callerAvatar: payload.callerAvatar,
        targetId: user.uid
      });
      setCallState('ringing');
      setLayout('large'); // Always start incoming calls in large layout
      setIsInitiator(false);
      
      if (incomingSoundRef.current) {
        incomingSoundRef.current.currentTime = 0;
        incomingSoundRef.current.play().catch(e => console.warn('Incoming sound failed to play auto-unlocked:', e));
      }
      
      // Store the offer to be processed when accepted
      (window as any)._pendingCallOffer = payload.offer;
    })
    .on('broadcast', { event: 'call_answer' }, async ({ payload }) => {
      // Signaling deduplication & Self-filter
      if (payload.senderId === user.uid) return;
      if (payload.msgId && processedSignalsRef.current.has(payload.msgId)) {
        console.log('Ignored duplicate call_answer', payload.msgId);
        return;
      }
      if (payload.msgId) processedSignalsRef.current.add(payload.msgId);

      console.log('Received call_answer. SignalingState:', peerConnectionRef.current?.signalingState);
      const pc = peerConnectionRef.current;
      
      if (!pc) {
        console.warn('Received call_answer but no PeerConnection exists');
        return;
      }

      if (pc.signalingState === 'have-local-offer' || pc.signalingState === 'have-remote-pranswer') {
        try {
          console.log('Setting remote description (answer)');
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          setCallState('connected');
          
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
        } catch (err) {
          console.error("Error setting remote answer", err);
        }
      } else if (pc.signalingState === 'stable') {
        console.log('Connection already stable, answer ignored');
      } else {
        console.warn('Received call_answer but PeerConnection in state:', pc.signalingState);
      }
    })
    .on('broadcast', { event: 'ice_candidate' }, async ({ payload }) => {
      // Signaling deduplication & Self-filter
      if (payload.senderId === user.uid) return;
      if (payload.msgId && processedSignalsRef.current.has(payload.msgId)) return;
      if (payload.msgId) processedSignalsRef.current.add(payload.msgId);
      
      console.log('Received ICE candidate from peer');
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription && pc.signalingState !== 'closed') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          console.log('ICE candidate applied successfully');
        } catch (err) {
          console.error("Error adding ice candidate", err);
        }
      } else {
        console.log('ICE candidate queued');
        pendingCandidatesRef.current.push(payload.candidate);
      }
    })
    .on('broadcast', { event: 'call_rejected' }, ({ payload }) => {
      if (payload.senderId === user.uid) return;
      toast.error('Oproep geweigerd');
      cleanupCall();
    })
    .on('broadcast', { event: 'call_busy' }, ({ payload }) => {
      if (payload.senderId === user.uid) return;
      toast.error('Gebruiker is in gesprek');
      cleanupCall();
    })
    .on('broadcast', { event: 'call_ended' }, ({ payload }) => {
      if (payload.senderId === user.uid) return;
      toast.info('Gesprek beëindigd');
      cleanupCall();
    })
    .subscribe();

    channelRef.current = channel;

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [user, supabaseClient]);

  const initiateCall = async (targetId: string, targetName: string, targetAvatar?: string) => {
    try {
      console.log('Initiating call to:', targetId);

      // Safari Autoplay Fix: Unlock audio element early
      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(() => {});
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Local stream captured. Tracks:', stream.getTracks().length);
      stream.getAudioTracks().forEach(track => {
        console.log('Local audio track:', track.label, 'Enabled:', track.enabled, 'ReadyState:', track.readyState);
      });

      localStreamRef.current = stream;
      
      setCallState('calling');
      setActiveCall({
        callerId: user.uid,
        callerName: (profile?.display_name || user?.displayName || 'Anoniem').trim(),
        callerAvatar: profile?.photo_url || user?.photoURL,
        targetId,
        targetName,
        targetAvatar
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
        offer
      });
    } catch (err) {
      console.error("Error initiating call:", err);
      toast.error("Kan microfoon niet openen. Controleer permissies.");
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
      console.log('Accepting call from:', activeCall.callerId);
      
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

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      console.log('Local stream captured on receiver side. Tracks:', stream.getTracks().length);
      stream.getAudioTracks().forEach(track => {
        console.log('Local audio track (receiver):', track.label, 'Enabled:', track.enabled, 'ReadyState:', track.readyState);
      });

      localStreamRef.current = stream;
      
      const pc = setupPeerConnection(activeCall.callerId, false);
      const offer = (window as any)._pendingCallOffer;
      if (offer) {
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

        sendSignalingMessage(activeCall.callerId, 'call_answer', {
          answer
        });
        
        setCallState('connected');
        (window as any)._pendingCallOffer = null;
      }
    } catch (err) {
      console.error("Error accepting call:", err);
      toast.error("Kan microfoon niet openen. Controleer permissies.");
      rejectCall();
    }
  };

  const rejectCall = async () => {
    if (!activeCall) return;
    
    const targetId = activeCall.callerId === user.uid ? activeCall.targetId : activeCall.callerId;
    sendSignalingMessage(targetId, 'call_rejected', {});
    
    cleanupCall();
  };

  const endCall = async () => {
    if (!activeCall) return;
    
    const targetId = activeCall.callerId === user.uid ? activeCall.targetId : activeCall.callerId;
    sendSignalingMessage(targetId, 'call_ended', {});
    
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

  return {
    callState,
    activeCall,
    isMuted,
    remoteAudioRef,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    layout,
    setLayout,
    isInitiator
  };
}
