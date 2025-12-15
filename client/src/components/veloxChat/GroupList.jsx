import React, { useEffect, useState } from "react";
import UserCard from "./UserCard";
import { Group, Plus, User } from "lucide-react";
import CreateGroupForm from "./CreateGroupForm";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addSelectedGroup } from "../../store/slices/selectedGroupSlice";
import { removeselectedFriend } from "../../store/slices/selectedFriendSlice";
import serverObj from "../../config/config";
import socket from "../../config/socket";

const GroupList = ({ setSideOpen, searchTerm }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState([]);
  const [filteredGroup, setFilteredGroup] = useState([]);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const dispatch = useDispatch();
  const apiKey = serverObj.apikey;

  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`${apiKey}/group/getAllGroups`, {
        withCredentials: true,
      })
      .then((res) => {
        setGroups(res.data);
        setFilteredGroup(res.data);
      })
      .catch((err) => console.log(err))
      .finally(() => setIsLoading(false));

    const handleAddGroup = (group) => {
      setGroups((prev) => [...prev, group]);
      setFilteredGroup((prev) => [...prev, group]);
    };

    socket.on("group-created", handleAddGroup);

    return () => socket.off("group-created", handleAddGroup);
  }, []);

  useEffect(() => {
    const result = groups.filter((group) =>
      group.groupName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredGroup(result);
  }, [searchTerm]);
  return (
    <>
      <div className="h-[70dvh] mt-3 overflow-y-auto flex flex-col justify-between">
        <div>
          {isLoading
            ? // Skeleton loader for UI feedback
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="p-4 flex items-center animate-pulse"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-secondary"></div>
                  <div className="ml-4 flex-1 space-y-2 ">
                    <div className="h-3 bg-gray-300 dark:bg-secondary rounded w-3/4"></div>
                    <div className="h-3 bg-zinc-300 dark:bg-secondary rounded w-1/3"></div>
                  </div>
                </div>
              ))
            : filteredGroup.length > 0 &&
              filteredGroup.map((group, index) => (
                <div
                  key={group._id}
                  className="flex justify-between items-center  mb-1 p-2 cursor-pointer "
                  onClick={() => {
                    dispatch(addSelectedGroup(group));
                    dispatch(removeselectedFriend());
                    setSideOpen(false);
                  }}
                >
                  <div className="flex gap-2 items-center ">
                    <img
                      src={group?.groupProfileImg}
                      alt=""
                      className="sm:h-7 sm:w-7 h-9 w-9 rounded-full shadow-lg "
                    />
                    <span className="text-text-normal dark:text-normal font-medium text-[15px] sm:text-sm">
                      {group?.groupName}
                    </span>
                  </div>
                </div>
              ))}

          {!isLoading && filteredGroup.length == 0 && (
            // Empty state view
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-other-bubble rounded-full flex items-center justify-center mb-4">
                <Group className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-700 mb-1">
                {searchTerm
                  ? "No groups found"
                  : "You're not in any groups yet"}
              </h3>
              <p className="text-gray-500 text-xs font-medium">
                {searchTerm
                  ? "Try searching with a different keyword"
                  : "Start by creating a new group!"}
              </p>

              <button
                className="mt-4 text-sm px-2 py-1 bg-primary text-white rounded hover:bg-primary-hover cursor-pointer transition flex items-center"
                onClick={() => setShowCreateGroupForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </button>
            </div>
          )}
        </div>

        {filteredGroup.length > 0 && (
          <button
            className="bg-primary dark:bg-primary-hover mr-4 w-fit self-end flex mb-2 p-1.5 cursor-pointer  text-white text-xs items-center  gap-1 rounded-full group hover:rounded "
            onClick={() => setShowCreateGroupForm(true)}
            title="Create New Group"
          >
            <Plus size={18} />{" "}
            <span className="group-hover:inline-block sm:hidden ">
              Create Group
            </span>
          </button>
        )}
      </div>

      {/* Create Group Form */}

      {showCreateGroupForm && (
        <div className="fixed inset-0 backdrop-blur-[1px] z-[100] grid place-items-center">
          <CreateGroupForm setShowCreateGroupForm={setShowCreateGroupForm} />
          <div
            className="bg-black/20 absolute inset-0 -z-4"
            onClick={() => setShowCreateGroupForm(false)}
          />
        </div>
      )}
    </>
  );
};

export default GroupList;
