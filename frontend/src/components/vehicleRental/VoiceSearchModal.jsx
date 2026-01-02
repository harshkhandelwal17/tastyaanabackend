import React, { useState, useEffect, useRef } from "react";
import { FiMic, FiMicOff, FiX } from "react-icons/fi";

const VoiceSearchModal = ({ onResult, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or Safari."
      );
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN"; // Indian English

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      // If we have a final result, process it
      if (finalTranscript) {
        setTimeout(() => {
          onResult(finalTranscript);
        }, 1000);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setError(`Error: ${event.error}. Please try again.`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Start listening immediately
    recognition.start();

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [onResult]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleManualSubmit = () => {
    if (transcript.trim()) {
      onResult(transcript);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
        >
          <FiX size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Voice Search
          </h3>
          <p className="text-gray-600">
            Say something like "I want a bike", "Show me electric cars", or
            "Find cheap vehicles"
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Microphone Visual */}
        <div className="flex justify-center mb-6">
          <button
            onClick={toggleListening}
            disabled={!!error}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : "bg-green-500 hover:bg-green-600"
            } ${error ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isListening ? (
              <FiMicOff size={32} className="text-white" />
            ) : (
              <FiMic size={32} className="text-white" />
            )}
          </button>
        </div>

        {/* Status */}
        <div className="text-center mb-4">
          {isListening ? (
            <p className="text-green-600 font-medium">🎤 Listening...</p>
          ) : (
            <p className="text-gray-600">Tap the microphone to start</p>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What you said:
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-900">{transcript}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          {transcript && (
            <button
              onClick={handleManualSubmit}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Search
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">Voice Search Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• "Show me bikes under 500 rupees"</li>
            <li>• "I need an electric car"</li>
            <li>• "Find Honda vehicles"</li>
            <li>• "Available cars near me"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VoiceSearchModal;
