
import React from 'react';
import { Helmet } from 'react-helmet-async';

export const SEO = ({
  title,
  description,
  keywords = "vibe building, AI tools, no-code, automation, open source, indie maker, templates, prompts, micro tools",
  url = "https://flylabs.fun",
  image = "https://flylabs.fun/images/og-image.png",
  type = "website",
  schema = null
}) => {
  const siteTitle = title.toLowerCase().includes('fly labs') ? title : `${title} | Fly Labs`;

  const baseSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Fly Labs",
    "description": "Free tools, templates, and AI prompts for builders. Vibe building with AI, no-code, and automation.",
    "url": "https://flylabs.fun",
    "logo": "https://flylabs.fun/images/og-logo.png",
    "sameAs": [
      "https://www.youtube.com/@falacomigoyt",
      "https://substack.com/@falacomigo",
      "https://github.com/fly-labs/"
    ]
  };

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify(schema || baseSchema)}
      </script>
    </Helmet>
  );
};
