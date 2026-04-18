import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (user.role === "admin" && window.location.pathname === "/") {
      navigate("/admin");
    }
  }, [user, navigate]);

  return !user || (user.role === "admin" && window.location.pathname === "/")
    ? null
    : children;
};

export default PrivateRoute;
