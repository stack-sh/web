# 테마와 아이콘

테마는 다이어그램 레벨에서 렌더러가 관리하는 시각 시스템의 기호 참조입니다. 아이콘은 해당 테마 안에서 해결되는 논리 이름입니다. 둘 다 다이어그램 의미를 바꾸지 않습니다.

## 테마 선택

다이어그램 바로 안에 `theme` 문장을 최대 하나 추가합니다.

```stack
stack 1.0

diagram "Dark architecture" {
  theme dark

  node api "API"
}
```

생략하면 `default`를 사용합니다. Draft Stack 1.0은 코어 catalog에 다음 테마를 요구합니다.

| Theme     | 용도                                                        |
| --------- | ----------------------------------------------------------- |
| `default` | 일반 아키텍처 다이어그램을 위한 균형 잡힌 blue-gray surface |
| `light`   | 밝은 문서를 위한 따뜻한 중립 surface                        |
| `dark`    | 어두운 캔버스를 위한 고대비 차가운 surface                  |

소스는 식별자만 선택하며 catalog package 버전을 고르지 않습니다. 렌더 metadata는 사용한 시각 데이터를 식별하도록 catalog 버전과 content revision을 기록합니다.

생성 다이어그램 테마는 Playground의 라이트/다크 UI와 독립적입니다. 테마는 palette, typography metric, surface, icon, connector, background를 바꿀 수 있지만 노드, 그룹, 엣지, 라벨, kind, 방향, 레이아웃 제약을 숨기거나 바꿀 수 없습니다.

## Fallback 동작

세 코어 테마는 렌더러 필수 리소스입니다. 설치된 catalog에 없는 non-core 테마는 `STK6001` 경고 후 `default`로 렌더링합니다. 소스에 테마 식별자가 있다고 네트워크에서 테마를 가져오지 않습니다.

테마 식별자는 일반 Stack 식별자 문법을 사용합니다. 한 번 등록된 식별자는 폐기된 뒤에도 다른 테마에 재할당할 수 없습니다.

## Kind fallback 아이콘

각 테마는 모든 노드 kind에 fallback을 제공합니다. `icon`을 생략하면 렌더러가 이를 사용합니다.

| Node kind  | 현재 논리 fallback 아이콘 |
| ---------- | ------------------------- |
| `actor`    | `kind-actor`              |
| `client`   | `kind-client`             |
| `service`  | `kind-service`            |
| `function` | `kind-function`           |
| `worker`   | `kind-worker`             |
| `database` | `kind-database`           |
| `cache`    | `kind-cache`              |
| `queue`    | `kind-queue`              |
| `storage`  | `kind-storage`            |
| `external` | `kind-external`           |

현재 공개 코어 catalog는 `default`, `light`, `dark`에 이 열 개 식별자를 포함하지만 `postgresql`, `aws`, `github` 같은 벤더 아이콘은 아직 없습니다. 대부분의 문서는 의미에 맞는 `kind`를 선택하고 `icon`을 생략하세요.

## 명시적 아이콘

명시적 아이콘은 인용된 논리 식별자입니다.

```stack
stack 1.0

diagram "Icon fallback" {
  node primary "Primary database" {
    kind database
    icon "postgresql"
  }
}
```

아이콘은 노드를 꾸밀 뿐 `database` kind나 접근성 라벨을 바꾸지 않습니다. 유효 테마에 `postgresql`이 없으면 `kind-database`로 계속 렌더링하고 `STK5001`을 냅니다. 테마마다 그림은 다를 수 있지만 같은 식별자는 같은 논리 대상을 의미해야 합니다.

## Catalog와 에셋 안전성

공개 `stack-sh/theme` catalog가 palette, 결정적 폰트 metric, node-kind visual, connector, icon metadata, SVG bytes, provenance, 재배포 권한을 소유합니다. Catalog 에셋은 렌더러에 번들되며 작성한 식별자는 파일 경로나 URL로 취급하지 않습니다.

SVG 검증은 script, event handler, nested SVG, unsafe reference, data/network URL, style attribute, allowlist 밖의 요소와 속성을 거부합니다. 아이콘만 의미의 유일한 단서가 될 수 없으며 라벨과 비색상 구분을 유지해야 합니다.
