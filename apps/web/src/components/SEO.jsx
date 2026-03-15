
import React from 'react';
import { Helmet } from 'react-helmet-async';

export const SEO = ({
  title,
  description,
  keywords = "vibe building, digital assets, AI tools, one person, open source, indie maker, business templates, build in public",
  url = "https://flylabs.fun",
  image = "https://flylabs.fun/images/og-image.png",
  type = "website",
  schema = null,
  noindex = false
}) => {
  const siteTitle = title.toLowerCase().includes('fly labs') ? title : `${title} | Fly Labs`;

  const baseSchema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Fly Labs",
      "description": "Tools, templates, and ideas for business and learning. Built by one person with AI. Open source.",
      "url": "https://flylabs.fun",
      "logo": "https://flylabs.fun/images/og-logo.png",
      "sameAs": [
        "https://www.youtube.com/@falacomigoyt",
        "https://falacomigo.substack.com",
        "https://github.com/fly-labs/"
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Fly Labs",
      "url": "https://flylabs.fun",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://flylabs.fun/ideas?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ];

  const allSchemas = [
    ...baseSchema,
    ...(schema ? (Array.isArray(schema) ? schema : [schema]) : [])
  ];

  return (
    <Helmet>
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Fly Labs" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@alvesluizc" />
      <meta name="twitter:creator" content="@alvesluizc" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify(allSchemas)}
      </script>
    </Helmet>
  );
};
