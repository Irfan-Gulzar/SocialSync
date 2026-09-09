import React, { useState, useEffect, useRef } from 'react';
import PlatformAvatar from './PlatformAvatar';

export default function ChatView({
  conversations,
  activePlatform,
  activeConversationId,
  setActiveConversationId,
  messages,
  sendMessage,
  isSending = false,
  sendError = ''
}) {
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter conversations by active platform
  const filteredConversations = conversations.filter((c) => {
    if (activePlatform === 'all' || activePlatform === 'overview') return true;
    return c.platform === activePlatform;
  });

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Helper to format timestamp for list view
  const formatListTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Helper to format message bubble timestamps
  const formatBubbleTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSending) return;
    const sent = await sendMessage(replyText);
    if (sent) setReplyText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <main className="w-full md:w-[calc(100%-260px)] md:ml-[260px] pt-14 h-screen flex flex-col md:flex-row relative z-10 overflow-hidden">
      {/* Left Panel: Chat List */}
      <aside className="w-full md:w-[340px] flex-shrink-0 border-r border-white/10 bg-surface-container-lowest/60 backdrop-blur-2xl flex flex-col md:border-b-0 border-b">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-surface/20">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-semibold">Messages</h2>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined text-sm">filter_list</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((c) => {
              const isSelected = c.id === activeConversationId;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConversationId(c.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-surface-container-high/80 border border-white/10 border-l-4 border-l-primary shadow-lg shadow-black/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <PlatformAvatar platform={c.platform} size="lg" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-tertiary rounded-full border-2 border-surface-container-high shadow-[0_0_8px_var(--tw-colors-tertiary)]"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                        {c.customer_name || 'Customer'}
                      </span>
                      <span className="font-label-sm text-label-sm text-tertiary">
                        {formatListTime(c.last_message_at)}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Click to check messages
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl opacity-30 mb-2 block">forum</span>
              No conversations found
            </div>
          )}
        </div>
      </aside>

      {/* Center Panel: Chat Window */}
      <section className="flex-1 flex flex-col min-w-0 relative bg-gradient-to-b from-surface/20 to-background/80">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-[72px] border-b border-white/10 bg-surface-container/40 backdrop-blur-xl px-6 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <PlatformAvatar platform={activeConversation.platform} size="md" />
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface font-semibold">
                    {activeConversation.customer_name || 'Customer'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_var(--tw-colors-tertiary)]"></span>
                    <span className="font-label-sm text-label-sm text-tertiary tracking-wide uppercase text-[10px]">
                      Online via {activeConversation.platform}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors hidden sm:block">
                  <span className="material-symbols-outlined">call</span>
                </button>
                <button className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors hidden sm:block">
                  <span className="material-symbols-outlined">videocam</span>
                </button>
                <button className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors sm:ml-2 sm:border-l sm:border-white/10 sm:pl-4">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-gutter space-y-6">
              <div className="flex justify-center">
                <span className="px-3 py-1 rounded-full bg-surface-container/50 border border-white/5 font-label-sm text-[11px] text-on-surface-variant backdrop-blur-md">
                  Active Connection Session
                </span>
              </div>

              {messages.map((msg) => {
                const isAgent = msg.sender_type === 'agent';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${isAgent ? 'ml-auto justify-end' : ''}`}
                  >
                    {!isAgent && (
                      <PlatformAvatar
                        platform={activeConversation.platform}
                        size="sm"
                        className="mt-auto opacity-90"
                      />
                    )}
                    <div
                      className={`p-4 rounded-2xl border relative group ${
                        isAgent
                          ? 'bg-gradient-to-br from-primary-container/90 to-primary-container rounded-br-sm border-primary/30 shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),_0_8px_16px_rgba(134,194,50,0.2)] text-on-primary-container'
                          : 'bg-gradient-to-br from-surface-container-high to-surface-container rounded-bl-sm border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),_0_8px_16px_rgba(0,0,0,0.4)] text-on-surface'
                      }`}
                    >
                      <p className="font-body-md text-body-md whitespace-pre-wrap">{msg.content}</p>
                      <div
                        className={`absolute -bottom-5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
                          isAgent ? 'right-0' : 'left-0'
                        }`}
                      >
                        <span className="font-label-sm text-[10px] text-on-surface-variant">
                          {formatBubbleTime(msg.created_at)}
                        </span>
                        {isAgent && (
                          <span className="material-symbols-outlined text-[14px] text-primary">done_all</span>
                        )}
                      </div>
                    </div>
                    {isAgent && (
                      <PlatformAvatar
                        platform={activeConversation.platform}
                        size="sm"
                        className="mt-auto opacity-90"
                      />
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-surface-container/60 backdrop-blur-xl border-t border-white/10 shrink-0">
              <div className="flex items-end gap-3 bg-surface/50 border border-white/10 rounded-2xl p-2 shadow-inner focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                <button type="button" className="p-2 text-on-surface-variant hover:text-tertiary transition-colors shrink-0">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <textarea
                  className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface font-body-md resize-none py-2 placeholder:text-on-surface-variant/50 min-h-[40px] max-h-[120px] overflow-y-auto"
                  placeholder="Type your message..."
                  rows={1}
                  value={replyText}
                  disabled={isSending}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button type="button" className="p-2 text-on-surface-variant hover:text-tertiary transition-colors shrink-0 hidden sm:block">
                  <span className="material-symbols-outlined">sentiment_satisfied</span>
                </button>
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="p-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary hover:shadow-[0_0_15px_var(--tw-colors-primary)] transition-all shrink-0 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">{isSending ? 'hourglass_empty' : 'send'}</span>
                </button>
              </div>
              {sendError && (
                <p className="mt-2 text-center text-xs text-red-400" role="alert">
                  {sendError}
                </p>
              )}
              <div className="text-center mt-2 hidden sm:block">
                <span className="font-label-sm text-[10px] text-on-surface-variant">Press Enter to send, Shift+Enter for new line</span>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-gutter">
            <span className="material-symbols-outlined text-6xl opacity-20 mb-4 animate-pulse">chat</span>
            <h3 className="font-title-md text-title-md font-semibold mb-2">Select a Conversation</h3>
            <p className="text-sm max-w-xs text-center opacity-70">Choose a chat from the message list panel on the left to start replying in real time.</p>
          </div>
        )}
      </section>

    </main>
  );
}
