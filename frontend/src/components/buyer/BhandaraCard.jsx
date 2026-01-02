import React, { useState, useEffect } from "react";
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaUser, 
  FaPhone, 
  FaUtensils,
  FaExternalLinkAlt,
  FaWhatsapp,
  FaCheckCircle,
  FaTimesCircle,
  FaThumbsUp,
  FaThumbsDown
} from "react-icons/fa";
import { FcClock } from "react-icons/fc";
import { GoUnverified } from "react-icons/go";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import BhandaraService from "../../services/bhandaraService";

const BhandaraCard = ({ bhandara, className = "" }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Like/Dislike state
  const [feedback, setFeedback] = useState({
    totalLikes: bhandara.totalLikes || 0,
    totalDislikes: bhandara.totalDislikes || 0,
    trustScore: bhandara.trustScore || 0,
    userLiked: false,
    userDisliked: false,
    loading: false
  });

  // Fetch user's feedback status
  useEffect(() => {
    if (isAuthenticated && bhandara._id) {
      fetchFeedbackStatus();
    }
  }, [isAuthenticated, bhandara._id]);

  const fetchFeedbackStatus = async () => {
    try {
      const result = await BhandaraService.getBhandaraFeedback(bhandara._id);
      if (result.success) {
        setFeedback(prev => ({
          ...prev,
          ...result.data
        }));
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like events');
      return;
    }

    setFeedback(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await BhandaraService.likeBhandara(bhandara._id);
      if (result.success) {
        setFeedback(prev => ({
          ...prev,
          ...result.data,
          loading: false
        }));
        toast.success(result.message);
      } else {
        toast.error(result.error);
        setFeedback(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      toast.error('Failed to update like');
      setFeedback(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDislike = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to provide feedback');
      return;
    }

    setFeedback(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await BhandaraService.dislikeBhandara(bhandara._id);
      if (result.success) {
        setFeedback(prev => ({
          ...prev,
          ...result.data,
          loading: false
        }));
        toast.success(result.message);
      } else {
        toast.error(result.error);
        setFeedback(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      toast.error('Failed to update feedback');
      setFeedback(prev => ({ ...prev, loading: false }));
    }
  };

  // Format date and time - show UTC time consistently
  const formatDateTime = (dateString) => {
    // Create date object from database value
    const date = new Date(dateString);
    
    // Use UTC values for consistent display
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const utcHours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    // Convert to 12-hour format
    const hours12 = utcHours === 0 ? 12 : utcHours > 12 ? utcHours - 12 : utcHours;
    const ampm = utcHours >= 12 ? 'PM' : 'AM';
    const hoursFormatted = String(hours12).padStart(2, '0');
    
    // Debug log
    console.log('UTC DateTime formatting:', {
      original: dateString,
      utcTime: date.toISOString(),
      displayTime: `${day}/${month}/${year}, ${hoursFormatted}:${minutes} ${ampm}`
    });
    
    // Return UTC time in 12-hour format
    return `${day}/${month}/${year}, ${hoursFormatted}:${minutes} ${ampm}`;
  };

  // Calculate time remaining - using Indian Standard Time (IST) for comparison
  const getTimeRemaining = (startTime) => {
    // Get current time and event start time
    const now = new Date();
    const start = new Date(startTime);
    
    // Convert both times to IST for comparison
    // IST is UTC + 5:30 hours
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    
    // Get current IST time
    const nowIST = new Date(now.getTime() + istOffset);
    
    // Convert event time to IST 
    const startIST = new Date(start.getTime() + istOffset);
    // const  startUTC = start.toISOString();
    // Calculate difference using IST times
    const diffMs = start.getTime() - nowIST.getTime();
    
    // Debug log with IST times
    console.log('IST time calculation:', {
      startTime,
      startUTC: start.toISOString(),
      startIST: startIST.toISOString(),
      startISTLocal: startIST.toLocaleString('en-IN'),
      nowUTC: now.toISOString(), 
      nowIST: nowIST.toISOString(),
      nowISTLocal: nowIST.toLocaleString('en-IN'),
      diffMs,
      diffHours: (diffMs / (1000 * 60 * 60)).toFixed(2),
      diffMinutes: Math.floor(diffMs / (1000 * 60))
    });
    
    if (diffMs <= 0) {
      const timeSinceStart = Math.abs(diffMs);
      if (timeSinceStart <= 60 * 60 * 1000) {
        return "Just Started";
      }
      return "Started";
    }
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      return `${diffDays} days left`;
    } else if (diffDays === 1) {
      const remainingHours = diffHours % 24;
      return remainingHours === 0 ? "1 day left" : `1 day, ${remainingHours}h left`;
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      return remainingMinutes === 0 ? `${diffHours} hour${diffHours > 1 ? 's' : ''} left` : `${diffHours}h ${remainingMinutes}m left`;
    } else if (diffMinutes > 30) {
      return `${diffMinutes} minutes left`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} min left`;
    } else {
      return "Starting now";
    }
  };

  // Generate Google Maps directions URL
  const getDirectionsUrl = (address) => {
    const encodedAddress = encodeURIComponent(`${address}, Indore, Madhya Pradesh`);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  // Generate WhatsApp contact URL
  const getWhatsAppUrl = (phone, message) => {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/91${phone}?text=${encodedMessage}`;
  };

  const timeRemaining = getTimeRemaining(bhandara.dateTimeStart);
  const isStartingSoon = timeRemaining === "Starting now" || timeRemaining === "Started" || timeRemaining === "Just Started" || timeRemaining.includes("min left");

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden ${className}`}>
      {/* Header with verification badge */}
      <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
        {/* Verification Badge */}
        {bhandara.isVerified ? (
          <div className="absolute top-3 right-3 bg-blue-600 rounded-full px-3 py-1 flex items-center shadow-lg">
            <FaCheckCircle className="text-white text-sm mr-2" />
            <span className="text-white text-xs font-bold tracking-wide">VERIFIED</span>
          </div>
        ) : (
          <div className="absolute top-3 right-3 bg-yellow-600 rounded-full px-3 py-1 flex items-center shadow-lg">
            <GoUnverified className="text-white text-sm mr-2" />
            <span className="text-white text-xs font-bold tracking-wide">UNVERIFIED</span>
          </div>
        )}
        
        {/* Time remaining badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isStartingSoon 
              ? 'bg-yellow-400 text-yellow-900' 
              : 'bg-green-400 text-green-900'
          }`}>
            {timeRemaining}
          </span>
        </div>
        
        <div className="mt-8">
          <h3 className="font-bold text-lg mb-2 pr-20 leading-tight">
            {bhandara.title}
          </h3>
          
          {bhandara.description && (
            <p className="text-orange-100 text-sm line-clamp-2">
              {bhandara.description}
            </p>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Date and Time */}
        <div className="flex items-center mb-3 text-gray-700">
          <FaClock className="mr-2 text-blue-500 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium">
              {formatDateTime(bhandara.dateTimeStart)}
            </div>
            {bhandara.dateTimeEnd && (
              <div className="text-gray-500 text-xs">
                Until: {formatDateTime(bhandara.dateTimeEnd)}
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start mb-3 text-gray-700">
          <FaMapMarkerAlt className="mr-2 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="line-clamp-2">{bhandara.location.address}</p>
          </div>
        </div>

        {/* Food Items */}
        {bhandara.foodItems && bhandara.foodItems.length > 0 && (
          <div className="flex items-start mb-3 text-gray-700">
            <FaUtensils className="mr-2 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm flex-1">
              <p className="line-clamp-2">
                {bhandara.foodItems.join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Organizer */}
        <div className="flex items-center mb-3 text-gray-700">
          <FaUser className="mr-2 text-purple-500 flex-shrink-0" />
          <span className="text-sm font-medium">{bhandara.organizerName}</span>
        </div>

        {/* Trust Score and Feedback */}
        <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={feedback.loading}
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                feedback.userLiked
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
              } ${feedback.loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <FaThumbsUp className="w-3 h-3" />
              <span>{feedback.totalLikes}</span>
            </button>

            {/* Dislike Button */}
            <button
              onClick={handleDislike}
              disabled={feedback.loading}
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                feedback.userDisliked
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
              } ${feedback.loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <FaThumbsDown className="w-3 h-3" />
              <span>{feedback.totalDislikes}</span>
            </button>
          </div>

          {/* Trust Score */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500">Trust:</span>
            <span className={`text-xs font-bold ${
              feedback.trustScore >= 60 ? 'text-green-600' :
              feedback.trustScore >= 20 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {feedback.trustScore}%
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Get Directions Button */}
          <a
            href={getDirectionsUrl(bhandara.location.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-lg flex items-center justify-center transition-colors duration-200"
          >
            <FaExternalLinkAlt className="mr-2 text-xs" />
            Directions
          </a>

          {/* Contact Organizer Button - only show if contact is available */}
          {bhandara.contact && (
            <a
              href={getWhatsAppUrl(
                bhandara.contact,
                `Hi! I saw your Bhandara event "${bhandara.title}" on Tastyaana. Could you provide more details?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2 px-3 rounded-lg flex items-center justify-center transition-colors duration-200"
            >
              <FaWhatsapp className="mr-2" />
              Contact
            </a>
          )}
        </div>

        {/* Contact Info (visible on hover/small display) - only show if contact is available */}
        {bhandara.contact && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center text-gray-600 text-xs">
              <FaPhone className="mr-2" />
              <span>{bhandara.contact}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BhandaraCard;