import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, X, Shield, Bot } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils.js';

export function ChatSidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onClose,
  isAdmin,
  messageCount,
  messageLimit,
}) {
  const content = (
    <div className="flex flex-col h-full bg-card/50 border-r border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-tight">FlyBot</h2>
            {isAdmin && (
              <span className="text-[9px] text-primary/70 font-medium flex items-center gap-0.5">
                <Shield className="w-2 h-2" />
                Admin (Opus)
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="sm:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New chat button */}
      <div className="p-3">
        <button
          onClick={() => { onNew(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={cn(
              'group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm',
              conv.id === activeConversationId
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
            onClick={() => { onSelect(conv.id); onClose(); }}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-[13px]">{conv.title}</p>
              <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                {timeAgo(conv.last_message_at)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="opacity-0 group-hover:opacity-50 hover:opacity-100 p-1.5 rounded-md hover:bg-muted transition-opacity"
              aria-label="Delete conversation"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {conversations.length === 0 && (
          <p className="text-[11px] text-muted-foreground/30 text-center py-12">
            Your conversations will appear here
          </p>
        )}
      </div>

      {/* Message counter */}
      {messageLimit && messageLimit !== Infinity && (
        <div className="p-3 border-t border-border/50">
          <div className="flex items-center justify-center gap-2">
            <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  messageCount >= messageLimit ? 'bg-red-500' : 'bg-primary/60'
                )}
                style={{ width: `${Math.min((messageCount / messageLimit) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground/40 tabular-nums">
              {messageCount}/{messageLimit}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden sm:block w-[260px] flex-shrink-0 h-full">
        {content}
      </div>

      {/* Mobile: slide-in overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="sm:hidden fixed left-0 top-0 bottom-0 w-[260px] z-50 shadow-2xl"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
