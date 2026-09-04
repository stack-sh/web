# 클라우드 제공자 아이콘

Stack은 설정 없이 제공자 중립적인 core icon catalog를 사용할 수 있습니다. AWS, Google Cloud, Azure 그림은 사용자가 가져온 provider pack으로 사용합니다. 아래 감사 완료 catalog는 공개하지만 Stack은 vendor SVG 파일을 호스팅하거나 재배포하지 않습니다.

## 사용 가능한 제공자 catalog

| 제공자       | 감사 완료 release                      | 사용 가능한 ID                                                                                                   | 공식 source 및 terms                                                                                                                             |
| ------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| AWS          | `Icon-package_07312026`                | `aws:s3`, `aws:sqs`, `aws:lambda`, `aws:ec2`, `aws:rds`, `aws:dynamodb`, `aws:eks`                               | [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/) 및 [AWS Trademark Guidelines](https://aws.amazon.com/trademark-guidelines/) |
| Google Cloud | 2026년 5월 가이드의 core product icons | `gcp:cloud-run`, `gcp:cloud-storage`, `gcp:compute-engine`, `gcp:gke`, `gcp:bigquery`, `gcp:cloud-sql`           | [Google Cloud Icon Library](https://cloud.google.com/icons) 및 [Google Brand Resource Center](https://about.google/brand-resource-center/)       |
| Azure        | `Azure_Public_Service_Icons_V24`       | `azure:virtual-machines`, `azure:storage-accounts`, `azure:azure-sql-database`, `azure:aks`, `azure:app-service` | [Azure Architecture Icons](https://learn.microsoft.com/azure/architecture/icons/) 및 공식 archive의 terms                                        |

가져온 manifest는 공식 제품명, source release, 전체 archive hash, terms URL, 검토 날짜, 허용된 output category, 비보증 안내를 기록합니다. Provider pack은 그림만 추가하며 source의 node `kind`가 계속 의미적 스타일과 레이아웃을 결정합니다.

## 그림을 호스팅하지 않는 이유

검토한 vendor 지침은 특정 다이어그램과 문서 용도를 허용하지만 Stack website, npm package, WebAssembly module 또는 native binary에 SVG byte를 다시 패키징할 명확한 허가는 제공하지 않습니다. 따라서 정적 문서는 vendor 그림을 복사하지 않고 catalog, provenance 및 정확한 ID를 표시합니다.

Pack을 불러온 뒤에는 Playground가 사용자가 선택한 로컬 파일에서 실제 아이콘을 표시합니다. Engine 검증 후에만 브라우저 로컬 이미지 URL을 만들며 SVG를 페이지 HTML로 주입하지 않습니다. 생성한 다이어그램을 사용하거나 배포하기 전에 연결된 제공자 terms를 확인하세요.

## 로컬 pack 만들기

공식 archive를 직접 다운로드한 뒤 공개 Stack CLI로 로컬 파일을 처리합니다.

```sh
stack icons import aws ~/Downloads/aws-icons.zip \
  --accept-terms \
  -o .stack-icons/aws
```

다른 감사 완료 profile은 `aws`를 `gcp` 또는 `azure`로 바꿉니다. Importer는 네트워크 요청이나 업로드를 하지 않습니다. 전체 archive를 검증하고 검토된 경로만 읽으며 active content를 제거하고 색상과 기하를 보존한 뒤 `manifest.json`, `NOTICE.md`, `assets/*.svg`를 생성합니다.

## Playground에서 pack 사용하기

**Icons**를 열고 하나의 pack에 있는 `manifest.json`과 `assets/`의 선언된 파일을 모두 선택한 뒤 로컬 catalog에서 ID를 source로 복사합니다.

```stack
stack 1.0

diagram "Storage" {
  node files "Amazon S3" {
    kind storage
    icon "aws:s3"
  }
}
```

선택한 파일은 현재 브라우저 탭에만 남습니다. Playground는 pack을 업로드, fetch 또는 영구 저장하지 않으므로 새로고침하면 다시 선택해야 합니다. 생성된 SVG에 provider 그림이 포함되면 SVG 다운로드 옆의 **Notice**도 저장하세요.

Playground는 이미 처리된 pack을 받으며 provider의 raw ZIP을 직접 받지 않습니다. Raw archive 검증과 안전한 SVG 처리는 CLI에 유지하여 브라우저 코드가 보안 경계를 중복 구현하지 않습니다.

## CLI에서 pack을 오프라인으로 사용하기

```sh
stack render architecture.stack \
  --provider-pack .stack-icons/aws \
  -o architecture.svg \
  --notice architecture.NOTICE.md
```

`--provider-pack`은 반복할 수 있습니다. `stack fmt`, `stack check`, `stack render`, `stack icons import`는 네트워크 요청을 하지 않으며 가져오기에는 공식 archive가 이미 로컬에 있으면 됩니다. CLI는 크기가 제한된 pack input을 렌더링 전에 검증하고 실제 사용 아이콘을 notice sidecar에 기록합니다.

## 오프라인 동작

CLI와 필요한 provider archive가 기기에 있으면 source 작성부터 SVG 생성까지 완전히 오프라인으로 동작합니다. CLI 설치나 새 공식 archive 다운로드에는 네트워크가 필요할 수 있습니다.

Web Playground도 JavaScript와 WebAssembly가 로드된 뒤에는 format, check, render를 브라우저 안에서 실행합니다. 서버 렌더링 의존성이 없고 provider 파일은 브라우저 밖으로 나가지 않습니다. 다만 현재 website는 설치된 offline app이 아니므로 네트워크 없는 cold start를 보장하지 않습니다.
