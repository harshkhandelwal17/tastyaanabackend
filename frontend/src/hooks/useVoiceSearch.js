import { useState, useEffect, useCallback, useRef } from 'react';
import { processVoiceCommand } from '../api/vehiclePublicApi';

/**
 * Custom hook for voice search functionality using Web Speech API
 * @returns {Object} Voice search state and controls
 */
const useVoiceSearch = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);

    // Check if Web Speech API is supported
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            setIsSupported(true);

            // Initialize speech recognition
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;

            // Handle results
            recognition.onresult = (event) => {
                let interimText = '';
                let finalText = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptPart = event.results[i][0].transcript;

                    if (event.results[i].isFinal) {
                        finalText += transcriptPart;
                    } else {
                        interimText += transcriptPart;
                    }
                }

                if (finalText) {
                    setTranscript(finalText);
                    setInterimTranscript('');
                } else {
                    setInterimTranscript(interimText);
                }
            };

            // Handle errors
            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setError(event.error);
                setIsListening(false);

                if (event.error === 'no-speech') {
                    setError('No speech detected. Please try again.');
                } else if (event.error === 'not-allowed') {
                    setError('Microphone access denied. Please allow microphone access.');
                } else {
                    setError('An error occurred. Please try again.');
                }
            };

            // Handle end
            recognition.onend = () => {
                setIsListening(false);
                setInterimTranscript('');
            };

            recognitionRef.current = recognition;
        } else {
            setIsSupported(false);
            setError('Voice search is not supported in this browser.');
        }

        // Cleanup
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    // Start listening
    const startListening = useCallback(() => {
        if (!isSupported || !recognitionRef.current) {
            setError('Voice search is not supported in this browser.');
            return;
        }

        try {
            setError(null);
            setTranscript('');
            setInterimTranscript('');
            setIsListening(true);
            recognitionRef.current.start();
        } catch (err) {
            console.error('Error starting speech recognition:', err);
            setError('Failed to start voice search. Please try again.');
            setIsListening(false);
        }
    }, [isSupported]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    // Reset transcript
    const resetTranscript = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
    }, []);

    // Process voice command into filters
    const getFiltersFromTranscript = useCallback((text) => {
        if (!text) return {};
        return processVoiceCommand(text);
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        isSupported,
        error,
        startListening,
        stopListening,
        resetTranscript,
        getFiltersFromTranscript,
    };
};

export default useVoiceSearch;
