import { escapeHtml } from "./escape-html";

export function getFirstName(fullName: string): string {
  return escapeHtml(fullName.split(" ")[0]);
}
