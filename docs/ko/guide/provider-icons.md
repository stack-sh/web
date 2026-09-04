# 클라우드 제공자 아이콘

Stack은 설정 없이 제공자 중립적인 core icon catalog를 사용할 수 있습니다. AWS, Google Cloud, Azure 및 주요 개발·협업 도구 그림은 사용자가 가져온 provider pack으로 사용합니다. 아래 검색 가능한 catalog는 공개 metadata이지만 Stack은 vendor SVG 파일을 호스팅하거나 재배포하지 않습니다.

## 사용 가능한 제공자 catalog

감사 완료 catalog에는 총 1,051개 ID가 있습니다. AWS Architecture Icons 305개, Google Cloud core product 19개와 category 26개 전체, byte가 완전히 같은 항목을 deduplicate한 Azure service icon 639개, 주요 tool icon 62개입니다. SVG byte를 불러오지 않고 전체 목록을 검색·filter할 수 있으며 작은 화면에서도 안정적으로 보이도록 100개씩 표시합니다.

<ProviderCatalog locale="ko" />

가져온 manifest는 공식 제품명, 사용한 모든 source release와 archive hash, terms URL, 검토 날짜, 허용된 output category, 비보증 안내를 기록합니다. Tool icon은 권리 보유자의 brand source 및 guideline link도 보존합니다. Provider pack은 그림만 추가하며 source의 node `kind`가 계속 의미적 스타일과 레이아웃을 결정합니다.

## 그림을 호스팅하지 않는 이유

검토한 vendor 지침은 특정 다이어그램과 문서 용도를 허용하지만 Stack website, npm package, WebAssembly module 또는 native binary에 모든 SVG byte를 다시 패키징할 명확한 허가는 제공하지 않습니다. 따라서 정적 문서는 vendor 그림을 복사하지 않고 검색 가능한 catalog metadata, provenance 및 정확한 ID를 표시합니다.

Tool archive는 [Simple Icons](https://simpleicons.org/)에서 가져옵니다. CC0 distribution은 각 brand mark까지 CC0이라는 뜻이 아니며 catalog 등재도 사용 허가나 endorsement가 아닙니다. 사용 전에 위의 icon별 source 및 guideline link를 확인하세요.

Pack을 불러온 뒤에는 Playground가 사용자가 선택한 로컬 파일에서 실제 아이콘을 표시합니다. Engine 검증 후에만 브라우저 로컬 이미지 URL을 만들며 SVG를 페이지 HTML로 주입하지 않습니다. 생성한 다이어그램을 사용하거나 배포하기 전에 연결된 제공자 terms를 확인하세요.

## 로컬 pack 만들기

위의 AWS, Google Cloud, Azure 또는 Simple Icons 카드를 선택하면 감사 완료 archive의 정확한 다운로드 URL, 예상 SHA-256 및 전체 `curl` → `stack icons import` → `stack render` 명령을 확인할 수 있습니다. Archive byte가 검토된 hash와 더 이상 일치하지 않으면 CLI가 import를 거부합니다.

```sh
$ stack icons list aws s3
$ stack icons list simple-icons github
```

`aws`, `gcp`, `azure`, `simple-icons`를 사용할 수 있습니다. Google Cloud에는 카드를 선택하면 표시되는 공식 archive 두 개가 필요합니다. Importer는 `curl`로 다운로드한 파일을 읽으며 자체적으로 다운로드하거나 업로드하지 않습니다. 모든 archive 전체를 검증하고 검토된 경로만 읽으며 active content를 제거하고 색상과 기하를 보존한 뒤 `manifest.json`, `NOTICE.md`, `assets/*.svg`를 생성합니다.

## Playground에서 pack 사용하기

**Icons**를 열고 하나의 pack에 있는 `manifest.json`과 `assets/`의 선언된 파일을 모두 선택한 뒤 불러온 local catalog를 검색해 ID를 source로 복사합니다.

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

## CLI에서 pack 사용하기

하나의 Stack 파일에서 여러 provider를 사용할 수 있습니다. 예를 들어 다음 다이어그램은 Google Cloud pack의 Cloud Run과 Simple Icons pack의 GitHub를 함께 사용합니다.

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

Catalog 카드의 명령으로 두 pack을 모두 import한 뒤 render할 때 `--provider-pack`을 반복해서 지정합니다.

```sh
$ stack render architecture.stack \
  --provider-pack .stack-icons/gcp \
  --provider-pack .stack-icons/simple-icons \
  -o architecture.svg \
  --notice architecture.NOTICE.md
```

CLI는 크기가 제한된 각 pack을 render 전에 검증하고 실제 사용 icon과 source archive를 notice sidecar에 기록합니다.

## 오프라인 동작

CLI와 필요한 provider archive가 기기에 있으면 source 작성부터 SVG 생성까지 완전히 오프라인으로 동작합니다. CLI 설치나 새 공식 archive 다운로드에는 네트워크가 필요할 수 있습니다.

Web Playground도 JavaScript와 WebAssembly가 로드된 뒤에는 format, check, render를 브라우저 안에서 실행합니다. 서버 렌더링 의존성이 없고 provider 파일은 브라우저 밖으로 나가지 않습니다. 다만 현재 website는 설치된 offline app이 아니므로 네트워크 없는 cold start를 보장하지 않습니다.
