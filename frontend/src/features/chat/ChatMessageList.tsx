import React, { useState } from 'react';
import { ToolExecutionCard } from '../tools/ToolExecutionCard';
import { MarkdownText } from './MarkdownText';

export interface ChatMessageItem {
  id: string;
  session_id: string;
  sender: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  metadata_json?: any;
  is_edited?: boolean;
  created_at: string;
}

interface ChatMessageListProps {
  messages: ChatMessageItem[];
  onEditMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
  isLoading?: boolean;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  onEditMessage,
  onDeleteMessage,
  isLoading
}) => {
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleStartEdit = (msg: ChatMessageItem) => {
    setEditingMsgId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = (msgId: string) => {
    if (editContent.trim()) {
      onEditMessage(msgId, editContent.trim());
    }
    setEditingMsgId(null);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#FAF7F2' }}>
      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#78350F', margin: 'auto', backgroundColor: '#FFFDF9', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #F3EAD8' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#B45309' }}>👋 Welcome to Brewly AI Assistant!</h4>
          <p style={{ fontSize: '0.85rem', margin: 0, color: '#57534E' }}>Ask me about branch menus, items, order cart, or branch locations.</p>
        </div>
      ) : (
        messages.map((m) => {
          const isUser = m.sender === 'USER';
          const isEditing = editingMsgId === m.id;

          return (
            <div
              key={m.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}
            >
              <div style={{
                fontSize: '0.725rem',
                color: '#78350F',
                fontWeight: 600,
                textAlign: isUser ? 'right' : 'left',
                padding: '0 0.25rem'
              }}>
                {isUser ? 'You' : 'Brewly AI Assistant'} {m.is_edited && '(edited)'}
              </div>

              <div
                style={{
                  backgroundColor: isUser ? '#F59E0B' : '#FFFFFF',
                  color: isUser ? '#FFFFFF' : '#1C1917',
                  padding: '0.8rem 1rem',
                  borderRadius: isUser ? '1rem 1rem 0.2rem 1rem' : '1rem 1rem 1rem 0.2rem',
                  lineHeight: '1.5',
                  fontSize: '0.9rem',
                  border: isUser ? 'none' : '1px solid #F3EAD8',
                  boxShadow: '0 2px 4px rgba(217, 119, 6, 0.06)'
                }}
              >
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#FFFDF9',
                        color: '#1C1917',
                        border: '1px solid #D97706',
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        fontSize: '0.85rem'
                      }}
                      rows={3}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingMsgId(null)} style={{ background: '#78350F', color: '#FFF', border: 'none', borderRadius: '0.25rem', padding: '0.25rem 0.6rem', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={() => handleSaveEdit(m.id)} style={{ background: '#059669', color: '#FFF', border: 'none', borderRadius: '0.25rem', padding: '0.25rem 0.6rem', cursor: 'pointer' }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Rendered content using MarkdownText */}
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    ) : (
                      <MarkdownText content={m.content} />
                    )}
                    
                    {/* Tool execution display card if present */}
                    {m.metadata_json && m.metadata_json.tool_executions && (
                      <div style={{ marginTop: '0.5rem' }}>
                        {m.metadata_json.tool_executions.map((exec: any, idx: number) => (
                          <ToolExecutionCard key={idx} execution={exec} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message Action Controls */}
              {isUser && !isEditing && (
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', fontSize: '0.725rem' }}>
                  <button onClick={() => handleStartEdit(m)} style={{ background: 'none', border: 'none', color: '#B45309', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => onDeleteMessage(m.id)} style={{ background: 'none', border: 'none', color: '#E11D48', cursor: 'pointer' }}>Delete</button>
                </div>
              )}
            </div>
          );
        })
      )}

      {isLoading && (
        <div style={{ alignSelf: 'flex-start', color: '#B45309', fontSize: '0.8rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>🤖</span> Brewly AI is processing your request...
        </div>
      )}
    </div>
  );
};
