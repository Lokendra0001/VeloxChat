import React from "react";
import logo from "../../assets/logoPng.png";
import { Plus } from "lucide-react";
import { useDispatch } from "react-redux";
import { removeselectedFriend } from "../../store/slices/selectedFriendSlice";

const Header = ({ onAddContact }) => {
  const dispatch = useDispatch();
  return (
    <div>
      {/* Header */}

      <nav className="p-4 h-[10dvh] w-full  flex items-center justify-between border-b border-gray-300  select-none">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => dispatch(removeselectedFriend())}
        >
          <img
            src={logo}
            className="h-7 w-7 select-none pointer-events-none"
            alt="VeloxChat Logo"
          />
          <h1 className="text-primary font-bold text-2xl">VeloxChat</h1>
        </div>
        <button
          className={`text-primary cursor-pointer hover:bg-primary hover:text-white rounded-full p-1 transition-colors  mr-7 md:mr-0`}
          title="Add New Contact"
          onClick={() => onAddContact(true)}
        >
          <Plus size={20} />
        </button>
      </nav>
    </div>
  );
};

export default Header;
