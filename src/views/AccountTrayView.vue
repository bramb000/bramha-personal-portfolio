<script setup lang="ts">
import ExperimentWrapper from '../components/ExperimentWrapper.vue'
import AccountTray from '../components/AccountTray.vue'
</script>

<template>
  <div class="max-w-4xl pt-12 mx-auto px-6 lg:px-0 mb-24">
    <ExperimentWrapper
      title="Analogue UI Inspired Usage Dashboard"
      description="A brutalist usage dashboard inspired by analogue UIs. Features a serialised X-axis chip cascade, CSS digit-rolling odometers, and a snap-shut mechanical close."
      :tags="['Web Design', 'Interaction Design', 'Tactile Motion']"
      storybook-id="portfolio-account-tray-tray--docs"
      container-class="bg-[#d8d8d8] relative no-scrollbar"
    >
      <!-- Texture overlay for physical feel (noise) within the simulator -->
      <div class="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');"></div>
      
      <!-- Flex container ensures it sits at the bottom, but min-height prevents it from clipping when expanded on small viewports -->
      <div class="relative z-10 w-full h-full min-h-[520px] flex flex-col justify-end items-center pb-8">
        <AccountTray />
      </div>
    </ExperimentWrapper>
  </div>
</template>
