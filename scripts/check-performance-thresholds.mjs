#!/usr/bin/env node
import fs from "node:fs";

const baselinePath = "docs/plans/performance-baseline.json";
if (!fs.existsSync(baselinePath)) {
  console.error(`Missing baseline file: ${baselinePath}`);
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));

const limits = {
  typecheck_seconds: Number(process.env.PERF_MAX_TYPECHECK_SECONDS ?? 10),
  unit_test_seconds: Number(process.env.PERF_MAX_UNIT_TEST_SECONDS ?? 12),
  build_seconds: Number(process.env.PERF_MAX_BUILD_SECONDS ?? 35),
  next_static_chunks_kb: Number(process.env.PERF_MAX_STATIC_CHUNKS_KB ?? 6000),
};

const failures = Object.entries(limits).flatMap(([key, max]) => {
  const value = baseline[key];
  if (typeof value !== "number") return [`${key} missing/invalid in baseline`];
  return value > max ? [`${key}=${value} exceeds ${max}`] : [];
});

if (failures.length > 0) {
  console.error("Performance threshold check failed:");
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log("Performance threshold check passed.");
console.log(JSON.stringify({ baseline, limits }, null, 2));
