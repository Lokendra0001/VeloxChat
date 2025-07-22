import AuthLayout from "./pages/AuthLayout";
import { BrowserRouter, Route, RouterProvider, Routes } from "react-router-dom";
import Home from "./pages/Home";
import { useEffect, useState } from "react";
import axios from "axios";
import serverObj from "./config/config";
import { useDispatch } from "react-redux";
import { addUser } from "./store/slices/authSlice";
import PrivateRoute from "./components/common/PrivateRoute";
import PublicRoute from "./components/common/PublicRoute";
import NotifcationPage from "./pages/NotifcationPage";
import Profile from "./pages/Profile";
import socket from "./config/socket";
import { useSelector } from "react-redux";
import { Toaster, toast } from "react-hot-toast";
import { MessageCircleMore } from "lucide-react";

const App = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const currentUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (currentUser) socket.emit("join", currentUser?._id);
  }, [currentUser]);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${serverObj.apikey}/user/getCurrentUser`, { withCredentials: true })
      .then((res) => {
        dispatch(addUser({ ...res.data, status: "online" }));
        toast(`Welcome Back ${res.data.username}`, {
          icon: "👏",
        });
      })
      .catch((err) => console.log(err.response.message))
      .finally(() => setTimeout(() => setLoading(false), 1000));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const theme = localStorage.getItem("theme");
    const secondaryTheme = localStorage.getItem("secondaryTheme");
    if (theme == "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    root.classList.add(secondaryTheme);
  }, []);

  if (loading)
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-teal-50 bg-secondary dark:from-background dark:to-secondary">
        {/* Animated Logo Container */}
        <div className="relative mb-6 w-32 h-32">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-primary dark:bg-transparent rounded-full opacity-20 blur-md animate-pulse"></div>

          {/* Dual Inverse Rotating Lines */}
          <div className="relative w-full h-full">
            {/* Outer line - rotates clockwise */}
            <div className="absolute inset-0 border-3 border-t-transparent border-primary-hover  border-b-transparent border-l-primary-hover rounded-full animate-rotate-cw"></div>
            {/* Inner line - rotates counter-clockwise */}
            <div className="absolute inset-5 border-3 border-t-primary border-r-transparent border-b-primary border-l-transparent rounded-full animate-rotate-ccw"></div>
          </div>

          {/* Center Brand Mark */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 p-1 bg-primary text-white rounded-full flex items-center justify-center shadow-inner">
              <MessageCircleMore />
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                {" "}
                <Home />{" "}
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                {" "}
                <Profile />{" "}
              </PrivateRoute>
            }
          />
          <Route
            path="/notification"
            element={
              <PrivateRoute>
                {" "}
                <NotifcationPage />{" "}
              </PrivateRoute>
            }
          />
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthLayout />
              </PublicRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          className: "text-sm rounded-md shadow-lg ",
          duration: 1500,
          style: {
            background: "#1f2937", // Tailwind gray-800
            color: "#fff",
          },
          success: {
            iconTheme: {
              primary: "#10b981", // Tailwind green-500
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444", // Tailwind red-500
              secondary: "#fff",
            },
          },
        }}
      />
    </>
  );
};

export default App;
