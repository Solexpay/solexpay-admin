/**
 * Which admin roles may open each console section. The sidebar hides links
 * with this and roleGuard enforces it on the route, so a deep link cannot
 * reach a page the backend would answer with 403. SUPER_ADMIN passes all.
 */
export const SUPPORT_OPS_COMPLIANCE = ["SUPPORT", "OPS", "COMPLIANCE"];

export const SECTION_ROLES: Record<string, string[]> = {
  users: SUPPORT_OPS_COMPLIANCE,
  kyc: ["COMPLIANCE"],
  schools: ["OPS"],
  transactions: SUPPORT_OPS_COMPLIANCE,
  loans: SUPPORT_OPS_COMPLIANCE,
  "nip-transfers": SUPPORT_OPS_COMPLIANCE,
  "gift-cards": ["OPS"],
  ops: ["OPS", "COMPLIANCE"],
  audit: ["COMPLIANCE"],
  admins: ["SUPER_ADMIN"],
};
