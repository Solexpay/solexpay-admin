/**
 * Which admin roles may open each console section. The sidebar hides links
 * with this and the admin layout enforces it per route, so a deep link cannot
 * reach a page the backend would answer with 403. SUPER_ADMIN passes all.
 */
export type AdminRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "OPS"
  | "COMPLIANCE"
  | "SUPPORT";

export const SUPPORT_OPS_COMPLIANCE: AdminRole[] = [
  "SUPPORT",
  "OPS",
  "COMPLIANCE",
];

export const SECTION_ROLES: Record<string, AdminRole[]> = {
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
  // Added with the observability work (backend roles in internal/admin/routes.go
  // and internal/app/modules.go registerAdmin).
  analytics: ["OPS", "COMPLIANCE"],
  support: SUPPORT_OPS_COMPLIANCE,
  cards: ["OPS"],
  offers: ["OPS"],
};

/** True when `role` may open `section`. SUPER_ADMIN may open everything. */
export function canAccess(role: string | undefined, section: string): boolean {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true;
  const allowed = SECTION_ROLES[section];
  return !allowed || (allowed as string[]).includes(role);
}
