import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, X, Shield } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { timeAgo } from '@/lib/utils.js';

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
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">Conversations</h2>
          {isAdmin && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5" />
              Admin
            </span>
          )}
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
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={cn(
              'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm',
              conv.id === activeConversationId
                ? 'bg-primary/10 text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            )}
            onClick={() => { onSelect(conv.id); onClose(); }}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate">{conv.title}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {timeAgo(conv.last_message_at)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="opacity-0 group-hover:opacity-60 hover:opacity-100 p-1 rounded transition-opacity"
              aria-label="Delete conversation"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {conversations.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-8">
            No conversations yet
          </p>
        )}
      </div>

      {/* Message counter */}
      {messageLimit && messageLimit !== Infinity && (
        <div className="p-3 border-t">
          <div className="text-xs text-muted-foreground text-center">
            {messageCount}/{messageLimit} messages used
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden sm:block w-[280px] flex-shrink-0 h-full">
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
              className="sm:hidden fixed inset-0 bg-black/40 z-40"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="sm:hidden fixed left-0 top-0 bottom-0 w-[280px] z-50"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
