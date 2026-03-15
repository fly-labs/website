import React, { useState } from 'react';
import { ChevronDown, Cpu, Target, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils.js';

function Section({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/30 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-foreground/80 hover:text-foreground transition-colors"
      >
        <Icon className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
        <span className="flex-1">{title}</span>
        <ChevronDown className={cn(
          'w-3 h-3 text-muted-foreground/40 transition-transform duration-200',
          open && 'rotate-180'
        )} />
      </button>
      {open && (
        <div className="px-3 pb-3 text-[11px] text-muted-foreground/70 leading-relaxed space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

export function FlyBotDisclosure({ compact = false }) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          'text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors',
          compact ? 'text-[10px] mt-3' : 'text-[11px] mt-4'
        )}
      >
        About FlyBot, limitations, and your data
      </button>
    );
  }

  return (
    <div className={cn(
      'rounded-xl border border-border/50 bg-card/30 overflow-hidden text-left',
      compact ? 'mt-3' : 'mt-4 max-w-sm mx-auto'
    )}>
      {/* Header with collapse */}
      <button
        onClick={() => setExpanded(false)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium hover:text-muted-foreground/70 transition-colors"
      >
        <span>About FlyBot</span>
        <ChevronDown className="w-3 h-3 rotate-180" />
      </button>

      <Section icon={Cpu} title="What this is" defaultOpen>
        <p>
          FlyBot is an AI-powered vibe building partner, built on Claude (Anthropic).
          It helps solo builders think through ideas, content,
          and business decisions.
        </p>
        <p>
          It's in beta. Responses can be inaccurate or incomplete. Always verify
          important information on your own.
        </p>
      </Section>

      <Section icon={Target} title="What it does and doesn't do">
        <p>
          Scores business ideas using multiple AI-powered frameworks. Helps with
          content strategy, writing, and titles. Applies behavioral finance
          concepts to building decisions.
        </p>
        <p>
          It cannot help with: personal coaching, therapy, investment recommendations,
          medical or legal advice, general knowledge, or code debugging. Scores
          and verdicts are AI opinions, not guarantees.
        </p>
      </Section>

      <Section icon={ShieldCheck} title="Your data">
        <p>
          Conversations are stored securely and are only visible to you. They're
          not shared with third parties or used to train AI models.
        </p>
        <p>
          5 free messages per account during beta. The full codebase is open
          source at github.com/fly-labs/website.
        </p>
      </Section>
    </div>
  );
}
