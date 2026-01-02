import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser, loginSuccess } from "../../redux/authslice";
import { useLocation, useNavigate } from "react-router-dom";
import GoogleLoginButton from "../auth/GoogleLoginButton";
import OTPVerification from "./OTPVerification";

import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: {
      warning: "",
      suggestions: [],
    },
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const { isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );
  const user = useSelector((state) => state.auth.user);
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User is authenticated:", user);
      // navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Validation functions
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value) return "Name is required";
        if (value.length < 2) return "Name must be at least 2 characters";
        if (value.length > 100) return "Name must be less than 100 characters";
        return null;

      case "email":
        if (!value) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value))
          return "Please enter a valid email address";
        return null;

      case "phone":
        if (!value) return "Phone number is required";
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(value))
          return "Please enter a valid 10-digit phone number";
        return null;

      case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return null;

      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
        return null;

      default:
        return null;
    }
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    const suggestions = [];
    let warning = "";

    if (password.length === 0) {
      return { score: 0, feedback: { warning: "", suggestions: [] } };
    }

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      suggestions.push("Use at least 8 characters");
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      suggestions.push("Add lowercase letters");
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      suggestions.push("Add uppercase letters");
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      suggestions.push("Add numbers");
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      suggestions.push("Add special characters");
    }

    // Set warning based on score
    if (score <= 2) {
      warning = "Weak password";
    } else if (score <= 3) {
      warning = "Fair password";
    } else if (score <= 4) {
      warning = "Good password";
    } else {
      warning = "Strong password";
    }

    return { score, feedback: { warning, suggestions } };
  };

  const getPasswordStrengthColor = () => {
    const score = passwordStrength.score;
    if (score <= 2) return "bg-red-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate all fields
    Object.keys(formData).forEach((field) => {
      if (
        !isLogin &&
        (field === "name" || field === "phone" || field === "confirmPassword")
      ) {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }
      if (field === "email" || field === "password") {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }
    });

    // Check terms acceptance for signup
    if (!isLogin && !termsAccepted) {
      newErrors.terms = "Please accept the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Trim whitespace for all fields except password
    const processedValue = name !== "password" ? value.trim() : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    // Validate field in real-time if it's been touched
    if (touched[name]) {
      const error = validateField(name, processedValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    // Special handling for password strength
    if (name === "password") {
      const strength = checkPasswordStrength(processedValue);
      setPasswordStrength(strength);
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const sendOTP = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: formData.email }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setPendingRegistration({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        });
        setShowOTP(true);
      } else {
        setErrors({ email: data.message || "Failed to send OTP" });
      }
    } catch (err) {
      setErrors({ email: "Network error. Please try again." });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isLogin) {
      dispatch(
        loginUser({ email: formData.email, password: formData.password })
      );
    } else {
      // For signup, send OTP first
      sendOTP();
    }
  };

  const handleOTPSuccess = (user, token) => {
    // Store user data and token
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    // Update Redux state
    dispatch(loginSuccess({ token, user }));

    // Navigate to home
    navigate("/", { replace: true });
  };

  const handleOTPBack = () => {
    setShowOTP(false);
    setPendingRegistration(null);
  };

  // If showing OTP verification, render that component
  if (showOTP && pendingRegistration) {
    return (
      <OTPVerification
        email={pendingRegistration.email}
        pendingRegistration={pendingRegistration}
        onBack={handleOTPBack}
        onSuccess={handleOTPSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? "Sign In to Tastyaana" : "Create a New Account"}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Google Sign-In Button */}
        <GoogleLoginButton isLogin={isLogin} />

        <div className="mt-4 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("name")}
                  className={`w-full p-2 border rounded ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loading}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> {errors.name}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={() => handleBlur("email")}
              className={`w-full p-2 border rounded ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              disabled={loading}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.email}
              </p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">+91</span>
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("phone")}
                  maxLength="10"
                  inputMode="numeric"
                  pattern="[6-9]\d{9}"
                  className={`w-full p-2 pl-12 border rounded ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={loading}
                  placeholder="Enter 10-digit mobile number"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" /> {errors.phone}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={() => handleBlur("password")}
                className={`w-full p-2 border rounded ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                disabled={loading}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!isLogin && formData.password && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">
                    {passwordStrength.feedback.warning}
                  </span>
                  <span className="text-xs text-gray-600">
                    {passwordStrength.score}/5
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                {passwordStrength.feedback.suggestions.length > 0 && (
                  <div className="mt-1">
                    {passwordStrength.feedback.suggestions.map(
                      (suggestion, index) => (
                        <p key={index} className="text-xs text-gray-500">
                          • {suggestion}
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {errors.password && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.password}
              </p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur("confirmPassword")}
                  className={`w-full p-2 pr-10 border rounded ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  disabled={loading}
                  placeholder="Confirm your password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />{" "}
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {!isLogin && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={() => setTermsAccepted((prev) => !prev)}
                className="mr-2"
                disabled={loading}
              />
              <label htmlFor="terms" className="text-sm">
                I accept the{" "}
                <a href="/terms" className="text-blue-600 underline">
                  Terms & Conditions
                </a>
              </label>
              {errors.terms && (
                <p className="text-red-500 text-xs mt-1 ml-2">{errors.terms}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            className="text-blue-600 hover:underline text-sm"
            onClick={() => setIsLogin((prev) => !prev)}
            disabled={loading}
          >
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
