<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

type Locale = "en" | "ja" | "zh" | "ko"
type PreviewTheme = "light" | "dark"
type EngineModule = typeof import("@stack-sh/engine")

const props = defineProps<{ locale: Locale }>()

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
  { id: "gateway", subject: "Network gateway" },
  { id: "load-balancer", subject: "Load balancer" },
  { id: "dns", subject: "Domain name service" },
  { id: "cdn", subject: "Content delivery network" },
  { id: "firewall", subject: "Network firewall" },
  { id: "network", subject: "Network topology" },
  { id: "event", subject: "Discrete event" },
  { id: "stream", subject: "Event stream" },
  { id: "search", subject: "Search service" },
  { id: "analytics", subject: "Analytics system" },
  { id: "repository", subject: "Source code repository" },
  { id: "pipeline", subject: "Delivery pipeline" },
  { id: "secret", subject: "Secret or credential" },
  { id: "document", subject: "Document or knowledge base" },
  { id: "task", subject: "Task or issue tracker" },
  { id: "chat", subject: "Chat or messaging tool" },
  { id: "email", subject: "Email delivery" },
  { id: "ai", subject: "Artificial intelligence system" },
] as const

const labels = {
  en: {
    copied: "Copied",
    copy: "Copy",
    copyLabel: "Copy Stack icon syntax",
    dark: "Dark",
    error: "The icon previews could not be rendered.",
    light: "Light",
    loading: "Rendering icon previews locally…",
    previewAlt: "Stack icon preview theme:",
    previewTheme: "Preview theme",
  },
  ja: {
    copied: "コピー済み",
    copy: "コピー",
    copyLabel: "Stack icon syntaxをコピー",
    dark: "ダーク",
    error: "Icon previewをrenderできませんでした。",
    light: "ライト",
    loading: "Icon previewをlocalでrenderしています…",
    previewAlt: "Stack icon preview / theme:",
    previewTheme: "Preview theme",
  },
  zh: {
    copied: "已复制",
    copy: "复制",
    copyLabel: "复制 Stack 图标语法",
    dark: "深色",
    error: "无法渲染图标预览。",
    light: "浅色",
    loading: "正在本地渲染图标预览…",
    previewAlt: "Stack 图标预览，主题：",
    previewTheme: "预览主题",
  },
  ko: {
    copied: "복사됨",
    copy: "복사",
    copyLabel: "Stack 아이콘 문법 복사",
    dark: "다크",
    error: "아이콘 미리보기를 렌더링하지 못했습니다.",
    light: "라이트",
    loading: "아이콘 미리보기를 로컬에서 렌더링하는 중…",
    previewAlt: "Stack 아이콘 미리보기, 테마:",
    previewTheme: "미리보기 테마",
  },
} as const

let enginePromise: Promise<EngineModule> | undefined

function loadEngine(): Promise<EngineModule> {
  enginePromise ??= import("@stack-sh/engine").then(async (engine) => {
    await engine.default()
    return engine
  })
  return enginePromise
}

const text = computed(() => labels[props.locale])
const previewTheme = ref<PreviewTheme>("light")
const renderedIcons = ref<Record<string, string>>({})
const copiedIcon = ref<string>()
const metadata = ref("")
const loading = ref(true)
const renderingError = ref(false)

let engine: EngineModule | undefined
let copyTimer: number | undefined
let objectUrls: string[] = []

function releaseObjectUrls() {
  for (const url of objectUrls) URL.revokeObjectURL(url)
  objectUrls = []
}

function renderIcons() {
  if (!engine) return

  releaseObjectUrls()
  const nextIcons: Record<string, string> = {}

  try {
    for (const icon of icons) {
      const result = engine.render(`stack 1.0

diagram "${icon.id}" {
  theme ${previewTheme.value}

  node preview "${icon.id}" {
    kind service
    icon "${icon.id}"
  }
}`)

      if (!result.svg || result.diagnostics.length > 0) {
        throw new Error(`Engine did not render the ${icon.id} icon without diagnostics`)
      }

      const url = URL.createObjectURL(new Blob([result.svg], { type: "image/svg+xml" }))
      objectUrls.push(url)
      nextIcons[icon.id] = url
      metadata.value = `Engine ${result.metadata.engineVersion} / Theme Catalog ${result.metadata.themeCatalogVersion}`
    }

    renderedIcons.value = nextIcons
    renderingError.value = false
  } catch {
    releaseObjectUrls()
    renderedIcons.value = {}
    renderingError.value = true
  }
}

async function copySyntax(iconId: string) {
  if (!navigator.clipboard) return

  try {
    await navigator.clipboard.writeText(`icon "${iconId}"`)
  } catch {
    return
  }

  copiedIcon.value = iconId
  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copiedIcon.value = undefined
  }, 1600)
}

onMounted(async () => {
  try {
    engine = await loadEngine()
    renderIcons()
  } catch {
    renderingError.value = true
  } finally {
    loading.value = false
  }
})

watch(previewTheme, renderIcons)

onBeforeUnmount(() => {
  window.clearTimeout(copyTimer)
  releaseObjectUrls()
})
</script>

<template>
  <section class="stack-icon-catalog-section">
    <div class="stack-icon-catalog-toolbar">
      <div class="stack-icon-theme-control" role="group" :aria-label="text.previewTheme">
        <button
          v-for="theme in ['light', 'dark'] as const"
          :key="theme"
          type="button"
          :aria-pressed="previewTheme === theme"
          @click="previewTheme = theme"
        >
          {{ text[theme] }}
        </button>
      </div>
      <span v-if="metadata" class="stack-icon-catalog-metadata">{{ metadata }}</span>
    </div>

    <p v-if="loading" class="stack-icon-catalog-status" role="status">{{ text.loading }}</p>
    <p v-else-if="renderingError" class="stack-icon-catalog-status" role="alert">
      {{ text.error }}
    </p>

    <div class="stack-icon-catalog" :aria-busy="loading">
      <article v-for="icon in icons" :key="icon.id" class="stack-icon-card" :data-icon-id="icon.id">
        <div class="stack-icon-card__preview">
          <img
            v-if="renderedIcons[icon.id]"
            :src="renderedIcons[icon.id]"
            :alt="`${icon.subject}: ${text.previewAlt} ${text[previewTheme]}`"
          />
          <span v-else class="stack-icon-card__placeholder" aria-hidden="true" />
        </div>
        <div class="stack-icon-card__identity">
          <code>{{ icon.id }}</code>
          <span>{{ icon.subject }}</span>
        </div>
        <button
          type="button"
          class="stack-icon-card__copy"
          :aria-label="`${text.copyLabel}: icon &quot;${icon.id}&quot;`"
          @click="copySyntax(icon.id)"
        >
          <code>icon "{{ icon.id }}"</code>
          <span>{{ copiedIcon === icon.id ? text.copied : text.copy }}</span>
        </button>
      </article>
    </div>
  </section>
</template>
