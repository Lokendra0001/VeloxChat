import React, { useState, useEffect } from "react";
import { User, Search, Plus, Bell } from "lucide-react";
import UserCard from "./UserCard";
import AddContact from "./AddContact";
import Header from "../common/Header";
import logo from "../../assets/logoPng.png";
import serverObj from "../../config/config";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
import socket from "../../config/socket";
import { addselectedFriend } from "../../store/slices/selectedFriendSlice";
import { handleErrorMsg, handleSuccessMsg } from "../../config/toast";
import GroupList from "./GroupList";

function ContactsPanel({ isSideOpen, setSideOpen }) {
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [isGroup, setIsGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [notify, setNotify] = useState(false);
  const apiKey = serverObj.apikey;
  const loggedInUser = useSelector((state) => state.auth.user);

  const dispatch = useDispatch();
  const selectedFriend = useSelector(
    (state) => state.selectedFriend.selectedFriend
  );

  // Fetch friend list from server
  const fetchFriends = async () => {
    try {
      const res = await axios.get(`${apiKey}/user/getAllFriends`, {
        withCredentials: true,
      });
      const fetchedFriends = res.data.friends || [];
      setFriends(fetchedFriends);
      setFilteredFriends(fetchedFriends);
    } catch (err) {
      handleErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();

    const handleIncomingRequest = () => setNotify(true);

    const handleAddAcceptedRequestFriend = (friend) => {
      const isAlreadyFriend = friends.find((user) => user._id === friend._id);
      if (isAlreadyFriend) return;
      const updatedFriends = [...friends, { ...friend }];
      setFriends(updatedFriends);

      // Also update the filtered list so the UI reflects change
      setFilteredFriends(updatedFriends);
      handleSuccessMsg(`${friend.username} accepted your request.`);
    };

    const handleUserOffline = (userId) => {
      setFriends((prev) => {
        const updatedList = prev.map((friend) =>
          friend._id === userId ? { ...friend, status: "offline" } : friend
        );

        // Dispatch to get the correct status online or offline in chatBox
        const matched = updatedList.find((f) => f._id === selectedFriend?._id);
        if (matched) {
          dispatch(addselectedFriend(matched));
        }

        return updatedList;
      });
    };

    const handleUserOnline = (userId) => {
      setFriends((prev) => {
        const updatedList = prev.map((friend) =>
          friend._id === userId ? { ...friend, status: "online" } : friend
        );

        // Dispatch to get the correct status online or offline in chatBox
        const matched = updatedList.find((f) => f._id === selectedFriend?._id);
        if (matched) {
          dispatch(addselectedFriend(matched));
        }

        return updatedList;
      });
    };

    socket.on("received-request", handleIncomingRequest);
    socket.on("addFriend-contactPanel", handleAddAcceptedRequestFriend);
    socket.on("user-offline", handleUserOffline);
    socket.on("user-online", handleUserOnline);

    return () => {
      return () => {
        socket.off("received-request", handleIncomingRequest);
        socket.off("addFriend-contactPanel", handleAddAcceptedRequestFriend);
        socket.off("user-offline", handleUserOffline);
        socket.off("user-online", handleUserOnline);
      };
    };
  }, []);

  // Filter friends based on search term
  useEffect(() => {
    const result = friends.filter((user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFriends(result);
  }, [searchTerm, friends]);

  return (
    <>
      <div
        className={`max-w-md border-l border-gray-300 dark:border-border mx-auto bg-white dark:bg-background h-[100dvh] md:flex flex-col shadow-lg overflow-hidden absolute w-full z-[90] md:relative   select-none ${
          isSideOpen ? "right-0" : "-right-full"
        } md:right-0`}
      >
        {/* Top Header */}
        <Header onAddContact={setShowAddContact} />

        {/* Search Bar */}
        <div className="px-2 my-3   dark:bg-transparent">
          <div className="relative flex w-full border border-gray-300 dark:border-border rounded bg-white dark:bg-secondary px-2 py-0.5">
            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-gray-400 dark:text-text-secondary" />
            </div>
            <input
              type="text"
              className="block w-full pr-3 py-1 outline-none sm:text-sm bg-transparent placeholder-gray-400 dark:placeholder-text-secondary dark:text-text-primary"
              placeholder={`Search ${isGroup ? "Groups..." : "Contacts..."}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Types of Chat individual or group */}
        <div className="flex gap-2 w-full justify-start pl-3 items-center border-b border-transparent text-sm ">
          <button
            onClick={() => setIsGroup(false)}
            className={`pb-1 px-1 font-medium ${
              !isGroup
                ? "text-primary dark:text-primary-hover border-b-2 border-primary dark:border-primary-hover"
                : "text-gray-500 dark:text-text-secondary"
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setIsGroup(true)}
            className={`pb-1 px-1 font-medium ${
              isGroup
                ? "text-primary dark:text-primary-hover border-b-2 border-primary dark:border-primary-hover"
                : "text-gray-500 dark:text-text-secondary"
            }`}
          >
            Groups
          </button>
        </div>

        {isGroup ? (
          <GroupList setSideOpen={setSideOpen} searchTerm={searchTerm} />
        ) : (
          // friends List
          <div className="h-[68dvh] mt-3 overflow-y-auto">
            {isLoading ? (
              // Skeleton loader for UI feedback
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="p-4 flex items-center animate-pulse"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-light-border"></div>
                  <div className="ml-4 flex-1 space-y-2">
                    <div className="h-3 bg-gray-300 dark:bg-light-border rounded w-3/4"></div>
                    <div className="h-3 bg-zinc-300 dark:bg-secondary rounded w-1/3"></div>
                  </div>
                </div>
              ))
            ) : filteredFriends.length > 0 ? (
              filteredFriends.map((user, index) => (
                <UserCard
                  key={user._id || index}
                  user={user}
                  setSideOpen={setSideOpen}
                />
              ))
            ) : (
              // Empty state view
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-other-bubble dark:bg-secondary rounded-full flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-gray-400 dark:text-text-secondary" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-text-primary mb-1">
                  {searchTerm ? "No results found" : "No contacts"}
                </h3>
                <p className="text-gray-500 dark:text-text-secondary">
                  {searchTerm
                    ? "Try a different search term"
                    : "Add new contacts to get started"}
                </p>
                {!searchTerm && (
                  <button
                    className="mt-4 px-2 py-1.5 bg-primary dark:bg-primary-hover text-white rounded hover:bg-primary-hover dark:hover:bg-primary cursor-pointer transition flex items-center"
                    onClick={() => setShowAddContact(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer with Profile & Notifications */}
        <div className="py-1 h-14 flex justify-between items-center gap-4 px-4 border-t border-gray-300 dark:border-zinc-800">
          {/* User Info */}
          <NavLink to="/profile" className="flex gap-3 items-center grow group">
            <img
              src={loggedInUser?.profilePic}
              alt={loggedInUser?.username || "User"}
              className="h-9 w-9 rounded-full object-cover border border-gray-200 dark:border-light-border"
            />
            <div className="flex flex-col ">
              <h1 className="text-sm font-medium text-gray-800 dark:text-text-primary -mb-0.5 truncate max-w-[120px]">
                {loggedInUser?.username || "Guest"}
              </h1>
              <button className="text-xs text-primary dark:text-primary-hover sm:text-gray-500 dark:sm:text-text-secondary group-hover:text-primary-hover dark:hover:text-primary transition-colors duration-200">
                View Profile
              </button>
            </div>
          </NavLink>

          {/* Notification Icon */}
          <NavLink
            to="/notification"
            className="p-2 rounded-full hover:bg-teal-100 dark:hover:bg-secondary transition-colors duration-200 relative"
            title="Notifications"
          >
            <Bell
              size={20}
              className="text-gray-600 dark:text-text-secondary"
            />
            {notify && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            )}
          </NavLink>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="w-full absolute top-0 h-full backdrop-blur-[1px] z-[100] grid place-items-center">
          <AddContact onCloseAddContact={setShowAddContact} />
          <div
            className="bg-black/20 absolute inset-0 -z-4"
            onClick={() => setShowAddContact(false)}
          />
        </div>
      )}
    </>
  );
}

export default ContactsPanel;
