# 표준품셈(2026) MCP 서버

2026년 건설공사 표준품셈(공통부문 1~8장, 건축부문 전체, 유지관리부문 전체, 총 618개 항목)을
검색·조회할 수 있는 원격 MCP(Model Context Protocol) 서버입니다.

항목을 조회하면 마크다운 표와 함께 **탭 구분(TSV) 복사 블록**이 나와, 표를 엑셀·한글에 그대로 붙여넣을 수 있습니다.

> ⚠️ 참고용 자료입니다. 공식 수치 확인은 반드시 한국건설기술연구원 CODIL(www.codil.or.kr)을 이용하시기 바랍니다.

## 현재 배포 상태

| 항목 | 내용 |
|---|---|
| 상태 | 운영 중 |
| 플랫폼 | Fly.io (리전: nrt, Tokyo) |
| 서비스 URL | https://pyojunpumsem-mcp.fly.dev |
| MCP 엔드포인트 | https://pyojunpumsem-mcp.fly.dev/mcp |
| 헬스체크 | `curl https://pyojunpumsem-mcp.fly.dev/` → `{"name":"pyojunpumsem-mcp","status":"ok","items":618,"endpoint":"/mcp"}` |

Claude에 바로 연결하려면 아래 [Claude에 연결하기](#claude에-연결하기) 섹션으로 이동하시면 됩니다.

## 제공 도구(Tools)

| 도구명 | 설명 |
|---|---|
| `search_pyojunpumsem` | 키워드로 항목 검색 (항목코드/제목/장·절/본문 대상) |
| `get_pyojunpumsem_item` | 항목코드로 상세 내용(표 포함) 조회 |
| `list_pyojunpumsem_chapters` | 부문/장/절 목차 조회 |
| `list_pyojunpumsem_items_in_section` | 특정 장/절에 속한 항목 목록 조회 |

## 프로젝트 구조

```
pyojunpumsem-mcp/
├── index.js              # MCP 서버 본체 (Node.js, StreamableHTTP, stateless)
├── package.json
├── package-lock.json
├── Dockerfile             # Fly.io / Cloud Run 공용 컨테이너 정의
├── .dockerignore
├── .gitignore
├── data/
│   └── pyojunpumsem.json  # 표준품셈 추출 데이터 (618개 항목)
└── README.md
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
"철근콘크리트 타설 관련 품셈 알려줘"
"유리 관련 품셈 정리해줘"
"현장정리"
```

→ 항목코드·제목·소속 장절·원문 페이지가 목록으로 반환됩니다. 결과가 많을 때는
`"건축부문만 찾아줘"`처럼 부문을 좁혀서 다시 물어보면 `bumun` 옵션이 자동 적용됩니다.

### ② 특정 항목 상세 보기 — `get_pyojunpumsem_item`

```
"2-11-2번 자세히 보여줘"
"10-3-1 표까지 다 보여줘"
```

→ 해당 항목의 본문 문단과 표(수량·단위·품)가 마크다운 표 형태로 그대로 반환됩니다.
검색 결과에서 항목코드만 알면 바로 조회할 수 있습니다.

**표 복사(엑셀·한글 붙여넣기):** 각 표 바로 아래에 탭 구분(TSV) 코드 블록이 함께 표시됩니다.
코드 블록 우측 상단의 복사 아이콘을 누른 뒤 엑셀·한글에 붙여넣으면 셀이 자동으로 나뉩니다.
표가 여러 개인 항목은 표마다 복사 블록이 따로 붙습니다.
(한글에서는 표를 먼저 만들어 첫 칸을 클릭해 붙여넣거나, 골라 붙이기 `Ctrl+Alt+V`로 넣으면 깔끔합니다.)

### ③ 목차 훑어보기 — `list_pyojunpumsem_chapters`

```
"건축부문 목차 보여줘"
"전체 목차 알려줘"
```

→ 부문 → 장 → 절 순서로 전체 구조가 나열됩니다. 어떤 절에 무엇이 있는지 감이 안 잡힐 때 먼저 물어보기 좋습니다.

### ④ 특정 장/절의 항목 전부 보기 — `list_pyojunpumsem_items_in_section`

```
"공통부문 6장에 어떤 항목들 있어?"
"10-3절 항목 목록 보여줘"
```

→ 지정한 장(또는 장+절) 범위에 속한 항목코드·제목이 전부 나열됩니다.

### 활용 팁

- 항목코드를 몰라도 됩니다. 키워드 검색 → 결과에서 코드 확인 → 상세 조회, 순서로 자연스럽게 이어집니다.
- "3-1-2랑 3-1-3 둘 다 비교해줘"처럼 여러 항목을 한 번에 요청해도 Claude가 도구를 여러 번 호출해 정리해 줍니다.
- 검색 결과가 618개 항목 중 원하는 게 없다면, 이는 검색 범위(공통부문 1~8장·건축부문·유지관리부문)에 포함되지 않은 항목일 수 있습니다.

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
    contents="철근콘크리트 타설 관련 표준품셈 알려줘",
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

기존 배포는 위에 안내된 URL로 이미 운영 중입니다. 코드를 수정한 뒤 재배포하시거나,
동일한 서버를 다른 계정에 새로 배포하실 경우 아래 절차를 따르시면 됩니다.

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

- 원본: 2026년 건설공사 표준품셈 PDF (원문정오표 1차 반영본)
- 추출 범위: 공통부문 1~8장, 건축부문 전체, 유지관리부문 전체
- 추출 방식: pdfplumber 기반 explicit grid 파싱(표준품셈 검색 웹앱과 동일 파이프라인 결과물 재사용)

## 참고

- 관리 부서: 전라남도교육청 교육시설과
- 본 데이터는 참고용이며, 공식 수치는 반드시 한국건설기술연구원 CODIL(www.codil.or.kr)에서 확인하시기 바랍니다.
