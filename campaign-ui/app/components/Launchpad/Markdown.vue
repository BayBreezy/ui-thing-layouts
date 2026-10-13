<script setup lang="ts">
  const props = defineProps<{ content: string }>();
  // Intentionally supports a small Markdown subset through Vue text nodes.
  // User content never becomes HTML, MDC components, or executable links.
  const blocks = computed(() => {
    const result: { type: string; text: string; lines?: string[] }[] = [];
    let code = false;
    for (const line of props.content.split("\n")) {
      if (line.startsWith("~~~") || line.startsWith(String.fromCharCode(96).repeat(3))) {
        code = !code;
        if (code) result.push({ type: "code", text: "" });
        continue;
      }
      if (code) {
        result[result.length - 1]!.text += line + "\n";
        continue;
      }
      if (line.startsWith("- ")) {
        if (result.at(-1)?.type !== "list") result.push({ type: "list", text: "", lines: [] });
        result.at(-1)!.lines!.push(line.slice(2));
      } else if (line.startsWith("### ")) result.push({ type: "h3", text: line.slice(4) });
      else if (line.startsWith("## ")) result.push({ type: "h2", text: line.slice(3) });
      else if (line.startsWith("# ")) result.push({ type: "h1", text: line.slice(2) });
      else if (line.trim()) result.push({ type: "p", text: line });
    }
    return result;
  });
</script>
<template>
  <div class="launchpad-prose">
    <template v-for="(block, i) in blocks" :key="i"
      ><ul v-if="block.type === 'list'">
        <li v-for="(line, j) in block.lines" :key="j">{{ line }}</li>
      </ul>
      <pre v-else-if="block.type === 'code'"><code>{{ block.text }}</code></pre>
      <component :is="block.type" v-else>{{ block.text }}</component></template
    >
  </div>
</template>
