import React, { useState, useEffect } from "react";
import BubbleBackground from "../components/common/BubbleBackground.jsx";
import logo from "../assets/logoPng.png";
import { useForm } from "react-hook-form";
import {
  AtSign,
  Eye,
  EyeClosed,
  LogIn,
  MessagesSquareIcon,
  User,
} from "lucide-react";
import serverObj from "../config/config.js";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../store/slices/authSlice.js";
import { useNavigate } from "react-router-dom";
import { handleErrorMsg, handleSuccessMsg } from "../config/toast.js";

const AuthLayout = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isPassword, setIsPassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post(`${serverObj.apikey}/user/signin`, data, {
        withCredentials: true,
      });
      dispatch(addUser(res.data.user));
      handleSuccessMsg(res.data.message);
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      handleErrorMsg(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post(`${serverObj.apikey}/user/signup`, data, {
        withCredentials: true,
      });
      dispatch(addUser(res.data.user));
      handleSuccessMsg(res.data.message);
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      handleErrorMsg(error.response.data.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reset();
    setIsPassword(true);
  }, [isLogin]);

  return (
    <BubbleBackground>
      <div className="min-h-[20dvh] w-md sm:w-[90dvw] mx-1.5 lg:w-[65dvw] bg-background rounded-xl flex shadow-xl overflow-hidden">
        {/* Left Form */}
        <div className="w-full md:w-1/2 h-full px-3 py-5 sm:px-10 sm:py-10 flex flex-col bg-white dark:bg-secondary">
          <div className="flex items-center mb-4 gap-2">
            <MessagesSquareIcon
              className="text-primary-hover dark:text-white/80 "
              size={35}
            />

            <h1 className="text-3xl font-bold text-primary dark:text-white/80">
              VeloxChat
            </h1>
          </div>
          <p className="text-[#667781] dark:text-text-secondary mb-8">
            Connect with friends instantly
          </p>

          <div className="flex space-x-4 mb-8 border-b border-transparent">
            <button
              onClick={() => setIsLogin(true)}
              className={`pb-2 px-1 font-medium ${
                isLogin
                  ? "text-primary dark:text-white border-b-2 border-primary "
                  : "text-gray-500 dark:text-text-secondary"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`pb-2 px-1 font-medium ${
                !isLogin
                  ? "text-primary dark:text-white border-b-2 border-primary "
                  : "text-gray-500 dark:text-text-secondary"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 flex flex-col">
            {isLogin ? (
              <>
                <form
                  onSubmit={handleSubmit(handleLogin)}
                  className="select-none"
                >
                  <div className="mb-4">
                    <label className="block text-gray-600 dark:text-text-secondary text-sm font-medium mb-1">
                      Email
                    </label>
                    <div className="w-full border-2 border-gray-300 dark:border-dark-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent relative flex items-center px-1">
                      <AtSign
                        size={20}
                        className="text-gray-600 dark:text-text-secondary"
                      />
                      <input
                        type="email"
                        className="w-full px-2 py-2 outline-none border-l border-gray-300 dark:border-zinc-500 ml-2 bg-transparent dark:text-text-primary"
                        placeholder="your@email.com"
                        {...register("loginEmail", {
                          required: {
                            value: true,
                            message: "Email is Required!",
                          },
                        })}
                      />
                    </div>
                    {errors.loginEmail && (
                      <p className="text-red-500 dark:text-danger mt-2 text-sm font-normal ml-1">
                        {errors.loginEmail.message}
                      </p>
                    )}
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-600 dark:text-text-secondary text-sm font-medium mb-1">
                      Password
                    </label>
                    <div className="w-full border-2 border-gray-300 dark:border-dark-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent relative flex items-center px-1">
                      {isPassword ? (
                        <EyeClosed
                          size={20}
                          className="text-gray-600 dark:text-text-secondary cursor-pointer h-full py-2"
                          onClick={() => setIsPassword(!isPassword)}
                        />
                      ) : (
                        <Eye
                          size={20}
                          className="text-gray-600 dark:text-text-secondary cursor-pointer h-full py-2"
                          onClick={() => setIsPassword(!isPassword)}
                        />
                      )}

                      <input
                        type={isPassword ? "password" : "text"}
                        className="w-full px-2 py-2 border-l border-gray-300 dark:border-dark-zinc-700 ml-2 outline-none bg-transparent dark:text-text-primary"
                        placeholder="••••••••"
                        {...register("loginPassword", {
                          required: {
                            value: true,
                            message: "Password required!",
                          },
                        })}
                      />
                    </div>
                    {errors.loginPassword && (
                      <p className="text-red-500 dark:text-danger mt-2 text-sm font-normal ml-1">
                        {errors.loginPassword.message}
                      </p>
                    )}
                  </div>
                  <button className="w-full bg-primary hover:bg-primary-hover dark:bg-primary dark:hover:bg-primary-hover text-white py-2 px-4 rounded-md font-medium transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1">
                    {loading ? (
                       <>
                        <LogIn size={20} /> Login...
                      </>
                    ) : (
                      <>
                        <LogIn size={20} /> Login
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                <form
                  onSubmit={handleSubmit(handleSignup)}
                  className="select-none"
                >
                  <div className="mb-4">
                    <label className="block text-gray-600 dark:text-text-secondary text-sm font-medium mb-1">
                      Name
                    </label>
                    <div className="w-full border-2 border-gray-300 dark:border-dark-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent relative flex items-center px-1">
                      <User
                        size={20}
                        className="text-gray-600 dark:text-text-secondary"
                      />
                      <input
                        type="text"
                        className="w-full px-3 py-2 outline-none border-l-2 border-gray-300 dark:border-dark-zinc-700 ml-2 bg-transparent dark:text-text-primary"
                        placeholder="Enter Username"
                        {...register("username", {
                          required: {
                            value: true,
                            message: "Username required!",
                          },
                          minLength: {
                            value: 5,
                            message: "Username should be 5 or more character!",
                          },
                        })}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-red-400 dark:text-danger mt-1 text-sm font-normal ml-1">
                        {errors.username.message}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-600 dark:text-text-secondary text-sm font-medium mb-1">
                      Email
                    </label>
                    <div className="w-full border-2 border-gray-300 dark:border-dark-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent relative flex items-center px-1">
                      <AtSign
                        size={20}
                        className="text-gray-600 dark:text-text-secondary"
                      />
                      <input
                        type="text"
                        className="w-full px-3 py-2 outline-none border-l-2 border-gray-300 dark:border-dark-zinc-700 ml-2 bg-transparent dark:text-text-primary"
                        placeholder="your@email.com"
                        {...register("email", {
                          required: {
                            value: true,
                            message: "Email is Required!",
                          },
                        })}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 dark:text-danger mt-1 text-sm font-normal ml-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div className="mb-6">
                    <label className="block text-gray-600 dark:text-text-secondary text-sm font-medium mb-1">
                      Password
                    </label>
                    <div className="w-full border-2 border-gray-300 dark:border-dark-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#128C7E] focus:border-transparent relative flex items-center px-1">
                      {isPassword ? (
                        <EyeClosed
                          size={20}
                          className="text-gray-600 dark:text-text-secondary cursor-pointer h-full py-2"
                          onClick={() => setIsPassword(!isPassword)}
                        />
                      ) : (
                        <Eye
                          size={20}
                          className="text-gray-600 dark:text-text-secondary cursor-pointer h-full py-2"
                          onClick={() => setIsPassword(!isPassword)}
                        />
                      )}

                      <input
                        type={isPassword ? "password" : "text"}
                        className="w-full px-2 py-2 border-l border-gray-300 dark:border-dark-zinc-700 ml-2 outline-none bg-transparent dark:text-text-primary"
                        placeholder="••••••••"
                        {...register("password", {
                          required: {
                            value: true,
                            message: "Password required!",
                          },
                          pattern: {
                            value:
                              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%&^*]{6,}$/,
                            message:
                              "Password must be 6+ chars, with uppercase, lowercase, number & special character.",
                          },
                        })}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-red-400 dark:text-danger mt-1 text-sm font-normal ml-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                  <button className="w-full bg-primary hover:bg-primary-hover dark:bg-primary dark:hover:bg-primary-hover text-white py-2 px-4 rounded-md font-medium transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1">
                    {loading ? (
                     <>
                        <LogIn size={20} /> Creating account...
                      </>
                    ) : (
                      <>
                        <LogIn size={20} /> Create Account
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Right Image */}
        <div className="w-1/2 hidden min-h-[20dvh] md:flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary-hover/60 relative overflow-hidden rounded-r-xl shadow-xl">
          {/* Animated Shape Accent */}
          <div className="absolute w-[150%] h-[150%] bg-[conic-gradient(at_top_left,_#25D366,_#075E54,_#128C7E,_#25D366)] opacity-10 rounded-full -top-1/2 -left-1/2 z-0" />

          {/* Branding Text */}
          <div className="text-white text-center p-10 relative z-10 max-w-[80%] space-y-4 select-none">
            <h2 className="text-4xl sm:text-3xl font-medium leading-tight drop-shadow-lg">
              Chat Smarter
              <br />
              with <span className="text-primary">VeloxChat</span>
            </h2>
            <p className="text-base sm:text-lg opacity-90 leading-relaxed">
              Experience real-time messaging thats fast, secure, and beautifully
              simple.
            </p>
            <div className="mt-6">
              <span className="inline-block bg-white text-primary px-4 py-2 rounded-xl text-sm font-semibold shadow hover:bg-other-bubble transition">
                🔐 End-to-End Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>
    </BubbleBackground>
  );
};

export default AuthLayout;
