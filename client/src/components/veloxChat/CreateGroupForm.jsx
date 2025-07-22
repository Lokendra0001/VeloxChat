import React, { useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  Image,
  Edit,
  Camera,
  Plus,
  Minus,
} from "lucide-react"; // optional icons
import { useForm } from "react-hook-form";
import axios from "axios";
import { useSelector } from "react-redux";
import serverObj from "../../config/config";
import { handleSuccessMsg } from "../../config/toast";
import { useNavigate } from "react-router-dom";
import socket from "../../config/socket";

const CreateGroupForm = ({ setShowCreateGroupForm }) => {
  const [friends, setFriends] = useState([]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const groupProfileImg = watch("groupProfileImg");
  const loggedInUser = useSelector((state) => state.auth.user);
  const [selectedFriends, setSelectedFriends] = useState([loggedInUser._id]);
  const [loading, setLoading] = useState(false);
  const apiKey = serverObj.apikey;
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleGetAllFriends = () => {
      axios
        .get(`${apiKey}/user/getAllFriends`, {
          withCredentials: true,
        })
        .then((res) => setFriends(res.data.friends))
        .catch((err) => console.log(err));
    };
    handleGetAllFriends();
  }, []);

  const handleAddFriend = (friendId) => {
    const isAlreadyFriend = selectedFriends.find((e) => e == friendId);
    if (isAlreadyFriend) {
      setSelectedFriends(selectedFriends.filter((e) => e !== friendId));
    } else {
      setSelectedFriends((prev) => [...prev, friendId]);
    }
  };

  const checkAddedFriend = (friendId) => {
    const isAlreadyFriend = selectedFriends.find((e) => e == friendId);
    if (isAlreadyFriend) {
      return true;
    } else {
      return false;
    }
  };

  const handleCreateGroupSubmit = (data) => {
    setError(false);
    const formData = new FormData();

    if (selectedFriends.length <= 1) {
      setError(true);
      return;
    }
    setLoading(true);

    // Append the actual file (not just the file name)
    if (data.groupProfileImg?.[0]) {
      formData.append("groupProfilePic", data.groupProfileImg[0]);
    }
    formData.append("groupName", data.groupName);

    // Convert selectedFriends array to JSON string or loop through each friend
    formData.append("selectedFriends", JSON.stringify(selectedFriends));

    axios
      .post(`${apiKey}/group/createGroup`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      })
      .then((res) => {
        const group = res.data.group;
        handleSuccessMsg(res.data.message);
        setShowCreateGroupForm(false);
        socket.emit("group-created", group);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <form
      className="max-w-lg w-full mx-auto bg-white dark:bg-secondary shadow-md rounded-lg p-6 select-none"
      encType="multipart/form-data"
      onSubmit={handleSubmit(handleCreateGroupSubmit)}
    >
      {/* Heading */}
      <h2 className="text-2xl font-bold text-primary mb-6">Create Group</h2>

      {/* Group Icon + Name */}
      <div className="flex items-center gap-5 mb-6">
        <div className="w-16 h-16 bg-gray-200 dark:bg-background dark:text-text-normal border border-gray-300 dark:border-transparent rounded-full  overflow-hidden group flex items-center justify-center relative">
          {groupProfileImg?.[0] ? (
            <img
              src={
                groupProfileImg?.[0] && URL.createObjectURL(groupProfileImg[0])
              }
              alt=""
            />
          ) : (
            <Image />
          )}
          <button className="absolute h-full w-full bg-black/20 text-white backdrop-blur-[3px]   rounded-full  transition-all  flex items-center justify-center group-hover:opacity-100 opacity-0">
            <input
              type="file"
              className="w-full h-full opacity-0 absolute top-0 left-0 cursor-pointer"
              accept="image/*"
              {...register("groupProfileImg", {
                required: { value: true, message: "GroupProfile is required!" },
              })}
            />

            <Camera size={20} />
          </button>
          {errors.groupProfileImg && (
            <p className="text-red-500 text-[10px] ">
              {errors.groupProfileImg.message}
            </p>
          )}
        </div>
        <div className="grow flex flex-col   gap-1 ">
          <input
            type="text"
            placeholder="Group Name"
            className="w-full border border-gray-300 dark:bg-light-border dark:border-zinc-600 dark:text-text-normal rounded px-3 py-1.5 outline-none focus:border-teal-400"
            {...register("groupName", {
              required: {
                value: true,
                message: "Group Name is required!",
              },
            })}
          />
          {errors.groupName && (
            <p className="text-red-500 text-xs ">{errors.groupName.message}</p>
          )}
        </div>
      </div>

      {selectedFriends.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 text-sm mb-1 ">
            {selectedFriends.map((id) => {
              const friend = friends.find((f) => f._id === id);
              return (
                <div
                  key={id}
                  className="bg-teal-100 dark:bg-primary-hover/60  text-teal-800 dark:text-text-normal px-3 py-1 rounded-full flex items-center gap-2"
                >
                  <img
                    src={
                      id == loggedInUser._id
                        ? loggedInUser?.profilePic
                        : friend?.profilePic
                    }
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                  <span>
                    {id == loggedInUser._id ? "You" : friend?.username}
                  </span>
                </div>
              );
            })}
          </div>
          {error && (
            <p className="text-red-500 text-xs">
              Group Should Be More than or equal to 2 Peoples!
            </p>
          )}
        </div>
      )}

      {/* Friends List (UI Only) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-primary mb-5">
          Select Friends
        </h3>
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {friends.map((friend, i) => (
            <li
              key={friend._id}
              className="flex justify-between items-center bg-teal-50 dark:bg-light-border p-2 rounded"
            >
              <div className="flex gap-2 items-center">
                <img
                  src={friend?.profilePic}
                  alt=""
                  className="h-6 w-6 rounded"
                />
                <span className="text-zinc-700 font-medium text-sm dark:text-text-normal ">
                  {friend.username}
                </span>
              </div>
              <button
                className=" border-gray-300 p-1  rounded-full  cursor-pointer text-sm"
                onClick={() => handleAddFriend(friend._id)}
                type="button"
              >
                {checkAddedFriend(friend._id) ? (
                  <Minus height={16} width={16} className="text-red-600" />
                ) : (
                  <Plus height={16} width={16} className="text-primary" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Create Button */}
      <button
        className={`w-full ${
          loading
            ? "bg-teal-600/60 cursor-not-allowed"
            : "bg-teal-600 hover:bg-teal-700 "
        }  text-white py-2 rounded transition flex items-center justify-center gap-1`}
        type="submit"
        disabled={loading}
      >
        <Plus size={18} /> {loading ? "Creating..." : "Create Group"}
      </button>
    </form>
  );
};

export default CreateGroupForm;
