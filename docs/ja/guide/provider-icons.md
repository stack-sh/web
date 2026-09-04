# Provider icon

Stackは設定不要でprovider-neutralなcore icon catalogを利用できます。AWS、Google Cloud、Azure、主要な開発・collaboration toolのartworkはuser-imported provider packとして利用します。検索可能なcatalogはpublic metadataですが、Stackがvendor SVG fileをhost・再配布することはありません。

## 利用可能なprovider catalog

監査済みcatalogは合計1,051 IDです。AWS Architecture Icons 305件、Google Cloudのcore product 19件とcategory 26件、完全に同じbyteをdeduplicateしたAzure service icon 639件、主要tool 62件を収録します。SVG byteをloadせず全件を検索・filterでき、小さいdeviceでも崩れないよう100件ずつ表示します。

<ProviderCatalog locale="ja" />

Import済みmanifestには、公式product name、利用した全source releaseとarchive hash、terms URL、review date、許可されたoutput category、non-endorsement noticeが記録されます。Tool iconはrights ownerのbrand sourceとguideline linkも保持します。Provider packが追加するのはartworkだけで、semantic stylingとlayoutはsourceに書いたnode `kind`が引き続き決めます。

## Artworkをhostしない理由

確認したvendor guidanceは特定のdiagramやdocumentationでの利用を認めていますが、Stackのwebsite、npm package、WebAssembly module、native binaryへすべてのSVG byteを再packageする明確な許諾は確認できません。そのため静的Documentationではvendor artworkを複製せず、検索可能なcatalog metadata、provenance、正確なIDを表示します。

Tool archiveには[Simple Icons](https://simpleicons.org/)を使います。そのCC0 distributionは、個々のbrand markまでCC0であることを意味しません。Catalogへの掲載は利用許諾やendorsementではないため、使用前に上表のicon別sourceとguidelineを確認してください。

Packをloadした後のPlaygroundでは、選択したlocal fileから実際のiconを表示できます。Engine validation後にbrowser-localなimage URLを作り、SVGをpage HTMLとしてinjectしません。生成diagramの利用・配布前に、link先のprovider termsを確認してください。

## Local packを作る

上のAWS、Google Cloud、Azure、Simple Iconsのcardを選ぶと、監査済みarchiveの正確なdownload URL、期待するSHA-256、`curl` → `stack icons import` → `stack render`の一連のcommandを確認できます。Archiveのbyteがreview済みhashと一致しなくなった場合、CLIはimportを拒否します。

```sh
$ stack icons list aws s3
$ stack icons list simple-icons github
```

`aws`、`gcp`、`azure`、`simple-icons`を利用できます。Google Cloudはcard選択時に表示される2つの公式archiveが必要です。Importerは`curl`でdownloadしたfileを読み、downloadやupload自体は行いません。すべてのarchive全体を検証し、review済みpathだけを読み、active contentを除去してcolorとgeometryを保持し、`manifest.json`、`NOTICE.md`、`assets/*.svg`を生成します。

## Playgroundでpackを使う

**Icons**を開き、1つのpackにある`manifest.json`と`assets/`内の宣言済みfileをすべて選びます。Load済みlocal catalogを検索してIDをcopyし、sourceで使います。

```stack
stack 1.0

diagram "Storage" {
  node files "Amazon S3" {
    kind storage
    icon "aws:s3"
  }
}
```

選択fileは現在のbrowser tab内だけに留まります。Playgroundはpackをupload、fetch、永続化しないため、reload後は再選択が必要です。Provider artworkを埋め込んだSVGでは、SVG download横の**Notice**も保存してください。

Playgroundが受け取るのは処理済みpackで、providerのraw ZIPではありません。Raw archiveの検証と安全なSVG処理はCLIに集約し、browser codeにsecurity boundaryを重複実装しません。

## CLIでpackを使う

1つのStack fileで複数providerを利用できます。例えば次のdiagramはGoogle Cloud packのCloud Runと、Simple Icons packのGitHubを使います。

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

Catalog cardのcommandで両方のpackをimportした後、render時に`--provider-pack`を繰り返します。

```sh
$ stack render architecture.stack \
  --provider-pack .stack-icons/gcp \
  --provider-pack .stack-icons/simple-icons \
  -o architecture.svg \
  --notice architecture.NOTICE.md
```

CLIはそれぞれのbounded packをrender前に検証し、実際に使ったiconとsource archiveをnotice sidecarへ記録します。

## Offline behavior

CLIと必要なprovider archiveがdeviceにあれば、source作成からSVG生成まで完全にofflineで動作します。CLIのinstallや新しい公式archiveの取得にはnetwork接続が必要な場合があります。

Web PlaygroundもJavaScriptとWebAssemblyをloadした後は、format、check、renderをbrowser内で実行します。Server-side renderへの依存はなく、provider fileはbrowser外へ出ません。ただし現在のwebsiteはinstall済みoffline appではないため、networkなしのcold startは保証しません。
