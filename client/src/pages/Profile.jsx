import React, { useState } from "react";
import {
  LogOut,
  Edit,
  UserRound,
  Mail,
  Calendar,
  ChevronLeft,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import serverObj from "../config/config";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import { addUser, removeUser } from "../store/slices/authSlice";
import socket from "../config/socket";
import { useForm } from "react-hook-form";
import { handleSuccessMsg, handleErrorMsg } from "../config/toast";

const Profile = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, watch } = useForm();
  const [isAvator, setIsAvator] = useState(false);
  const profilePic = watch("newProfilePic");
  const [loading, setLoading] = useState(false);

  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleLogout = () => {
    axios
      .get(`${serverObj.apikey}/user/signout`, { withCredentials: true })
      .then((res) => {
        dispatch(removeUser());
        handleSuccessMsg(res.data);
        socket.emit("logged-out");
        navigate("/auth");
      })
      .catch((err) => handleErrorMsg(err.message));
  };

  const changeProfilePic = (data) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("profilePic", data.newProfilePic[0]);
    axios
      .patch(`${serverObj.apikey}/user/updateProfilePic`, formData, {
        withCredentials: true,
      })
      .then((res) => {
        console.log(user);
        console.log(res.data.user);
        handleSuccessMsg(res.data.message);
        dispatch(addUser(res.data.user));
      })
      .catch((err) => handleErrorMsg(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-6 flex flex-col items-center justify-center relative">
      <NavLink
        className="absolute top-5 left-5 sm:top-10 sm:left-10 flex  text-primary hover:text-primary-hover cursor-pointer mb-4"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft /> <span>Back</span>
      </NavLink>

      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-800">
          <UserRound size={28} className="text-primary" />
          My Profile
        </h1>
      </div>

      {/* Profile Card */}
      <div className="w-full max-w-2xl  rounded-2xl p-8 bg-white shadow-xl transition-all hover:shadow-2xl">
        <div className="flex flex-col md:flex-row items-center  md:items-start gap-8">
          {/* Avatar Section */}
          <form
            encType="multipart/form-data"
            className="flex flex-col items-center"
            onSubmit={handleSubmit(changeProfilePic)}
          >
            <div className="relative group">
              <img
                src={
                  profilePic?.[0]
                    ? URL.createObjectURL(profilePic?.[0])
                    : user.profilePic
                }
                alt="Profile"
                className="w-36 h-36 rounded-full border-4 border-indigo-100 object-cover shadow-md transition-transform duration-300 lg:group-hover:scale-105"
              />
              <button className="absolute bottom-2 right-2 h-7 w-7 bg-primary  rounded-full text-white hover:bg-primary-hover transition-all lg:opacity-0 group-hover:opacity-100 flex items-center justify-center">
                <input
                  type="file"
                  className="w-full h-full opacity-0 absolute top-0 left-0"
                  {...register("newProfilePic", {
                    onChange: () => setIsAvator(true),
                  })}
                />
                <Edit size={16} />
              </button>
            </div>

            {isAvator && (
              <button
                className=" bg-primary text-sm cursor-pointer text-white tracking-wide mt-5 p-2 px-4 rounded-sm font-semibold"
                type="submit"
              >
                {loading ? "Updating..." : "Update Avator"}
              </button>
            )}
          </form>

          {/* Info Section */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 capitalize mb-1">
                {user.username}
              </h2>
              <div className="flex items-center gap-2 text-gray-600 mb-2">
                <Mail size={16} className="text-primary" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Calendar size={16} className="text-indigo-400" />
                <span>Joined {joinedDate}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              className="mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
