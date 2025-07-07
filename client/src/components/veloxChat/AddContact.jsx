import React, { useEffect, useState } from "react";
import {
  Search,
  PlusCircle,
  User,
  X,
  UserPlus,
  Clock,
  Check,
} from "lucide-react";
import axios from "axios";
import serverObj from "../../config/config";
import { useSelector } from "react-redux";
import socket from "../../config/socket";

const AddContact = ({ status, onCloseAddContact }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const apiKey = serverObj.apikey;
  const loggedInUser = useSelector((state) => state.auth.user);

  // Fetch all users except current user
  const getAllUsers = async () => {
    try {
      const res = await axios.get(`${apiKey}/user/getAllUsers`, {
        withCredentials: true,
      });
      if (res?.data) {
        setUsers(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error.message);
    }
  };

  // Send a friend request and emit socket event only after success
  const handleSendRequest = async (toUserId, user) => {
    console.log(user);
    try {
      const res = await axios.post(
        `${apiKey}/contact/send`,
        { to: toUserId, from: loggedInUser._id },
        { withCredentials: true }
      );

      setRequests((prev) => [
        ...prev,
        { from: loggedInUser._id, to: toUserId, status: "pending" },
      ]);

      socket.emit("send-request", toUserId); // Emit only after DB update
    } catch (err) {
      console.error("Failed to send request:", err.message);
    }
  };

  // Check if the current user has already sent request to this user
  const handleCheckIsSend = (user) => {
    return requests.some(
      (request) =>
        (request.from === loggedInUser._id &&
          request.to === user._id &&
          request.status !== "rejected") ||
        (request.from === user._id &&
          request.to === loggedInUser._id &&
          request.status !== "rejected") // allow re-send if rejected
    );
  };

  // Check if the friend request was accepted
  const handleCheckStatus = (user) => {
    return requests.some(
      (request) =>
        (request.from === loggedInUser._id &&
          request.to === user._id &&
          request.status === "accepted") ||
        (request.from === user._id &&
          request.to === loggedInUser._id &&
          request.status === "accepted")
    );
  };

  // Fetch all sent and received contact requests
  const handleGetAllContactRequests = async () => {
    try {
      const res = await axios.get(`${apiKey}/contact/requests`, {
        withCredentials: true,
      });
      setRequests(res.data);
    } catch (error) {
      console.error("Failed to fetch requests:", error.message);
    }
  };

  // Initial fetch for users and requests, and socket listener setup
  useEffect(() => {
    getAllUsers();
    handleGetAllContactRequests();

    const handleRequest = () => {
      handleGetAllContactRequests(); // Re-fetch requests on socket trigger
      // handleSuccessMsg(res.data.message);
    };

    socket.on("received-request", handleRequest);

    return () => {
      socket.off("received-request", handleRequest); // Clean up
    };
  }, []);

  // Filter users on search or user change
  useEffect(() => {
    if (!searchTerm && users.length > 0) {
      setFilteredUsers(users.filter((u) => u._id !== loggedInUser._id));
    } else {
      const res = users.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          user._id !== loggedInUser._id
      );
      setFilteredUsers(res);
    }
  }, [searchTerm, users, loggedInUser._id]);

  return (
    <div className="max-w-md w-full z-[100] bg-white sm:rounded-xl shadow-md overflow-hidden flex flex-col h-full sm:h-[85dvh] select-none relative">
      {/* Close button */}
      <div
        className="absolute top-5 right-5 text-other-bubble cursor-pointer hover:text-white"
        onClick={() => onCloseAddContact(false)}
      >
        <X />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br bg-primary p-4 text-white">
        <div className="flex items-center gap-3">
          <PlusCircle className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-semibold">Add New Contact</h1>
            <p className="text-sm text-teal-100">Connect with new friends</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-light-border">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded bg-gray-50 focus:outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="ml-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-sm font-medium transition-colors shadow-sm">
            Search
          </button>
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto divide-y space-y-1 divide-gray-100">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user, index) => {
            const isSent = handleCheckIsSend(user);
            const isAccepted = handleCheckStatus(user);
            console.log(isSent);
            return (
              <div
                key={user._id || index}
                className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-all"
              >
                {/* Profile */}
                <div className="relative h-10 w-10">
                  <img
                    src={user.profilePic}
                    alt="User"
                    className="w-full h-full rounded-full object-cover"
                  />
                  {/* Online status */}
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white shadow ${
                      status === "online"
                        ? "bg-green-500"
                        : status === "recent"
                        ? "bg-yellow-500"
                        : "hidden"
                    }`}
                  />
                </div>

                {/* Name + Status */}
                <div className="flex-1">
                  <h2 className="text-gray-800 font-semibold capitalize">
                    {user.username}
                  </h2>
                  {status !== "offline" && (
                    <p
                      className={`text-sm ${
                        status === "online"
                          ? "text-green-600"
                          : status === "recent"
                          ? "text-yellow-500"
                          : "text-gray-400"
                      }`}
                    >
                      {status}
                    </p>
                  )}
                </div>

                {/* Add button */}
                <button
                  onClick={() => handleSendRequest(user._id, user)}
                  className={`text-xs px-2 py-1.5 rounded shadow-md transition-all duration-300 flex items-center gap-1 ${
                    isSent
                      ? isAccepted
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-other-bubble text-gray-700 cursor-not-allowed"
                      : "bg-primary hover:bg-primary-hover text-white cursor-pointer"
                  }`}
                  disabled={isSent}
                >
                  {isSent ? (
                    isAccepted ? (
                      <>
                        <Check size={14} /> Added
                      </>
                    ) : (
                      <>
                        <Clock size={14} /> Sent
                      </>
                    )
                  ) : (
                    <>
                      <UserPlus size={16} /> Add
                    </>
                  )}
                </button>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No Contact Yet
            </h3>
            <p className="text-gray-500">Try a different search term</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
        <p className="text-sm text-gray-500">
          {filteredUsers.length} contacts found
        </p>
      </div>
    </div>
  );
};

export default AddContact;
