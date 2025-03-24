import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";

export const useCurrentBreadcrumbs = () => useState<Crumbs[]>("current-breadcrumbs", () => []);
