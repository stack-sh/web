# Provider icon

Stackは設定不要でprovider-neutralなcore icon catalogを利用できます。AWS、Google Cloud、Azureのartworkはuser-imported provider packとして利用します。監査済みcatalogは以下で公開しますが、Stackがvendor SVG fileをhost・再配布することはありません。

## 利用可能なprovider catalog

| Provider     | 監査済みrelease                    | 利用可能なID                                                                                                     | 公式sourceとterms                                                                                                                              |
| ------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| AWS          | `Icon-package_07312026`            | `aws:s3`, `aws:sqs`, `aws:lambda`, `aws:ec2`, `aws:rds`, `aws:dynamodb`, `aws:eks`                               | [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/)と[AWS Trademark Guidelines](https://aws.amazon.com/trademark-guidelines/) |
| Google Cloud | 2026年5月guideのcore product icons | `gcp:cloud-run`, `gcp:cloud-storage`, `gcp:compute-engine`, `gcp:gke`, `gcp:bigquery`, `gcp:cloud-sql`           | [Google Cloud Icon Library](https://cloud.google.com/icons)と[Google Brand Resource Center](https://about.google/brand-resource-center/)       |
| Azure        | `Azure_Public_Service_Icons_V24`   | `azure:virtual-machines`, `azure:storage-accounts`, `azure:azure-sql-database`, `azure:aks`, `azure:app-service` | [Azure Architecture Icons](https://learn.microsoft.com/azure/architecture/icons/)と公式archive内のterms                                        |

Import済みmanifestには、公式product name、source release、archive全体のhash、terms URL、review date、許可されたoutput category、non-endorsement noticeが記録されます。Provider packが追加するのはartworkだけで、semantic stylingとlayoutはsourceに書いたnode `kind`が引き続き決めます。

## Artworkをhostしない理由

確認したvendor guidanceは特定のdiagramやdocumentationでの利用を認めていますが、Stackのwebsite、npm package、WebAssembly module、native binaryへSVG byteを再packageする明確な許諾は確認できません。そのため静的Documentationではvendor artworkを複製せず、catalog、provenance、正確なIDを表示します。

Packをloadした後のPlaygroundでは、選択したlocal fileから実際のiconを表示できます。Engine validation後にbrowser-localなimage URLを作り、SVGをpage HTMLとしてinjectしません。生成diagramの利用・配布前に、link先のprovider termsを確認してください。

## Local packを作る

公式archiveを自分でdownloadし、publicなStack CLIでlocal fileを処理します。

```sh
stack icons import aws ~/Downloads/aws-icons.zip \
  --accept-terms \
  -o .stack-icons/aws
```

他の監査済みprofileでは`aws`を`gcp`または`azure`に置き換えます。Importerはnetwork requestやuploadを行いません。Archive全体を検証し、review済みpathだけを読み、active contentを除去してcolorとgeometryを保持し、`manifest.json`、`NOTICE.md`、`assets/*.svg`を生成します。

## Playgroundでpackを使う

**Icons**を開き、1つのpackにある`manifest.json`と`assets/`内の宣言済みfileをすべて選びます。Local catalogからIDをcopyし、sourceで使います。

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

## CLIでpackをoffline利用する

```sh
stack render architecture.stack \
  --provider-pack .stack-icons/aws \
  -o architecture.svg \
  --notice architecture.NOTICE.md
```

`--provider-pack`は繰り返し指定できます。`stack fmt`、`stack check`、`stack render`、`stack icons import`はnetwork requestを行いません。Importに必要なのは、公式archiveがlocalに存在することだけです。CLIはbounded pack inputをrender前に検証し、実際に使ったiconをnotice sidecarへ記録します。

## Offline behavior

CLIと必要なprovider archiveがdeviceにあれば、source作成からSVG生成まで完全にofflineで動作します。CLIのinstallや新しい公式archiveの取得にはnetwork接続が必要な場合があります。

Web PlaygroundもJavaScriptとWebAssemblyをloadした後は、format、check、renderをbrowser内で実行します。Server-side renderへの依存はなく、provider fileはbrowser外へ出ません。ただし現在のwebsiteはinstall済みoffline appではないため、networkなしのcold startは保証しません。
