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
  Image,
  FileText,
  Smile,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import socket from "../../config/socket";
import axios from "axios";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { handleErrorMsg } from "../../config/toast";
import { FaRegSmileBeam } from "react-icons/fa";
import serverObj from "../../config/config";
import { encryptMessage, decryptMessage, getSharedId } from "../../config/encryption";
import { removeselectedFriend } from "../../store/slices/selectedFriendSlice";
import { useDispatch } from "react-redux";

// Helper component for async decryption
const DecryptedText = ({ text, sharedId }) => {
  const [decrypted, setDecrypted] = useState("...");
  
  useEffect(() => {
    const decrypt = async () => {
      if (!text) return;
      // If it doesn't look like base64 or is too short, show as is
      if (text.length < 16) {
        setDecrypted(text);
        return;
      }
      const result = await decryptMessage(text, sharedId);
      setDecrypted(result);
    };
    decrypt();
  }, [text, sharedId]);

  return <>{decrypted}</>;
};

function ChatBox() {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [typerName, setTyperName] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [members, setMembers] = useState([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [docFileName, setDocFileName] = useState(null);
  const messageEndRef = useRef(null);
  const loggedInUser = useSelector((state) => state.auth.user);
  const apiKey = serverObj.apikey;
  const [sizeError, setSizeError] = useState(null);
  const [sendingLoading, setSendingLoading] = useState(false);
  const videoCallEnabled = useSelector((state) => state.settings.features.videoCall);
  const aiChatEnabled = useSelector((state) => state.settings.features.aiChat);
  const dispatch = useDispatch();

  const { register, handleSubmit, reset, setValue, getValues, watch } =
    useForm();
  const navigate = useNavigate();
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState("");

  // Selected Group from State
  const selectedGroup = useSelector(
    (state) => state.selectedGroup.selectedGroup,
  );

  // Selected Friend from State
  const selectedFriend = useSelector(
    (state) => state.selectedFriend.selectedFriend,
  );

  // Get All Chats
  const handleGetAllChats = () => {
    axios
      .get(`${serverObj.apikey}/chat/getAllChats`, { withCredentials: true })
      .then((res) => setChats(res.data))
      .catch((err) => handleErrorMsg(err.message))
      .finally(() => setLoading(false));
  };

  // Get All Member Detail for show to group member name under the groupName in header.
  const handleGetGroupMemberDetail = () => {
    axios
      .get(`${serverObj.apikey}/group/getGroup`, {
        withCredentials: true,
        headers: { groupid: selectedGroup?._id },
      })
      .then((res) => setMembers(res.data))
      .catch((err) => handleErrorMsg(err.message))
      .finally(() => setLoading(false));
  };

  // Handle Friend Typing
  const handleTyping = (friendId, msgLen) => {
    socket.emit("typing", {
      receiver_id: friendId,
      sender_id: loggedInUser._id,
      msgLen,
    });
  };

  // Handle Group Typing
  const handleGroupTypings = (sender_name, groupMembers, groupId, msgLen) => {
    socket.emit("typing", {
      sender_name,
      groupMembers,
      groupId,
      msgLen,
    });
  };

  // Handle File Change and set the types and preview of the file type image, video or document
  const handleFileChange = (e) => {
    setDocFileName(null);
    setSizeError("");
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setFilePreview(url);

    if (file.type.startsWith("image/")) {
      setFileType("image");
    } else if (file.type.startsWith("video/")) {
      setFileType("video");
    } else if (
      file.type === "application/pdf" ||
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      setFileType("document");
      setDocFileName(file.name);
      if (file.size > 10 * 1024 * 1024) {
        setSizeError("File must be under 10MB");
      }
    }

    setShowMediaPicker(false);
  };

  // Handle send Msg
  const handleSendMessage = (data) => {
    setShowPicker(false);
    setShowMediaPicker(false);

    if (!data?.message && !data?.selectedMedia && !data?.selectedDoc) return;

    let selectedFile = null;
    let previewFile = null;

    if (data.selectedMedia && data.selectedMedia.length > 0) {
      selectedFile = data.selectedMedia[0];
      previewFile = URL.createObjectURL(selectedFile);
    } else if (data.selectedDoc && data.selectedDoc.length > 0) {
      selectedFile = data.selectedDoc[0];
      previewFile = URL.createObjectURL(selectedFile);
    }

    const isGroup = !!selectedGroup;
    const sharedId = isGroup ? selectedGroup._id : getSharedId(loggedInUser._id, selectedFriend._id);

    // Prepare FormData
    const formData = new FormData();

    const processMessage = async () => {
      let encryptedText = data.message;
      if (data.message) {
        encryptedText = await encryptMessage(data.message, sharedId);
        formData.append("text", encryptedText);
      }
      
      if (selectedFile) formData.append("selectedFile", selectedFile);
      if (selectedFile) formData.append("selectedFileName", selectedFile.name);
      formData.append("sender_id", loggedInUser._id);
      if (!isGroup) formData.append("receiver_id", selectedFriend?._id);
      if (isGroup) formData.append("group_id", selectedGroup._id);
      formData.append("createdAt", new Date().toISOString());
      if (isGroup)
        formData.append(
          "groupMembers",
          JSON.stringify(selectedGroup.groupMember),
        );
      formData.append("senderName", loggedInUser?.username);
      formData.append("senderProfilePic", loggedInUser?.profilePic);

      // Create local chatObj for UI update if needed
      const chatObj = {};
      for (let pair of formData.entries()) {
        chatObj[pair[0]] = pair[1];
      }

      const tempMsg = {
        _id: Date.now().toString(),
        sender_id: loggedInUser._id,
        receiver_id: isGroup ? null : selectedFriend?._id,
        group_id: isGroup ? selectedGroup._id : null,
        message: {
          text: encryptedText || null,
          fileName: selectedFile?.name || null,
          fileType: selectedFile?.type || null,
          fileUrl: previewFile,
        },
        previewFile,
        selectedFileName: selectedFile?.name || null,
        loading: true,
        createdAt: new Date().toISOString(),
        senderName: loggedInUser?.username,
        senderProfilePic: loggedInUser?.profilePic,
      };

      setChats((prev) => [...prev, tempMsg]);

      // Send to backend
      const isAIChat = selectedFriend?._id === "000000000000000000000001";

      if (!isAIChat) {
        axios
          .post(`${apiKey}/chat/createMsg`, formData, { withCredentials: true })
          .then((res) => {
            const chat = res.data.chat;
            setChats((prevChats) =>
              prevChats.map((msg) =>
                msg.loading && msg._id === tempMsg._id ? chat : msg,
              ),
            );
            socket.emit("send-message", {
              ...chat,
              senderName: chatObj.senderName,
              senderProfilePic: chatObj.senderProfilePic,
              groupMembers: chatObj.groupMembers,
            });
          })
          .catch((err) => console.log(err.message))
          .finally(() => setSendingLoading(false));
      } else {
        // AI Chat (No encryption for AI for now, or use AI's public key if available)
        const chat = {
          _id: `ai-${Date.now()}`,
          sender_id: loggedInUser?._id,
          receiver_id: "000000000000000000000001",
          message: {
            text: data.message, // Send plain text to AI
            fileType: null,
            fileUrl: null,
            fileName: null,
          },
          senderName: loggedInUser?.username,
          senderProfilePic: loggedInUser?.profilePic || null,
          createdAt: new Date().toISOString(),
          loading: false,
        };
        setChats((prevChats) =>
          prevChats.map((msg) =>
            msg.loading && msg._id === tempMsg._id ? chat : msg,
          ),
        );
        socket.emit("send-message", chat);
      }
    };

    processMessage();
    reset();
    setFilePreview(null);
    setFileType(null);
    return;
  };

  // Clean the InputValue onChange the SelectedUser.
  useEffect(() => {
    setValue("message");
    
    // Kick out of AI chat if disabled
    if (!aiChatEnabled && selectedFriend?._id === "000000000000000000000001") {
      dispatch(removeselectedFriend());
    }
  }, [selectedFriend, aiChatEnabled]);

  // Handle receiving message
  useEffect(() => {
    setTyping(false);
    setTyperName(false);

    const handleReceiveMessage = (payload) => {
      setChats((prev) => [...prev, payload]);
      setTyping(false);
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

    const handleGroupTyping = (payload) => {
      if (selectedGroup && selectedGroup?._id === payload.groupId) {
        setTyping(true);
        setTyperName(payload.sender_name);
      } else {
        setTyping(false);
      }
    };

    const handleGroupStopTyping = (group_id) => {
      if (selectedGroup?._id === group_id) {
        setTyping(false);
      }
    };

    socket.on("received-message", handleReceiveMessage);
    socket.on("friend-typing", handleFriendTyping);
    socket.on("friend-stopTyping", handleFriendStopTyping);
    socket.on("group-typing", handleGroupTyping);
    socket.on("group-stopTyping", handleGroupStopTyping);

    return () => {
      socket.off("received-message", handleReceiveMessage);
      socket.off("friend-typing", handleFriendTyping);
      socket.off("friend-stopTyping", handleFriendStopTyping);
      socket.off("group-typing", handleGroupTyping);
      socket.off("group-stopTyping", handleGroupStopTyping);
    };
  }, [selectedFriend, selectedGroup]);

  // Fetch chat history on load
  useEffect(() => {
    handleGetAllChats();
  }, []);

  useEffect(() => {
    selectedGroup && handleGetGroupMemberDetail();
  }, [selectedGroup]);

  // Filter messages between current user and selected user
  useEffect(() => {
    console.log(chats);
    let filtered = [];
    if (selectedFriend) {
      filtered = chats.filter((chat) => {
        const chatSenderId = String(chat?.sender_id?._id || chat?.sender_id);
        const chatReceiverId = String(
          chat?.receiver_id?._id || chat.receiver_id,
        );
        const currentUserId = String(loggedInUser?._id);
        const selectedFriendId = String(selectedFriend?._id);

        return (
          (chatSenderId === currentUserId &&
            chatReceiverId === selectedFriendId) ||
          (chatReceiverId === currentUserId &&
            chatSenderId === selectedFriendId)
        );
      });
    } else if (selectedGroup) {
      filtered = chats.filter((chat) => {
        const chatGroupId = String(chat?.group_id?._id || chat?.group_id);
        const selectedGroupId = String(selectedGroup?._id);
        return chatGroupId === selectedGroupId;
      });
    }

    setMessages(filtered);
  }, [chats, loggedInUser, selectedFriend, selectedGroup]);

  // Scroll to bottom on new message
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // If No Friends or Group Selected Return SomeThing
  if (!selectedGroup && !selectedFriend) {
    return (
      <div className="h-[100dvh] select-none w-full flex flex-col justify-center items-center bg-gradient-to-br from-gray-50 to-white dark:from-background dark:to-secondary">
        <div className="relative mb-10">
          <div className="absolute -inset-4 bg-teal-100/10 dark:bg-primary/10 blur-xl rounded-full" />
          <div className="relative w-28 h-28 flex items-center justify-center rounded-full shadow-lg dark:bg-secondary">
            <MessagesSquareIcon className="w-14 h-14 text-primary dark:text-primary-hover" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary-hover to-primary mb-4 text-center">
          Welcome to VeloxChat
        </h1>

        <p className="text-gray-500 dark:text-text-secondary mb-10 max-w-lg text-center px-6 text-sm sm:text-lg">
          Select a contact or start a new conversation to begin your messaging
          experience
        </p>

        <div className="flex items-center sm:gap-1 animate-bounce">
          <ChevronLeft className="w-5 h-5 text-primary dark:text-primary-hover" />
          <span className="text-sm text-gray-500 dark:text-text-secondary">
            Select Your Friend or Group
          </span>
        </div>

        <div className="absolute bottom-8 flex items-center gap-2 text-sm text-gray-400 dark:text-text-secondary">
          <Lock className="w-4 h-4 text-teal-600 dark:text-primary-hover" />
          <span>Your messages are end-to-end encrypted</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-background  ">
      {/* Header */}
      <div className="sticky top-0 flex items-center justify-between bg-gray-50 dark:bg-background z-50 h-[10dvh] p-3 border-b border-gray-300 dark:border-light-border select-none">
        <div className="flex items-center space-x-3 cursor-pointer w-full">
          <div className="w-8 h-8 rounded-full overflow-hidden shadow-md border border-gray-300 dark:border-light-border">
            <img
              src={selectedGroup?.groupProfileImg || selectedFriend?.profilePic}
              alt="Group || Friend"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-text-primary capitalize text-[14px]">
              {selectedGroup?.groupName || selectedFriend?.username}
            </h3>

            {selectedFriend && (
              <div className="flex items-center gap-0.5 ">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    selectedFriend.status === "online"
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-400"
                  }`}
                />
                <span className="text-xs capitalize text-gray-700 dark:text-text-secondary">
                  {typing ? "Typing..." : selectedFriend.status}
                </span>
              </div>
            )}

            {selectedGroup && (
              <div className="max-w-[200px] sm:max-w-[400px] overflow-hidden">
                <span className="truncate text-[11px] capitalize text-gray-600 dark:text-text-secondary whitespace-nowrap block">
                  {members.map((member) => member.username).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mr-10 md:mr-2">
          {videoCallEnabled && (
            <button
              className="text-gray-500 dark:text-text-secondary hover:text-gray-700 dark:hover:text-text-primary cursor-pointer flex items-center gap-2 bg-primary/10 dark:bg-secondary p-2 rounded-md hover:bg-primary/20 dark:hover:bg-secondary/20 transition-colors text-sm font-semibold text-primary dark:text-primary-hover"
              onClick={() => {
                let roomId = null;
                if (selectedGroup) {
                  roomId = selectedGroup._id;
                } else if (selectedFriend) {
                  const ids = [loggedInUser._id, selectedFriend._id].sort();
                  roomId = ids.join("_");
                }
                if (roomId) {
                  const callData = {
                    roomId,
                    callerName: loggedInUser.username,
                    callerProfile: loggedInUser.profilePic,
                    receiverId: selectedGroup
                      ? selectedGroup._id
                      : selectedFriend._id,
                    isGroup: !!selectedGroup,
                    groupMembers: selectedGroup
                      ? members.map((m) => m._id)
                      : null,
                    groupName: selectedGroup ? selectedGroup.groupName : null,
                  };
                  socket.emit("call-user", callData);
                  const receiverParam = selectedFriend
                    ? `&receiver=${selectedFriend._id}`
                    : ``;
                  navigate(`/room/${roomId}?caller=true${receiverParam}`);
                }
              }}
              title="Video Call"
            >
              <Video size={23} className="shrink-0 text-primary" /> Call
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className={`flex-1 grow overflow-y-auto   py-2 px-2 w-full  ${
          selectedGroup && "px-4"
        } z-0 min-h-0`}
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] dark:bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat  bg-auto opacity-15 dark:opacity-35 pointer-events-none"></div>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-sm text-gray-500 dark:text-text-secondary">
              Loading messages...
            </span>
          </div>
        ) : (messages || []).length == 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center text-gray-400 dark:text-text-secondary">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600 dark:text-text-secondary" />
              {selectedFriend?.username === "Velox_AI" ||
              selectedGroup?.groupName === "Velox_AI" ? (
                <>
                  <p className="text-lg font-semibold">
                    🤖 Hyy {loggedInUser?.username}! I'm VeloxAI 😄
                  </p>
                  <p className="text-gray-500 dark:text-text-secondary mt-1">
                    How can I help you today? 🌟 Type your message below ⬇️
                  </p>
                </>
              ) : (
                <>
                  <p>No messages yet</p>
                  <p className="text-sm">
                    Start chatting with "
                    {selectedGroup?.groupName || selectedFriend?.username}"
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((chat, index) => {
              const chatSenderId = chat.sender_id?._id || chat.sender_id;
              const chatReceiverId = chat.receiver_id?._id || chat.receiver_id;
              const chatGroupId = chat.group_id?._id || chat.group_id;
              const msgSharedId = chatGroupId ? chatGroupId : getSharedId(chatSenderId, chatReceiverId);

              const msgText = chat?.message?.text || chat?.text;
              const isEventMessage = msgText && msgText.startsWith("🎥");

              if (isEventMessage) {
                return (
                  <div
                    key={chat?._id || index}
                    className="flex w-full mt-3 justify-center px-1"
                  >
                    <div className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] px-3 py-1 rounded-full shadow-sm font-medium flex items-center gap-1.5 border border-zinc-300 dark:border-zinc-700">
                      <span>{msgText}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={chat?._id || index}
                  className={`flex w-full mt-5  ${
                    (chat?.sender_id._id || chat?.sender_id) ===
                    loggedInUser?._id
                      ? "justify-end"
                      : "justify-start"
                  } px-1`}
                >
                  <div
                    className={`w-fit max-w-[80%] sm:max-w-[60%] pl-2 pr-2 py-1 break-words whitespace-pre-wrap  flex items-end justify-between gap-3 rounded-sm shadow-sm relative ${
                      (chat?.sender_id._id || chat?.sender_id) ===
                      loggedInUser?._id
                        ? "bg-user-bubble dark:bg-user-bubble text-text-on-user-bubble ml-auto"
                        : `bg-[#c5f7f287] dark:bg-secondary dark:text-text-on-other-bubble mr-auto ${
                            selectedGroup && "ml-2.5"
                          } ml-0 text-gray-900 dark:text-text-primary`
                    }`}
                  >
                    {/* Show sender's profile and name in group chat if not self */}
                    {String(chat?.sender_id._id || chat?.sender_id) !==
                      String(loggedInUser?._id) &&
                      selectedGroup && (
                        <div className="flex items-center absolute top-1 -left-6">
                          <img
                            src={
                              chat?.sender_id.profilePic ||
                              chat?.senderProfilePic
                            }
                            alt="sender"
                            className="w-5 h-5 rounded-full overflow-hidden"
                          />
                        </div>
                      )}

                    {/* Message */}
                    <div className="text-[13px] break-words tracking-wide flex flex-col">
                      <span className="text-[9px] text-red-500 dark:text-danger font-medium">
                        {String(chat?.sender_id._id || chat?.sender_id) !==
                          String(loggedInUser?._id) &&
                          selectedGroup &&
                          `~${chat?.sender_id.username || chat?.senderName}`}
                      </span>

                      <span className="flex flex-col gap-1 text-normal dark:text-text-normal">
                        {/* This is For Document Message */}
                        {chat?.message?.fileType &&
                          !chat?.message?.fileType.startsWith("image/") &&
                          !chat?.message?.fileType.startsWith("video/") &&
                          !chat?.message?.fileType.startsWith("audio/") && (
                            <a
                              href={chat?.message?.fileUrl || chat?.previewFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dark:hover:bg-secondary/50 p-1 pr-5 max-w-70 sm:w-auto flex items-center gap-3 transition-all duration-200"
                            >
                              <div className="p-2 rounded-full">
                                <FileText
                                  className={`${
                                    String(
                                      chat?.sender_id._id || chat?.sender_id,
                                    ) === String(loggedInUser?._id)
                                      ? "text-text-on-user-bubble"
                                      : "text-primary"
                                  } dark:text-success`}
                                />
                              </div>
                              <div>
                                <p
                                  className={`font-medium text-xs line-clamp-2 ${
                                    String(
                                      chat?.sender_id._id || chat?.sender_id,
                                    ) === String(loggedInUser?._id)
                                      ? "text-text-on-user-bubble"
                                      : "text-gray-800"
                                  } dark:text-text-primary`}
                                >
                                  {chat?.message?.fileName ||
                                    chat?.selectedFileName}
                                </p>
                                <p
                                  className={`text-[10px] ${
                                    String(
                                      chat?.sender_id._id || chat?.sender_id,
                                    ) === String(loggedInUser?._id)
                                      ? "text-gray-300"
                                      : "text-gray-500"
                                  } dark:text-text-secondary`}
                                >
                                  Click to open
                                </p>
                              </div>
                              {chat?.loading && (
                                <div className="absolute top-1 right-2 animate-spin rounded-full h-3 w-3 border-t-2 border-primary dark:border-primary-hover"></div>
                              )}
                            </a>
                          )}

                        {/* This is For Image Media Message */}
                        {chat?.message?.fileType &&
                          chat?.message?.fileType.startsWith("image/") && (
                            <div className="relative wf-full">
                              <img
                                src={
                                  chat?.message?.fileUrl || chat?.previewFile
                                }
                                alt="preview"
                                className="w-70 sm:max-w-70 sm:w-auto max-h-40 h-auto object-contain rounded-sm"
                              />
                              {chat?.loading && (
                                <div className="absolute inset-0 bg-black/50 grid place-items-center">
                                  <div className="animate-spin rounded-full h-7 w-7 border-t-3 border-primary dark:border-primary-hover"></div>
                                </div>
                              )}
                            </div>
                          )}

                        {/* This is For Video Media Message */}
                        {chat?.message?.fileType &&
                          chat?.message?.fileType.startsWith("video/") && (
                            <div className="relative">
                              <video
                                src={
                                  chat?.message?.fileUrl || chat?.previewFile
                                }
                                controls
                                className="w-70 sm:max-w-70 max-h-40 h-auto object-cover"
                                muted
                              />
                              {chat?.loading && (
                                <div className="absolute inset-0 bg-black/50 grid place-items-center">
                                  <div className="animate-spin rounded-full h-7 w-7 border-t-3 border-primary dark:border-primary-hover"></div>
                                </div>
                              )}
                            </div>
                          )}

                        {/* This is For Text Message */}
                        <div className="whitespace-pre-wrap break-words max-w-full overflow-hidden">
                          <DecryptedText text={chat?.message?.text || chat?.text} sharedId={msgSharedId} />
                        </div>
                      </span>
                    </div>

                    {/* Arrow */}
                    <div
                      className={`absolute top-0.5 w-2 h-2 rotate-45 ${
                        (chat?.sender_id._id || chat?.sender_id) ===
                        loggedInUser?._id
                          ? "bg-user-bubble dark:bg-user-bubble -right-1"
                          : "bg-[#c5f7f287] dark:bg-secondary -left-1"
                      }`}
                    ></div>

                    {/* Timestamp */}

                    <span
                      className={`text-[8px] whitespace-nowrap text-gray-500 dark:text-text-secondary ${
                        (chat?.message?.text === null ||
                          (chat?.message?.text && chat?.message?.fileUrl)) &&
                        "absolute bottom-2 right-4"
                      }`}
                    >
                      {new Date(chat?.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {typing &&
              (selectedGroup ? (
                <div className="flex mt-3">
                  <div className="bg-gray-100 dark:bg-secondary px-4 py-1 rounded-full text-xs text-gray-600 dark:text-text-secondary animate-pulse">
                    {typerName} is typing...
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-4 ml-2 w-fit px-2 py-2 shadow-sm dark:bg-secondary">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 bg-gray-400 dark:bg-text-secondary rounded-full animate-[bounce_1s_infinite]"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 bg-gray-400 dark:bg-text-secondary rounded-full animate-[bounce_1s_infinite]"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-1.5 w-1.5 bg-gray-400 dark:bg-text-secondary rounded-full animate-[bounce_1s_infinite]"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-red-500 dark:text-danger">
                    {typerName}
                  </span>
                </div>
              ))}
          </>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSubmit(handleSendMessage)}
        className="sm:p-3 px-1 py-3 bg-gray-50  dark:bg-background relative shrink-0"
        encType="multipart/form-data"
      >
        {/* Preview */}
        {filePreview && (
          <div
            className={`bg-gray-300 dark:bg-secondary/40 h-auto max-h-40 px-2 rounded overflow-hidden absolute left-2 ${
              fileType == "document" ? "-top-13" : "-top-39"
            } flex flex-col gap-2 text-sm font-medium text-gray-800 dark:text-text-primary`}
          >
            <div className="relative">
              {fileType === "image" ? (
                <img
                  src={filePreview}
                  alt="preview"
                  className="w-70 h-40 object-contain rounded-sm"
                />
              ) : fileType === "video" ? (
                <video
                  src={filePreview}
                  controls
                  className="sm:w-70 h-40"
                  muted
                />
              ) : fileType === "document" ? (
                <>
                  <a
                    href={filePreview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white dark:bg-background hover:bg-teal-100 dark:hover:bg-secondary/50 border border-gray-300 dark:border-light-border rounded-lg p-1 px-3 w-70 flex items-center gap-3 transition-all duration-200"
                  >
                    <div className="p-2 rounded-full">
                      <FileText className="text-green-700 dark:text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-xs line-clamp-2 text-zinc-700 dark:text-text-primary">
                        {docFileName}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-text-secondary">
                        Click to open
                      </p>
                      {sizeError && (
                        <p className="text-red-500 dark:text-danger animate-pulse text-xs">
                          {sizeError}
                        </p>
                      )}
                    </div>
                  </a>
                </>
              ) : null}
              <button
                type="button"
                className="absolute top-1 right-1 cursor-pointer text-white bg-black/40 hover:bg-black/70 p-1 rounded-full"
                onClick={() => {
                  setFilePreview(null);
                  setFileType(null);
                  setSizeError(null);
                  reset();
                }}
                title="Delete/Unsend"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {showMediaPicker && (
          <div className="h-auto w-42 ml-2 bg-gray-300 dark:bg-secondary p-2 rounded-sm absolute left-0 -top-23 shadow-lg flex flex-col gap-2 text-sm font-medium text-gray-700 dark:text-text-primary">
            {/* Image Option */}
            <label className="flex items-center gap-2 hover:bg-gray-400/40 dark:hover:bg-primary/20 hover:text-black dark:text-white/70 dark:hover:text-white rounded p-2">
              <input
                type="file"
                className="hidden"
                accept="image/*, video/*"
                {...register("selectedMedia", {
                  onChange: handleFileChange,
                })}
              />
              <Image className="w-5 h-5" />
              <span>Photo & Video</span>
            </label>

            {/* Document Option */}
            <label className="flex items-center gap-2 hover:bg-gray-400/40 dark:hover:bg-primary/20 hover:text-black dark:text-white/70 dark:hover:text-white rounded p-2">
              <input
                type="file"
                className="hidden"
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                {...register("selectedDoc", {
                  onChange: handleFileChange,
                })}
              />
              <FileText className="w-5 h-5" />
              <span>Document</span>
            </label>
          </div>
        )}

        <div className="flex items-center relative">
          <button
            type="button"
            className={`cursor-pointer hidden sm:block ${
              showPicker && "bg-gray-300 dark:bg-secondary"
            } p-2 rounded-md`}
            onClick={() => {
              setShowPicker(!showPicker);
              setShowMediaPicker(false);
            }}
          >
            <FaRegSmileBeam className="w-4.5 h-4.5 text-gray-600 dark:text-text-secondary" />
          </button>

          {selectedFriend?._id !== "000000000000000000000001" && (
            <button
              type="button"
              className={`cursor-pointer ${
                showMediaPicker && "bg-gray-300 dark:bg-secondary"
              } p-2 rounded-md`}
              onClick={() => {
                setShowMediaPicker(!showMediaPicker);
                setShowPicker(false);
              }}
            >
              <Paperclip className="w-4.5 h-4.5 text-gray-600 dark:text-text-secondary" />
            </button>
          )}

          <input
            type="text"
            name="message"
            placeholder="Type a message..."
            autoComplete="off"
            autoCapitalize="sentences"
            autoFocus={true}
            className="flex-1 border border-gray-300 dark:border-light-border bg-white dark:bg-background rounded mr-2 py-1.5 px-2 sm:pr-12 focus:outline-none dark:text-text-primary"
            {...register("message")}
            onChange={(e) => {
              const value = e.target.value;
              selectedGroup &&
                handleGroupTypings(
                  loggedInUser.username,
                  selectedGroup.groupMember,
                  selectedGroup._id,
                  value.length,
                );
              selectedFriend && handleTyping(selectedFriend._id, value.length);
              setValue("message", value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const message = getValues("message");
                const selectedMedia = getValues("selectedMedia");
                const selectedDoc = getValues("selectedDoc");

                if (
                  message?.trim() ||
                  (selectedMedia && selectedMedia.length > 0) ||
                  (selectedDoc && selectedDoc.length > 0)
                ) {
                  handleSubmit(handleSendMessage)();
                }
              }
            }}
          />

          {showPicker && (
            <div className="hidden sm:block absolute bottom-12 left-2 z-50 rounded-lg shadow-sm border border-gray-300 dark:border-light-border h-[280px] overflow-hidden">
              <Picker
                data={data}
                theme={localStorage.getItem("theme") || "light"}
                previewPosition="none"
                searchPosition="none"
                skinTonePosition="none"
                emojiSize={17}
                onEmojiSelect={(emoji) => {
                  setValue(
                    "message",
                    (getValues("message") ?? "") + emoji.native,
                  );
                }}
              />
            </div>
          )}

          <button
            type="submit"
            className={`p-2 px-2.5 ${
              sizeError
                ? "bg-primary/30 dark:bg-primary-hover/30"
                : "bg-primary hover:bg-primary-hover dark:bg-primary-hover dark:hover:bg-primary"
            } rounded transition`}
            disabled={sizeError}
          >
            <SendHorizonal className="w-5 h-5 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatBox;
