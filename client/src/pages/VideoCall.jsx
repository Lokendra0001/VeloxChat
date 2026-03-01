import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useSelector } from "react-redux";
import socket from "../config/socket";
import axios from "axios";
import serverObj from "../config/config";
import { Phone, PhoneOff } from "lucide-react";

const RINGING_PATH = "/audio/ringing.mp3";
const DIAL_TONE_PATH = "/audio/dialtone.mp3";

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const zpRef = useRef(null);
  const audioRef = useRef(null);

  const searchParams = new window.URLSearchParams(location.search);
  const isCaller = searchParams.get("caller") === "true";
  const receiverId = searchParams.get("receiver");

  const [callState, setCallState] = useState(
    isCaller ? "waiting" : "connected",
  );
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user || !roomId) return;
    let callTimeout = null;

    if (callState === "waiting") {
      if (!audioRef.current) {
        audioRef.current = new Audio(DIAL_TONE_PATH);
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch((e) => console.log("Audio play failed", e));

      if (isCaller && receiverId) {
        callTimeout = setTimeout(async () => {
          sendMissedCall();
          stopAudio();
          navigate("/");
        }, 20000);
      }
    }

    if (callState === "connected") {
      stopAudio();
      if (callTimeout) clearTimeout(callTimeout);
      initMeeting();
    }

    const handleCallAccepted = (data) => {
      if (data.roomId === roomId) setCallState("connected");
    };

    const handleCallDeclined = () => {
      stopAudio();
      if (callTimeout) clearTimeout(callTimeout);
      if (zpRef.current) zpRef.current.destroy();
      navigate("/");
    };

    socket.on("call-accepted", handleCallAccepted);
    socket.on("call-declined-by-callee", handleCallDeclined);

    return () => {
      stopAudio();
      if (callTimeout) clearTimeout(callTimeout);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("call-declined-by-callee", handleCallDeclined);
    };
  }, [callState, roomId, user, navigate, isCaller, receiverId]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const sendMissedCall = async () => {
    try {
      const formData = new FormData();
      formData.append(
        "text",
        `🎥 Missed video call at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      );
      formData.append("sender_id", user._id);
      formData.append("receiver_id", receiverId);
      formData.append("createdAt", new Date().toISOString());
      formData.append("senderName", user.username);
      formData.append("senderProfilePic", user.profilePic);

      const res = await axios.post(
        `${serverObj.apikey}/chat/createMsg`,
        formData,
        { withCredentials: true },
      );
      socket.emit("send-message", {
        ...res.data.chat,
        senderName: user.username,
        senderProfilePic: user.profilePic,
      });
      socket.emit("call-cancelled", { roomId, receiverId });
    } catch (error) {
      console.error(error);
    }
  };

  const initMeeting = async () => {
    const appID = Number(import.meta.env.VITE_ZEGO_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomId,
      user._id || Date.now().toString(),
      user.username || "Guest",
    );
    const zp = ZegoUIKitPrebuilt.create(kitToken);
    zpRef.current = zp;

    zp.joinRoom({
      container: containerRef.current,
      turnOnCameraWhenJoining: true,
      turnOnMicrophoneWhenJoining: true,
      showPreJoinView: false,
      scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
      onLeaveRoom: () => {
        if (isCaller) socket.emit("call-cancelled", { roomId, receiverId });
        navigate("/");
      },
    });
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      {callState === "waiting" && (
        <div className="flex flex-col items-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-full animate-ping bg-teal-500/20" />
            <div className="w-28 h-28 bg-zinc-800 rounded-full flex items-center justify-center border-4 border-zinc-700 relative z-10">
              <Phone className="w-12 h-12 text-zinc-500" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Calling...</h2>
          <p className="text-zinc-500 mb-12 animate-pulse">
            Waiting for answer
          </p>
          <button
            onClick={() => {
              socket.emit("call-cancelled", { roomId, receiverId });
              navigate("/");
            }}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className={callState === "waiting" ? "hidden" : "w-full h-full"}
      ></div>
    </div>
  );
};

export default VideoCall;
