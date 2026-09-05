<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from "vue"
import { createExamplePreview, type ExamplePreviewState } from "../../../../src/lib/example-preview"
import { renderExample } from "../../../../src/lib/render-example"

const props = defineProps<{
  source: string
  sourceUrl: string
  alt: string
  locale: "en" | "ja" | "zh" | "ko"
}>()
const labels = {
  en: {
    loading: "Rendering this example on your device…",
    unavailable: "The preview could not be loaded.",
    errors: "This example reported rendering errors.",
    diagnostics: "Rendering diagnostics (provider icons may use fallback shapes)",
    retry: "Retry preview",
    source: "View .stack source",
    noScript: "Enable JavaScript to render this example, or read its .stack source.",
  },
  ja: {
    loading: "この端末で作例を描画しています…",
    unavailable: "プレビューを読み込めませんでした。",
    errors: "作例の描画でエラーが報告されました。",
    diagnostics: "描画の診断（Provider iconは代替図形になる場合があります）",
    retry: "プレビューを再試行",
    source: ".stackソースを見る",
    noScript: "JavaScriptを有効にして作例を描画するか、.stackソースをご覧ください。",
  },
  zh: {
    loading: "正在您的设备上渲染此示例…",
    unavailable: "无法加载预览。",
    errors: "此示例报告了渲染错误。",
    diagnostics: "渲染诊断（服务商图标可能显示为替代图形）",
    retry: "重试预览",
    source: "查看 .stack 源码",
    noScript: "请启用 JavaScript 渲染此示例，或阅读其 .stack 源码。",
  },
  ko: {
    loading: "이 기기에서 예제를 렌더링하고 있습니다…",
    unavailable: "미리보기를 불러올 수 없습니다.",
    errors: "이 예제에서 렌더링 오류가 보고되었습니다.",
    diagnostics: "렌더링 진단 (제공자 아이콘이 대체 도형으로 표시될 수 있음)",
    retry: "미리보기 다시 시도",
    source: ".stack 소스 보기",
    noScript: "JavaScript를 활성화하여 예제를 렌더링하거나 .stack 소스를 읽어 보세요.",
  },
} as const
const text = computed(() => labels[props.locale])
const element = ref<HTMLElement>()
const state = shallowRef<ExamplePreviewState>({ status: "idle" })
const preview = createExamplePreview(renderExample, (next) => (state.value = next))
const diagnostics = computed(() => ("result" in state.value ? state.value.result.diagnostics : []))
let observer: IntersectionObserver | undefined
let activated = false

function load() {
  activated = true
  observer?.disconnect()
  void preview.load(props.source)
}

onMounted(() => {
  if (!("IntersectionObserver" in window)) {
    load()
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) load()
    },
    { rootMargin: "200px" },
  )
  if (element.value) observer.observe(element.value)
})
watch(
  () => props.source,
  () => {
    if (activated) load()
  },
)
onUnmounted(() => {
  observer?.disconnect()
  preview.dispose()
})
</script>

<template>
  <div ref="element" class="stack-example-preview" :data-preview-status="state.status">
    <div class="stack-example-preview__image" :aria-busy="state.status === 'loading'">
      <a v-if="state.status === 'ready'" :href="sourceUrl">
        <img :src="state.url" :alt="alt" @error="state = { status: 'unavailable' }" />
      </a>
      <div v-else class="stack-example-preview__fallback">
        <p v-if="state.status === 'loading'" role="status">{{ text.loading }}</p>
        <p v-else-if="state.status === 'unavailable'" role="status">{{ text.unavailable }}</p>
        <p v-else-if="state.status === 'diagnostics'" role="status">{{ text.errors }}</p>
        <a :href="sourceUrl">{{ text.source }}</a>
        <button
          v-if="state.status === 'unavailable' || state.status === 'diagnostics'"
          type="button"
          @click="load"
        >
          {{ text.retry }}
        </button>
        <noscript>{{ text.noScript }}</noscript>
      </div>
    </div>
    <details v-if="diagnostics.length" class="stack-example-preview__diagnostics">
      <summary>{{ text.diagnostics }}</summary>
      <ul>
        <li v-for="(diagnostic, index) in diagnostics" :key="index">
          <code>{{ diagnostic.code }}</code> {{ diagnostic.message }}
        </li>
      </ul>
    </details>
  </div>
</template>
