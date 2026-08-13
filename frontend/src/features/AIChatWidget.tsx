import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ChatSidebar, ChatSession } from './chat/ChatSidebar';
import { ChatMessageList, ChatMessageItem } from './chat/ChatMessageList';
import { VoiceController } from './voice/VoiceController';

export const AIChatWidget: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [enableVoice, setEnableVoice] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load chat sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      fetchMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  const fetchSessions = async () => {
    try {
      setErrorMsg(null);
      const res = await api.get<ChatSession[]>('/chat/sessions');
      setSessions(res.data);
      if (res.data.length > 0 && !activeSessionId) {
        setActiveSessionId(res.data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load chat sessions', err);
      if (err.response?.status === 401) {
        setErrorMsg('Authentication token expired or invalid. Please log in again.');
      } else {
        setErrorMsg('Failed to connect to backend server. Make sure Uvicorn is running on port 8000.');
      }
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await api.get<ChatMessageItem[]>(`/chat/messages/session/${sessionId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to load session messages', err);
    }
  };

  const handleCreateSession = async (customTitle?: string) => {
    try {
      setErrorMsg(null);
      const titleToUse = customTitle || 'New Chat';
      const res = await api.post<ChatSession>('/chat/sessions', { title: titleToUse });
      setSessions((prev) => [res.data, ...prev]);
      setActiveSessionId(res.data.id);
    } catch (err: any) {
      console.error('Failed to create session', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to create chat session.');
    }
  };

  const handleRenameSession = async (id: string, newTitle: string) => {
    try {
      const res = await api.patch<ChatSession>(`/chat/sessions/${id}/title`, { title: newTitle });
      setSessions((prev) => prev.map((s) => (s.id === id ? res.data : s)));
    } catch (err) {
      console.error('Failed to rename session', err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await api.delete(`/chat/sessions/${id}`);
      const filtered = sessions.filter((s) => s.id !== id);
      setSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete session', err);
    }
  };

  const handleSendMessage = async (promptText: string) => {
    if (!promptText.trim()) return;

    setErrorMsg(null);
    let targetSessionId = activeSessionId;

    // Auto-create session if none exists
    if (!targetSessionId) {
      try {
        const res = await api.post<ChatSession>('/chat/sessions', { title: promptText.slice(0, 25) });
        setSessions((prev) => [res.data, ...prev]);
        targetSessionId = res.data.id;
        setActiveSessionId(res.data.id);
      } catch (err: any) {
        console.error('Error creating session for message', err);
        setErrorMsg(err.response?.data?.detail || 'Unable to initialize a new chat session.');
        return;
      }
    } else {
      // If current session is titled "New Chat", auto-rename it to user's first prompt
      const currentSession = sessions.find((s) => s.id === targetSessionId);
      if (currentSession && currentSession.title === 'New Chat') {
        const autoTitle = promptText.slice(0, 25);
        handleRenameSession(targetSessionId, autoTitle);
      }
    }

    if (!targetSessionId) return;

    setIsLoading(true);
    setInputText('');

    // Optimistically append user message to UI
    const tempUserMsg: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      session_id: targetSessionId,
      sender: 'USER',
      content: promptText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      await api.post('/orchestrator/process', {
        session_id: targetSessionId,
        prompt: promptText,
        generate_voice: enableVoice
      });

      await fetchMessages(targetSessionId);
    } catch (err: any) {
      console.error('Error sending message to orchestrator', err);
      setErrorMsg(err.response?.data?.detail || 'Groq AI Orchestrator failed to process your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await api.patch(`/chat/messages/${messageId}`, { content: newContent });
      if (activeSessionId) {
        fetchMessages(activeSessionId);
      }
    } catch (err) {
      console.error('Failed to edit message', err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await api.delete(`/chat/messages/${messageId}`);
      if (activeSessionId) {
        fetchMessages(activeSessionId);
      }
    } catch (err) {
      console.error('Failed to delete message', err);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 70px)', backgroundColor: '#111827' }}>
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onCreateSession={handleCreateSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Error Banner */}
        {errorMsg && (
          <div style={{
            backgroundColor: '#7F1D1D',
            color: '#FCA5A5',
            padding: '0.6rem 1rem',
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>⚠️ {errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {/* Messages list */}
        <ChatMessageList
          messages={messages}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
          isLoading={isLoading}
        />

        {/* Bottom Bar: Voice controller + Prompt input */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#1F2937',
          borderTop: '1px solid #374151',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <VoiceController
            onVoiceInput={(transcript) => handleSendMessage(transcript)}
            enableVoiceResponse={enableVoice}
            onToggleVoiceResponse={setEnableVoice}
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            style={{ display: 'flex', gap: '0.75rem' }}
          >
            <input
              type="text"
              placeholder="Ask Groq AI about menu, order cart, or branch locations..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                backgroundColor: '#374151',
                color: '#FFFFFF',
                border: '1px solid #4B5563',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.95rem'
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              style={{
                backgroundColor: '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
