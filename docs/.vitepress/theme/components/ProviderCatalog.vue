<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue"

import catalogData from "../data/provider-catalogs.json"

type Locale = "en" | "ja" | "zh" | "ko"
type CatalogIcon = (typeof catalogData.providers)[number]["icons"][number]

const props = defineProps<{ locale: Locale }>()
const pageSize = 100
const query = ref("")
const provider = ref("all")
const category = ref("all")
const visibleCount = ref(pageSize)
const copiedIcon = ref<string>()
let copyTimer: number | undefined

const labels = {
  en: {
    allCategories: "All categories",
    allProviders: "All providers",
    commandIntro: "Import this provider",
    category: "Category",
    copy: "Copy",
    copied: "Copied",
    guidelines: "Guidelines",
    kind: "Kind",
    noResults: "No icon IDs match these filters.",
    officialPage: "Official download page",
    product: "Product",
    results: "results",
    search: "Search ID, product, or category",
    showMore: "Show more",
    source: "Brand source",
    terms: "Terms and guidance",
  },
  ja: {
    allCategories: "すべてのcategory",
    allProviders: "すべてのprovider",
    commandIntro: "このproviderをimport",
    category: "Category",
    copy: "コピー",
    copied: "コピー済み",
    guidelines: "Guideline",
    kind: "Kind",
    noResults: "条件に一致するicon IDはありません。",
    officialPage: "公式download page",
    product: "Product",
    results: "件",
    search: "ID、product、categoryを検索",
    showMore: "さらに表示",
    source: "Brand source",
    terms: "Termsとguidance",
  },
  zh: {
    allCategories: "所有分类",
    allProviders: "所有提供商",
    commandIntro: "导入此服务商",
    category: "分类",
    copy: "复制",
    copied: "已复制",
    guidelines: "使用指南",
    kind: "类型",
    noResults: "没有符合筛选条件的图标 ID。",
    officialPage: "官方下载页面",
    product: "产品",
    results: "项结果",
    search: "搜索 ID、产品或分类",
    showMore: "显示更多",
    source: "品牌来源",
    terms: "条款与指南",
  },
  ko: {
    allCategories: "모든 카테고리",
    allProviders: "모든 제공자",
    commandIntro: "이 제공자 가져오기",
    category: "카테고리",
    copy: "복사",
    copied: "복사됨",
    guidelines: "사용 지침",
    kind: "종류",
    noResults: "필터와 일치하는 아이콘 ID가 없습니다.",
    officialPage: "공식 다운로드 페이지",
    product: "제품",
    results: "개 결과",
    search: "ID, 제품 또는 카테고리 검색",
    showMore: "더 보기",
    source: "브랜드 출처",
    terms: "약관 및 지침",
  },
} as const

const text = computed(() => labels[props.locale])
const selectedProvider = computed(() =>
  catalogData.providers.find((item) => item.id === provider.value),
)
const selectedProviderCommands = computed(() => {
  const item = selectedProvider.value
  if (!item) return ""
  return `$ stack icons import ${item.id} --accept-terms`
})
const allIcons = computed(() =>
  catalogData.providers.flatMap((item) =>
    item.icons.map((icon) => ({ ...icon, providerId: item.id })),
  ),
)
const categories = computed(() => {
  const values = allIcons.value
    .filter((icon) => provider.value === "all" || icon.providerId === provider.value)
    .map((icon) => icon.category)
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
})
const filteredIcons = computed(() => {
  const normalizedQuery = query.value.trim().toLocaleLowerCase()
  return allIcons.value.filter(
    (icon) =>
      (provider.value === "all" || icon.providerId === provider.value) &&
      (category.value === "all" || icon.category === category.value) &&
      (normalizedQuery.length === 0 ||
        icon.id.toLocaleLowerCase().includes(normalizedQuery) ||
        icon.productName.toLocaleLowerCase().includes(normalizedQuery) ||
        icon.category.toLocaleLowerCase().includes(normalizedQuery)),
  )
})
const visibleIcons = computed(() => filteredIcons.value.slice(0, visibleCount.value))

watch([query, provider, category], () => {
  visibleCount.value = pageSize
  if (category.value !== "all" && !categories.value.includes(category.value)) {
    category.value = "all"
  }
})

async function copySyntax(icon: CatalogIcon) {
  if (!navigator.clipboard) return
  try {
    await navigator.clipboard.writeText(`icon "${icon.id}"`)
  } catch {
    return
  }
  copiedIcon.value = icon.id
  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copiedIcon.value = undefined
  }, 1600)
}

onBeforeUnmount(() => window.clearTimeout(copyTimer))
</script>

<template>
  <section class="stack-provider-catalog">
    <div class="stack-provider-summary" aria-label="Provider icon counts" role="group">
      <button
        v-for="item in catalogData.providers"
        :key="item.id"
        type="button"
        :aria-pressed="provider === item.id"
        @click="provider = provider === item.id ? 'all' : item.id"
      >
        <strong>{{ item.name }}</strong>
        <span>{{ item.icons.length }}</span>
      </button>
    </div>

    <section
      v-if="selectedProvider"
      class="stack-provider-setup"
      aria-labelledby="stack-provider-setup-title"
    >
      <div class="stack-provider-setup__heading">
        <h3 id="stack-provider-setup-title">{{ selectedProvider.name }}</h3>
        <span>{{ selectedProvider.source.release }}</span>
      </div>
      <div class="stack-provider-setup__links">
        <a :href="selectedProvider.source.pageUrl" rel="noreferrer" target="_blank">
          {{ text.officialPage }}
        </a>
        <a :href="selectedProvider.source.termsUrl" rel="noreferrer" target="_blank">
          {{ text.terms }}
        </a>
      </div>
      <p>{{ text.commandIntro }}</p>
      <pre tabindex="0"><code>{{ selectedProviderCommands }}</code></pre>
    </section>

    <div class="stack-provider-filters">
      <label>
        <span class="sr-only">{{ text.search }}</span>
        <input v-model="query" type="search" :placeholder="text.search" />
      </label>
      <label>
        <span class="sr-only">Provider</span>
        <select v-model="provider">
          <option value="all">{{ text.allProviders }}</option>
          <option v-for="item in catalogData.providers" :key="item.id" :value="item.id">
            {{ item.name }} ({{ item.icons.length }})
          </option>
        </select>
      </label>
      <label>
        <span class="sr-only">{{ text.category }}</span>
        <select v-model="category">
          <option value="all">{{ text.allCategories }}</option>
          <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
        </select>
      </label>
    </div>

    <p class="stack-provider-result-count" role="status">
      {{ filteredIcons.length.toLocaleString() }} {{ text.results }}
    </p>
    <p v-if="filteredIcons.length === 0" class="stack-provider-empty">{{ text.noResults }}</p>

    <div v-else class="stack-provider-table" role="table">
      <div class="stack-provider-table__header" role="row">
        <span role="columnheader">ID</span>
        <span role="columnheader">{{ text.product }}</span>
        <span role="columnheader">{{ text.category }}</span>
        <span role="columnheader">{{ text.kind }}</span>
        <span role="columnheader"
          ><span class="sr-only">{{ text.copy }}</span></span
        >
      </div>
      <div v-for="icon in visibleIcons" :key="icon.id" class="stack-provider-table__row" role="row">
        <code role="cell">{{ icon.id }}</code>
        <span role="cell">
          <strong>{{ icon.productName }}</strong>
          <small v-if="icon.brandSourceUrl || icon.brandGuidelinesUrl">
            <a
              v-if="icon.brandSourceUrl"
              :href="icon.brandSourceUrl"
              rel="noreferrer"
              target="_blank"
              >{{ text.source }}</a
            >
            <a
              v-if="icon.brandGuidelinesUrl"
              :href="icon.brandGuidelinesUrl"
              rel="noreferrer"
              target="_blank"
              >{{ text.guidelines }}</a
            >
          </small>
        </span>
        <span role="cell">{{ icon.category }}</span>
        <code role="cell">{{ icon.recommendedNodeKind }}</code>
        <span class="stack-provider-table__action" role="cell">
          <button type="button" @click="copySyntax(icon)">
            {{ copiedIcon === icon.id ? text.copied : text.copy }}
          </button>
        </span>
      </div>
    </div>

    <button
      v-if="visibleIcons.length < filteredIcons.length"
      class="stack-provider-show-more"
      type="button"
      @click="visibleCount += pageSize"
    >
      {{ text.showMore }} ({{ filteredIcons.length - visibleIcons.length }})
    </button>
  </section>
</template>
