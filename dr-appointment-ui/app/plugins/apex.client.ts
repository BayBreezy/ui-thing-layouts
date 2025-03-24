import { _background, _blue, _border, _foreground, _muted } from "#tailwind-config/theme/colors";
import { _sans } from "#tailwind-config/theme/fontFamily";
import type { ApexOptions } from "apexcharts";

declare global {
  interface Window {
    Apex: ApexOptions;
  }
}

export default defineNuxtPlugin(() => {
  window.Apex = {
    chart: {
      background: _background,
      foreColor: _foreground,
      fontFamily: _sans.join(","),
      toolbar: { show: false },
    },
    grid: { borderColor: _border },
    legend: { show: true },
    markers: { strokeColors: _background },
    stroke: { width: 2, curve: "smooth", lineCap: "round" },
    xaxis: {
      axisBorder: { color: _border },
      axisTicks: { color: _border },
      labels: {
        style: { colors: _muted["foreground"] },
      },
    },
    yaxis: {
      axisBorder: { color: _border },
      axisTicks: { color: _border },
      labels: {
        style: { colors: _muted["foreground"] },
      },
    },
  };
});
