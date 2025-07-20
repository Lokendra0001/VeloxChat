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
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import socket from "../../config/socket";
import axios from "axios";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { handleErrorMsg } from "../../config/toast";
import { FaRegSmileBeam } from "react-icons/fa";
import serverObj from "../../config/config";

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

  const { register, handleSubmit, reset, setValue, getValues, watch } =
    useForm();
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState("");

  // Selected Group from State
  const selectedGroup = useSelector(
    (state) => state.selectedGroup.selectedGroup
  );

  // Selected Friend from State
  const selectedFriend = useSelector(
    (state) => state.selectedFriend.selectedFriend
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
    setSendingLoading(true);
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
    // Prepare FormData
    const formData = new FormData();

    if (data.message) formData.append("text", data.message);
    if (selectedFile) formData.append("selectedFile", selectedFile);
    formData.append("sender_id", loggedInUser._id);
    if (!isGroup) formData.append("receiver_id", selectedFriend?._id);
    if (isGroup) formData.append("group_id", selectedGroup._id);
    formData.append("createdAt", new Date().toISOString());
    if (isGroup)
      formData.append(
        "groupMembers",
        JSON.stringify(selectedGroup.groupMember)
      );
    formData.append("senderName", loggedInUser?.username);
    formData.append("senderProfilePic", loggedInUser?.profilePic);

    // Create local chatObj for UI update if needed
    const chatObj = {};
    for (let pair of formData.entries()) {
      chatObj[pair[0]] = pair[1];
    }

    const tempMsg = {
      ...chatObj,
      previewFile,
      loading: true,
    };

    setChats((prev) => [...prev, tempMsg]);

    // Send to backend
    axios
      .post(`${apiKey}/chat/createMsg`, formData, { withCredentials: true })
      .then((res) => {
        const chat = res.data.chat;

        setChats((prevChats) =>
          prevChats.map((msg) =>
            msg.loading && msg._id === tempMsg._id ? chat : msg
          )
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

    // Clean up
    reset();
    setFilePreview(null);
    setFileType(null);
  };

  // Clean the InputValue onChange the SelectedUser.
  useEffect(() => {
    setValue("message");
  }, [selectedFriend]);

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
        console.log("hello");
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
      socket.on("group-typing", handleGroupTyping);
      socket.on("group-stopTyping", handleGroupStopTyping);
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
    let filtered = [];
    if (selectedFriend) {
      filtered = chats.filter(
        (chat) =>
          ((chat?.sender_id?._id || chat?.sender_id) === loggedInUser?._id &&
            chat.receiver_id === selectedFriend?._id) ||
          (chat.receiver_id === loggedInUser?._id &&
            (chat?.sender_id?._id || chat?.sender_id) === selectedFriend?._id)
      );
      // console.log(filtered);
    } else if (selectedGroup) {
      filtered = chats.filter(
        (chat) => chat.group_id?.toString() === selectedGroup._id?.toString()
      );
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
      <div className="h-[100dvh] w-full flex flex-col justify-center items-center bg-gradient-to-br from-gray-50 to-white">
        <div className="relative mb-10">
          <div className="absolute -inset-4 bg-teal-100/10 blur-xl rounded-full" />
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
          <span className="text-sm  text-gray-500">
            Select Your Friend or Group
          </span>
        </div>

        <div className="absolute bottom-8 flex items-center gap-2 text-sm text-gray-400">
          <Lock className="w-4 h-4 text-teal-600" />
          <span>Your messages are end-to-end encrypted</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 z-50 h-16 p-3 border-b border-gray-300">
        <div className="flex items-center space-x-3 cursor-pointer w-full">
          <div className="w-8 h-8 rounded-full overflow-hidden shadow-md border border-gray-300">
            <img
              src={selectedGroup?.groupProfileImg || selectedFriend?.profilePic}
              alt="Group || Friend"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 capitalize text-[14px]">
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
                <span className="text-xs capitalize text-gray-700 ">
                  {typing ? "Typing..." : selectedFriend.status}
                </span>
              </div>
            )}

            {selectedGroup && (
              <div className="max-w-[200px] sm:max-w-[400px] overflow-hidden">
                <span className="truncate  text-[11px] capitalize text-gray-600 whitespace-nowrap block">
                  {members.map((member) => member.username).join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700 hidden md:block">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto py-2 px-2 w-full  ${
          selectedGroup && "px-4"
        } z-0 min-h-0`}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-sm text-gray-500">Loading messages...</span>
          </div>
        ) : (messages || []).length == 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p>No messages yet</p>
              <p className="text-sm">
                Start chatting with "
                {selectedGroup?.groupName || selectedFriend?.username}"
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 
          chat?.sender_id._id => For First Time Page Reload We wanna the name and profile Pic of the sender in Group Chat.
          chat?.sender_id => This for the Receiving Message or sending then set to the Chat */}

            {messages.map((chat, index) => {
              return (
                <div
                  key={chat?._id || index}
                  className={`flex w-full mt-5 ${
                    (chat?.sender_id._id || chat?.sender_id) ===
                    loggedInUser?._id
                      ? "justify-end"
                      : "justify-start"
                  } px-1`}
                >
                  {/* ${
                      chat?.message?.text.length > 70 ? "flex-col" : ""
                    }  */}
                  <div
                    className={`w-fit max-w-[80%]   sm:max-w-[60%] pl-2 pr-2 py-1 flex items-end justify-between gap-3 rounded-sm shadow-sm relative ${
                      (chat?.sender_id._id || chat?.sender_id) ===
                      loggedInUser?._id
                        ? "bg-user-bubble ml-auto"
                        : `bg-[#c5f7f287]  mr-auto ${
                            selectedGroup && "ml-2.5"
                          }  ml-0 text-gray-900`
                    } bgblack`}
                  >
                    {/* Show sender's profile and name in group chat if not self */}
                    {String(chat?.sender_id._id || chat?.sender_id) !==
                      String(loggedInUser?._id) &&
                      selectedGroup && (
                        <div className="flex items-center absolute top-1 -left-6 ">
                          <img
                            src={
                              chat?.sender_id.profilePic ||
                              chat?.senderProfilePic
                            }
                            alt="sender"
                            className="w-5 h-5 rounded-full  overflow-hidden"
                          />
                        </div>
                      )}

                    {/* Message */}
                    <div className="text-[13px] break-words tracking-wide flex flex-col">
                      <span className="text-[9px] text-red-500 font-medium">
                        {String(chat?.sender_id._id || chat?.sender_id) !==
                          String(loggedInUser?._id) &&
                          selectedGroup &&
                          `~${chat?.sender_id.username || chat?.senderName}`}
                      </span>

                      {/* This is For Text Message */}
                      {chat?.message?.text || chat?.text}

                      {/* This is For Document Message */}
                      {((chat?.message?.fileType &&
                        chat?.message?.fileType === "application/pdf") ||
                        chat?.selectedFile?.type.startsWith(
                          "application/"
                        )) && (
                        <>
                          <a
                            href={
                              chat?.message?.fileUrl || chat?.selectedFile[0]
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="  hover:bg-teal-50/50  p-1 px-3 sm:w-70 flex items-center gap-3 transition-all duration-200 "
                          >
                            <div className="p-2 rounded-full">
                              <FileText className="text-green-700" />
                            </div>
                            <div>
                              <p className="font-medium text-xs line-clamp-2 text-zinc-700">
                                {/* {chat?.fileUrl || chat?.selectedFile?.[0].name} */}
                                View Document
                              </p>
                              <p className="text-[10px] text-gray-500">
                                Click to open
                              </p>
                              {sizeError && (
                                <p className="text-red-500 animate-pulse text-xs">
                                  {sizeError}
                                </p>
                              )}
                            </div>
                            {chat?.loading && (
                              <div className="absolute top-1 right-2 animate-spin rounded-full h-3 w-3 border-t-2  border-primary"></div>
                            )}
                          </a>
                        </>
                      )}

                      {/* This is For Image Media Message */}
                      {((chat?.message?.fileType &&
                        chat?.message?.fileType.startsWith("image/")) ||
                        chat?.selectedFile?.type.startsWith("image/")) && (
                        <div className="relative">
                          <img
                            src={chat?.message?.fileUrl || chat?.previewFile}
                            alt="preview"
                            className="w-70 sm:max-w-70  max-h-40 h-auto object-contain rounded-sm"
                          />
                          {chat?.loading && (
                            <div className="absolute inset-0 bg-black/50 grid place-items-center">
                              <div className=" animate-spin rounded-full h-7 w-7 border-t-3   border-primary"></div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* This is For Video Media Message */}
                      {((chat?.message?.fileType &&
                        chat?.message?.fileType.startsWith("video/")) ||
                        chat?.selectedFile?.type.startsWith("video/")) && (
                        <div className="relative">
                          <video
                            src={chat?.message?.fileUrl || chat?.previewFile}
                            controls
                            className="w-70 sm:max-w-70  max-h-40 h-auto  object-cover"
                            muted
                          />
                          {chat?.loading && (
                            <div className="absolute inset-0 bg-black/50 grid place-items-center">
                              <div className=" animate-spin rounded-full h-7 w-7 border-t-3   border-primary"></div>
                            </div>
                          )}
                        </div>
                      )}
                      {/* {console.log(chat?.message?.fileType)} */}
                    </div>

                    {/* Arrow */}
                    <div
                      className={`absolute top-0.5 w-2 h-2 rotate-45 ${
                        (chat?.sender_id._id || chat?.sender_id) ===
                        loggedInUser?._id
                          ? "bg-user-bubble -right-1"
                          : "bg-[#c5f7f287] -left-1"
                      }`}
                    ></div>

                    {/* Timestamp */}
                    <span
                      className={`text-[8px] whitespace-nowrap text-gray-500 ${
                        (chat?.message?.text === null ||
                          (chat?.text == null && chat?.selectedFile)) &&
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
                <div className="flex  mt-3">
                  <div className="bg-gray-100 px-4 py-1 rounded-full text-xs text-gray-600 animate-pulse">
                    {typerName} is typing...
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-4 ml-2 w-fit px-2 py-2 shadow-sm ">
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
                  <span className="text-red-500">{typerName}</span>
                </div>
              ))}
          </>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSubmit(handleSendMessage)}
        className="p-3  bg-gray-50 relative shrink-0"
        encType="multipart/form-data"
      >
        {/* Preview */}
        {filePreview && (
          <div
            className={`bg-gray-300 h-auto max-h-40 px-2 rounded overflow-hidden absolute left-0 ${
              fileType == "document" ? "-top-13" : " -top-38"
            } flex flex-col gap-2 text-sm font-medium text-gray-800`}
          >
            <div className="relative">
              {/* Add this wrapper */}
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
                  className="sm:w-70 h-40  "
                  muted
                />
              ) : fileType === "document" ? (
                <>
                  <a
                    href={filePreview}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-teal-100  border border-gray-300 rounded-lg p-1 px-3 w-70 flex items-center gap-3 transition-all duration-200 "
                  >
                    <div className="p-2 rounded-full">
                      <FileText className="text-green-700" />
                    </div>
                    <div>
                      <p className="font-medium text-xs line-clamp-2 text-zinc-700">
                        {docFileName}
                      </p>
                      <p className="text-[10px] text-gray-500">Click to open</p>
                      {sizeError && (
                        <p className="text-red-500 animate-pulse text-xs">
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
          <div className="h-auto  w-42 ml-2 bg-gray-300/90 p-2 rounded-sm absolute left-0 -top-22 shadow-lg flex flex-col gap-2 text-sm font-medium text-gray-700">
            {/* Image Option */}
            <label className="flex items-center gap-2 hover:bg-gray-400/40  hover:text-black rounded p-2">
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
            <label className="flex items-center gap-2 hover:bg-gray-400/40 hover:text-black rounded p-2">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                {...register("selectedDoc", {
                  onChange: handleFileChange,
                })}
              />
              <FileText className="w-5 h-5" />
              <span>Document</span>
            </label>
          </div>
        )}

        <div className="flex items-center  relative">
          <button
            type="button"
            className={`cursor-pointer ${
              showPicker && "bg-gray-300"
            } p-2 rounded-md`}
            onClick={() => {
              setShowPicker(!showPicker);
              setShowMediaPicker(false);
            }}
          >
            <FaRegSmileBeam className="w-4.5 h-4.5 text-gray-600" />
          </button>
          <button
            type="button"
            className={`cursor-pointer ${
              showMediaPicker && "bg-gray-300"
            } p-2 rounded-md`}
            onClick={() => {
              setShowMediaPicker(!showMediaPicker);
              setShowPicker(false);
            }}
          >
            <Paperclip className="w-4.5 h-4.5 text-gray-600" />
          </button>

          <input
            type="text"
            placeholder="Type a message..."
            autoComplete="off"
            autoCapitalize="sentences"
            autoFocus={true}
            className="flex-1 border border-gray-300 bg-white rounded mr-2 py-1.5 px-2 sm:pr-12 focus:outline-none"
            {...register("message")}
            onChange={(e) => {
              selectedGroup &&
                handleGroupTypings(
                  loggedInUser.username,
                  selectedGroup.groupMember,
                  selectedGroup._id,
                  e.target.value.length
                );
              selectedFriend &&
                handleTyping(selectedFriend._id, e.target.value.length);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (e.target.value)
                  handleSendMessage({ message: e.target.value });
              }
            }}
          />

          {showPicker && (
            <div className="hidden sm:block absolute bottom-12 left-2 z-50 rounded-lg shadow-sm border border-gray-300 h-[280px] overflow-hidden">
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
            type="submit"
            className={`p-2 px-2.5 ${
              sizeError ? "bg-primary/30" : "bg-primary hover:bg-primary-hover"
            }  rounded  transition`}
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
