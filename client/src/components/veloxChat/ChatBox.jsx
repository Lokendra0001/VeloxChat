import React, { useEffect, useState, useRef } from "react";
import {
  SendHorizonal,
  Paperclip,
  ChevronLeft,
  MessagesSquareIcon,
  MessageCircle,
  Lock,
  MoreVertical,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import socket from "../../config/socket";
import axios from "axios";
import serverObj from "../../config/config";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import smile from "../../assets/smile.png";
import { handleErrorMsg } from "../../config/toast";

function ChatBox() {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const messageEndRef = useRef(null);
  const loggedInUser = useSelector((state) => state.auth.user);
  const { register, handleSubmit, reset, watch, setValue, getValues } =
    useForm();
  const sendingImg = watch("selectedImage");
  const selectedFriend = useSelector(
    (state) => state.selectedFriend.selectedFriend
  );

  const handleGetAllChats = () => {
    axios
      .get(`${serverObj.apikey}/chat/getAllChats`, { withCredentials: true })
      .then((res) => setChats(res.data))
      .catch((err) => handleErrorMsg(err.message))
      .finally(() => setLoading(false));
  };

  const handleTyping = (friendId, msgLen) => {
    socket.emit("typing", {
      receiver_id: friendId,
      sender_id: loggedInUser._id,
      msgLen,
    });
  };

  // Clean the InputValue onChange the SelectedUser.
  useEffect(() => {
    setValue("message");
  }, [selectedFriend]);

  // Handle receiving message
  useEffect(() => {
    setTyping(false);
    const handleReceiveMessage = (payload) => {
      setChats((prev) => [...prev, payload]);
    };

    const handleFriendTyping = (sender_id) => {
      if (
        selectedFriend &&
        selectedFriend._id === sender_id &&
        selectedFriend.status === "online"
      ) {
        setTyping(true);
      } else {
        setTyping(false);
      }
    };

    const handleFriendStopTyping = (sender_id) => {
      if (selectedFriend?._id === sender_id) {
        setTyping(false);
      }
    };

    socket.on("received-message", handleReceiveMessage);
    socket.on("friend-typing", handleFriendTyping);
    socket.on("friend-stopTyping", handleFriendStopTyping);

    return () => {
      socket.off("received-message", handleReceiveMessage);
      socket.off("friend-typing", handleFriendTyping);
      socket.off("friend-stopTyping", handleFriendStopTyping);
    };
  }, [selectedFriend]);

  // Fetch chat history on load
  useEffect(() => {
    handleGetAllChats();
  }, []);

  // Filter messages between current user and selected user
  useEffect(() => {
    const filtered = chats.filter(
      (msg) =>
        (msg.sender_id === loggedInUser._id &&
          msg.receiver_id === selectedFriend?._id) ||
        (msg.receiver_id === loggedInUser._id &&
          msg.sender_id === selectedFriend?._id)
    );
    setMessages(filtered);
  }, [chats, loggedInUser, selectedFriend]);

  // Scroll to bottom on new message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a message
  const handleSendMessage = (data) => {
    setShowPicker(false);

    const chatObj = {
      message: data.message,
      sender_id: loggedInUser._id,
      receiver_id: selectedFriend._id,
      createdAt: new Date().toISOString(),
    };

    socket.emit("send-message", chatObj);
    setChats((prev) => [...prev, chatObj]);
    reset({ message: "", selectedImage: null });
  };

  if (!selectedFriend) {
    return (
      <div className="h-[100dvh] w-full flex flex-col justify-center items-center bg-gradient-to-br from-gray-50 to-white">
        <div className="relative mb-10">
          <div className="absolute -inset-4 bg-teal-100/40 blur-xl rounded-full" />
          <div className="relative w-28 h-28 flex items-center justify-center rounded-full shadow-lg">
            <MessagesSquareIcon className="w-14 h-14 text-primary" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary-hover to-green-600 mb-4 text-center">
          Welcome to VeloxChat
        </h1>

        <p className="text-gray-500 mb-10 max-w-lg text-center px-6 text-sm sm:text-lg">
          Select a contact or start a new conversation to begin your messaging
          experience
        </p>

        <div className="flex items-center sm:gap-1 animate-bounce">
          <ChevronLeft className="w-5 h-5 text-primary" />
          <span className="text-sm  text-gray-500">Select Your Contact</span>
        </div>

        <div className="absolute bottom-8 flex items-center gap-2 text-sm text-gray-400">
          <Lock className="w-4 h-4 text-teal-600" />
          <span>Your messages are end-to-end encrypted</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div className="sticky top-0 flex items-center justify-between bg-white h-[10dvh] p-3 border-b border-gray-300 ">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-md border border-gray-300">
            <img
              src={selectedFriend?.profilePic}
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 capitalize">
              {selectedFriend.username}
            </h3>
            <div className="flex items-center gap-0.5 ">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  selectedFriend.status === "online"
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-400"
                }`}
              />
              <span className="text-xs capitalize text-gray-700">
                {typing ? "Typing..." : selectedFriend.status}
              </span>
            </div>
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700 hidden md:block">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-2 px-4  bg-teal-50 ">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-sm text-gray-500">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p>No messages yet</p>
              <p className="text-sm">
                Start chatting with "{selectedFriend.username}"
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`flex  mt-2 ${
                  msg.sender_id === loggedInUser._id
                    ? "justify-end"
                    : "justify-start"
                } px-1`}
              >
                <div
                  className={`w-fit max-w-[60%] pl-3 pr-2 py-1 flex ${
                    msg.message.length > 70 && "flex-col"
                  } items-end justify-between gap-3 rounded-sm shadow-sm relative ${
                    msg.sender_id === loggedInUser._id
                      ? "bg-user-bubble ml-auto"
                      : "bg-[#c5f7f287] mr-auto text-gray-900"
                  }`}
                >
                  {/* Chat arrow */}
                  <div
                    className={`absolute top-0.5 w-2 h-2 rotate-45 ${
                      msg.sender_id === loggedInUser._id
                        ? "bg-user-bubble -right-1"
                        : "bg-[#e0fcf9cb] -left-1"
                    }`}
                  ></div>

                  {/* Message text */}
                  <p className="text-[14px] wrap-anywhere tracking-wide">
                    {msg.message}
                  </p>

                  {/* Timestamp */}
                  <span className="text-[9px] whitespace-nowrap text-gray-500">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-center gap-1.5 mt-4 ml-2 w-fit px-2 py-2 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-[bounce_1s_infinite]"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 bg-gray-400 rounded-full  animate-[bounce_1s_infinite]"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5   bg-gray-400 rounded-full animate-[bounce_1s_infinite]"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSubmit(handleSendMessage)}
        className="p-3  bg-white relative"
      >
        {/* {sendingImg?.length > 0 && (
          <div className="h-24 w-24 bg-gray-300 p-1 rounded absolute left-3 -top-24">
            <img
              src={URL.createObjectURL(sendingImg[0])}
              alt="Selected"
              className="h-full w-full object-contain"
            />
            <X
              size={14}
              className="absolute top-1 right-1 bg-primary text-white rounded cursor-pointer"
              onClick={() => reset({ selectedImage: null })}
            />
          </div>
        )} */}

        <div className="flex items-center space-x-2 relative">
          {/* <label className="cursor-pointer">
            <Paperclip className="w-5 h-5 text-gray-500" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              {...register("selectedImage")}
            />
          </label> */}
          <input
            type="text"
            placeholder="Type a message..."
            autoComplete="off"
            autoCapitalize="sentences"
            autoFocus={true}
            className="flex-1 border border-gray-300 rounded-lg py-2 px-4 sm:pr-12 focus:outline-none"
            {...register("message", { required: "Message is required" })}
            onChange={(e) => {
              handleTyping(selectedFriend._id, e.target.value.length);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage({ message: e.target.value });
              }
            }}
          />

          {showPicker && (
            <div className="hidden sm:block absolute bottom-12 right-13 z-50 rounded-lg shadow-sm border border-gray-300 h-[280px] overflow-hidden">
              <Picker
                data={data}
                theme="light"
                previewPosition="none"
                searchPosition="none"
                skinTonePosition="none"
                emojiSize={17}
                onEmojiSelect={(emoji) => {
                  setValue(
                    "message",
                    (getValues("message") ?? "") + emoji.native
                  );
                }}
              />
            </div>
          )}

          <button
            type="button"
            className="absolute right-13.5 text-lg  cursor-pointer hidden sm:block "
            onClick={() => setShowPicker(!showPicker)}
          >
            <img src={smile} className="h-5" />
          </button>

          <button
            type="submit"
            className="p-2 px-2.5 bg-gradient-to-br from-green-600 to-teal-800 rounded hover:opacity-90 transition"
          >
            <SendHorizonal className="w-5 h-5 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatBox;
