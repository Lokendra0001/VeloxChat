import React, { useEffect, useState } from "react";
import logo from "../../assets/logoPng.png";
import {
  LucideBotMessageSquare,
  LucideMessagesSquare,
  MessageCircleHeartIcon,
  MessageSquare,
  Moon,
  MoonStar,
  Plus,
  SunMedium,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { removeselectedFriend } from "../../store/slices/selectedFriendSlice";
import { BsMoonStars } from "react-icons/bs";
import { removeSelectedGroup } from "../../store/slices/selectedGroupSlice";

const Header = ({ onAddContact }) => {
  const dispatch = useDispatch();
  const [isDark, setIsDark] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <div>
      {/* Header */}

      <nav className="p-4 h-[10dvh] w-full  flex items-center justify-between border-b border-gray-300   dark:border-light-border select-none">
        <div
          className="flex items-center space-x-1 cursor-pointer"
          onClick={() => {
            dispatch(removeselectedFriend());
            dispatch(removeSelectedGroup());
          }}
        >
          <div className="p-2 rounded-2xl border border-gray-300 shadow-xl dark:border-light-border">
            <LucideMessagesSquare
              className="text-primary-hover dark:text-primary  "
              size={23}
            />
          </div>
          <h1 className="text-primary font-bold text-2xl dark:text-white/95">
            VeloxChat
          </h1>
        </div>
        <div className="flex items-center gap-1 ">
          <button
            className={`text-primary dark:text-text-normal cursor-pointer hover:bg-primary hover:text-white  rounded-full p-1 transition-colors mr-1  md:mr-0`}
            title="Add New Contact"
            onClick={() => onAddContact(true)}
          >
            <Plus size={20} />
          </button>
          <button
            className="text-zinc-700 dark:text-text-normal cursor-pointer rounded-full p-1 transition-colors mr-9 md:mr-0 font-normal"
            title="Switch Dark/Light"
            onClick={() => setIsDark(!isDark)}
          >
            <span
              className={`flex items-center justify-center w-6 h-6 transition-transform duration-300 ease-in-out ${
                isDark ? "rotate-20" : "rotate-0"
              }`}
            >
              {!isDark ? (
                <SunMedium size={20} />
              ) : (
                <MoonStar size={20} className="scale-[0.85]" />
              )}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Header;
