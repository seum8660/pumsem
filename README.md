# 표준품셈(2026) MCP 서버

2026년 **건설·전기·정보통신·소방** 4개 분야 표준품셈(8개 부문, 총 2,888개 항목)을
검색·조회할 수 있는 원격 MCP(Model Context Protocol) 서버입니다.

항목을 조회하면 마크다운 표와 함께 **탭 구분(TSV) 복사 블록**이 나와, 표를 엑셀·한글에 그대로 붙여넣을 수 있습니다.

> ⚠️ 참고용 자료입니다. 공식 수치는 반드시 각 분야 관리기관의 원문(아래 [데이터 출처](#데이터-출처) 참조)에서 확인하시기 바랍니다.

## 수록 범위

| 분야 | 부문(`bumun` 값) | 항목 수 | 원문 | 관리기관 |
|---|---|---:|---|---|
| 건설 | 공통부문 · 토목부문 · 건축부문 · 기계설비부문 · 유지관리부문 | 1,092 | 2026년 건설공사 표준품셈 | 한국건설기술연구원 |
| 전기 | 전기부문 | 831 | 2026년 전기공사 표준품셈 | 대한전기협회 |
| 정보통신 | 정보통신부문 | 687 | 2026년 정보통신공사 표준품셈 | 한국정보통신산업연구원 |
| 소방 | 소방부문 | 278 | 2026년 소방공사 표준품셈 | 한국소방시설협회 |
| **합계** | **8개 부문** | **2,888** | | |

## 현재 배포 상태

| 항목 | 내용 |
|---|---|
| 상태 | 운영 중 |
| 플랫폼 | Fly.io (리전: nrt, Tokyo) |
| 서비스 URL | https://pyojunpumsem-mcp.fly.dev |
| MCP 엔드포인트 | https://pyojunpumsem-mcp.fly.dev/mcp |
| 헬스체크 | `curl https://pyojunpumsem-mcp.fly.dev/` |

헬스체크 정상 응답 예시(부문별 항목 수 `byBumun` 포함):

```json
{"name":"pyojunpumsem-mcp","status":"ok","items":2888,
 "byBumun":{"공통부문":…,"토목부문":…,"건축부문":…,"기계설비부문":…,"유지관리부문":…,
            "전기부문":831,"소방부문":278,"정보통신부문":687},
 "endpoint":"/mcp"}
```

Claude에 바로 연결하려면 아래 [Claude에 연결하기](#claude에-연결하기) 섹션으로 이동하시면 됩니다.

## 제공 도구(Tools)

| 도구명 | 설명 |
|---|---|
| `search_pyojunpumsem` | 키워드로 항목 검색 (항목코드/제목/장·절/본문 대상, 부문 한정 가능) |
| `get_pyojunpumsem_item` | 항목코드로 상세 내용(표 포함) 조회 |
| `list_pyojunpumsem_chapters` | 부문/장/절 목차 조회 |
| `list_pyojunpumsem_items_in_section` | 특정 장/절에 속한 항목 목록 조회 |

### 분야별 항목코드 체계

| 분야 | 체계 | 장번호(`chapter_no`) 예시 | 항목코드 예시 |
|---|---|---|---|
| 건설 | 장-절-항목 | `6` | `6-3-2` |
| 전기 | 장-절-항목 | `5` | `5-26-5` |
| 정보통신 | 장-절-항목(-세부) | `9` | `9-2-1-1` |
| 소방 | **편-장-절-세부** | `8-1` (제8편 제1장) | `8-1-1-1` |

같은 항목코드(예: `1-1-1`)가 여러 부문에 있으므로, 조회할 때 부문을 함께 지정하는 것이 정확합니다.

## 프로젝트 구조

```
pyojunpumsem-mcp/
├── index.js               # MCP 서버 본체 (Node.js, StreamableHTTP, stateless)
├── package.json
├── package-lock.json
├── Dockerfile              # Fly.io / Cloud Run 공용 컨테이너 정의
├── .dockerignore
├── .gitignore
├── data/
│   ├── pyojunpumsem.json   # 건설공사 5개 부문 (1,092개 항목)
│   ├── 전기부문.json        # 전기공사 (831개 항목)
│   ├── 정보통신부문.json    # 정보통신공사 (687개 항목)
│   └── 소방부문.json        # 소방공사 (278개 항목)
└── README.md
```

`index.js`의 `DATA_FILES` 목록에 있는 파일을 모두 읽어 하나의 데이터로 합칩니다.
분야를 추가할 때는 같은 스키마의 JSON을 `data/`에 넣고 `DATA_FILES`와 `BUMUN_LIST`에 이름을 추가하면 됩니다.

```javascript
const DATA_FILES = ["pyojunpumsem.json", "전기부문.json", "소방부문.json", "정보통신부문.json"];
```

## 로컬 실행

```bash
npm install
npm start
# http://localhost:3000/mcp 에서 대기
```

## Claude에 연결하기

### 방법 A — Claude.ai 웹/모바일 (권장, Free 플랜 포함 모든 요금제 가능)

1. Claude.ai 접속 → **Customize(맞춤 설정)** → **Connectors(커넥터)**
2. **"+"** 버튼 클릭
3. 아래 값을 그대로 입력
   - 이름: `표준품셈`
   - URL: `https://pyojunpumsem-mcp.fly.dev/mcp`
4. **Add** → **Connect**

> 무료(Free) 플랜은 커스텀 커넥터를 1개까지 등록할 수 있습니다.
> 이미 연결해 두신 경우, 서버가 갱신되면 별도 작업 없이 새 분야가 바로 조회됩니다.

### 방법 B — Claude Desktop (로컬 config 파일)

`claude_desktop_config.json`에 아래와 같이 등록합니다.
(경로: `%APPDATA%\Claude\claude_desktop_config.json` 또는
MSIX 설치 시 `C:\Users\<사용자명>\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "표준품셈": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://pyojunpumsem-mcp.fly.dev/mcp"
      ]
    }
  }
}
```

설정 저장 후 Claude Desktop을 재시작하면 표준품셈 검색 도구를 바로 사용할 수 있습니다.

## 사용법 (Claude)

커넥터 등록이 끝나면 별도 명령어 없이, 대화창에 자연어로 질문하면 Claude가 알맞은 도구를 자동으로 호출합니다.

### ① 키워드로 찾기 — `search_pyojunpumsem`

```
"철근콘크리트 타설 관련 품셈 알려줘"            (건설)
"전기부문에서 전선관 배관 품 찾아줘"            (전기)
"정보통신부문 CCTV 카메라 설치 품셈 알려줘"      (정보통신)
"소방부문 스프링클러 헤드 설치 품 찾아줘"        (소방)
```

→ 항목코드·제목·소속 장절·원문 페이지가 목록으로 반환됩니다.
**분야 이름(전기·정보통신·소방·건축 등)을 함께 말하면** `bumun` 옵션이 자동 적용되어 결과가 정확해집니다.

### ② 특정 항목 상세 보기 — `get_pyojunpumsem_item`

```
"건축부문 2-11-2 자세히 보여줘"
"전기부문 5-26-5 표까지 다 보여줘"
"소방부문 8-1-1-1 보여줘"
```

→ 해당 항목의 본문 문단과 표(수량·단위·품)가 마크다운 표 형태로 반환됩니다.
같은 항목코드가 여러 부문에 있으면 어느 부문인지 되물어보므로, 처음부터 부문을 함께 말하는 것이 편리합니다.

**표 복사(엑셀·한글 붙여넣기):** 각 표 바로 아래에 탭 구분(TSV) 코드 블록이 함께 표시됩니다.
코드 블록 우측 상단의 복사 아이콘을 누른 뒤 엑셀·한글에 붙여넣으면 셀이 자동으로 나뉩니다.
표가 여러 개인 항목은 표마다 복사 블록이 따로 붙습니다.
(한글에서는 표를 먼저 만들어 첫 칸을 클릭해 붙여넣거나, 골라 붙이기 `Ctrl+Alt+V`로 넣으면 깔끔합니다.)

### ③ 목차 훑어보기 — `list_pyojunpumsem_chapters`

```
"건축부문 목차 보여줘"
"정보통신부문 목차 알려줘"
"전체 목차 알려줘"
```

→ 부문 → 장 → 절 순서로 전체 구조가 나열됩니다.

### ④ 특정 장/절의 항목 전부 보기 — `list_pyojunpumsem_items_in_section`

```
"공통부문 6장에 어떤 항목들 있어?"
"전기부문 10장 항목 목록 보여줘"
"소방부문 8-1장(제8편 제1장) 항목 보여줘"
```

→ 지정한 장(또는 장+절) 범위에 속한 항목코드·제목이 전부 나열됩니다.
소방부문은 편과 장을 함께 쓴 `8-1` 형식이 장번호입니다.

### 활용 팁

- 항목코드를 몰라도 됩니다. 키워드 검색 → 결과에서 코드 확인 → 상세 조회, 순서로 자연스럽게 이어집니다.
- "3-1-2랑 3-1-3 둘 다 비교해줘"처럼 여러 항목을 한 번에 요청해도 Claude가 도구를 여러 번 호출해 정리해 줍니다.
- **분야 간 중복 공종에 주의하십시오.** 예를 들어 감지기·비상콘센트는 전기부문(제10장 소방전기설비공사)과 소방부문에 모두 있으며 품이 다를 수 있습니다. 적용할 분야를 지정해 조회하시기 바랍니다.
- 전기·정보통신·소방 품셈의 "타 부문 품 준용" 규정에 따라 건설부문 항목을 함께 조회해야 하는 경우도 있습니다.
- 정보통신부문의 삭제·이동 항목(예: `9-2-7 통화겸용 비상벨 (9-4-20-2 항목 이동)`)은 본문 없이 제목만 남겨 이동 위치를 안내합니다.

## Gemini에서 사용하기

MCP는 Anthropic이 만든 개방형 표준이라 Claude 외에 Google Gemini에서도 동일한 서버를 그대로 연결해 쓸 수 있습니다.
(2026년 기준 Gemini 쪽 MCP 지원은 아직 실험적 단계이며, tools 호출만 지원합니다.)

### Antigravity CLI (구 Gemini CLI 후속)

`~/.gemini/settings.json`에 아래와 같이 등록합니다.

```json
{
  "mcpServers": {
    "pyojunpumsem": {
      "httpUrl": "https://pyojunpumsem-mcp.fly.dev/mcp"
    }
  }
}
```

등록 후 세션 중 슬래시 명령으로 활성화/비활성화할 수 있습니다.

```
/mcp enable pyojunpumsem
/mcp disable pyojunpumsem
```

### Gemini API (Python/JavaScript SDK)

코드에서 직접 원격 MCP 서버를 도구로 전달할 수 있습니다.

```python
from google import genai

client = genai.Client()
response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents="전기부문 전선관 배관 표준품셈 알려줘",
    config={
        "tools": [
            {
                "mcp_server": {
                    "url": "https://pyojunpumsem-mcp.fly.dev/mcp"
                }
            }
        ]
    },
)
print(response.text)
```

> 참고: Gemini 쪽은 `resources`/`prompts` 등 MCP의 다른 기능은 지원하지 않으며, 도구(tools) 목록만 조회해 사용합니다.
> 표준품셈 MCP는 도구 기반으로만 구성되어 있어 이 부분은 문제되지 않습니다.

## 재배포 / 새로 배포하기

기존 배포는 위에 안내된 URL로 이미 운영 중입니다. 코드나 데이터를 수정한 뒤 재배포하시거나,
동일한 서버를 다른 계정에 새로 배포하실 경우 아래 절차를 따르시면 됩니다.

> `fly deploy`는 **GitHub가 아니라 로컬 폴더의 파일**로 이미지를 만듭니다.
> 데이터(JSON)나 `index.js`를 바꿨다면 먼저 로컬 폴더에 반영한 뒤 배포하십시오.

### Fly.io (현재 사용 중인 플랫폼)

```bash
# 최초 1회
fly launch      # Dockerfile 자동 감지, App name/Region 입력

# fly.toml의 [http_service] internal_port가 8080인지 확인
# (Dockerfile의 ENV PORT=8080과 일치해야 함)

# 배포 / 재배포
fly deploy
```

> 2026년 기준 Fly.io는 신규 가입자에게 완전 무료 등급을 제공하지 않습니다.
> 카드 등록이 필요하며 최소 사양도 월 2달러 미만의 소액이 청구될 수 있습니다.

### Google Cloud Run (완전 무료 대안)

무료 한도(월 200만 요청, 콜드스타트 1~2초)로 운영하고 싶을 경우의 대안입니다.

```bash
gcloud auth login
gcloud config set project <프로젝트ID>

gcloud run deploy pyojunpumsem-mcp \
  --source . \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --port 8080
```

배포가 끝나면 터미널에 서비스 URL이 출력됩니다. Cloud Console에서 GitHub 저장소를 직접 연결해
Dockerfile을 자동 감지시키는 방식(Cloud Run 콘솔 → 서비스 만들기 → 소스 저장소 연결)도 가능합니다.

## 데이터 출처

| 분야 | 원문 | 관리기관 | 공식 확인처 |
|---|---|---|---|
| 건설 | 2026년 건설공사 표준품셈 (원문정오표 1차 반영본) | 한국건설기술연구원 | CODIL (www.codil.or.kr) |
| 전기 | 2026년 전기공사 표준품셈 | 대한전기협회 | 대한전기협회 |
| 정보통신 | 2026년 정보통신공사 표준품셈 | 한국정보통신산업연구원 | www.kici.re.kr |
| 소방 | 2026년 소방공사 표준품셈 (타공종 반영) | 한국소방시설협회 | www.ekffa.or.kr |

### 추출 방식

- 공통: `pdfplumber` 기반 PDF 파싱, 부문 공통 스키마(`b`, `cn`, `ct`, `sc`, `st`, `ic`, `it`, `pg`, `bl`, `tx`)로 변환
- 전기·정보통신·소방: 각 PDF의 **목차 항목코드를 기준으로 본문 제목을 대조**하여 누락·순서 오류 0건 확인
- 괘선이 불완전한 표(행 구분선·테두리 없음)는 세로 괘선 좌표로 열을, 글자 높이로 행을 나누는 **좌표 기반 재구성** 적용
- 정보통신부문 부록(예정가격작성기준, 이행점검 권장 점검표, 관리업무 흐름도)과 소방부문 부록(이행점검 권장 점검표)도 함께 수록

## 참고

- 본 데이터는 참고용이며, 공식 수치는 반드시 각 분야 관리기관의 원문에서 확인하시기 바랍니다.
- 여러 줄로 된 병합 셀은 추출 과정에서 행이 나뉘어 표시될 수 있으므로, 수치를 인용하실 때는 원문 페이지(`p.`)로 확인하시기 바랍니다.
- `pg`(원문 페이지)는 각 품셈 책자에 인쇄된 쪽번호 기준입니다.
