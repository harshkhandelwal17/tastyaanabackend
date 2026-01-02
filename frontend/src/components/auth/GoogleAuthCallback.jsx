import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../redux/authslice";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle, Phone } from "lucide-react";

const GoogleAuthCallback = () => {
  const [status, setStatus] = useState("Processing authentication...");
  const [error, setError] = useState(null);
  const [showPhoneReminder, setShowPhoneReminder] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    console.log(window.location.search)
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const token = urlParams.get('token');
    const userStr = urlParams.get('user');

    if (authStatus === 'success' && token && userStr) {
      setStatus('Authentication successful! Processing data...');
      try {
        const decodedUserStr = decodeURIComponent(userStr);
        const user = JSON.parse(decodedUserStr);
        
        // Check if phone number is placeholder
        if (user.phone === '0000000000') {
          setShowPhoneReminder(true);
        }
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        dispatch(loginSuccess({ token, user }));
        setStatus('Success! Redirecting to home page...');
        
        // Clean up URL parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        setTimeout(() => {
          if(user?.role=='buyer'){
          navigate('/', { replace: true });}
          else if(user?.role=='seller'){
            navigate('/seller',{replace:true})
          }else{
            navigate('/',{replace:true})
          }
        }, 1000);
      } catch (parseError) {
        console.error('Error parsing user data:', parseError);
        setError('Failed to process authentication data');
      }
    } else {
      setError('Authentication failed or incomplete');
    }
  }, [dispatch, navigate]);

  const handleUpdatePhone = () => {
    navigate('/profile', { replace: true });
  };

  const handleDismiss = () => {
    setShowPhoneReminder(false);
    navigate('/', { replace: true });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Authentication Error
          </h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (showPhoneReminder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <div className="flex items-center justify-center mb-4">
            <Phone className="w-12 h-12 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            Welcome to Tastyaana! 🍯
          </h2>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-orange-800 text-sm">
              <strong>Quick Setup:</strong> Please update your phone number in your profile to ensure smooth order delivery and customer support.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleUpdatePhone}
              className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold"
            >
              Update Phone Number
            </button>
            <button
              onClick={handleDismiss}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              I'll do it later
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Authentication Successful
        </h2>
        <p className="text-gray-600 text-center">{status}</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;