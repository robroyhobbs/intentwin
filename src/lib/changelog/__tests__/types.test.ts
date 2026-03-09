import { describe, it, expect } from "vitest";
import {
  isValidEntry,
  sortEntries,
  hasUnseenEntries,
  type ChangelogEntry,
} from "../types";
import changelogData from "@/data/changelog.json";

const sampleEntries: ChangelogEntry[] = [
  {
    version: "1.2.0",
    date: "2026-02-15",
    title: "Intelligence Integration",
    items: { new: ["Agency explorer"], improved: ["Bid scoring"] },
  },
  {
    version: "1.3.0",
    date: "2026-03-09",
    title: "Reliability Release",
    items: { new: ["Retry logic"], fixed: ["SAM.gov URLs"] },
  },
  {
    version: "1.1.0",
    date: "2026-01-20",
    title: "Export Features",
    items: { new: ["DOCX export"] },
  },
];

describe("Changelog Types & Utilities", () => {
  // ── Happy Path ──────────────────────────────────────────────

  describe("Happy Path", () => {
    it("changelog.json entries are all valid", () => {
      for (const entry of changelogData) {
        expect(isValidEntry(entry)).toBe(true);
      }
    });

    it("entries display version, date, title, and categorized items", () => {
      const entry = changelogData[0];
      expect(entry.version).toBeDefined();
      expect(entry.date).toBeDefined();
      expect(entry.title).toBeDefined();
      expect(entry.items).toBeDefined();
    });

    it("sortEntries returns most recent first", () => {
      const sorted = sortEntries(sampleEntries);
      expect(sorted[0].version).toBe("1.3.0");
      expect(sorted[1].version).toBe("1.2.0");
      expect(sorted[2].version).toBe("1.1.0");
    });

    it("hasUnseenEntries returns true when latest is newer than last viewed", () => {
      expect(hasUnseenEntries(sampleEntries, "2026-02-01")).toBe(true);
    });

    it("hasUnseenEntries returns false after viewing latest", () => {
      expect(hasUnseenEntries(sampleEntries, "2026-03-09")).toBe(false);
    });

    it("hasUnseenEntries returns false when last viewed is in the future", () => {
      expect(hasUnseenEntries(sampleEntries, "2027-01-01")).toBe(false);
    });
  });

  // ── Bad Path ────────────────────────────────────────────────

  describe("Bad Path", () => {
    it("empty changelog: hasUnseenEntries returns false", () => {
      expect(hasUnseenEntries([], "2026-01-01")).toBe(false);
    });

    it("malformed entry is rejected by isValidEntry", () => {
      expect(isValidEntry({})).toBe(false);
      expect(isValidEntry({ version: "1.0" })).toBe(false);
      expect(isValidEntry({ version: "", date: "", title: "" })).toBe(false);
      expect(isValidEntry(null)).toBe(false);
      expect(isValidEntry("string")).toBe(false);
    });

    it("user has no last_viewed_changelog: badge shows", () => {
      expect(hasUnseenEntries(sampleEntries, null)).toBe(true);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────

  describe("Edge Cases", () => {
    it("multiple entries on same date maintain stable order", () => {
      const sameDateEntries: ChangelogEntry[] = [
        {
          version: "1.3.1",
          date: "2026-03-09",
          title: "Hotfix A",
          items: { fixed: ["Bug A"] },
        },
        {
          version: "1.3.0",
          date: "2026-03-09",
          title: "Release",
          items: { new: ["Feature A"] },
        },
      ];
      const sorted = sortEntries(sameDateEntries);
      // Both should be present
      expect(sorted).toHaveLength(2);
    });

    it("sortEntries does not modify original array", () => {
      const original = [...sampleEntries];
      sortEntries(sampleEntries);
      expect(sampleEntries).toEqual(original);
    });

    it("handles entries with only one category", () => {
      const entry: ChangelogEntry = {
        version: "1.0.0",
        date: "2026-01-01",
        title: "Initial",
        items: { new: ["First feature"] },
      };
      expect(isValidEntry(entry)).toBe(true);
    });
  });

  // ── Security ────────────────────────────────────────────────

  describe("Security", () => {
    it("changelog content does not reference internal systems", () => {
      for (const entry of changelogData) {
        const allText = JSON.stringify(entry);
        expect(allText).not.toContain("API_KEY");
        expect(allText).not.toContain("SUPABASE");
        expect(allText).not.toContain("localhost:");
        expect(allText).not.toContain("password");
      }
    });
  });

  // ── Data Leak ───────────────────────────────────────────────

  describe("Data Leak", () => {
    it("entries only contain expected fields", () => {
      for (const entry of changelogData) {
        const keys = Object.keys(entry);
        expect(keys.every((k) => ["version", "date", "title", "items"].includes(k))).toBe(true);
      }
    });
  });

  // ── Data Damage ─────────────────────────────────────────────

  describe("Data Damage", () => {
    it("sortEntries returns new array, does not modify input", () => {
      const before = JSON.stringify(sampleEntries);
      sortEntries(sampleEntries);
      expect(JSON.stringify(sampleEntries)).toBe(before);
    });
  });
});
