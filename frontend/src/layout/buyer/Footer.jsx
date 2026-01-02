import React from "react";
import {
  Facebook,
  Instagram,
  Twitter,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (section) => {
    console.log(`Navigating to: ${section}`);
  };

  const handleSocialClick = (platform) => {
    const socialLinks = {
      facebook: "https://facebook.com/TastyAana",
      instagram: "https://instagram.com/TastyAana",
      twitter: "https://twitter.com/TastyAana",
    };

    if (socialLinks[platform]) {
      window.open(socialLinks[platform], "_blank");
    }
  };

  const handleContactClick = (type, value) => {
    switch (type) {
      case "phone":
        window.open(`tel:${value}`);
        break;
      case "email":
        window.open(`mailto:${value}`);
        break;
      case "address":
        window.open(`https://maps.google.com/?q=${encodeURIComponent(value)}`);
        break;
      default:
        break;
    }
  };

  return (
    <footer className="bg-gray-800 text-white mt-auto font-['Plus_Jakarta_Sans'] pb-24 sm:pb-12">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-lg sm:text-xl font-bold">Tastyaana</h3>
            </div>
            <p className="text-gray-300 mb-4 text-sm sm:text-base leading-relaxed">
              On Your doorstep
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
              Contact Us
            </h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <button
                  onClick={() =>
                    handleContactClick(
                      "address",
                      "CL 46 Jai Ambe Nagar, Indore, India"
                    )
                  }
                  className="text-gray-300 hover:text-orange-400 transition-colors duration-200 text-sm sm:text-base text-left"
                >
                  CL 46 Jai Ambe Nagar, Indore, India
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0" />
                <button
                  onClick={() => handleContactClick("phone", "+919203338229")}
                  className="text-gray-300 hover:text-orange-400 transition-colors duration-200 text-sm sm:text-base"
                >
                  +91 9203338229
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0" />
                <button
                  onClick={() =>
                    handleContactClick("email", "contact@Tastyaana.com")
                  }
                  className="text-gray-300 hover:text-orange-400 transition-colors duration-200 text-sm sm:text-base"
                >
                  contact@Tastyaana.com
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
          <p className="text-gray-300 text-sm sm:text-base">
            © {currentYear} Tastyaana. All rights reserved. Made with ❤️ for
            sweet lovers.
          </p>
          <span className="text-sm text-gray-400">
            Developed by{" "}
            <a
              href="https://www.nexisparkx.com/"
              className="text-orange-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              NexisparkX Technologies
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
