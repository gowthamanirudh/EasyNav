'use client';

import React, { useRef, useState } from 'react';

interface VoiceInputProps {
  onDestination: (destination: string, nodeId: number) => void;
}

export default function VoiceInput({ onDestination }: VoiceInputProps) {
  const recognitionRef = useRef<any>(null);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);

  const startRecording = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        alert('Speech Recognition not supported in your browser');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.language = 'en-US';

      recognition.onstart = () => {
        setRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        setTranscript(transcript);
        processVoice(transcript);
        setRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setTranscript(`Error: ${event.error}`);
        setRecording(false);
      };

      recognition.onend = () => {
        setRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Mic error:', error);
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
  };

  const processVoice = (text: string) => {
    const destinations = [
      { keywords: ['marina', 'beach'], name: 'Marina Beach', nodeId: 2 },
      { keywords: ['anna', 'university', 'uni'], name: 'Anna University', nodeId: 3 },
      { keywords: ['guindy', 'station'], name: 'Guindy Station', nodeId: 4 },
      { keywords: ['central', 'starting'], name: 'Central Chennai', nodeId: 1 },
    ];

    const textLower = text.toLowerCase();
    
    for (const dest of destinations) {
      if (dest.keywords.some(kw => textLower.includes(kw))) {
        onDestination(dest.name, dest.nodeId);
        return;
      }
    }
  };

  return (
    <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg">
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`w-full px-6 py-4 rounded-full text-white font-bold text-lg transition transform hover:scale-105 ${
          recording
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-blue-700 hover:bg-blue-800'
        }`}
      >
        {recording ? '🎤 Recording... Tap to stop' : '🎤 Tap to speak'}
      </button>

      {transcript && (
        <p className="mt-3 text-sm text-white bg-black bg-opacity-30 p-3 rounded">
          <strong>You said:</strong> "{transcript}"
        </p>
      )}
    </div>
  );
}
