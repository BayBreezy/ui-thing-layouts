import type { MaybeRefOrGetter } from "vue";

export const siteName = "Orbit";
export const defaultSeoDescription =
  "An interactive AI workspace by Behon Baker. Explore chat, assistants, audio, and real-time sessions, built with Nuxt and UI Thing.";

/**
 * Sets the page title and description plus the matching Open Graph and Twitter tags.
 *
 * `title` is the bare page title; the ` · Orbit` suffix comes from the title template for
 * `<title>` and is added here for social titles. Both values may be refs or getters.
 */
export function usePageSeo(options: {
  title: MaybeRefOrGetter<string | undefined>;
  description?: MaybeRefOrGetter<string | undefined>;
}) {
  const route = useRoute();
  const { siteUrl } = useRuntimeConfig().public;
  const title = computed(() => toValue(options.title));
  const description = computed(() => toValue(options.description) || defaultSeoDescription);
  const socialTitle = computed(() =>
    title.value ? `${title.value} · ${siteName}` : `${siteName}: a little space for big ideas`
  );
  useSeoMeta({
    title,
    description,
    ogTitle: socialTitle,
    ogDescription: description,
    // Normalised so `/audio/` (served from the static `public/audio` directory) matches `/audio`.
    ogUrl: () => `${siteUrl}${route.path.replace(/\/+$/, "") || "/"}`,
    twitterTitle: socialTitle,
    twitterDescription: description,
    twitterImage: `${siteUrl}/social-preview.png`,
  });
}
