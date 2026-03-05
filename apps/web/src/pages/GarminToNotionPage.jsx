
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Github, ExternalLink, CheckCircle2, Activity, Database, Zap, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';

const GarminToNotionPage = () => {
  return (
    <PageLayout
      seo={{
        title: "Garmin to Notion Sync",
        description: "Automatically sync your Garmin health and fitness data to Notion. Free, open source automation.",
        keywords: "Garmin Notion sync, Garmin automation, fitness tracking, Notion integration, health data",
        url: "https://flylabs.fun/templates/garmin-to-notion",
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">

          <Link to="/templates" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold mb-8 transition-colors bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Templates
          </Link>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary font-bold text-sm border border-secondary/20">
                <Activity className="w-4 h-4" /> Health & Fitness
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Garmin to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Notion</span> Sync
              </h1>
              <p className="text-xl text-muted-foreground font-bold leading-relaxed">
                Stop manually logging your workouts. Automatically sync your Garmin health data, activities, and sleep metrics directly into your Notion workspace.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <a href="https://github.com/fly-labs/garmin-to-notion" target="_blank" rel="noreferrer" className="btn-playful btn-playful-primary text-base h-12 px-6 md:text-lg md:h-14 md:px-8 inline-flex items-center gap-2">
                  <Github className="w-5 h-5" /> View on GitHub
                </a>
                <a href="https://substack.com/home/post/p-189585499" target="_blank" rel="noreferrer" className="btn-playful btn-playful-outline text-base h-12 px-6 md:text-lg md:h-14 md:px-8 inline-flex items-center gap-2 bg-card">
                  Read the Story <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Redesigned Visual Section */}
            <div className="relative h-full min-h-[280px] md:min-h-[350px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl transform rotate-3 scale-105 -z-10"></div>
              <div className="card-playful p-8 bg-card border-4 border-border rounded-3xl shadow-2xl h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>

                <div className="flex items-center justify-center gap-4 mb-8 relative z-10">
                  <div className="w-20 h-20 bg-background rounded-2xl flex items-center justify-center shadow-lg border-2 border-border">
                    <Activity className="w-10 h-10 text-primary" />
                  </div>

                  <div className="flex flex-col items-center px-2">
                    <div className="flex gap-1 mb-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>

                  <div className="w-20 h-20 bg-background rounded-2xl flex items-center justify-center shadow-lg border-2 border-border">
                    <Database className="w-10 h-10 text-secondary" />
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-3">Automated Data Flow</h3>
                  <p className="text-muted-foreground font-medium max-w-xs mx-auto">
                    Your health metrics sync automatically in the background every single day. No manual entry needed.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <div className="mb-20">
            <h2 className="text-3xl font-black mb-8 text-center">Why you'll love it</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Zap, title: "Fully Automated", desc: "Set it up once and forget it. Your data syncs in the background every day." },
                { icon: Database, title: "All Your Data", desc: "Tracks steps, sleep, heart rate, stress, body battery, and specific activities." },
                { icon: CheckCircle2, title: "Customizable", desc: "Built on Notion, so you can build custom dashboards and relations with your data." }
              ].map((feature, i) => (
                <div key={i} className="card-playful p-6 md:p-8 bg-card/50 backdrop-blur-sm">
                  <feature.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-black mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground font-medium">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="card-playful p-5 sm:p-8 md:p-12 bg-card border-2 border-border mb-20">
            <h2 className="text-3xl font-black mb-8">How to set it up</h2>
            <div className="space-y-8">
              {[
                { step: "1", title: "Duplicate the Notion Template", desc: "Grab the free template from the link below and duplicate it to your workspace." },
                { step: "2", title: "Create a Notion Integration", desc: "Go to Notion settings, create a new integration, and get your Internal Integration Secret." },
                { step: "3", title: "Connect the Database", desc: "Share your duplicated database with the integration you just created." },
                { step: "4", title: "Run the Script", desc: "Clone the GitHub repo, add your Garmin credentials and Notion token to the .env file, and run the script." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 md:gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-xl border-4 border-primary/30">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-black mb-2">{item.title}</h3>
                    <p className="text-muted-foreground font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8 border-t border-border text-center">
              <p className="text-muted-foreground font-bold mb-4">Detailed instructions available in the GitHub repository.</p>
              <a href="https://github.com/fly-labs/garmin-to-notion" target="_blank" rel="noreferrer" className="btn-playful btn-playful-outline px-6 py-3 inline-flex items-center">
                View Documentation
              </a>
            </div>
          </div>

        </div>
      </div>
    </PageLayout>
  );
};

export default GarminToNotionPage;
