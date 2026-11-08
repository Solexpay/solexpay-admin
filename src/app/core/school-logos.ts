/**
 * Bundled crests for partner universities (public/logos). The backend only
 * stores a logo URL when a school uploads one, so the console falls back to
 * these by name before showing initials.
 */
const BUNDLED: { logo: string; match: RegExp }[] = [
  { logo: "/logos/unilag.png", match: /\b(unilag|university of lagos)\b/i },
  { logo: "/logos/ui.png", match: /\b(university of ibadan)\b|^ui$/i },
  {
    logo: "/logos/oau.png",
    match: /\b(oau|obafemi awolowo)\b/i,
  },
  { logo: "/logos/unn.png", match: /\b(unn|university of nigeria)\b/i },
  { logo: "/logos/abu.png", match: /\b(abu|ahmadu bello)\b/i },
  {
    logo: "/logos/futa.png",
    match: /\b(futa|federal university of technology,? akure)\b/i,
  },
  {
    logo: "/logos/uniabuja.png",
    match: /\b(uniabuja|university of abuja)\b/i,
  },
  { logo: "/logos/cu.png", match: /\b(covenant university)\b|^cu$/i },
];

/** The school's own logo, else a bundled crest matched by name, else null. */
export function schoolLogo(school: {
  name?: string;
  logoUrl?: string | null;
}): string | null {
  if (school.logoUrl) return school.logoUrl;
  const name = (school.name ?? "").trim();
  return BUNDLED.find((b) => b.match.test(name))?.logo ?? null;
}
