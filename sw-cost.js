import fs from "fs";

export function loadSwCostData(dataPath) {
  return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

function sourceMap(data) {
  return new Map(data.sources.map((source) => [source.id, source]));
}

export function flattenSwCostData(data) {
  const commonSourceId = "source-sw-wage-2026";
  const items = [
    ...data.sources.map((item) => ({ ...item, kind: "기준문서", source_ids: [item.id] })),
    ...data.methods.map((item) => ({ ...item, kind: "산정방식" })),
    ...data.planning_rates.map((item) => ({ ...item, kind: "단가" })),
    ...data.sw_wages.map((item) => ({
      ...item,
      kind: "평균임금",
      category: "인건비",
      source_ids: [commonSourceId],
    })),
    ...data.database_rates.map((item) => ({ ...item, kind: "단가" })),
    ...data.templates.map((item) => ({ ...item, kind: "산정양식" })),
  ];

  const sources = sourceMap(data);
  return items.map((item) => ({
    ...item,
    sources: (item.source_ids || []).map((id) => sources.get(id)).filter(Boolean),
  }));
}

export function searchSwCostItems(data, { query, category, year, limit = 15 }) {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return flattenSwCostData(data)
    .filter((item) => {
      if (category && item.category !== category) return false;
      if (year && item.year !== year && !item.effective_from?.startsWith(String(year))) return false;
      const haystack = JSON.stringify(item).toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    })
    .slice(0, limit);
}

export function getSwCostItem(data, id) {
  return flattenSwCostData(data).find((item) => item.id === id);
}

export function listSwCostCategories(data) {
  const counts = new Map();
  for (const item of flattenSwCostData(data)) {
    counts.set(item.category, (counts.get(item.category) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => left.category.localeCompare(right.category, "ko"));
}

function formatWon(value) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function renderSwCostItem(item, notice) {
  const lines = [`[${item.id}] ${item.title}`, `구분: ${item.kind} / ${item.category}`];
  if (item.year) lines.push(`적용연도: ${item.year}년`);
  if (item.effective_from || item.effective_to) {
    lines.push(`적용기간: ${item.effective_from || "미상"} ~ ${item.effective_to || "계속"}`);
  }
  if (item.summary) lines.push(`개요: ${item.summary}`);
  if (item.amount != null) lines.push(`금액: ${formatWon(item.amount)}${item.unit === "원" ? "" : ` (${item.unit})`}`);
  if (item.monthly != null) {
    lines.push(`월평균: ${formatWon(item.monthly)}`);
    lines.push(`일평균: ${formatWon(item.daily)}`);
    lines.push(`시간평균: ${formatWon(item.hourly)}`);
  }
  if (item.base_daily != null) {
    lines.push(`기본급: ${formatWon(item.base_daily)}/일`);
    lines.push(`상여금 최대: ${formatWon(item.maximum_bonus_daily)}/일`);
    lines.push(`퇴직급여충당금 최대: ${formatWon(item.maximum_severance_daily)}/일`);
    lines.push(`최대 합계: ${formatWon(item.maximum_total_daily)}/일`);
  }
  if (item.inputs?.length) lines.push(`필요 입력값: ${item.inputs.join(", ")}`);
  if (item.included_roles?.length) lines.push(`포함직무: ${item.included_roles.join(", ")}`);
  if (item.sources?.length) {
    lines.push("공식 출처:");
    for (const source of item.sources) lines.push(`- ${source.publisher}: ${source.title}\n  ${source.url}`);
  }
  lines.push(`주의: ${notice}`);
  return lines.join("\n");
}
