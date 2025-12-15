import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import serverObj from "../config/config";
import { User, Check, X, ChevronLeft } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import socket from "../config/socket";
import { handleSuccessMsg } from "../config/toast";

const NotifcationPage = () => {
  const loggedInUser = useSelector((state) => state.auth.user);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGetAllRequests = () => {
    setLoading(true);
    axios
      .get(`${serverObj.apikey}/contact/requests/${loggedInUser._id}`, {
        withCredentials: true,
      })
      .then((res) => setFriendRequests(res.data))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    handleGetAllRequests();
  }, [loggedInUser._id]);

  useEffect(() => {
    const handleRequest = () => {
      handleGetAllRequests();
    };

    socket.on("received-request", handleRequest);

    return () => {
      socket.off("received-request", handleRequest);
    };
  }, []);

  const handleAddFriend = (friendId) => {
    axios
      .patch(
        `${serverObj.apikey}/user/addFriend`,
        { friendId },
        { withCredentials: true }
      )
      .then((res) => {
        handleSuccessMsg("Friend Added!");
      })
      .catch((err) => console.log(err));
  };

  const handleAcceptRequest = (request_id, friendId, friend) => {
    axios
      .patch(
        `${serverObj.apikey}/contact/accept/${request_id}`,
        {},
        { withCredentials: true }
      )
      .then(() => {
        handleAddFriend(friendId);
        setFriendRequests((prev) =>
          prev.filter((req) => req._id !== request_id)
        );
        socket.emit("onChange-request", friendId);
        socket.emit("request-accepted", loggedInUser, friendId);
      })
      .catch((err) => console.log(err));
  };

  const handleRejectRequest = (request_id, friendId) => {
    axios
      .patch(
        `${serverObj.apikey}/contact/reject/${request_id}`,
        {},
        { withCredentials: true }
      )
      .then(() => {
        setFriendRequests((prev) =>
          prev.filter((req) => req._id !== request_id)
        );
        socket.emit("onChange-request", friendId);
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="w-full min-h-screen  bg-background">
      <div className="max-w-2xl mx-auto p-4 pt-20 bg-background  min-h-screen">
        <h2 className="text-2xl font-semibold mb-4 text-text-primary dark:text-text-primary">
          Contact Requests
        </h2>

        <div
          className="absolute top-5 left-5  sm:top-10 sm:left-10 flex text-primary dark:text-text-secondary dark:hover:text-text-normal cursor-pointer mb-4"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft /> <span>Back</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center mt-10">
            <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : friendRequests.length === 0 ? (
          <p className="text-text-secondary dark:text-text-secondary text-center">
            No pending requests
          </p>
        ) : (
          <div className="space-y-4">
            {friendRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white dark:bg-secondary shadow-sm border border-light-border dark:border-border rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 dark:bg-dark-zinc-700">
                    <img
                      src={req.from.profilePic}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-text-primary dark:text-text-primary font-medium capitalize">
                      {req.from.username}
                    </h3>
                    <p className="text-sm text-text-secondary dark:text-text-secondary">
                      wants to connect
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-1 bg-primary hover:bg-primary-hover dark:bg-primary dark:hover:bg-primary-hover text-white text-sm px-3 py-1.5 rounded transition"
                    onClick={() =>
                      handleAcceptRequest(req._id, req.from._id, req.from)
                    }
                  >
                    <Check size={16} /> Accept
                  </button>
                  <button
                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1.5 rounded transition"
                    onClick={() => handleRejectRequest(req._id, req.from._id)}
                  >
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotifcationPage;
