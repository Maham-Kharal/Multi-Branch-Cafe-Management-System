import React, { useState } from 'react';

export interface ChatSession {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: (title?: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customNewTitle, setCustomNewTitle] = useState('');

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSession(customNewTitle.trim() || 'New Chat');
    setCustomNewTitle('');
    setIsCreatingCustom(false);
  };

  return (
    <aside style={{
      width: '280px',
      backgroundColor: '#111827',
      color: '#F9FAFB',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #374151',
      padding: '1rem',
      height: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>💬 Chat Sessions</h3>
        <button
          onClick={() => setIsCreatingCustom(!isCreatingCustom)}
          style={{
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '0.375rem',
            padding: '0.4rem 0.75rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          + New Chat
        </button>
      </div>

      {/* Inline Create Custom Chat Session Input */}
      {isCreatingCustom && (
        <form onSubmit={handleCreateSubmit} style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <input
            type="text"
            placeholder="Enter chat session name..."
            value={customNewTitle}
            onChange={(e) => setCustomNewTitle(e.target.value)}
            autoFocus
            style={{
              backgroundColor: '#1F2937',
              color: '#FFFFFF',
              border: '1px solid #3B82F6',
              borderRadius: '0.375rem',
              padding: '0.5rem',
              fontSize: '0.85rem'
            }}
          />
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsCreatingCustom(false)}
              style={{ backgroundColor: '#4B5563', color: '#FFF', border: 'none', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', borderRadius: '0.25rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Create
            </button>
          </div>
        </form>
      )}

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sessions.length === 0 ? (
          <div style={{ color: '#9CA3AF', fontSize: '0.875rem', textAlign: 'center', marginTop: '2rem' }}>
            No chat sessions yet.<br />Click "+ New Chat" to start.
          </div>
        ) : (
          sessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: isActive ? '#1F2937' : 'transparent',
                  border: isActive ? '1px solid #3B82F6' : '1px solid #374151',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.2s'
                }}
              >
                {editingId === s.id ? (
                  <form onSubmit={(e) => handleSaveRename(s.id, e)} style={{ flex: 1, display: 'flex', gap: '0.25rem' }}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      autoFocus
                      style={{
                        flex: 1,
                        backgroundColor: '#374151',
                        color: '#FFFFFF',
                        border: '1px solid #4B5563',
                        borderRadius: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.85rem'
                      }}
                    />
                    <button type="submit" style={{ backgroundColor: '#10B981', color: '#FFF', border: 'none', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>✓</button>
                  </form>
                ) : (
                  <>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      <span style={{ fontWeight: isActive ? 600 : 400, fontSize: '0.9rem' }}>{s.title}</span>
                      <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Status: {s.status}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.5rem' }}>
                      <button
                        title="Rename Chat"
                        onClick={(e) => handleStartRename(s, e)}
                        style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        ✏️
                      </button>
                      <button
                        title="Delete Chat"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this chat session?')) onDeleteSession(s.id);
                        }}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
