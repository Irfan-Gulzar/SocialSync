import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardView from './components/DashboardView';
import ChatView from './components/ChatView';
import SocialBotPanel from './components/SocialBotPanel';

const PLATFORM_IDS = ['whatsapp', 'instagram', 'tiktok', 'facebook'];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, whatsapp, instagram, tiktok, facebook
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [stats, setStats] = useState(null);
  const [isBotPanelOpen, setIsBotPanelOpen] = useState(false);
  const [unreadConversationIds, setUnreadConversationIds] = useState({
    whatsapp: [],
    instagram: [],
    tiktok: [],
    facebook: [],
  });
  const activeTabRef = useRef(activeTab);
  const activeConversationIdRef = useRef(activeConversationId);

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  // Fetch dashboard stats from DB
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Send message reply
  const sendMessage = async (text) => {
    if (!activeConversationId) return false;
    setIsSending(true);
    setSendError('');
    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }), // Matches backend structure { text }
      });

      const responseBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(responseBody.error || 'Failed to send reply');
      }

      setMessages((prev) => [...prev, responseBody]);

      // Update last message timestamp in conversations list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, last_message_at: new Date().toISOString() }
            : c
        )
      );
      return true;
    } catch (err) {
      console.error('Error sending reply:', err);
      setSendError(err.message || 'Failed to send reply');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const handleTabChange = (tab) => {
    setIsBotPanelOpen(false);
    activeTabRef.current = tab;
    setActiveTab(tab);
  };

  const handleConversationSelect = (conversationId) => {
    activeConversationIdRef.current = conversationId;
    setActiveConversationId(conversationId);

    const platform = conversations.find(
      (conversation) => conversation.id === conversationId
    )?.platform;
    if (!platform) return;

    setUnreadConversationIds((previous) => ({
      ...previous,
      [platform]: previous[platform].filter((id) => id !== conversationId),
    }));
  };

  // Handle Dashboard "Reply" click: switch tab and set active conversation
  const handleReplyFromDashboard = (convId, platform) => {
    handleTabChange(platform);
    handleConversationSelect(convId);
  };

  // Initial fetch and Socket.io registration
  useEffect(() => {
    fetchConversations();
    fetchStats();

    // Connect to Socket.io backend
    const socket = io();

    socket.on('connect', () => {
      console.log('Socket.io connected to server, id:', socket.id);
    });

    socket.on('new_message', (payload) => {
      // payload: { conversationId, platform, customerName, text, createdAt }

      // Refresh dashboard data after successful webhook persistence.
      fetchConversations();
      fetchStats();

      // Messages in the open conversation are already read by the agent.
      if (
        activeTabRef.current === payload.platform &&
        activeConversationIdRef.current === payload.conversationId
      ) {
        const newMsg = {
          id: Date.now(), // fallback temporary key
          conversation_id: payload.conversationId,
          sender_type: 'customer',
          content: payload.text,
          created_at: payload.createdAt || new Date().toISOString()
        };
        setMessages((prev) => [...prev, newMsg]);
      } else {
        // Count each unread customer conversation once, even if it receives
        // multiple messages before the agent opens it.
        const platform = payload.platform;
        if (PLATFORM_IDS.includes(platform)) {
          setUnreadConversationIds((previous) => {
            if (previous[platform].includes(payload.conversationId)) {
              return previous;
            }
            return {
              ...previous,
              [platform]: [...previous[platform], payload.conversationId],
            };
          });
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    activeTabRef.current = activeTab;
    activeConversationIdRef.current = activeConversationId;
  }, [activeTab, activeConversationId]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // When changing platform tab, auto-select first conversation of that platform
  useEffect(() => {
    if (activeTab !== 'overview') {
      const activeConversationIsVisible = conversations.some(
        (conversation) =>
          conversation.id === activeConversationId &&
          conversation.platform === activeTab
      );
      if (activeConversationIsVisible) return;

      const firstConv = conversations.find((c) => c.platform === activeTab);
      if (firstConv) {
        activeConversationIdRef.current = firstConv.id;
        setActiveConversationId(firstConv.id);
        setUnreadConversationIds((previous) => ({
          ...previous,
          [activeTab]: previous[activeTab].filter((id) => id !== firstConv.id),
        }));
      } else {
        activeConversationIdRef.current = null;
        setActiveConversationId(null);
      }
    }
  }, [activeTab, activeConversationId, conversations]);

  const unreadCounts = Object.fromEntries(
    PLATFORM_IDS.map((platform) => [
      platform,
      unreadConversationIds[platform].length,
    ])
  );
  const isDashboardView = activeTab === 'overview';

  return (
    <div className="min-h-screen text-on-surface select-none relative bg-background">
      {/* Ambient Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-container/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-tertiary-container/10 blur-[150px]"></div>
      </div>

      {/* Side Navigation Bar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        unreadCounts={unreadCounts}
      />

      {/* Top Header Bar */}
      <Topbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onMenuClick={() => {
          const sidebar = document.getElementById('mobile-sidebar');
          if (sidebar) sidebar.classList.remove('-translate-x-full');
        }}
      />

      {/* View router */}
      {isDashboardView ? (
        <DashboardView
          conversations={conversations}
          onReplyClick={handleReplyFromDashboard}
          stats={stats}
        />
      ) : (
        <ChatView
          conversations={conversations}
          activePlatform={activeTab}
          activeConversationId={activeConversationId}
          setActiveConversationId={handleConversationSelect}
          messages={messages}
          sendMessage={sendMessage}
          isSending={isSending}
          sendError={sendError}
        />
      )}

      {/* Floating Quick Action Buttons — only visible on Main Dashboard */}
      {isDashboardView && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            type="button"
            title={isBotPanelOpen ? 'Close Social Bot' : 'Open Social Bot'}
            aria-label={isBotPanelOpen ? 'Close Social Bot' : 'Open Social Bot'}
            aria-expanded={isBotPanelOpen}
            aria-controls="social-bot-panel"
            onClick={() => setIsBotPanelOpen((isOpen) => !isOpen)}
            className={`group relative flex h-14 w-14 items-center justify-center overflow-visible rounded-2xl border shadow-[0_10px_30px_rgba(134,194,50,0.3)] transition-all duration-200 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_14px_36px_rgba(134,194,50,0.45)] ${
              isBotPanelOpen
                ? 'border-[#b5ec67] bg-gradient-to-br from-[#a3dc50] to-[#6da822] text-[#102000]'
                : 'border-[#9bd847]/70 bg-gradient-to-br from-[#9bd847] via-[#86c232] to-[#5f941d] text-[#102000]'
            }`}
          >
            <span className="absolute inset-[3px] rounded-[11px] border border-white/20" aria-hidden="true" />
            <span
              className="material-symbols-outlined relative transition-transform duration-200 group-hover:scale-110"
              style={{ fontSize: '27px', fontVariationSettings: "'FILL' 1, 'wght' 600" }}
            >
              smart_toy
            </span>
            <span
              className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-[3px] border-[#11171b] bg-[#b5ef64] shadow-[0_0_10px_rgba(181,239,100,0.9)]"
              aria-hidden="true"
            />
          </button>
        </div>
      )}

      {isDashboardView && (
        <SocialBotPanel
          isOpen={isBotPanelOpen}
          onClose={() => setIsBotPanelOpen(false)}
        />
      )}
    </div>
  );
}
