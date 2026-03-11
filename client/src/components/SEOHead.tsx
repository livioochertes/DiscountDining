import { Helmet } from "react-helmet-async";

const DOMAIN = "https://eatoff.app";

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

export default function SEOHead({
  title,
  description = "EatOff - Marketplace de vouchere pentru restaurante. Economisești la mese delicioase în restaurantele tale preferate.",
  canonical,
  ogImage = `${DOMAIN}/favicon.png`,
  ogType = "website",
}: SEOHeadProps) {
  const fullTitle = title.includes("EatOff") ? title : `${title} | EatOff`;
  const canonicalUrl = canonical ? `${DOMAIN}${canonical}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
