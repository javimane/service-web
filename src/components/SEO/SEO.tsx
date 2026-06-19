"use client";
// In Next.js App Router, page-level SEO is handled via generateMetadata in route pages.
// This component is kept for inline/dynamic use within client components.

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: any;
}

const SEO = ({
  title = "Sercio - Red de Servicios y Comercio",
  description = "Encontrá a los mejores profesionales y productos en un solo lugar.",
  schema,
}: SEOProps) => {
  // In Next.js, meta tags are managed via layout.tsx and generateMetadata.
  // For JSON-LD structured data we inject it via script tag.
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default SEO;
