import React from 'react';
import { Printer } from 'lucide-react';

/**
 * PrintingServiceBanner component
 * A promotional banner for professional printing services with a call-to-action via WhatsApp.
 */
const PrintingServiceBanner = () => {
  const handleQuoteRequest = () => {
    const phoneNumber = '9203338229';
    const message = 'Hello! I am interested in your printing services. Could you please share more details?';
    const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="px-2 xs:px-3 sm:px-4 lg:px-6 mb-4 xs:mb-6 lg:mb-8">
      <div
        onClick={handleQuoteRequest}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
      >
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center">
            {/* Icon and Description */}
            <div className="flex items-center mb-4 md:mb-0 md:mr-6">
              <div className="bg-white/20 p-3 rounded-full mr-4 backdrop-blur-sm">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Professional Printing Services</h3>
                <p className="text-sm text-emerald-100 opacity-90">High-quality prints, posters, and more</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="ml-auto flex items-center bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
              <span className="font-medium mr-2">Get a Printout</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Background Decoration */}
          <div className="absolute top-0 right-0 opacity-10">
            <Printer className="w-32 h-32 text-white" />
          </div>
        </div>

        {/* Accent Border */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-300" />
      </div>
    </div>
  );
};

export default PrintingServiceBanner;
