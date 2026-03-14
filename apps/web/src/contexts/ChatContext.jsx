import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '@/hooks/useChat.js';

const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
};

// Map pathname to human-readable page context
const PAGE_CONTEXT_MAP = {
  '/': 'Home',
  '/explore': 'Explore (project catalog)',
  '/ideas': 'Idea Lab (idea submissions and scoring)',
  '/ideas/analytics': 'Idea Lab Analytics',
  '/newsletter': 'Newsletter (Substack archive)',
  '/about': 'About Fly Labs',
  '/scoring': 'Scoring Frameworks',
  '/library': 'Library (free ebooks)',
  '/prompts': 'Prompt Library',
  '/templates': 'Templates',
  '/templates/website-blueprint': 'Website Blueprint',
  '/templates/garmin-to-notion': 'Garmin to Notion',
  '/templates/launch-checklist': 'Launch Checklist',
  '/templates/one-page-business-plan': 'One-Page Business Plan',
  '/microsaas': 'Micro Tools',
  '/profile': 'User Profile',
  '/flybot': 'FlyBot (full page)',
};

function getPageContext(pathname) {
  // Exact match first
  if (PAGE_CONTEXT_MAP[pathname]) return PAGE_CONTEXT_MAP[pathname];
  // Dynamic routes
  if (pathname.startsWith('/ideas/') && pathname !== '/ideas/analytics') return 'Idea Detail';
  return null;
}

export const ChatProvider = ({ children }) => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const hasInitializedRef = useRef(false);
  const location = useLocation();

  const chat = useChat();

  const currentPageContext = useMemo(() => {
    const name = getPageContext(location.pathname);
    if (!name) return null;
    return { name, path: location.pathname };
  }, [location.pathname]);

  const initChat = useCallback(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    chat.fetchConversations();
  }, [chat.fetchConversations]);

  const toggleWidget = useCallback(() => {
    setIsWidgetOpen(prev => {
      const opening = !prev;
      if (opening) initChat();
      return opening;
    });
  }, [initChat]);

  const closeWidget = useCallback(() => {
    setIsWidgetOpen(false);
  }, []);

  const openWidget = useCallback(() => {
    setIsWidgetOpen(true);
    initChat();
  }, [initChat]);

  const value = useMemo(() => ({
    ...chat,
    isWidgetOpen,
    toggleWidget,
    closeWidget,
    openWidget,
    currentPageContext,
    initChat,
  }), [
    chat,
    isWidgetOpen,
    toggleWidget,
    closeWidget,
    openWidget,
    currentPageContext,
    initChat,
  ]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
