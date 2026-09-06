import path from "path";
import { fileURLToPath } from "url";
import { loadSwCostData } from "../sw-cost.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const data = loadSwCostData(path.join(dirname, "..", "data", "sw-cost-standards.json"));
let failed = 0;

for (const source of data.sources.filter((item) => item.checks?.length)) {
  try {
    const response = await fetch(source.url, {
      headers: { "user-agent": "pumsem-mcp-source-check/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = (await response.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const missing = source.checks.filter((value) => !text.includes(value));
    if (missing.length) throw new Error(`검증 문자열 누락: ${missing.join(", ")}`);
    console.log(`OK ${source.id}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${source.id}: ${error.message}`);
  }
}

if (failed) process.exitCode = 1;
