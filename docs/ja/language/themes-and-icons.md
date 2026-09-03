# Themeとicon

Themeはdiagram-levelでrendererが管理するvisual systemへのsymbolic referenceです。Iconはそのtheme内で解決するlogical nameです。どちらもdiagramの意味を変更しません。

## Themeを選ぶ

Diagram直下に最大1つの`theme` statementを置きます。

```stack
stack 1.0

diagram "Dark architecture" {
  theme dark

  node api "API"
}
```

省略時は`default`です。Draft Stack 1.0はcore catalogに次のthemeを要求します。

| Theme     | Intended use                                                 |
| --------- | ------------------------------------------------------------ |
| `default` | 一般的なarchitecture diagram向けのbalanced blue-gray surface |
| `light`   | Light document向けのwarm neutral surface                     |
| `dark`    | Dark canvas向けのhigh-contrast cool surface                  |

Sourceはidentifierを選ぶだけで、catalog package versionを選びません。Render metadataがcatalog versionとcontent revisionを記録します。

生成diagramのthemeとPlayground UIのlight/darkは独立しています。Themeはpalette、typography metric、surface、icon、connector、backgroundを変えられますが、node、group、edge、label、kind、direction、layout constraintを隠したり変更したりできません。

## Fallback behavior

3つのcore themeはrenderer必須resourceです。利用中catalogにないnon-core themeはwarning `STK6001`を出し、`default`でrenderします。Sourceにidentifierがあってもnetworkからthemeを取得しません。

Theme identifierは通常のStack identifier syntaxを使います。一度登録されたidentifierを、deprecation後も別themeへ再利用できません。

## Kind fallback icon

各themeは全node kindにfallbackを持ちます。`icon`を省略するとrendererがこれを使います。

| Node kind  | Current logical fallback icon |
| ---------- | ----------------------------- |
| `actor`    | `kind-actor`                  |
| `client`   | `kind-client`                 |
| `service`  | `kind-service`                |
| `function` | `kind-function`               |
| `worker`   | `kind-worker`                 |
| `database` | `kind-database`               |
| `cache`    | `kind-cache`                  |
| `queue`    | `kind-queue`                  |
| `storage`  | `kind-storage`                |
| `external` | `kind-external`               |

現在のopen core catalogは`default`、`light`、`dark`にこの10 fallback identifierを持ちます。`postgresql`、`aws`、`github`などのvendor iconはまだありません。通常はsemanticな`kind`を選び、`icon`を省略してください。

## 明示icon

明示iconはquoted logical identifierです。

```stack
stack 1.0

diagram "Icon fallback" {
  node primary "Primary database" {
    kind database
    icon "postgresql"
  }
}
```

Iconはnodeを装飾するだけで、`database` kindやaccessible labelを変えません。Effective themeに`postgresql`がなければ、`kind-database`でrenderを続け、warning `STK5001`を出します。Themeごとにartworkを変えられますが、同じidentifierは同じlogical subjectを表します。

## Catalogとasset safety

Public `stack-sh/theme` catalogがpalette、deterministic font metric、node-kind visual、connector、icon metadata、SVG byte、provenance、redistribution permissionを所有します。Catalog assetはrendererへbundleし、authored identifierをfile pathやURLとして扱いません。

SVG validationはscript、event handler、nested SVG、unsafe reference、data/network URL、style attribute、allowlist外のelement/attributeを拒否します。Iconだけを意味の唯一の手掛かりにせず、labelとnon-color distinctionも維持します。
