/** Structured edge event fields that are safe to record. */
export interface EdgeLog {
  level: "info" | "warn" | "error";
  msg: "admin_edge";
  request_id: string;
  ray: string | null;
  method: string;
  path: string;
  status: number;
  dur_ms: number;
  ip: string | null;
  country: string | undefined;
  access_email: string | undefined;
  admin_id: string | undefined;
  route: "asset" | "bff_auth" | "bff_api" | "csp_report" | "blocked";
  ua: string;
  error?: { name: string; message: string };
  report?: unknown;
  event?: "access_disabled";
}

/** Writes one structured JSON line for an edge request. */
export function writeLog(event: EdgeLog): void {
  console.log(JSON.stringify(event));
}
