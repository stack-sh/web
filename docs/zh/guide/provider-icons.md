# 云服务商图标

Stack 无需配置即可使用与服务商无关的核心图标目录。AWS、Google Cloud、Azure 以及常用开发和协作工具图标通过用户导入的 provider pack 使用。下方可搜索目录属于公开元数据，但 Stack 不托管或重新分发服务商 SVG 文件。

## 可用的服务商目录

已审核目录共有 1,051 个 ID：305 个 AWS Architecture Icons、Google Cloud 的全部 19 个核心产品与 26 个分类图标、对完全相同字节去重后的 639 个 Azure 服务图标，以及 62 个常用工具图标。无需加载 SVG 字节即可搜索和筛选完整列表，并以每次 100 项的方式在小屏设备上稳定显示。

<ProviderCatalog locale="zh" />

每个导入的 manifest 都记录官方产品名称、使用的每个来源版本与压缩包 hash、条款 URL、审核日期、允许的输出类别和非背书声明。工具图标还保留权利方的品牌来源和使用指南链接。Provider pack 只增加图形；源代码中的节点 `kind` 仍决定语义样式和布局。

## 为什么不托管图形

已审核的服务商指南允许特定的架构图与文档用途，但没有明确授权 Stack 将所有 SVG 字节重新打包到网站、npm 包、WebAssembly 模块或原生二进制中。因此静态文档只展示可搜索的目录元数据、来源和准确 ID，不复制服务商图形。

工具归档来自 [Simple Icons](https://simpleicons.org/)。其 CC0 分发不代表每个底层品牌标志都是 CC0；被列入目录也不构成使用许可或背书。使用前请查看上方每个图标的来源和指南链接。

加载 pack 后，Playground 会从用户选择的本地文件显示真实图标。Engine 验证完成后才创建浏览器本地图片 URL，也不会把 SVG 注入页面 HTML。使用或分发生成图之前，请检查对应的服务商条款。

## 创建本地 pack

选择上方的 AWS、Google Cloud、Azure 或 Simple Icons 卡片，即可查看已审核压缩包的准确下载 URL、预期 SHA-256，以及完整的 `curl` → `stack icons import` → `stack render` 命令。如果压缩包字节不再匹配已审核 hash，CLI 会拒绝导入。

```sh
$ stack icons list aws s3
$ stack icons list simple-icons github
```

可使用 `aws`、`gcp`、`azure` 或 `simple-icons`。Google Cloud 需要选择卡片时显示的两个官方压缩包。Importer 读取由 `curl` 下载的文件，本身不发起下载或上传；它验证每个完整压缩包，只读取审核过的路径，移除活动内容，保留颜色与几何，并生成 `manifest.json`、`NOTICE.md` 和 `assets/*.svg`。

## 在 Playground 使用 pack

打开 **Icons**，选择一个 pack 的 `manifest.json` 和 `assets/` 中所有已声明文件，再搜索已加载的本地目录并复制 ID 到源代码：

```stack
stack 1.0

diagram "Storage" {
  node files "Amazon S3" {
    kind storage
    icon "aws:s3"
  }
}
```

所选文件只保留在当前浏览器标签页。Playground 不上传、获取或持久化 pack，因此刷新后需要重新选择。生成的 SVG 使用服务商图形时，也请下载 SVG 旁边的 **Notice**。

Playground 接受已经处理的 pack，而不是服务商原始 ZIP。原始压缩包验证和安全 SVG 处理仍由 CLI 负责，避免浏览器代码重复安全边界。

## 在 CLI 中使用 pack

一个 Stack 文件可以使用多个服务商。例如，下面的图同时使用 Google Cloud pack 中的 Cloud Run 与 Simple Icons pack 中的 GitHub：

```stack
stack 1.0

diagram "Deploy from GitHub to Cloud Run" {
  node repository "GitHub" {
    kind external
    icon "simple-icons:github"
  }

  node service "Cloud Run" {
    kind service
    icon "gcp:cloud-run"
  }

  edge repository -> service "Deploy" {
    kind dependency
  }
}
```

使用目录卡片中的命令导入两个 pack 后，在渲染时重复指定 `--provider-pack`：

```sh
$ stack render architecture.stack \
  --provider-pack .stack-icons/gcp \
  --provider-pack .stack-icons/simple-icons \
  -o architecture.svg \
  --notice architecture.NOTICE.md
```

CLI 会在渲染前验证每个有大小限制的 pack，并把实际使用的图标和来源压缩包写入 notice sidecar。

## 离线行为

设备上已有 CLI 和所需服务商压缩包后，从编写源码到生成 SVG 都可完全离线。安装 CLI 或获取新的官方压缩包可能需要网络。

Web Playground 的 JavaScript 与 WebAssembly 加载完成后，format、check 和 render 也都在浏览器本地运行，不依赖服务端渲染，服务商文件不会离开浏览器。但当前网站并不是已安装的离线应用，因此无法保证断网冷启动。
