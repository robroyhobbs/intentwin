import { describe, it, expect } from "vitest";
import { extractJsonFromResponse } from "../extract-json";

describe("extractJsonFromResponse", () => {
  it("extracts JSON from markdown code block with json tag", () => {
    const input = '```json\n{ "key": "value" }\n```';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ key: "value" });
  });

  it("extracts JSON from markdown code block without json tag", () => {
    const input = '```\n{ "key": "value" }\n```';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ key: "value" });
  });

  it("extracts JSON from outermost braces in mixed text", () => {
    const input = 'some text { "key": "value" } more text';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ key: "value" });
  });

  it("parses raw JSON string directly", () => {
    const input = '{ "name": "test", "count": 42 }';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ name: "test", count: 42 });
  });

  it("handles truncated JSON gracefully (returns null)", () => {
    const input = '{ "key": "value", "nested": { "a": ';
    const result = extractJsonFromResponse(input);
    expect(result).toBeNull();
  });

  it("returns null for completely invalid input", () => {
    const result = extractJsonFromResponse("no json here at all");
    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = extractJsonFromResponse("");
    expect(result).toBeNull();
  });

  it("handles nested JSON objects correctly", () => {
    const input =
      '{ "outer": { "inner": { "deep": "value" } }, "top": "level" }';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({
      outer: { inner: { deep: "value" } },
      top: "level",
    });
  });

  it("handles JSON with arrays", () => {
    const input = '{ "items": [1, 2, 3], "tags": ["a", "b"] }';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ items: [1, 2, 3], tags: ["a", "b"] });
  });

  it("prefers code block extraction over brace extraction", () => {
    const input =
      'prefix { "wrong": true } ```json\n{ "right": true }\n``` suffix';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ right: true });
  });

  it("falls back to brace extraction when code block has invalid JSON", () => {
    const input = '```json\nnot valid json\n``` { "fallback": true }';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ fallback: true });
  });

  it("extracts object from a JSON-encoded response string", () => {
    const input = JSON.stringify('{ "key": "value" }');
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ key: "value" });
  });

  it("extracts fenced JSON from a JSON-encoded response string", () => {
    const input = JSON.stringify('```json\n{ "key": "value" }\n```');
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ key: "value" });
  });

  it("handles JSON with special characters in values", () => {
    const input = '{ "message": "Hello \\"world\\"", "path": "a/b/c" }';
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({ message: 'Hello "world"', path: "a/b/c" });
  });

  it("handles multiline JSON in code block", () => {
    const input = `\`\`\`json
{
  "name": "proposal",
  "sections": [
    { "id": "1", "title": "Executive Summary" },
    { "id": "2", "title": "Approach" }
  ]
}
\`\`\``;
    const result = extractJsonFromResponse(input);
    expect(result).toEqual({
      name: "proposal",
      sections: [
        { id: "1", title: "Executive Summary" },
        { id: "2", title: "Approach" },
      ],
    });
  });
});
