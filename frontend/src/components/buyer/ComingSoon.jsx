import { useEffect } from "react";

export default function ComingSoon() {
  useEffect(() => {
    // Redirect to WhatsApp after 5 seconds
    const timer = setTimeout(() => {
      window.location.href = "https://wa.me/919203338229";
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-indigo-500 to-indigo-700 text-white px-4">
      {/* Logo or Icon */}
      <div className="text-5xl mb-4 animate-bounce">🚀</div>

      {/* Heading */}
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
        Coming Soon
      </h1>

      {/* Subtitle */}
      <p className="text-center mb-6 text-sm md:text-base opacity-90">
        Our service is launching soon! services are currently available on{" "}
        <strong>WhatsApp</strong>. You’ll be redirected to WhatsApp for
        inquiries.
      </p>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/919203338229"
        className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="w-5 h-5"
        >
          <path d="M20.52 3.48A11.77 11.77 0 0 0 12.07 0C5.62 0 .3 5.32.3 11.88a11.7 11.7 0 0 0 1.65 6L0 24l6.35-1.65a11.9 11.9 0 0 0 5.68 1.45h.05c6.45 0 11.77-5.32 11.77-11.88a11.8 11.8 0 0 0-3.33-8.44zM12.08 22a9.8 9.8 0 0 1-5-1.37l-.36-.22-3.77 1 1-3.67-.24-.38a9.7 9.7 0 0 1-1.52-5.19c0-5.4 4.4-9.79 9.8-9.79a9.7 9.7 0 0 1 6.92 2.87 9.7 9.7 0 0 1 2.88 6.92c0 5.4-4.4 9.79-9.8 9.79zm5.38-7.36c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.67.15-.2.3-.77.97-.95 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.48-1.77-1.65-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.5-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.28.3-1.05 1.03-1.05 2.5 0 1.47 1.08 2.88 1.23 3.08.15.2 2.13 3.25 5.17 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.78-.72 2.03-1.4.25-.68.25-1.27.17-1.4-.07-.12-.27-.2-.57-.35z" />
        </svg>
        Chat on WhatsApp
      </a>

      {/* Footer Info */}
      <p className="mt-8 text-xs text-white/70">
        Redirecting you automatically in <span className="font-bold">5s</span>…
      </p>
    </div>
  );
}
