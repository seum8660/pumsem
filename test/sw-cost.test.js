import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  flattenSwCostData,
  getSwCostItem,
  listSwCostCategories,
  loadSwCostData,
  renderSwCostItem,
  searchSwCostItems,
} from "../sw-cost.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const data = loadSwCostData(path.join(dirname, "..", "data", "sw-cost-standards.json"));

test("flattens every supported record type", () => {
  assert.equal(flattenSwCostData(data).length, 59);
});

test("search uses AND tokens and category filter", () => {
  const results = searchSwCostItems(data, { query: "기능점수 재개발", category: "운영단계" });
  assert.deepEqual(results.map((item) => item.id), ["method-redevelopment"]);
});

test("returns current SW wage with official source", () => {
  const item = getSwCostItem(data, "wage-2026-application-developer");
  assert.equal(item.daily, 378250);
  assert.equal(item.sources[0].id, "source-sw-wage-2026");
});

test("lists categories with counts", () => {
  const categories = listSwCostCategories(data);
  assert.ok(categories.some((item) => item.category === "인건비" && item.count === 18));
});

test("renders amounts, source URL and notice", () => {
  const item = getSwCostItem(data, "rate-2026-isp");
  const rendered = renderSwCostItem(item, data.metadata.notice);
  assert.match(rendered, /11,821,610원/);
  assert.match(rendered, /https:\/\/www\.sw\.or\.kr/);
  assert.match(rendered, /최종 예정가격/);
});
