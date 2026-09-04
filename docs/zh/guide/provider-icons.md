# 云服务商图标

Stack 无需配置即可使用与服务商无关的核心图标目录。AWS、Google Cloud 和 Azure 图标通过用户导入的 provider pack 使用。下表公开已审核目录，但 Stack 不托管或重新分发服务商 SVG 文件。

## 可用的服务商目录

| 服务商       | 已审核版本                       | 可用 ID                                                                                                          | 官方来源与条款                                                                                                                                   |
| ------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| AWS          | `Icon-package_07312026`          | `aws:s3`, `aws:sqs`, `aws:lambda`, `aws:ec2`, `aws:rds`, `aws:dynamodb`, `aws:eks`                               | [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) 与 [AWS Trademark Guidelines](https://aws.amazon.com/trademark-guidelines/) |
| Google Cloud | 2026 年 5 月指南中的核心产品图标 | `gcp:cloud-run`, `gcp:cloud-storage`, `gcp:compute-engine`, `gcp:gke`, `gcp:bigquery`, `gcp:cloud-sql`           | [Google Cloud Icon Library](https://cloud.google.com/icons) 与 [Google Brand Resource Center](https://about.google/brand-resource-center/)       |
| Azure        | `Azure_Public_Service_Icons_V24` | `azure:virtual-machines`, `azure:storage-accounts`, `azure:azure-sql-database`, `azure:aks`, `azure:app-service` | [Azure Architecture Icons](https://learn.microsoft.com/azure/architecture/icons/) 与官方压缩包内的条款                                           |

每个导入的 manifest 都记录官方产品名称、来源版本、完整压缩包 hash、条款 URL、审核日期、允许的输出类别和非背书声明。Provider pack 只增加图形；源代码中的节点 `kind` 仍决定语义样式和布局。

## 为什么不托管图形

已审核的服务商指南允许特定的架构图与文档用途，但没有明确授权 Stack 将 SVG 字节重新打包到网站、npm 包、WebAssembly 模块或原生二进制中。因此静态文档只展示目录、来源和准确 ID，不复制服务商图形。

加载 pack 后，Playground 会从用户选择的本地文件显示真实图标。Engine 验证完成后才创建浏览器本地图片 URL，也不会把 SVG 注入页面 HTML。使用或分发生成图之前，请检查对应的服务商条款。

## 创建本地 pack

自行下载官方压缩包，再使用公开的 Stack CLI 处理本地文件：

```sh
stack icons import aws ~/Downloads/aws-icons.zip \
  --accept-terms \
  -o .stack-icons/aws
```

其他已审核 profile 可将 `aws` 换成 `gcp` 或 `azure`。Importer 不发起网络请求或上传；它验证完整压缩包，只读取审核过的路径，移除活动内容，保留颜色与几何，并生成 `manifest.json`、`NOTICE.md` 和 `assets/*.svg`。

## 在 Playground 使用 pack

打开 **Icons**，选择一个 pack 的 `manifest.json` 和 `assets/` 中所有已声明文件，再从本地目录复制 ID 到源代码：

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

## 在 CLI 中离线使用 pack

```sh
stack render architecture.stack \
  --provider-pack .stack-icons/aws \
  -o architecture.svg \
  --notice architecture.NOTICE.md
```

`--provider-pack` 可以重复指定。`stack fmt`、`stack check`、`stack render` 与 `stack icons import` 都不会发起网络请求；导入只要求官方压缩包已经存在于本地。CLI 在渲染前验证有大小限制的 pack，并把实际使用的图标写入 notice sidecar。

## 离线行为

设备上已有 CLI 和所需服务商压缩包后，从编写源码到生成 SVG 都可完全离线。安装 CLI 或获取新的官方压缩包可能需要网络。

Web Playground 的 JavaScript 与 WebAssembly 加载完成后，format、check 和 render 也都在浏览器本地运行，不依赖服务端渲染，服务商文件不会离开浏览器。但当前网站并不是已安装的离线应用，因此无法保证断网冷启动。
