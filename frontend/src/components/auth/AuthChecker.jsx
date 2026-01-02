import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { loginSuccess } from "../../redux/authslice"; // Adjust path as needed

const AuthChecker = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    const checkAuthOnStartup = () => {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (token && userStr && !isAuthenticated) {
          const parsed = JSON.parse(userStr);
          // Only keep required fields
          const user = parsed && {
            id: parsed.id,
            name: parsed.name,
            email: parsed.email,
            phone: parsed.phone,
            role: parsed.role,
          };

          // Dispatch loginSuccess to restore auth state
          dispatch(
            loginSuccess({
              token,
              user,
            })
          );

          // console.log('Authentication restored from localStorage');
        }
      } catch (error) {
        console.error("Error restoring authentication:", error);
        // Clear corrupted data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    };

    // Check auth on component mount
    checkAuthOnStartup();

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e) => {
      if (e.key === "token" || e.key === "user") {
        if (e.newValue) {
          // Auth data was added/updated
          checkAuthOnStartup();
        } else {
          // Auth data was removed (logout in another tab)
          if (isAuthenticated) {
            dispatch({ type: "auth/clearAuth" });
          }
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch, isAuthenticated]);

  // Handle Google authentication from URL parameters
  useEffect(() => {
    const handleGoogleAuth = () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(location.search);
        const authStatus = urlParams.get("auth");
        const token = urlParams.get("token");
        const userStr = urlParams.get("user");

        // console.log('AuthChecker: Processing URL params:', {
        //   authStatus,
        //   hasToken: !!token,
        //   hasUser: !!userStr
        // });

        // Handle successful authentication
        if (authStatus === "success" && token && userStr) {
          try {
            // Decode and parse user data
            const decodedUserStr = decodeURIComponent(userStr);
            const parsed = JSON.parse(decodedUserStr);
            // Only keep required fields
            const user = parsed && {
              id: parsed.id,
              name: parsed.name,
              email: parsed.email,
              phone: parsed.phone,
              role: parsed.role,
            };

            // console.log('AuthChecker: Parsed user data:', user);

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

            // console.log('AuthChecker: Data stored in Redux and localStorage');

            // Clear URL parameters and redirect to home page
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            // Navigate to home page
            navigate("/", { replace: true });
          } catch (parseError) {
            console.error("AuthChecker: Error parsing user data:", parseError);
            navigate("/login?error=auth_data_error", { replace: true });
          }
        } else if (authStatus === "success") {
          // console.log('AuthChecker: Missing token or user data');
          navigate("/login?error=invalid_response", { replace: true });
        }
        // If no auth parameters, do nothing (normal page load)
      } catch (error) {
        console.error("AuthChecker: Error processing auth data:", error);
        navigate("/login?error=callback_error", { replace: true });
      }
    };

    handleGoogleAuth();
  }, [location.search, dispatch, navigate]);

  return children;
};

export default AuthChecker;
