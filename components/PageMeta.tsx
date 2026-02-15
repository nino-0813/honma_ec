import React from 'react';
import { Helmet } from 'react-helmet-async';

interface PageMetaProps {
  title?: string;
  description?: string;
  ogImage?: string;
  path?: string;
}

const SITE_NAME = 'イケベジ | 佐渡ヶ島のオーガニックファーム';
const DEFAULT_DESCRIPTION = '自然栽培の考えをベースに、品種が秘めた旨みと香りをまっすぐに届けるため、島の有機資源で土を磨き上げ、農薬に頼らず育てました。新潟県佐渡産の自然栽培米を販売するIKEVEGE（イケベジ）の公式サイト。';
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://ikevege.com';

/**
 * SEO用メタタグの雛形。各ページで title / description を渡して利用する。
 * 既存の index.html のデフォルトメタはそのまま。このコンポーネントで上書きする。
 */
const PageMeta: React.FC<PageMetaProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  ogImage = `${BASE_URL}/favicon.webp`,
  path = '',
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = path ? `${BASE_URL}${path}` : BASE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="ja_JP" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default PageMeta;
