
import React from 'react';
import { Send, ArrowRight, X, Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics.js';
import { categories, industries, frequencyOptions, formSteps } from '@/lib/data/ideas.js';

const IdeaSubmitModal = ({ show, onClose, formData, onFormChange, formStep, onStepChange, onSubmit, isSubmitting, toast }) => {
  if (!show) return null;

  const handleClose = () => {
    onClose();
    onStepChange(0);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
          role="dialog" aria-modal="true"
          className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden pointer-events-auto relative"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 via-secondary/20 to-background opacity-50 pointer-events-none" />

          <button
            onClick={handleClose}
            type="button"
            className="absolute top-4 right-4 p-3 rounded-full bg-background/50 hover:bg-muted text-muted-foreground transition-colors z-20"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-5 pt-10 sm:p-8 sm:pt-12 relative z-10">
            {/* AI Scoring Pitch */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/10 mb-4">
              <Zap className="w-4 h-4 text-accent shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your idea will be scored by AI using{' '}
                <span className="font-semibold text-foreground">Hormozi</span> and{' '}
                <span className="font-semibold text-foreground">Dan Koe</span> frameworks.
                Top ideas get built. Min. 1% equity if it flies.
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-0 mb-8">
              {formSteps.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      idx <= formStep
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className={`text-[10px] font-medium ${idx <= formStep ? 'text-primary' : 'text-muted-foreground/50'}`}>
                      {step.label}
                    </span>
                  </div>
                  {idx < formSteps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-1 mb-4 rounded ${idx < formStep ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <form onSubmit={onSubmit}>
              {/* Step 1: The Problem */}
              {formStep === 0 && (
                <div className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black tracking-tight mb-2">What's bugging you?</h2>
                    <p className="text-muted-foreground font-medium text-sm">
                      Rough is fine. I care about the problem, not the pitch.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="idea_title" className="text-sm font-medium text-muted-foreground">What's the problem? *</label>
                    <input
                      id="idea_title"
                      name="idea_title"
                      type="text"
                      required
                      maxLength={100}
                      placeholder="I wish there was a tool that..."
                      value={formData.idea_title}
                      onChange={onFormChange}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="idea_description" className="text-sm font-medium text-muted-foreground">
                      Tell me more <span className="text-muted-foreground/50">(optional)</span>
                    </label>
                    <textarea
                      id="idea_description"
                      name="idea_description"
                      rows={4}
                      maxLength={1000}
                      placeholder="What makes this annoying? Who else has it?"
                      value={formData.idea_description}
                      onChange={onFormChange}
                      className="w-full p-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors resize-y leading-relaxed"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.idea_title.trim()) {
                        toast({ title: 'Describe the problem first', variant: 'destructive' });
                        return;
                      }
                      onStepChange(1);
                      trackEvent('idea_form_step', { step: 1, step_name: 'context' });
                    }}
                    className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Step 2: Context */}
              {formStep === 1 && (
                <div className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black tracking-tight mb-2">A little context</h2>
                    <p className="text-muted-foreground font-medium text-sm">
                      All optional. Helps me understand what to build.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="category" className="text-sm font-medium text-muted-foreground">Type</label>
                      <div className="relative">
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={onFormChange}
                          className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors appearance-none cursor-pointer"
                        >
                          {categories.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="industry" className="text-sm font-medium text-muted-foreground">Industry</label>
                      <div className="relative">
                        <select
                          id="industry"
                          name="industry"
                          value={formData.industry}
                          onChange={onFormChange}
                          className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Select industry</option>
                          {industries.map((ind) => (
                            <option key={ind.value} value={ind.value}>{ind.label}</option>
                          ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">How often do you hit this?</label>
                    <div className="flex gap-2 flex-wrap">
                      {frequencyOptions.map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => onFormChange({ target: { name: 'frequency', value: formData.frequency === freq ? '' : freq } })}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            formData.frequency === freq
                              ? 'bg-primary/10 text-primary border border-primary/30'
                              : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
                          }`}
                        >
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="existing_solutions" className="text-sm font-medium text-muted-foreground">
                      Tried anything to solve it?
                    </label>
                    <input
                      id="existing_solutions"
                      name="existing_solutions"
                      type="text"
                      maxLength={200}
                      placeholder="Spreadsheets, existing tools, nothing..."
                      value={formData.existing_solutions}
                      onChange={onFormChange}
                      className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onStepChange(0)}
                      className="flex-1 h-11 rounded-lg border border-border text-foreground text-sm font-semibold hover:bg-muted/50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => { onStepChange(2); trackEvent('idea_form_step', { step: 2, step_name: 'about_you' }); }}
                      className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      Continue <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: About You */}
              {formStep === 2 && (
                <div className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black tracking-tight mb-2">Almost done</h2>
                    <p className="text-muted-foreground font-medium text-sm">
                      So I can follow up when I build it. If it flies, we partner up.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                        Name <span className="text-muted-foreground/50">(optional)</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        maxLength={100}
                        placeholder="What should I call you?"
                        value={formData.name}
                        onChange={onFormChange}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email *</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="So I can follow up"
                        value={formData.email}
                        onChange={onFormChange}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onStepChange(1)}
                      className="flex-1 h-11 rounded-lg border border-border text-foreground text-sm font-semibold hover:bg-muted/50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Send it <Send className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default IdeaSubmitModal;
