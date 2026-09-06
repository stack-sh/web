<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"

type Locale = "en" | "ja" | "zh" | "ko"
type PreviewTheme = "default" | "light" | "dark"
type EngineModule = typeof import("@stack-sh/engine")

const props = defineProps<{ locale: Locale }>()

const kinds = [
  "actor",
  "client",
  "service",
  "function",
  "worker",
  "database",
  "cache",
  "queue",
  "storage",
  "external",
] as const

type NodeKind = (typeof kinds)[number]

const labels = {
  en: {
    copied: "Copied",
    copy: "Copy",
    copyLabel: "Copy Stack node kind syntax",
    error: "The node kind previews could not be rendered.",
    loading: "Rendering node kinds locally…",
    previewAlt: "Stack node kind preview",
    previewTheme: "Preview theme",
    themes: { default: "Default", light: "Light", dark: "Dark" },
  },
  ja: {
    copied: "コピー済み",
    copy: "コピー",
    copyLabel: "Stack node kind syntaxをコピー",
    error: "Node kind previewをrenderできませんでした。",
    loading: "Node kindをlocalでrenderしています…",
    previewAlt: "Stack node kind preview",
    previewTheme: "Preview theme",
    themes: { default: "Default", light: "Light", dark: "Dark" },
  },
  zh: {
    copied: "已复制",
    copy: "复制",
    copyLabel: "复制 Stack 节点种类语法",
    error: "无法渲染节点种类预览。",
    loading: "正在本地渲染节点种类…",
    previewAlt: "Stack 节点种类预览",
    previewTheme: "预览主题",
    themes: { default: "默认", light: "浅色", dark: "深色" },
  },
  ko: {
    copied: "복사됨",
    copy: "복사",
    copyLabel: "Stack 노드 종류 문법 복사",
    error: "노드 종류 미리보기를 렌더링하지 못했습니다.",
    loading: "노드 종류를 로컬에서 렌더링하는 중…",
    previewAlt: "Stack 노드 종류 미리보기",
    previewTheme: "미리보기 테마",
    themes: { default: "기본", light: "라이트", dark: "다크" },
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

function sourceFor(kind: NodeKind, theme: PreviewTheme) {
  return `stack 1.0

diagram "${kind}" {
  theme ${theme}

  node preview "${kind}" {
    kind ${kind}
  }
}`
}

const text = computed(() => labels[props.locale])
const previewTheme = ref<PreviewTheme>("default")
const renderedKinds = ref<Partial<Record<NodeKind, string>>>({})
const copiedKind = ref<NodeKind>()
const metadata = ref("")
const loading = ref(true)
const renderingError = ref(false)

let engine: EngineModule | undefined
let copyTimer: number | undefined
let objectUrls: string[] = []
let disposed = false

function releaseObjectUrls() {
  for (const url of objectUrls) URL.revokeObjectURL(url)
  objectUrls = []
}

function renderKinds() {
  if (!engine || disposed) return

  releaseObjectUrls()
  const nextKinds: Partial<Record<NodeKind, string>> = {}

  try {
    for (const kind of kinds) {
      const result = engine.render(sourceFor(kind, previewTheme.value))

      if (!result.svg || result.diagnostics.length > 0) {
        throw new Error(`Engine did not render the ${kind} node kind without diagnostics`)
      }

      const url = URL.createObjectURL(new Blob([result.svg], { type: "image/svg+xml" }))
      objectUrls.push(url)
      nextKinds[kind] = url
      metadata.value = `Engine ${result.metadata.engineVersion} / Theme Catalog ${result.metadata.themeCatalogVersion}`
    }

    renderedKinds.value = nextKinds
    renderingError.value = false
  } catch {
    releaseObjectUrls()
    renderedKinds.value = {}
    renderingError.value = true
  }
}

async function copySyntax(kind: NodeKind) {
  if (!navigator.clipboard) return

  try {
    await navigator.clipboard.writeText(`kind ${kind}`)
  } catch {
    return
  }

  if (disposed) return

  copiedKind.value = kind
  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copiedKind.value = undefined
  }, 1600)
}

onMounted(async () => {
  try {
    const loadedEngine = await loadEngine()
    if (disposed) return
    engine = loadedEngine
    renderKinds()
  } catch {
    if (!disposed) renderingError.value = true
  } finally {
    if (!disposed) loading.value = false
  }
})

watch(previewTheme, renderKinds)

onBeforeUnmount(() => {
  disposed = true
  window.clearTimeout(copyTimer)
  releaseObjectUrls()
})
</script>

<template>
  <section class="stack-icon-catalog-section">
    <div class="stack-icon-catalog-toolbar">
      <div class="stack-icon-theme-control" role="group" :aria-label="text.previewTheme">
        <button
          v-for="theme in ['default', 'light', 'dark'] as const"
          :key="theme"
          type="button"
          :aria-pressed="previewTheme === theme"
          @click="previewTheme = theme"
        >
          {{ text.themes[theme] }}
        </button>
      </div>
      <span v-if="metadata" class="stack-icon-catalog-metadata">{{ metadata }}</span>
    </div>

    <p v-if="loading" class="stack-icon-catalog-status" role="status">{{ text.loading }}</p>
    <p v-else-if="renderingError" class="stack-icon-catalog-status" role="alert">
      {{ text.error }}
    </p>

    <div class="stack-icon-catalog" :aria-busy="loading">
      <article
        v-for="kind in kinds"
        :key="kind"
        class="stack-icon-card stack-kind-card"
        :data-node-kind="kind"
      >
        <div class="stack-icon-card__preview">
          <img
            v-if="renderedKinds[kind]"
            :src="renderedKinds[kind]"
            :alt="`${text.previewAlt}: ${kind}, ${text.themes[previewTheme]}`"
          />
          <span v-else class="stack-icon-card__placeholder" aria-hidden="true" />
        </div>
        <button
          type="button"
          class="stack-icon-card__copy"
          :aria-label="`${text.copyLabel}: kind ${kind}`"
          @click="copySyntax(kind)"
        >
          <code>kind {{ kind }}</code>
          <span aria-live="polite">{{ copiedKind === kind ? text.copied : text.copy }}</span>
        </button>
      </article>
    </div>
  </section>
</template>
