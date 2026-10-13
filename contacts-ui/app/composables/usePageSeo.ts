import type { MaybeRefOrGetter } from "vue";

export const siteName = "Verdant";
export const defaultSeoDescription =
  "Keep every contact, conversation and follow-up in one calm, green workspace. An interactive open-source contact manager by Behon Baker.";

/**
 * Sets the page title and description plus the matching Open Graph and Twitter tags, including the
 * social image. Every page, and the error page, goes through this so none of them ships without
 * the share card.
 *
 * `title` is the bare page title; the ` · Verdant` suffix comes from the title template for
 * `<title>` and is added here for social titles. Both values may be refs or getters, so detail
 * pages can use the record they show.
 */
export function usePageSeo(options: {
  title: MaybeRefOrGetter<string | undefined>;
  description?: MaybeRefOrGetter<string | undefined>;
  /** Set to `false` for pages that should not claim a canonical URL, like the error page. */
  canonical?: boolean;
}) {
  const route = useRoute();
  const { siteUrl } = useRuntimeConfig().public;
  const title = computed(() => toValue(options.title));
  const description = computed(() => toValue(options.description) || defaultSeoDescription);
  const socialTitle = computed(() =>
    title.value ? `${title.value} · ${siteName}` : `${siteName}: a calmer way to keep in touch`
  );
  const url = computed(() => `${siteUrl}${route.path.replace(/\/+$/, "") || "/"}`);
  const image = `${siteUrl}/social-preview.png`;
  useSeoMeta({
    title,
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
  if (options.canonical !== false) useHead({ link: [{ rel: "canonical", href: () => url.value }] });
}
