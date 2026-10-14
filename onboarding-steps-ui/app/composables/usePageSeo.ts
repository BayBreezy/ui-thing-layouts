export const siteName = "Waypoint";
export const defaultSeoDescription =
  "Waypoint is a four-step onboarding flow: create an account, verify your email, invite your team and get started. An interactive demo by Behon Baker.";

/**
 * Sets the page title and description plus the matching Open Graph and Twitter tags, including the
 * social image. The page and the error page both go through this so neither ships without the
 * share card.
 */
export function usePageSeo(options: { title?: string; description?: string; canonical?: boolean }) {
  const route = useRoute();
  const { siteUrl } = useRuntimeConfig().public;
  const description = options.description || defaultSeoDescription;
  const socialTitle = options.title
    ? `${options.title} · ${siteName}`
    : `${siteName}: get started in four steps`;
  const url = `${siteUrl}${route.path.replace(/\/+$/, "") || "/"}`;
  const image = `${siteUrl}/social-preview.png`;
  useSeoMeta({
    title: options.title ?? "Get started in four steps",
    titleTemplate: `%s · ${siteName}`,
    description,
    author: "Behon Baker",
    ogSiteName: siteName,
    ogType: "website",
    ogTitle: socialTitle,
    ogDescription: description,
    ogUrl: url,
    ogImage: image,
    twitterCard: "summary_large_image",
    twitterTitle: socialTitle,
    twitterDescription: description,
    twitterImage: image,
  });
  if (options.canonical !== false) useHead({ link: [{ rel: "canonical", href: url }] });
}
