# 主题与图标

主题是图级别、由渲染器管理的视觉系统符号引用。图标是在该主题内解析的逻辑名称。两者都不会改变图的语义。

## 选择主题

在图中最多添加一条 `theme` 语句：

```stack
stack 1.0

diagram "Dark architecture" {
  theme dark

  node api "API"
}
```

省略时使用 `default`。Draft Stack 1.0 要求核心 catalog 提供：

| Theme     | 用途                         |
| --------- | ---------------------------- |
| `default` | 适合通用架构图的均衡蓝灰表面 |
| `light`   | 适合浅色文档的暖中性色表面   |
| `dark`    | 适合深色画布的高对比冷色表面 |

源文件选择标识符，而不是 catalog package 版本。渲染 metadata 记录 catalog 版本和内容 revision，以标识实际使用的视觉数据。

生成图主题与 Playground 的明暗界面相互独立。主题可改变 palette、字体 metrics、surface、icon、connector 和 background，但不能隐藏或改变节点、分组、连线、标签、kind、方向或布局约束。

## 回退行为

三个核心主题是渲染器必需资源。当前 catalog 中不存在的非核心主题会发出 `STK6001`，并使用 `default` 渲染。引擎不会因为源文件出现主题标识符就从网络下载主题。

主题标识符使用普通 Stack 标识符语法。一旦注册，即使废弃后也不能重新分配给另一个主题。

## Kind 回退图标

每个主题为所有节点 kind 提供回退。省略 `icon` 时渲染器使用它。

| Node kind  | 当前逻辑回退图标 |
| ---------- | ---------------- |
| `actor`    | `kind-actor`     |
| `client`   | `kind-client`    |
| `service`  | `kind-service`   |
| `function` | `kind-function`  |
| `worker`   | `kind-worker`    |
| `database` | `kind-database`  |
| `cache`    | `kind-cache`     |
| `queue`    | `kind-queue`     |
| `storage`  | `kind-storage`   |
| `external` | `kind-external`  |

当前开放核心 catalog 在 `default`、`light` 和 `dark` 中包含这十个回退标识符，尚不包含 `postgresql`、`aws` 或 `github` 等厂商图标。多数文档应选择语义 `kind` 并省略 `icon`。

## 显式图标

显式图标使用带引号的逻辑标识符：

```stack
stack 1.0

diagram "Icon fallback" {
  node primary "Primary database" {
    kind database
    icon "postgresql"
  }
}
```

图标只装饰节点，不改变 `database` kind 或无障碍标签。如果有效主题没有 `postgresql`，会继续用 `kind-database` 渲染并发出 `STK5001`。同一标识符在不同主题中必须表示同一逻辑对象，但具体图形可以不同。

## Catalog 与资源安全

公共 `stack-sh/theme` catalog 拥有 palette、确定性字体 metrics、node-kind visual、connector、icon metadata、SVG bytes、来源和再分发许可。Catalog 资源随渲染器打包，编写的标识符绝不会被当成文件路径或 URL。

SVG 验证会拒绝脚本、事件处理器、嵌套 SVG、不安全引用、data/network URL、style 属性和 allowlist 外元素或属性。图标不能成为表达意义的唯一方式，标签和非颜色区分也必须保留。
