import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import socket from "../../config/socket";
import { Phone, PhoneOff } from "lucide-react";

const RINGING_PATH = "/audio/dialtone.mp3";

const CallListener = () => {
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);
  const audioRef = useRef(null);
  const videoCallEnabled = useSelector((state) => state.settings.features.videoCall);

  // 🔥 STOP RING FUNCTION
  const stopRinging = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // 🔥 UNLOCK AUDIO (IMPORTANT FOR CHROME AUTOPLAY)
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioRef.current) {
        audioRef.current = new Audio(RINGING_PATH);
        audioRef.current.loop = true;
      }

      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        })
        .catch(() => {});

      window.removeEventListener("click", unlockAudio);
    };

    window.addEventListener("click", unlockAudio);
  }, []);

  // 🔥 SOCKET LISTENER
  useEffect(() => {
    const handleIncomingCall = (data) => {
      if (!videoCallEnabled) return; // Ignore if feature is disabled
      console.log("Incoming call:", data);
      setIncomingCall(data);
    };

    const handleCallCancelled = ({ roomId }) => {
      setIncomingCall((prev) => (prev?.roomId === roomId ? null : prev));
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-cancelled", handleCallCancelled);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-cancelled", handleCallCancelled);
    };
  }, []);

  // 🔥 PLAY / STOP RINGTONE
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(RINGING_PATH);
      audioRef.current.loop = true;
    }

    if (incomingCall) {
      audioRef.current.play().catch((err) => {
        console.log("Ringtone blocked:", err);
      });
    } else {
      stopRinging();
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md px-4">
      <div className="bg-zinc-900 rounded-3xl p-8 shadow-2xl w-full max-w-sm border border-zinc-800 flex flex-col items-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full animate-ping bg-green-500/20" />
          <img
            src={
              incomingCall.callerProfile ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            alt="caller"
            className="w-24 h-24 rounded-full object-cover border-4 border-zinc-700 relative z-10"
          />
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">
          {incomingCall.callerName}
        </h2>

        <p className="text-zinc-400 mb-10">
          {incomingCall.isGroup ? "Group Call" : "Incoming Video Call"}
        </p>

        <div className="flex gap-12">
          {/* ❌ DECLINE */}
          <button
            onClick={() => {
              socket.emit("call-declined", {
                callerId: incomingCall.callerId,
                roomId: incomingCall.roomId,
              });
              stopRinging();
              setIncomingCall(null);
            }}
            className="group flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white group-hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-xs text-zinc-500 font-medium">Decline</span>
          </button>

          {/* ✅ ACCEPT */}
          <button
            onClick={() => {
              stopRinging();
              socket.emit("call-accepted", {
                callerId: incomingCall.callerId,
                roomId: incomingCall.roomId,
              });
              setIncomingCall(null);
              navigate(`/room/${incomingCall.roomId}`);
            }}
            className="group flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white group-hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 animate-bounce">
              <Phone className="w-6 h-6 fill-current" />
            </div>
            <span className="text-xs text-zinc-500 font-medium">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallListener;
