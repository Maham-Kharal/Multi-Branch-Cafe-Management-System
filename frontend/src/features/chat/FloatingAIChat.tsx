import React, { useState, useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import { api } from '../../services/api';
import { ChatMessageItem } from './ChatMessageList';
import { ToolExecutionCard } from '../tools/ToolExecutionCard';
import { MarkdownText } from './MarkdownText';

export const FloatingAIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enableVoice, setEnableVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Create or retrieve active floating chat session
  const initSession = async (): Promise<string | null> => {
    if (sessionId) return sessionId;

    try {
      const listRes = await api.get('/chat/sessions');
      if (listRes.data && listRes.data.length > 0) {
        const activeId = listRes.data[0].id;
        setSessionId(activeId);
        loadMessages(activeId);
        return activeId;
      }

      const createRes = await api.post('/chat/sessions', { title: 'Quick Voice AI Chat' });
      const newId = createRes.data.id;
      setSessionId(newId);
      return newId;
    } catch (err: any) {
      console.error('Failed to init floating chat session', err);
      setErrorMsg('Failed to initialize AI chat session.');
      return null;
    }
  };

  const loadMessages = async (sid: string) => {
    try {
      const res = await api.get<ChatMessageItem[]>(`/chat/messages/session/${sid}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load floating chat messages', err);
    }
  };

  const handleToggleOpen = async () => {
    if (!isOpen) {
      setIsOpen(true);
      await initSession();
    } else {
      setIsOpen(false);
    }
  };

  const handleSendMessage = async (promptText: string) => {
    if (!promptText.trim()) return;

    setErrorMsg(null);
    const sid = await initSession();
    if (!sid) return;

    setIsLoading(true);
    setInputText('');

    // Optimistically add user message
    const tempUserMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      session_id: sid,
      sender: 'USER',
      content: promptText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.post('/orchestrator/process', {
        session_id: sid,
        prompt: promptText,
        generate_voice: enableVoice
      });

      // Play ElevenLabs audio output if returned from backend
      if (res.data && res.data.audio_base64) {
        try {
          const audio = new Audio(`data:audio/mp3;base64,${res.data.audio_base64}`);
          audio.play().catch((audioErr) => console.warn('Browser autoplay blocked:', audioErr));
        } catch (e) {
          console.error('Audio playback error', e);
        }
      }

      await loadMessages(sid);
    } catch (err: any) {
      console.error('Error sending message in floating chat', err);
      setErrorMsg(err.response?.data?.detail || 'AI Assistant failed to process prompt.');
    } finally {
      setIsLoading(false);
    }
  };

  // Deepgram Nova-3 Voice Input Handler
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach((track) => track.stop());

        // Send recorded audio to Deepgram Nova-3 transcribe endpoint
        try {
          setIsLoading(true);
          const formData = new FormData();
          formData.append('file', audioBlob, 'voice.wav');

          const transcribeRes = await api.post('/orchestrator/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (transcribeRes.data && transcribeRes.data.transcript) {
            const transcript = transcribeRes.data.transcript;
            if (transcript.trim()) {
              handleSendMessage(transcript);
            }
          } else {
            setErrorMsg('Deepgram Nova-3 could not transcribe audio. Try typing text.');
          }
        } catch (err) {
          console.error('Deepgram transcription error', err);
          setErrorMsg('Deepgram STT connection error.');
        } finally {
          setIsLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access error', err);
      // Fallback to browser SpeechRecognition if mic stream fails
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.onresult = (e: any) => {
          const t = e.results[0][0].transcript;
          if (t) handleSendMessage(t);
        };
        recognition.start();
      } else {
        alert('Microphone access is required for voice input.');
      }
    }
  };

  return (
    <>
      {/* 🟡 Floating Widget Modal Box (Warm Cream / White / Amber Gold Theme) */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '390px',
            height: '530px',
            backgroundColor: '#FAF7F2',
            color: '#1C1917',
            borderRadius: '1.25rem',
            boxShadow: '0 20px 25px -5px rgba(180, 83, 9, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden',
            border: '1.5px solid #F3EAD8',
            fontFamily: 'sans-serif'
          }}
        >
          {/* Top Bar Header (Gold / Amber Palette) */}
          <div
            style={{
              padding: '0.85rem 1.1rem',
              backgroundColor: '#FEF3C7',
              borderBottom: '1px solid #FDE68A',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', backgroundColor: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)' }}>
                <Bot style={{ width: '1.35rem', height: '1.35rem', color: '#FFFFFF' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#78350F' }}>Brewly AI Assistant</div>
                <div style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ display: 'inline-block', width: '7px', height: '7px', backgroundColor: '#059669', borderRadius: '50%' }} />
                  Groq & ElevenLabs Active
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#78350F',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0.25rem',
                fontWeight: 700
              }}
            >
              ✕
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div style={{ backgroundColor: '#FFE4E6', color: '#E11D48', borderBottom: '1px solid #FECDD3', padding: '0.45rem 0.85rem', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
              <span>⚠️ {errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', color: '#E11D48', cursor: 'pointer', fontWeight: 700 }}>✕</button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', backgroundColor: '#FAF7F2' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#78350F', fontSize: '0.85rem', margin: 'auto', backgroundColor: '#FFFDF9', padding: '1.25rem', borderRadius: '0.875rem', border: '1px solid #F3EAD8' }}>
                <h5 style={{ margin: '0 0 0.4rem 0', color: '#B45309', fontSize: '0.95rem' }}>👋 How can I help you today?</h5>
                <p style={{ margin: 0, color: '#57534E', fontSize: '0.8rem' }}>Ask about menu items, order cart, or branch locations.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.sender === 'USER';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      backgroundColor: isUser ? '#F59E0B' : '#FFFFFF',
                      color: isUser ? '#FFFFFF' : '#1C1917',
                      padding: '0.7rem 0.95rem',
                      borderRadius: isUser ? '0.875rem 0.875rem 0.2rem 0.875rem' : '0.875rem 0.875rem 0.875rem 0.2rem',
                      fontSize: '0.875rem',
                      lineHeight: '1.45',
                      border: isUser ? 'none' : '1px solid #F3EAD8',
                      boxShadow: '0 2px 4px rgba(217, 119, 6, 0.05)'
                    }}
                  >
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    ) : (
                      <MarkdownText content={m.content} />
                    )}

                    {m.metadata_json && m.metadata_json.tool_executions && (
                      <div style={{ marginTop: '0.5rem' }}>
                        {m.metadata_json.tool_executions.map((exec: any, idx: number) => (
                          <ToolExecutionCard key={idx} execution={exec} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isLoading && (
              <div style={{ alignSelf: 'flex-start', color: '#B45309', fontSize: '0.8rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🤖</span> Brewly AI is processing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Bar: Mic & Input */}
          <div style={{ padding: '0.75rem 0.85rem', backgroundColor: '#FFFDF9', borderTop: '1px solid #F3EAD8', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={toggleRecording}
                style={{
                  backgroundColor: isRecording ? '#E11D48' : '#FEF3C7',
                  color: isRecording ? '#FFFFFF' : '#78350F',
                  border: isRecording ? 'none' : '1px solid #FDE68A',
                  borderRadius: '0.375rem',
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: isRecording ? '0 0 0 3px rgba(225, 29, 72, 0.25)' : 'none'
                }}
              >
                {isRecording ? '🛑 Recording...' : '🎙️ Deepgram Voice'}
              </button>

              <label style={{ fontSize: '0.75rem', color: '#78350F', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableVoice}
                  onChange={(e) => setEnableVoice(e.target.checked)}
                />
                ElevenLabs TTS
              </label>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              style={{ display: 'flex', gap: '0.4rem' }}
            >
              <input
                type="text"
                placeholder="Ask about menu items, cart, or branches..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                style={{
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  color: '#1C1917',
                  border: '1px solid #FDE68A',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem'
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.9rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.25)'
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🔴 Floating Action Button (Pastel Green with Barbie Pink Border) */}
      <button
        onClick={handleToggleOpen}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          backgroundColor: '#A7F3D0',
          color: '#065F46',
          border: '3.5px solid #EC4899',
          boxShadow: '0 10px 20px -3px rgba(167, 243, 208, 0.6), 0 4px 10px 0px rgba(236, 72, 153, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          transition: 'transform 0.2s, background-color 0.2s, box-shadow 0.2s'
        }}
        title="Open AI Voice Chat"
      >
        {isOpen ? (
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#065F46' }}>✕</span>
        ) : (
          <Bot style={{ width: '1.85rem', height: '1.85rem', color: '#065F46' }} />
        )}
      </button>
    </>
  );
};
