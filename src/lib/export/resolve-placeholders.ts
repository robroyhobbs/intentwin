// ── Resolve Placeholders ── Auto-substitute merge fields before export ───────
// Replaces {date}, {client_name}, {signatory_name}, {signatory_title} using
// extracted intake data and L1 sources. Fills [CASE STUDY NEEDED] and
// [TEAM MEMBER NEEDED] from evidence library and team members.

import type { EvidenceLibraryEntry, TeamMember } from "@/types/idd";

export interface PlaceholderValues {
  date: string;
  client_name: string;
  signatory_name: string;
  signatory_title: string;
}

export interface L1Sources {
  teamMembers: TeamMember[];
  evidenceLibrary: EvidenceLibraryEntry[];
}

/** Build a brief inline summary from an evidence entry. */
function formatCaseStudy(ev: EvidenceLibraryEntry): string {
  const parts = [ev.title];
  if (ev.summary) parts.push(ev.summary);
  if (ev.metrics && ev.metrics.length > 0) {
    const metricStr = ev.metrics
      .slice(0, 3)
      .map((m) => `${m.name}: ${m.value}`)
      .join("; ");
    parts.push(`Key metrics: ${metricStr}`);
  }
  return parts.join(". ");
}

/** Build a brief inline bio from a team member. */
function formatTeamMember(tm: TeamMember): string {
  const parts = [`${tm.name}`];
  if (tm.title) parts[0] += `, ${tm.title}`;
  if (tm.years_experience)
    parts.push(`${tm.years_experience} years experience`);
  if (tm.certifications?.length) {
    parts.push(tm.certifications.slice(0, 3).join(", "));
  }
  return parts.join(" — ");
}

/** Find the best matching evidence entry for a gap marker's hint text. */
function matchEvidence(
  hint: string,
  library: EvidenceLibraryEntry[],
  usedIds: Set<string>,
): EvidenceLibraryEntry | undefined {
  const lower = hint.toLowerCase();
  const keywords = lower
    .split(/[,|]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Score each unused entry by keyword overlap
  let best: EvidenceLibraryEntry | undefined;
  let bestScore = 0;
  for (const ev of library) {
    if (usedIds.has(ev.id)) continue;
    const haystack = [ev.title, ev.summary, ev.client_industry, ev.service_line]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = ev;
    }
  }
  // If no keyword match, use the first unused entry
  if (!best) {
    best = library.find((ev) => !usedIds.has(ev.id));
  }
  return best;
}

/** Find the best matching team member for a role hint. */
function matchTeamMember(
  hint: string,
  members: TeamMember[],
  usedIds: Set<string>,
): TeamMember | undefined {
  const lower = hint.toLowerCase();
  const keywords = lower.split(/[\s,]+/).filter((w) => w.length > 2);

  let best: TeamMember | undefined;
  let bestScore = 0;
  for (const tm of members) {
    if (usedIds.has(tm.id)) continue;
    const haystack = [tm.name, tm.role, tm.title, ...(tm.skills || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = tm;
    }
  }
  if (!best) {
    best = members.find((tm) => !usedIds.has(tm.id));
  }
  return best;
}

/** Replace {date}, {client_name}, {signatory_name}, {signatory_title}. */
function substituteMergeFields(text: string, v: PlaceholderValues): string {
  let r = text;
  r = r.replace(/\{date\}/g, v.date);
  r = r.replace(/\{client_name\}/g, v.client_name);
  r = r.replace(/\{signatory_name\}/g, v.signatory_name);
  if (v.signatory_title) {
    r = r.replace(/\{signatory_title\}/g, v.signatory_title);
  } else {
    r = r.replace(/,\s*\{signatory_title\}/g, "");
    r = r.replace(/\{signatory_title\}/g, "");
  }
  return r;
}

/**
 * Replace all merge fields and gap markers in section content using
 * extracted data and L1 sources. Exported documents come out clean.
 */
export function resolvePlaceholders(
  content: string,
  values: PlaceholderValues,
  l1?: L1Sources,
): string {
  let result = substituteMergeFields(content, values);

  // Fill [CASE STUDY NEEDED: ...] from evidence library
  if (l1?.evidenceLibrary?.length) {
    const usedIds = new Set<string>();
    result = result.replace(
      /\[CASE STUDY NEEDED:([^\]]*)\]/g,
      (_match, hint: string) => {
        const ev = matchEvidence(hint, l1.evidenceLibrary, usedIds);
        if (ev) {
          usedIds.add(ev.id);
          return formatCaseStudy(ev);
        }
        return "";
      },
    );
  } else {
    result = result.replace(/\[CASE STUDY NEEDED:[^\]]*\]/g, "");
  }

  // 3. Fill [TEAM MEMBER NEEDED: ...] from team members
  if (l1?.teamMembers?.length) {
    const usedIds = new Set<string>();
    result = result.replace(
      /\[TEAM MEMBER NEEDED:([^\]]*)\]/g,
      (_match, hint: string) => {
        const tm = matchTeamMember(hint, l1.teamMembers, usedIds);
        if (tm) {
          usedIds.add(tm.id);
          return formatTeamMember(tm);
        }
        return "";
      },
    );
  } else {
    result = result.replace(/\[TEAM MEMBER NEEDED:[^\]]*\]/g, "");
  }

  // 4. Strip any remaining gap markers
  result = result.replace(/\[PRODUCT NEEDED:[^\]]*\]/g, "");
  result = result.replace(/\$TBD/g, "");

  // 5. Clean up double-blank-lines from stripped markers
  result = result.replace(/\n{3,}/g, "\n\n");

  return result;
}
