<script setup lang="ts">
import DefaultTheme from "vitepress/theme"
import { useData } from "vitepress"

const { frontmatter } = useData()
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-info-after>
      <p v-if="frontmatter.description" class="stack-home-description">
        {{ frontmatter.description }}
      </p>
    </template>
  </DefaultTheme.Layout>
</template>
