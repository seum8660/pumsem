import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// 데이터 로드
// ---------------------------------------------------------------------------
const DATA_PATH = path.join(__dirname, "data", "pyojunpumsem.json");
const DATA = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

console.error(`[표준품셈 MCP] 데이터 로드 완료: 총 ${DATA.length}개 항목`);

// 부문/장/절 목차 인덱스 미리 구성
function buildIndex() {
  const index = {};
  for (const item of DATA) {
    const b = item.b; // 부문
    const cn = item.cn; // 장 번호
    const ct = item.ct; // 장 제목
    const sc = item.sc; // 절 번호
    const st = item.st; // 절 제목
    index[b] ??= {};
    const chapterKey = `${cn}|${ct}`;
    index[b][chapterKey] ??= new Set();
    index[b][chapterKey].add(`${sc}|${st}`);
  }
  const result = {};
  for (const b of Object.keys(index)) {
    result[b] = Object.entries(index[b])
      .map(([chapterKey, sections]) => {
        const [cn, ct] = chapterKey.split("|");
        return {
          장번호: cn,
          장제목: ct,
          절목록: [...sections]
            .map((s) => {
              const [sc, st] = s.split("|");
              return { 절번호: sc, 절제목: st };
            })
            .sort((a, b) => a.절번호.localeCompare(b.절번호, "ko", { numeric: true })),
        };
      })
      .sort((a, b) => Number(a.장번호) - Number(b.장번호));
  }
  return result;
}
const CHAPTER_INDEX = buildIndex();

// 표(table) 블록을 마크다운 표로 변환
function tableBlockToMarkdown(rows) {
  if (!rows || rows.length === 0) return "";
  const lines = [];
  rows.forEach((row, i) => {
    lines.push("| " + row.map((c) => (c ?? "").toString().replace(/\|/g, "\\|")).join(" | ") + " |");
    if (i === 0) {
      lines.push("| " + row.map(() => "---").join(" | ") + " |");
    }
  });
  return lines.join("\n");
}

// 표(table) 블록을 탭 구분(TSV) 텍스트로 변환 (엑셀·한글 붙여넣기용)
// 셀 안의 탭·줄바꿈은 TSV 구조가 깨지지 않도록 공백으로 치환한다.
function tableBlockToTsv(rows) {
  if (!rows || rows.length === 0) return "";
  return rows
    .map((row) =>
      row.map((c) => (c ?? "").toString().replace(/[\t\r\n]+/g, " ").trim()).join("\t")
    )
    .join("\n");
}

// 항목 블록 전체를 사람이 읽기 좋은 텍스트로 렌더링
function renderItem(item, { includeTables = true } = {}) {
  const header = `[${item.ic}] ${item.it}\n부문: ${item.b} / ${item.cn}장 ${item.ct} / ${item.sc} ${item.st} (원문 p.${item.pg})`;
  const bodyParts = [];
  for (const block of item.bl || []) {
    if (block.type === "p") {
      bodyParts.push(block.text);
    } else if (block.type === "table" && includeTables) {
      const md = tableBlockToMarkdown(block.rows);
      const tsv = tableBlockToTsv(block.rows);
      // 표(마크다운) 바로 아래에 복사용 TSV 코드 블록을 함께 붙인다.
      bodyParts.push(tsv ? `${md}\n\n\`\`\`text\n${tsv}\n\`\`\`` : md);
    }
  }
  return `${header}\n\n${bodyParts.join("\n\n")}`;
}

// ---------------------------------------------------------------------------
// MCP 서버 정의
// ---------------------------------------------------------------------------
function createServer() {
  const server = new McpServer(
    {
      name: "표준품셈(2026)",
      version: "1.0.0",
      description:
        "2026년 건설공사 표준품셈(공통부문 1~8장, 건축부문 전체, 유지관리부문 전체) 검색 MCP 서버. 참고용이며 공식 수치는 한국건설기술연구원 CODIL에서 확인 필요.",
    },
    { capabilities: { tools: {} } }
  );

  // 1) 키워드 검색
  server.registerTool(
    "search_pyojunpumsem",
    {
      title: "표준품셈 키워드 검색",
      description:
        "표준품셈 항목을 키워드로 검색합니다. 항목코드, 항목명, 장/절 제목, 본문 전체 텍스트를 대상으로 검색하며 공백으로 구분된 여러 단어는 모두 포함(AND)하는 항목만 반환합니다.",
      inputSchema: {
        query: z.string().describe("검색어 (예: '철근콘크리트', '방수', '조적 인력')"),
        bumun: z
          .enum(["공통부문", "건축부문", "유지관리부문"])
          .optional()
          .describe("부문으로 결과를 한정하고 싶을 때만 지정"),
        limit: z.number().int().min(1).max(50).optional().describe("최대 반환 개수 (기본 15)"),
      },
    },
    async ({ query, bumun, limit }) => {
      const tokens = query.trim().split(/\s+/).filter(Boolean);
      const max = limit ?? 15;
      const results = DATA.filter((item) => {
        if (bumun && item.b !== bumun) return false;
        const haystack = `${item.ic} ${item.it} ${item.ct} ${item.st} ${item.tx}`.toLowerCase();
        return tokens.every((t) => haystack.includes(t.toLowerCase()));
      }).slice(0, max);

      if (results.length === 0) {
        return {
          content: [{ type: "text", text: `"${query}"에 해당하는 표준품셈 항목을 찾을 수 없습니다.` }],
        };
      }

      const summary = results
        .map(
          (item) =>
            `- [${item.ic}] ${item.it} (${item.b} ${item.cn}장 ${item.ct} > ${item.sc} ${item.st}, 원문 p.${item.pg})`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `총 ${results.length}건 검색됨 (상위 ${max}건 이내)\n\n${summary}\n\n※ 상세 내용(표 포함)은 get_pyojunpumsem_item 도구에 항목코드를 입력하여 조회하시기 바랍니다.`,
          },
        ],
      };
    }
  );

  // 2) 항목코드로 상세 조회
  server.registerTool(
    "get_pyojunpumsem_item",
    {
      title: "표준품셈 항목 상세 조회",
      description:
        "항목코드(예: '1-1-1', '6-3-2')를 입력하면 해당 표준품셈 항목의 전체 본문과 표(수량·단위·품 등)를 반환합니다.",
      inputSchema: {
        item_code: z.string().describe("항목코드 (예: '1-1-1')"),
      },
    },
    async ({ item_code }) => {
      const item = DATA.find((d) => d.ic === item_code.trim());
      if (!item) {
        return {
          content: [
            {
              type: "text",
              text: `항목코드 "${item_code}"를 찾을 수 없습니다. search_pyojunpumsem 도구로 먼저 항목코드를 확인하시기 바랍니다.`,
            },
          ],
        };
      }
      return { content: [{ type: "text", text: renderItem(item) }] };
    }
  );

  // 3) 목차 조회 (부문/장/절 구조)
  server.registerTool(
    "list_pyojunpumsem_chapters",
    {
      title: "표준품셈 목차 조회",
      description:
        "표준품셈의 부문/장/절 목차 구조를 조회합니다. 부문을 지정하지 않으면 전체 부문(공통부문 1~8장, 건축부문, 유지관리부문) 목차를 반환합니다.",
      inputSchema: {
        bumun: z.enum(["공통부문", "건축부문", "유지관리부문"]).optional().describe("특정 부문만 조회하고 싶을 때 지정"),
      },
    },
    async ({ bumun }) => {
      const target = bumun ? { [bumun]: CHAPTER_INDEX[bumun] } : CHAPTER_INDEX;
      const lines = [];
      for (const [b, chapters] of Object.entries(target)) {
        lines.push(`■ ${b}`);
        for (const ch of chapters) {
          lines.push(`  ${ch.장번호}장 ${ch.장제목}`);
          for (const sec of ch.절목록) {
            lines.push(`    ${sec.절번호} ${sec.절제목}`);
          }
        }
      }
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  // 4) 특정 장/절 범위의 항목 목록 조회
  server.registerTool(
    "list_pyojunpumsem_items_in_section",
    {
      title: "특정 장/절의 표준품셈 항목 목록 조회",
      description: "부문과 장 번호(및 선택적으로 절 번호)를 지정하여 해당 범위에 속하는 모든 항목 목록(코드·제목)을 반환합니다.",
      inputSchema: {
        bumun: z.enum(["공통부문", "건축부문", "유지관리부문"]).describe("부문"),
        chapter_no: z.string().describe("장 번호 (예: '3')"),
        section_no: z.string().optional().describe("절 번호까지 좁히고 싶을 때 지정 (예: '3-2')"),
      },
    },
    async ({ bumun, chapter_no, section_no }) => {
      const results = DATA.filter((item) => {
        if (item.b !== bumun) return false;
        if (item.cn !== chapter_no.trim()) return false;
        if (section_no && item.sc !== section_no.trim()) return false;
        return true;
      });
      if (results.length === 0) {
        return { content: [{ type: "text", text: "해당 범위에 항목이 없습니다. list_pyojunpumsem_chapters로 목차를 먼저 확인하시기 바랍니다." }] };
      }
      const text = results
        .map((item) => `[${item.ic}] ${item.it}  (${item.sc} ${item.st}, p.${item.pg})`)
        .join("\n");
      return { content: [{ type: "text", text: `총 ${results.length}개 항목\n\n${text}` }] };
    }
  );

  return server;
}

// ---------------------------------------------------------------------------
// HTTP 서버 (StreamableHTTP transport, stateless)
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json({ limit: "5mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "pyojunpumsem-mcp",
    status: "ok",
    items: DATA.length,
    endpoint: "/mcp",
  });
});

app.post("/mcp", async (req, res) => {
  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless 모드
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[표준품셈 MCP] 요청 처리 오류:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// GET/DELETE 는 stateless 모드에서 지원하지 않음
app.get("/mcp", (_req, res) => {
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
});
app.delete("/mcp", (_req, res) => {
  res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.error(`[표준품셈 MCP] 서버 시작됨: http://localhost:${PORT}/mcp`);
});
