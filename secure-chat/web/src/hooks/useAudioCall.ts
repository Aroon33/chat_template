import { useEffect, useRef, useState } from "react";

type UseAudioCallArgs = {
  ws: WebSocket | null; // WebSocket（シグナリング用）
  roomId: string | null;
};

export function useAudioCall({ ws, roomId }: UseAudioCallArgs) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const [inCall, setInCall] = useState(false);

  const iceConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  // ========= PeerConnection 作成 =========
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceConfig);

    pc.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && ws && roomId) {
        ws.send(
          JSON.stringify({
            type: "ice",
            candidate: ev.candidate,
            room: roomId,
          })
        );
      }
    };

    pcRef.current = pc;
    return pc;
  };

  // ========= 通話開始 =========
  const startCall = async () => {
    if (!ws || !roomId) return;

    console.log("📞 startCall");

    const pc = createPeerConnection();

    // local audio
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    ws.send(JSON.stringify({ type: "offer", sdp: offer, room: roomId }));
    setInCall(true);
  };

  // ========= 通話終了 =========
  const endCall = () => {
    console.log("📴 endCall");

    setInCall(false);

    pcRef.current?.close();
    pcRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
  };

  // ========= WebSocket メッセージ受信 =========
  useEffect(() => {
    if (!ws) return;

    const handler = async (ev: MessageEvent) => {
      const msg = JSON.parse(ev.data);

      if (msg.room !== roomId) return;

      console.log("📨 signaling:", msg.type);

      // 常に peerConnection の存在を保証
      let pc = pcRef.current;
      if (!pc && msg.type === "offer") {
        pc = createPeerConnection();
      }
      if (!pc) return;

      switch (msg.type) {
        case "offer": {
          // local audio
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));

          await pc.setRemoteDescription(msg.sdp);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          ws.send(JSON.stringify({ type: "answer", sdp: answer, room: roomId }));

          setInCall(true);
          break;
        }

        case "answer": {
          await pc.setRemoteDescription(msg.sdp);
          break;
        }

        case "ice": {
          try {
            await pc.addIceCandidate(msg.candidate);
          } catch (e) {
            console.error("ICE error", e);
          }
          break;
        }
      }
    };

    ws.addEventListener("message", handler);
    return () => ws.removeEventListener("message", handler);
  }, [ws, roomId]);

  return {
    inCall,
    startCall,
    endCall,
    remoteAudioRef,
  };
}
