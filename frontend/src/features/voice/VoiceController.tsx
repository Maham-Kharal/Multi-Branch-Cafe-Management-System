import React, { useState } from 'react';

interface VoiceControllerProps {
  onVoiceInput: (transcript: string) => void;
  enableVoiceResponse: boolean;
  onToggleVoiceResponse: (enabled: boolean) => void;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  onVoiceInput,
  enableVoiceResponse,
  onToggleVoiceResponse
}) => {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition is not supported by your browser. You can type text prompts directly!');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onVoiceInput(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Recording initialization error:', err);
      setIsRecording(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button
        onClick={toggleRecording}
        style={{
          backgroundColor: isRecording ? '#EF4444' : '#3B82F6',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '50%',
          width: '2.5rem',
          height: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: isRecording ? '0 0 0 4px rgba(239, 68, 68, 0.4)' : 'none',
          transition: 'all 0.2s'
        }}
        title={isRecording ? 'Listening... Click to stop' : 'Click to Speak (Voice Input)'}
      >
        {isRecording ? '🛑' : '🎙️'}
      </button>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#D1D5DB', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={enableVoiceResponse}
          onChange={(e) => onToggleVoiceResponse(e.target.checked)}
        />
        <span>ElevenLabs Voice Output (Free Tier)</span>
      </label>
    </div>
  );
};
