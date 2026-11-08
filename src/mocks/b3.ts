import { type HttpHandler, HttpResponse, http } from "msw";
import type { School } from "@/lib/types";

const logos = new Map<string, School>();
const knownSchools: Record<string, School> = {
  "SCH-001": {
    id: "SCH-001",
    name: "University of Lagos",
    email: "bursar@unilag.edu.ng",
    status: "ACTIVE",
    createdAt: "2023-01-15T00:00:00Z",
    websiteDomain: "unilag.edu.ng",
    logoSource: "NONE",
  },
  "SCH-002": {
    id: "SCH-002",
    name: "Covenant University",
    email: "finance@covenantuniversity.edu.ng",
    status: "ACTIVE",
    createdAt: "2023-02-20T00:00:00Z",
    websiteDomain: "covenantuniversity.edu.ng",
    logoSource: "NONE",
  },
};

function schoolById(id: string): School {
  return (
    logos.get(id) ??
    knownSchools[id] ?? {
      id,
      name: "University of Lagos",
      email: "bursar@unilag.edu.ng",
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    }
  );
}

export const b3Handlers: HttpHandler[] = [
  http.put("*/admin/schools/:id/logo", async ({ params, request }) => {
    const id = String(params.id);
    const body = (await request.json()) as {
      domain?: string;
      logoUrl?: string;
      clear?: boolean;
    };
    const previous = schoolById(id);
    const school: School = body.clear
      ? { ...previous, logoUrl: null, logoSource: "NONE" }
      : body.domain
        ? {
            ...previous,
            websiteDomain: body.domain,
            logoUrl: `https://img.logo.dev/${body.domain}?size=128&format=png`,
            logoSource: "MANUAL",
          }
        : { ...previous, logoUrl: body.logoUrl ?? null, logoSource: "MANUAL" };
    logos.set(id, school);
    return HttpResponse.json(school);
  }),
  http.post("*/admin/schools/:id/logo/refresh", ({ params }) => {
    const id = String(params.id);
    const previous = schoolById(id);
    const school: School = {
      ...previous,
      logoUrl: previous.websiteDomain
        ? `https://img.logo.dev/${previous.websiteDomain}?size=128&format=png`
        : null,
      logoSource: previous.websiteDomain ? "LOGODEV" : "NONE",
    };
    logos.set(id, school);
    return HttpResponse.json(school);
  }),
  http.post("*/admin/schools/logos/backfill", () =>
    HttpResponse.json({ resolved: 2, failed: 0 }),
  ),
];
