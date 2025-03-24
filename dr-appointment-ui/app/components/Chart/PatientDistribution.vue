<template>
  <UiCard>
    <UiCardContent>
      <UiCardTitle>Patient Distribution</UiCardTitle>
      <UiCardDescription class="mt-1">
        Distribution of patients across the world.
      </UiCardDescription>

      <div class="mt-5 h-[300px]">
        <ClientOnly>
          <template #fallback>
            <UiSkeleton class="size-full" />
          </template>
          <div id="patient-map" class="size-full"></div>
        </ClientOnly>
      </div>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
  import { _colors, _fontFamily } from "#tailwind-config/theme";

  declare const jsVectorMap: any;

  const markers = [
    {
      name: "United States",
      coords: [37.0902, -95.7129],
      count: 320,
      style: { initial: { fill: "#ef4444" } },
    },
    {
      name: "Canada",
      coords: [56.1304, -106.3468],
      count: 120,
      style: { initial: { fill: "#3b82f6" } },
    },
    {
      name: "Brazil",
      coords: [-14.235, -51.9253],
      count: 90,
      style: { initial: { fill: "#10b981" } },
    },
    {
      name: "United Kingdom",
      coords: [55.3781, -3.436],
      count: 150,
      style: { initial: { fill: "#6366f1" } },
    },
    {
      name: "Germany",
      coords: [51.1657, 10.4515],
      count: 180,
      style: { initial: { fill: "#f59e0b" } },
    },
    {
      name: "France",
      coords: [46.6034, 1.8883],
      count: 160,
      style: { initial: { fill: "#a855f7" } },
    },
    {
      name: "Italy",
      coords: [41.8719, 12.5674],
      count: 140,
      style: { initial: { fill: "#ec4899" } },
    },
    {
      name: "Russia",
      coords: [61.524, 105.3188],
      count: 100,
      style: { initial: { fill: "#f43f5e" } },
    },
    {
      name: "India",
      coords: [20.5937, 78.9629],
      count: 250,
      style: { initial: { fill: "#22c55e" } },
    },
    {
      name: "China",
      coords: [35.8617, 104.1954],
      count: 280,
      style: { initial: { fill: "#0ea5e9" } },
    },
    {
      name: "Japan",
      coords: [36.2048, 138.2529],
      count: 190,
      style: { initial: { fill: "#f87171" } },
    },
    {
      name: "Australia",
      coords: [-25.2744, 133.7751],
      count: 130,
      style: { initial: { fill: "#eab308" } },
    },
    {
      name: "South Africa",
      coords: [-30.5595, 22.9375],
      count: 110,
      style: { initial: { fill: "#14b8a6" } },
    },
    {
      name: "Egypt",
      coords: [26.8206, 30.8025],
      count: 90,
      style: { initial: { fill: "#f43f5e" } },
    },
    {
      name: "Mexico",
      coords: [23.6345, -102.5528],
      count: 150,
      style: { initial: { fill: "#a3e635" } },
    },
    {
      name: "Argentina",
      coords: [-38.4161, -63.6167],
      count: 80,
      style: { initial: { fill: "#fb923c" } },
    },
    {
      name: "Saudi Arabia",
      coords: [23.8859, 45.0792],
      count: 70,
      style: { initial: { fill: "#7c3aed" } },
    },
    {
      name: "Nigeria",
      coords: [9.082, 8.6753],
      count: 60,
      style: { initial: { fill: "#0d9488" } },
    },
    {
      name: "South Korea",
      coords: [35.9078, 127.7669],
      count: 95,
      style: { initial: { fill: "#f43f5e" } },
    },
    {
      name: "Indonesia",
      coords: [-0.7893, 113.9213],
      count: 85,
      style: { initial: { fill: "#06b6d4" } },
    },
  ];

  onMounted(async () => {
    await nextTick();

    const map = new jsVectorMap({
      selector: "#patient-map",
      map: "world_merc",
      zoomOnScrollSpeed: 1.1,
      markers,
      markerLabelStyle: {
        initial: {
          fontFamily: _fontFamily.sans.join(","),
          fontSize: 10,
          fontWeight: 500,
        },
      },
      regionStyle: {
        initial: {
          fill: _colors.muted.foreground,
          stroke: _colors.muted.DEFAULT,
          strokeWidth: 1,
          fillOpacity: 1,
        },
      },
      regionLabelStyle: {
        initial: {
          fill: "orange",
        },
      },
      onRegionTooltipShow(ev: any, tooltip: any) {
        tooltip.css({ backgroundColor: _colors.primary.DEFAULT });
      },
      onMarkerTooltipShow(ev: any, tooltip: any, index: string) {
        // get count for the marker
        const pos = Number(index);
        const count = markers[pos]?.count;
        const name = markers[pos]?.name;
        tooltip.css({ backgroundColor: _colors.primary.DEFAULT });
        // set the tooltip content
        tooltip.text(
          `<div class="text-xs font-semibold text-primary-foreground">${name}</div>
          <div class="text-xs text-primary-foreground/80">Patients: ${count}</div>`,
          true
        );
      },
    });

    useEventListener("resize", () => {
      map?.updateSize();
    });
  });
</script>
