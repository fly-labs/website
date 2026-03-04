import React from 'react';
import { SEO } from '@/components/SEO.jsx';
import { GeometricBackground } from '@/components/GeometricBackground.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { cn } from '@/lib/utils.js';

export const PageLayout = ({ children, seo, className, wrapperClassName }) => (
  <>
    <SEO {...seo} />
    <div className={cn("min-h-screen flex flex-col relative", wrapperClassName)}>
      <GeometricBackground />
      <Header />
      <main className={cn("flex-grow relative z-10", className)}>
        {children}
      </main>
      <Footer />
    </div>
  </>
);
