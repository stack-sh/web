<script setup lang="ts">
type Locale = "en" | "ja" | "zh" | "ko"

defineProps<{ locale: Locale }>()

const icons = [
  { id: "api", subject: "Application programming interface" },
  { id: "web", subject: "Web application" },
  { id: "mobile", subject: "Mobile application" },
  { id: "desktop", subject: "Desktop application" },
  { id: "server", subject: "Server host" },
  { id: "container", subject: "Application container" },
  { id: "cluster", subject: "Compute cluster" },
  { id: "cloud", subject: "Cloud environment" },
  { id: "scheduler", subject: "Scheduled execution" },
  { id: "webhook", subject: "Webhook endpoint" },
  { id: "identity", subject: "Identity and access" },
  { id: "observability", subject: "Observability system" },
] as const
</script>

<template>
  <div class="stack-icon-catalog">
    <article v-for="icon in icons" :key="icon.id" class="stack-icon-card" :data-icon-id="icon.id">
      <div class="stack-icon-card__identity">
        <code>{{ icon.id }}</code>
        <span>{{ icon.subject }}</span>
      </div>
      <code class="stack-icon-card__syntax">icon "{{ icon.id }}"</code>
    </article>
  </div>
</template>
