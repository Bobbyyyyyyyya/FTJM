import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export type GroupCallState = 'idle' | 'joining' | 'connected';

export interface GroupParticipant {
  uid: string;
  name: string;
  photo_url?: string;
  isMuted: boolean;
  stream: MediaStream | null;
}

export function useGroupVoiceCall(user: any, profile: any, supabaseClient: any) {
  const [callState, setCallState] = useState<GroupCallState>('idle');
  const [participants, setParticipants] = useState<Record<string, GroupParticipant>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>('');

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const pendingCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const channelRef = useRef<any>(null);
  
  const processedSignalsRef = useRef<Set<string>>(new Set());

  // Cleanup processed signals periodically
  useEffect(() => {
    const interval = setInterval(() => {
      processedSignalsRef.current.clear();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};
    
    if (channelRef.current) {
      supabaseClient.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setCallState('idle');
    setParticipants({});
    setActiveRoomId(null);
    setIsMuted(false);
  };

  const sendSignalingMessage = async (roomId: string, event: string, payload: any) => {
    if (!channelRef.current) return;
    
    const msgId = `${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await channelRef.current.send({
      type: 'broadcast',
      event: event,
      payload: { ...payload, msgId, senderId: user.uid, roomId: roomId }
    });
  };

  const setupPeerConnection = (targetUid: string, isInitiator: boolean, roomId: string) => {
    if (peerConnectionsRef.current[targetUid]) {
      peerConnectionsRef.current[targetUid].close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
      ],
      iceCandidatePoolSize: 10,
    });

    pendingCandidatesRef.current[targetUid] = [];

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage(roomId, 'group_ice_candidate', {
          targetId: targetUid,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setParticipants(prev => ({
        ...prev,
        [targetUid]: {
          ...prev[targetUid],
          stream: stream
        }
      }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setParticipants(prev => {
          const next = { ...prev };
          delete next[targetUid];
          return next;
        });
        delete peerConnectionsRef.current[targetUid];
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnectionsRef.current[targetUid] = pc;
    return pc;
  };

  const joinGroupCall = async (roomId: string, name: string) => {
    try {
      cleanup();
      setCallState('joining');
      setActiveRoomId(roomId);
      setRoomName(name);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Kan microfoon niet openen. WebRTC bellen is niet ondersteund.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      localStreamRef.current = stream;

      // Broadcast to global monitor first
      const monitorChannel = supabaseClient.channel('group_calls_monitor', {
        config: {
          broadcast: { self: false, ack: true }
        }
      });
      await monitorChannel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await monitorChannel.send({
            type: 'broadcast',
            event: 'group_join',
            payload: { roomId, senderId: user.uid }
          });
          supabaseClient.removeChannel(monitorChannel);
        }
      });

      const channel = supabaseClient.channel(`group_calls:${roomId}`, {
        config: {
          broadcast: { self: false, ack: true }
        }
      });
      channelRef.current = channel;

      channel.on('broadcast', { event: 'group_join' }, async ({ payload }) => {
        if (payload.senderId === user.uid) return;
        
        // Add participant to list
        setParticipants(prev => ({
          ...prev,
          [payload.senderId]: {
            uid: payload.senderId,
            name: payload.name,
            photo_url: payload.photo_url,
            isMuted: payload.isMuted,
            stream: null
          }
        }));

        // Initiator creates offer
        const pc = setupPeerConnection(payload.senderId, true, roomId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        sendSignalingMessage(roomId, 'group_call_offer', {
          targetId: payload.senderId,
          offer,
          name: profile?.display_name || user.displayName,
          photo_url: profile?.photo_url || user.photoURL,
          isMuted: isMuted
        });
      })
      .on('broadcast', { event: 'group_call_offer' }, async ({ payload }) => {
        if (payload.targetId !== user.uid) return;
        
        setParticipants(prev => ({
          ...prev,
          [payload.senderId]: {
            uid: payload.senderId,
            name: payload.name,
            photo_url: payload.photo_url,
            isMuted: payload.isMuted,
            stream: null
          }
        }));

        const pc = setupPeerConnection(payload.senderId, false, roomId);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
        
        // Process queued candidates
        const candidates = pendingCandidatesRef.current[payload.senderId] || [];
        pendingCandidatesRef.current[payload.senderId] = [];
        for (const c of candidates) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
          } catch (e) {
            console.error('Error adding queued ICE candidate in group call:', e);
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendSignalingMessage(roomId, 'group_call_answer', {
          targetId: payload.senderId,
          answer
        });
      })
      .on('broadcast', { event: 'group_call_answer' }, async ({ payload }) => {
        if (payload.targetId !== user.uid) return;
        const pc = peerConnectionsRef.current[payload.senderId];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
          
          // Process queued candidates
          const candidates = pendingCandidatesRef.current[payload.senderId] || [];
          pendingCandidatesRef.current[payload.senderId] = [];
          for (const c of candidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch (e) {
              console.error('Error adding queued ICE candidate in group call (after answer):', e);
            }
          }
        }
      })
      .on('broadcast', { event: 'group_ice_candidate' }, async ({ payload }) => {
        if (payload.targetId !== user.uid) return;
        const pc = peerConnectionsRef.current[payload.senderId];
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.error('Error adding ice candidate in group call:', e);
          }
        } else {
          if (!pendingCandidatesRef.current[payload.senderId]) {
            pendingCandidatesRef.current[payload.senderId] = [];
          }
          pendingCandidatesRef.current[payload.senderId].push(payload.candidate);
        }
      })
      .on('broadcast', { event: 'group_mute_status' }, ({ payload }) => {
        setParticipants(prev => {
          if (!prev[payload.senderId]) return prev;
          return {
            ...prev,
            [payload.senderId]: {
              ...prev[payload.senderId],
              isMuted: payload.isMuted
            }
          };
        });
      })
      .on('broadcast', { event: 'group_leave' }, ({ payload }) => {
        if (peerConnectionsRef.current[payload.senderId]) {
          peerConnectionsRef.current[payload.senderId].close();
          delete peerConnectionsRef.current[payload.senderId];
        }
        setParticipants(prev => {
          const next = { ...prev };
          delete next[payload.senderId];
          return next;
        });
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          setCallState('connected');
          // Broadcast my presence
          await sendSignalingMessage(roomId, 'group_join', {
            roomId: roomId,
            name: profile?.display_name || user.displayName,
            photo_url: profile?.photo_url || user.photoURL,
            isMuted: false
          });
        }
      });

    } catch (err) {
      console.error("Error joining group call:", err);
      toast.error("Kan groepscall niet starten. Controleer permissies.");
      cleanup();
    }
  };

  const leaveGroupCall = () => {
    if (activeRoomId) {
      sendSignalingMessage(activeRoomId, 'group_leave', {});
    }
    cleanup();
  };

  const toggleGroupMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      const newMuted = !localStreamRef.current.getAudioTracks()[0].enabled;
      setIsMuted(newMuted);
      if (activeRoomId) {
        sendSignalingMessage(activeRoomId, 'group_mute_status', { isMuted: newMuted });
      }
    }
  };

  return {
    groupCallState: callState,
    groupParticipants: participants,
    isGroupMuted: isMuted,
    joinGroupCall,
    leaveGroupCall,
    toggleGroupMute,
    activeRoomId,
    roomName
  };
}
