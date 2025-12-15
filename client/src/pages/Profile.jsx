import React, { useEffect, useState } from "react";
import {
  LogOut,
  Edit,
  Mail,
  Calendar,
  ChevronLeft,
  Phone,
  Check,
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
  const [activeTab, setActiveTab] = useState("themes");
  const [selectedTheme, setSelectedTheme] = useState(
    localStorage.getItem("secondaryTheme") || "teal"
  );

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
        handleSuccessMsg(res.data.message);
        dispatch(addUser(res.data.user));
        setIsAvator(false);
      })
      .catch((err) => handleErrorMsg(err.message))
      .finally(() => setLoading(false));
  };

  const themes = [
    { name: "teal", bg: "bg-gradient-to-r from-teal-600 to-teal-700" },
    { name: "blue", bg: "bg-gradient-to-r from-blue-600 to-blue-700" },
    { name: "indigo", bg: "bg-gradient-to-r from-indigo-600 to-indigo-700" },
    { name: "purple", bg: "bg-gradient-to-r from-purple-600 to-purple-700" },
    { name: "pink", bg: "bg-gradient-to-r from-pink-600 to-pink-700" },
    { name: "orange", bg: "bg-gradient-to-r from-orange-600 to-orange-700" },
  ];

  useEffect(() => {
    const root = document.documentElement;
    themes.map((theme) => {
      root.classList.contains(theme.name) && root.classList.remove(theme.name);
    });
    root.classList.add(selectedTheme);
    localStorage.setItem("secondaryTheme", selectedTheme);
  }, [selectedTheme]);
  return (
    <div className="min-h-screen bg-background dark:bg-background p-4 md:p-6 flex flex-col items-center relative">
      <NavLink
        className="fixed top-7  z-50 left-5 flex items-center gap-1 text-text-secondary hover:text-text-primary dark:text-white  dark:sm:text-text-secondary dark:hover:text-text-primary cursor-pointer"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft size={20} /> <span className="text-sm">Back</span>
      </NavLink>

      <div className="w-full max-w-4xl bg-white dark:bg-secondary rounded-xl shadow-sm overflow-hidden">
        {/* Cover Photo - Uses selected theme */}
        <div
          className={`h-32 ${
            themes.find((t) => t.name === selectedTheme)?.bg
          } relative`}
        >
          <div className="absolute -bottom-16 left-6">
            <form
              encType="multipart/form-data"
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
                  className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                />
                <button
                  type="button"
                  className="absolute bottom-0 right-0 h-9 w-9 bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-dark-zinc-700 dark:text-gray-200 dark:hover:bg-gray-600 rounded-full transition-all flex items-center justify-center"
                >
                  <input
                    type="file"
                    className="w-full h-full opacity-0 absolute top-0 left-0 cursor-pointer"
                    {...register("newProfilePic", {
                      onChange: () => setIsAvator(true),
                    })}
                  />
                  <Edit size={16} />
                </button>
              </div>
              {isAvator && (
                <button
                  className="mt-3 bg-primary hover:bg-primary-hover dark:bg-primary dark:hover:bg-primary-hover text-sm text-white px-3 py-1 rounded-md font-medium"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Photo"}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Profile Content */}
        <div className="pt-20 px-6 pb-6">
          <div className="flex flex-col md:flex-row justify-between">
            {/* Main Profile Info */}
            <div className="md:w-2/3">
              <h1 className="text-2xl font-bold capitalize text-text-primary dark:text-text-primary">
                {user.username}
              </h1>
              <p className="mt-1 text-text-secondary dark:text-text-secondary">
                {user.bio || "No bio yet"}
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail
                    size={18}
                    className="text-text-secondary dark:text-text-secondary"
                  />
                  <span className="text-text-normal dark:text-text-normal">
                    {user.email}
                  </span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone
                      size={18}
                      className="text-text-secondary dark:text-text-secondary"
                    />
                    <span className="text-text-normal dark:text-text-normal">
                      {user.phone}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar
                    size={18}
                    className="text-text-secondary dark:text-text-secondary"
                  />
                  <span className="text-text-normal dark:text-text-normal">
                    Joined {joinedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row md:items-start gap-3 mt-4 md:mt-0">
              <button
                className="flex items-center justify-center gap-2 cursor-pointer bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 border-b border-light-border ">
            <nav className="flex space-x-8">
              <button
                className={`py-2 px-1 font-medium text-sm border-b-2 ${
                  activeTab === "themes"
                    ? "border-primary text-primary dark:border-primary dark:text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary dark:text-text-secondary dark:hover:text-text-primary"
                }`}
                onClick={() => setActiveTab("themes")}
              >
                Themes
              </button>
            </nav>
          </div>

          {/* Theme Selection */}
          <div className="mt-6">
            {activeTab === "themes" && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary mb-4">
                  Choose Theme
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {themes.map((theme) => (
                    <div
                      key={theme.name}
                      onClick={() => setSelectedTheme(theme.name)}
                      className={`${theme.bg} h-24 rounded-lg cursor-pointer relative overflow-hidden transition-transform hover:scale-105 shadow-md`}
                    >
                      {selectedTheme === theme.name && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 ">
                          <Check size={24} className="text-white" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 text-white text-sm font-medium capitalize">
                        {theme.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
