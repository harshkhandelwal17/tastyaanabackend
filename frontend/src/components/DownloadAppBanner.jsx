import React, { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  X,
  Star,
  Zap,
  Shield,
  CheckCircle,
} from "lucide-react";

const DownloadAppBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  localStorage.setItem("tastyaana-banner-dismissed", "false");
  // Check if banner was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem("tastyaana-banner-dismissed");
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // You can replace this with your actual APK download link
      const apkUrl = "/downloads/Tastyaana.apk";

      // Create a temporary link element to trigger download
      const link = document.createElement("a");
      link.href = apkUrl;
      link.download = "Tastyaana.apk";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success state
      setDownloadComplete(true);
      setTimeout(() => {
        setDownloadComplete(false);
        setIsDownloading(false);
      }, 2000);

      // Track download event (you can integrate with analytics)
      console.log("Tastyaana APK download initiated");
    } catch (error) {
      console.error("Download failed:", error);
      setIsDownloading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal for this session
    localStorage.setItem("tastyaana-banner-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white py-2.5 px-4 relative overflow-hidden shadow-lg">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1 left-4 text-lg animate-pulse">📱</div>
        <div className="absolute bottom-1 right-8 text-sm animate-bounce">
          ⚡
        </div>
        <div className="absolute top-0 right-4 text-xs animate-pulse">⭐</div>
        <div className="absolute top-2 left-1/2 text-xs animate-pulse">🍕</div>
      </div>

      <div className="relative z-10 flex items-center justify-between max-w-7xl mx-auto">
        {/* Left Content */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          {/* <div className="hidden sm:flex items-center space-x-2 flex-shrink-0">
            <Star className="w-4 h-4" />
            <span className="text-sm font-semibold">Get Tastyaana App</span>
          </div> */}

          <div className="flex items-center space-x-1 text-xs sm:text-sm flex-shrink-0">
            <Smartphone className="w-4 h-4" />

            <span className="hidden xs:inline font-medium">
              Better Experience
            </span>
            <span className="xs:hidden font-medium">Get Tastyaana App</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 text-xs flex-shrink-0">
            <Zap className="w-3 h-3 text-yellow-300" />
            <span className="font-medium">Faster Orders</span>
          </div>

          <div className="hidden md:flex items-center space-x-1 text-xs flex-shrink-0">
            <Shield className="w-3 h-3 text-green-300" />
            <span className="font-medium">Secure Payments</span>
          </div>
        </div>

        {/* Right Content - Download Button */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={handleDownload}
            disabled={isDownloading || downloadComplete}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center space-x-1 shadow-sm ${
              downloadComplete
                ? "bg-green-100 text-green-700 cursor-default"
                : isDownloading
                ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                : "bg-white text-emerald-600 hover:bg-gray-100 hover:shadow-md"
            }`}
          >
            {downloadComplete ? (
              <>
                <CheckCircle className="w-3 h-3" />
                <span className="hidden xs:inline">Downloaded!</span>
                <span className="xs:hidden">Done!</span>
              </>
            ) : isDownloading ? (
              <>
                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="hidden xs:inline">Downloading...</span>
                <span className="xs:hidden">...</span>
              </>
            ) : (
              <>
                <Download className="w-3 h-3" />
                <span className="hidden xs:inline">Download APK</span>
                <span className="xs:hidden">Download</span>
              </>
            )}
          </button>

          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors duration-200 p-1 hover:bg-white/10 rounded"
            aria-label="Close banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadAppBanner;
