import React, { useEffect, useState, useRef } from "react";
import { MoreVertical, PinIcon } from "lucide-react";
import { useDispatch } from "react-redux";
import { addselectedFriend } from "../../store/slices/selectedFriendSlice";
import { removeSelectedGroup } from "../../store/slices/selectedGroupSlice";

const UserCard = ({ users, setSideOpen }) => {
  const dispatch = useDispatch();
  const sortedUsers = [...users].sort((a, b) => {
    return (b?.isAI === true) - (a?.isAI === true);
  });

  return sortedUsers.map((user, index) => (
    <div
      key={index}
      className=" flex p-2 ml-1 mt-1 cursor-pointer"
      onClick={() => {
        dispatch(addselectedFriend(user));
        dispatch(removeSelectedGroup());
        setSideOpen?.(false);
      }}
    >
      {/* User ProfilePic */}
      <div className="sm:h-8 sm:w-8 h-9 w-9 relative grid place-items-center overflow-hidden">
        <img
          src={user.profilePic}
          alt="User Img"
          className="h-full w-full rounded-full object-cover overflow-hidden"
        />

        {/* Status Dot */}
        <div
          className={`absolute bottom-0.5 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-light-border ${
            user.status == "online"
              ? "bg-green-500"
              : user.status == "recent"
              ? "bg-yellow-500"
              : "hidden"
          } shadow-sm`}
        />
      </div>

      {/* User Name & Status & More Vertical Icon */}
      <div className="ml-3 flex-1 flex items-center justify-between w-full">
        <div>
          <h2 className="text-text-normal font-semibold sm:text-sm text-[15px]">
            {user?.username}
          </h2>
          <p
            className={` ${
              user.status === "online"
                ? "text-green-600"
                : user.status === "recent"
                ? "text-yellow-500"
                : "hidden"
            } text-xs leading-2.5`}
          >
            {user.status}
          </p>
        </div>

        {/* More Vertical Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // handleDropdownToggle(index);
          }}
          className="relative "
          title="Functionality Come in Next Update!"
        >
          {user?.isAI ? (
            <PinIcon
              className="rotate-45 text-gray-400 cursor-pointer hover:text-primary-hover"
              size={17}
            />
          ) : (
            <MoreVertical
              className="text-gray-400 cursor-pointer hover:text-primary-hover"
              size={17}
            />
          )}

          {/* <div
                    className={`absolute right-2 ${
                      openId === index ? "block" : "hidden"
                    }`}
                  >
                    {["HELLO", "RAKESH", "WORLD"].map((text) => (
                      <p key={text} className="p-1 border border-gray-300">
                        {text}
                      </p>
                    ))}
                  </div> */}
        </button>
      </div>
    </div>
  ));
};

export default UserCard;
