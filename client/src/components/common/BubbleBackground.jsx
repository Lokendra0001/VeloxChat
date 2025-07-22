import React, { useRef } from "react";

const BubbleBackground = ({ children }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-200 dark:bg-background">
      {/* Abstract Background Blobs */}
      <div className="absolute w-[300px] h-[300px] bg-primary/70 top-[-50px] left-[-50px] animate-float rotate-45 rounded-3xl opacity-50"></div>
      <div className="absolute w-[300px] h-[300px] bg-primary/70 bottom-[-100px] animate-float right-[-30px] rotate-45 rounded-full opacity-50"></div>

      {/* Foreground content */}
      <div className="relative z-10 flex items-center justify-center h-full w-full  ">
        {children}
      </div>
    </div>
  );
};

export default BubbleBackground;
