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
    packs: "Icon packs",
    core: "Built-in icons",
    expected: "Expected output",
    structure: { nodes: "nodes", groups: "groups", edges: "edges" },
    features: "Syntax features",
    source: "View canonical .stack source",
    contract: "Pinned source",
  },
  ja: {
    stage: { starter: "小さく始める", intermediate: "表現を広げる", advanced: "Systemを描く" },
    packs: "Icon pack",
    core: "組み込みicon",
    expected: "期待する出力",
    structure: { nodes: "node", groups: "group", edges: "edge" },
    features: "Syntax feature",
    source: "Canonical .stack sourceを見る",
    contract: "Pin済みsource",
  },
  zh: {
    stage: { starter: "从小处开始", intermediate: "扩展表达", advanced: "描述系统" },
    packs: "图标包",
    core: "内置图标",
    expected: "预期输出",
    structure: { nodes: "节点", groups: "分组", edges: "连线" },
    features: "语法特性",
    source: "查看规范 .stack 源码",
    contract: "固定源版本",
  },
  ko: {
    stage: { starter: "작게 시작하기", intermediate: "표현 넓히기", advanced: "시스템 모델링" },
    packs: "아이콘 팩",
    core: "기본 아이콘",
    expected: "예상 출력",
    structure: { nodes: "노드", groups: "그룹", edges: "엣지" },
    features: "문법 기능",
    source: "Canonical .stack 소스 보기",
    contract: "고정된 소스",
  },
} as const

function examplesFor(stage: LearningStage) {
  return corpus.examples.filter((example) => example.learningStage === stage)
}

function sourceUrl(source: string) {
  return `https://raw.githubusercontent.com/${exampleCorpusSource.repository}/${exampleCorpusSource.revision}/examples/${source}`
}

function featureLabel(feature: string) {
  return feature.replaceAll("-", " ")
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

            <div class="stack-example-card__meta">
              <div>
                <strong>{{ labels[locale].packs }}</strong>
                <span>{{ example.providers.join(", ") || labels[locale].core }}</span>
              </div>
              <div>
                <strong>{{ labels[locale].expected }}</strong>
                <span>{{ example.expected.description }}</span>
              </div>
            </div>

            <dl class="stack-example-card__counts">
              <div v-for="field in ['nodes', 'groups', 'edges'] as const" :key="field">
                <dt>{{ labels[locale].structure[field] }}</dt>
                <dd>{{ example.expected[field] }}</dd>
              </div>
            </dl>

            <details class="stack-example-card__features">
              <summary>{{ labels[locale].features }}</summary>
              <ul>
                <li v-for="feature in example.features" :key="feature">
                  {{ featureLabel(feature) }}
                </li>
              </ul>
            </details>

            <a class="stack-example-card__source" :href="sourceUrl(example.source)">
              {{ labels[locale].source }}
            </a>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
