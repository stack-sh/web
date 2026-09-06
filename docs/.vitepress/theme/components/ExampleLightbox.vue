<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { createImageDialog } from "../../../../scripts/image-dialog.mjs"

const props = defineProps<{ url: string; alt: string; locale: "en" | "ja" | "zh" | "ko" }>()
const labels = {
  en: { title: "Expanded diagram", close: "Close", actual: "Actual size", fit: "Fit to screen" },
  ja: { title: "作例を拡大", close: "閉じる", actual: "実寸で見る", fit: "画面に合わせる" },
  zh: { title: "放大图表", close: "关闭", actual: "实际大小", fit: "适应屏幕" },
  ko: { title: "다이어그램 확대", close: "닫기", actual: "실제 크기", fit: "화면에 맞추기" },
} as const
const text = computed(() => labels[props.locale])
const dialog = ref<HTMLDialogElement>()
const actualSize = ref(false)
let controller: ReturnType<typeof createImageDialog> | undefined
onMounted(() => {
  controller = createImageDialog(dialog.value!, () => (actualSize.value = false))
})
watch(
  () => props.url,
  () => controller?.close(),
)
onUnmounted(() => controller?.dispose())
function backdrop(event: MouseEvent) {
  if (event.target !== dialog.value) return
  const bounds = dialog.value!.getBoundingClientRect()
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    controller?.close()
}
defineExpose({ open: () => controller?.open() })
</script>

<template>
  <dialog ref="dialog" class="stack-example-lightbox" :aria-label="text.title" @click="backdrop">
    <header class="stack-example-lightbox__toolbar">
      <strong>{{ text.title }}</strong>
      <button type="button" :aria-pressed="actualSize" @click="actualSize = !actualSize">
        {{ actualSize ? text.fit : text.actual }}
      </button>
      <button type="button" autofocus @click="controller?.close()">{{ text.close }}</button>
    </header>
    <div
      class="stack-example-lightbox__canvas"
      :class="{ 'is-actual-size': actualSize }"
      tabindex="0"
      :aria-label="alt"
    >
      <img :src="url" :alt="alt" />
    </div>
  </dialog>
</template>
