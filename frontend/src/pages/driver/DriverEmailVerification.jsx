import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Loader,
  Mail,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const DriverEmailVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [verificationStatus, setVerificationStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [driverData, setDriverData] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const urlParams = new URLSearchParams(location.search);
      const token = urlParams.get('token');

      if (!token) {
        setVerificationStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/drivers/verify-email/${token}`, {
          method: 'GET'
        });

        const data = await response.json();

        if (response.ok) {
          setVerificationStatus('success');
          setMessage(data.message);
          setDriverData(data.driver);
          toast.success('Email verified successfully!', { duration: 2000 });
        } else {
          setVerificationStatus('error');
          setMessage(data.message || 'Email verification failed');
          toast.error(data.message || 'Email verification failed', { duration: 2000 });
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        setMessage('Network error. Please try again later.');
        toast.error('Network error. Please try again later.', { duration: 2000 });
      }
    };

    verifyEmail();
  }, [location.search]);

  const handleResendVerification = async () => {
    if (!driverData?.email) {
      toast.error('Unable to resend verification email. Please try registering again.', { duration: 2000 });
      return;
    }

    setResendLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/drivers/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: driverData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox.', { duration: 2000 });
      } else {
        toast.error(data.message || 'Failed to send verification email', { duration: 2000 });
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Network error. Please try again.', { duration: 2000 });
    } finally {
      setResendLoading(false);
    }
  };

  const renderLoadingState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-6">
        <Loader className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying Your Email</h2>
      <p className="text-gray-600">Please wait while we verify your email address...</p>
    </motion.div>
  );

  const renderSuccessState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verified Successfully!</h2>
      <p className="text-gray-600 mb-6">{message}</p>

      {driverData && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Welcome to Tastyaana, {driverData.name}!</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <Mail className="h-4 w-4 mr-2" />
              {driverData.email}
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
        <ul className="text-sm text-blue-800 space-y-1 text-left">
          <li>• Our team will review your application within 24-48 hours</li>
          <li>• You'll receive an email notification once approved</li>
          <li>• Complete any additional document verification if required</li>
          <li>• Start receiving delivery assignments and earning money</li>
        </ul>
      </div>

      <div className="space-y-4">
        <Link
          to="/login"
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Continue to Login
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>

        <Link
          to="/"
          className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </motion.div>
  );

  const renderErrorState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="mx-auto h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <XCircle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Failed</h2>
      <p className="text-gray-600 mb-6">{message}</p>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-yellow-900 mb-2">Need Help?</h4>
        <p className="text-sm text-yellow-800 mb-3">
          If your verification link has expired or you're having trouble, you can:
        </p>
        <button
          onClick={handleResendVerification}
          disabled={resendLoading}
          className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-lg text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 transition-colors"
        >
          {resendLoading ? (
            <>
              <Loader className="animate-spin h-4 w-4 mr-2" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resend Verification Email
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        <Link
          to="/driver/register"
          className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Register Again
        </Link>

        <Link
          to="/login"
          className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {verificationStatus === 'loading' && renderLoadingState()}
          {verificationStatus === 'success' && renderSuccessState()}
          {verificationStatus === 'error' && renderErrorState()}
        </div>

        {/* Support */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Need help? Contact{' '}
            <a 
              href="mailto:drivers@tastyaana.com" 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              drivers@tastyaana.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DriverEmailVerification;