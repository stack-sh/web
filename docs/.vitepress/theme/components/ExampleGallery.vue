<script setup lang="ts">
import corpus from "../../../../example-corpus/catalog.json"
import { exampleCorpusSource } from "../../../../scripts/example-corpus.config.mjs"
import ExamplePreview from "./ExamplePreview.vue"

type Locale = "en" | "ja" | "zh" | "ko"
type LearningStage = "starter" | "intermediate" | "advanced"

defineProps<{ locale: Locale }>()

const stages: LearningStage[] = ["starter", "intermediate", "advanced"]
const labels = {
  en: {
    stage: { starter: "Start small", intermediate: "Build fluency", advanced: "Model systems" },
    structure: { nodes: "nodes", groups: "groups", edges: "edges" },
    source: "View canonical .stack source",
    contract: "Pinned source",
  },
  ja: {
    stage: { starter: "小さく始める", intermediate: "表現を広げる", advanced: "Systemを描く" },
    structure: { nodes: "node", groups: "group", edges: "edge" },
    source: "Canonical .stack sourceを見る",
    contract: "Pin済みsource",
  },
  zh: {
    stage: { starter: "从小处开始", intermediate: "扩展表达", advanced: "描述系统" },
    structure: { nodes: "节点", groups: "分组", edges: "连线" },
    source: "查看规范 .stack 源码",
    contract: "固定源版本",
  },
  ko: {
    stage: { starter: "작게 시작하기", intermediate: "표현 넓히기", advanced: "시스템 모델링" },
    structure: { nodes: "노드", groups: "그룹", edges: "엣지" },
    source: "Canonical .stack 소스 보기",
    contract: "고정된 소스",
  },
} as const

function examplesFor(stage: LearningStage) {
  return corpus.examples.filter(
    (example) => example.learningStage === stage && example.providers.length === 0,
  )
}

function sourceUrl(source: string) {
  return `https://raw.githubusercontent.com/${exampleCorpusSource.repository}/${exampleCorpusSource.revision}/examples/${source}`
}
</script>

<template>
  <section class="stack-example-gallery">
    <p class="stack-example-gallery__contract">
      {{ labels[locale].contract }}:
      <a
        :href="`https://github.com/${exampleCorpusSource.repository}/tree/${exampleCorpusSource.revision}/examples`"
      >
        <code>{{ exampleCorpusSource.revision.slice(0, 8) }}</code>
      </a>
    </p>

    <section v-for="stage in stages" :key="stage" class="stack-example-stage">
      <h2 :id="`examples-${stage}`">{{ labels[locale].stage[stage] }}</h2>
      <div class="stack-example-list">
        <article
          v-for="example in examplesFor(stage)"
          :key="example.id"
          class="stack-example-card"
          :aria-labelledby="`example-${example.id}`"
        >
          <ExamplePreview
            :source="example.source"
            :source-url="sourceUrl(example.source)"
            :alt="example.thumbnail.alt"
            :locale="locale"
          />
          <div class="stack-example-card__body">
            <div class="stack-example-card__heading">
              <h3 :id="`example-${example.id}`">{{ example.title }}</h3>
              <span class="stack-example-card__stage">{{ example.learningStage }}</span>
            </div>
            <p>{{ example.summary }}</p>

            <dl class="stack-example-card__counts">
              <div v-for="field in ['nodes', 'groups', 'edges'] as const" :key="field">
                <dt>{{ labels[locale].structure[field] }}</dt>
                <dd>{{ example.expected[field] }}</dd>
              </div>
            </dl>

            <a class="stack-example-card__source" :href="sourceUrl(example.source)">
              {{ labels[locale].source }}
            </a>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
