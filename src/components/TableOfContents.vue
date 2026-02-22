<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface TocItem {
  id: string;
  text: string;
}

const items = ref<TocItem[]>([]);
const activeId = ref<string>('');
let observer: IntersectionObserver | null = null;

onMounted(() => {
  // Find all H2s in the document (specifically inside the main case study container to avoid header/footer)
  // Our case studies use animate-fade-in as the main wrapper, but generic h2 is usually fine
  // Let's scope it to h2s that are inside <section> elements or have actual content
  const headings = Array.from(document.querySelectorAll('section h2, .animate-fade-in h2'));
  
  headings.forEach((heading, index) => {
    // Generate an ID if it doesn't have one
    if (!heading.id) {
      const parentSection = heading.closest('section');
      const generatedId = heading.textContent
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `section-${index}`;
      
      // Prefer putting the ID on the parent section for better scrolling/margins
      if (parentSection && !parentSection.id) {
        parentSection.id = generatedId;
      } else {
        heading.id = generatedId;
      }
    }

    const targetId = heading.closest('section')?.id || heading.id;

    if (targetId && heading.textContent) {
      // Avoid duplicates
      if (!items.value.find(item => item.id === targetId)) {
        items.value.push({
          id: targetId,
          text: heading.textContent.trim(),
        });
      }
    }
  });

  // Setup Intersection Observer for scroll spy
  // We want to detect which section is currently active in the viewport
  observer = new IntersectionObserver(
    (entries) => {
      // Find the most visible intersecting entry
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        // Sort by how much of the element is visible
        visibleEntries.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        activeId.value = visibleEntries[0].target.id;
      }
    },
    {
      rootMargin: '-10% 0px -60% 0px', // Trigger when section is in the top 40% of the screen
      threshold: [0, 0.25, 0.5, 0.75, 1.0],
    }
  );

  // Observe all sections that have IDs we collected
  items.value.forEach((item) => {
    const el = document.getElementById(item.id);
    if (el) observer?.observe(el);
  });
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) {
    // Offset for fixed header if there is one
    const y = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: 'smooth' });
    // Manually set active since smooth scroll takes a moment
    activeId.value = id;
  }
}
</script>

<template>
  <nav class="w-full p-5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 shadow-sm transition-all duration-300">
    <h4 class="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3 px-2">
      Contents
    </h4>
    <ul class="space-y-0.5">
      <li v-for="item in items" :key="item.id">
        <button
          @click="scrollTo(item.id)"
          class="w-full text-left px-2 py-1 rounded-lg text-sm transition-all duration-200"
          :class="[
            activeId === item.id
              ? 'bg-[var(--color-accent-soft)]/10 text-[var(--color-accent-soft)] font-bold translate-x-1'
              : 'text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800/50'
          ]"
        >
          {{ item.text }}
        </button>
      </li>
    </ul>
  </nav>
</template>
