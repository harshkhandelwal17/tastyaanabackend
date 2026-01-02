// components/auth/AuthHandler.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/authslice";

const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleAuthData = () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(location.search);
        const authStatus = urlParams.get("auth");
        const token = urlParams.get("token");
        const userStr = urlParams.get("user");

        // console.log('AuthHandler: Processing URL params:', {
        //   authStatus,
        //   hasToken: !!token,
        //   hasUser: !!userStr
        // });

        // Handle successful authentication
        if (authStatus === "success" && token && userStr) {
          try {
            // Decode and parse user data
            const decodedUserStr = decodeURIComponent(userStr);
            const user = JSON.parse(decodedUserStr);

            // console.log('AuthHandler: Parsed user data:', user);

            // Store in localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            // Update Redux store
            dispatch(
              loginSuccess({
                token,
                user,
              })
            );

            // console.log('AuthHandler: Data stored in Redux and localStorage');

            // Clear URL parameters and redirect to home page
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            // Navigate to home page
            navigate("/", { replace: true });
          } catch (parseError) {
            console.error("AuthHandler: Error parsing user data:", parseError);
            navigate("/login?error=auth_data_error", { replace: true });
          }
        } else if (authStatus === "success") {
          console.log("AuthHandler: Missing token or user data");
          navigate("/login?error=invalid_response", { replace: true });
        }
        // If no auth parameters, do nothing (normal page load)
      } catch (error) {
        console.error("AuthHandler: Error processing auth data:", error);
        navigate("/login?error=callback_error", { replace: true });
      }
    };

    handleAuthData();
  }, [navigate, location, dispatch]);

  // This component doesn't render anything visible
  return null;
};

export default AuthHandler;
