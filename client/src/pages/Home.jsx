import React, { useEffect, useState } from "react";
import ChatBox from "../components/veloxChat/ChatBox";
import { HiMenuAlt3 } from "react-icons/hi";
import { CgMenuLeft } from "react-icons/cg";
import ContactsPanel from "../components/veloxChat/ContactPanel";

const Home = () => {
  const [isSideOpen, setIsSideOpen] = useState(false);

  return (
    <div className="flex w-full h-[100dvh] relative overflow-hidden dark:bg-zinc-900">
      {/* Toggle Button */}
      <div
        className="z-[100] text-[27px] fixed top-5.5 right-3 text-gray-600 dark:text-text-secondary md:hidden "
        onClick={() => setIsSideOpen(!isSideOpen)}
      >
        <CgMenuLeft className="rotate-180 " />
      </div>

      {/* Sidebar */}
      <div className="md:w-1/3 lg:w-1/4 border-r border-border h-full overflow-hidden">
        <ContactsPanel isSideOpen={isSideOpen} setSideOpen={setIsSideOpen} />
      </div>

      {/* Chat area */}
      <div className="overflow-hidden flex-1">
        <ChatBox />
      </div>
    </div>
  );
};

export default Home;
