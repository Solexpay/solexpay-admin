const BUNDLED: { logo: string; match: RegExp }[] = [
  { logo: "/logos/unilag.png", match: /\b(unilag|university of lagos)\b/i },
  { logo: "/logos/ui.png", match: /\b(university of ibadan)\b|^ui$/i },
  { logo: "/logos/oau.png", match: /\b(oau|obafemi awolowo)\b/i },
  { logo: "/logos/unn.png", match: /\b(unn|university of nigeria)\b/i },
  { logo: "/logos/abu.png", match: /\b(abu|ahmadu bello)\b/i },
  {
    logo: "/logos/futa.png",
    match: /\b(futa|federal university of technology,? akure)\b/i,
  },
  { logo: "/logos/uniabuja.png", match: /\b(uniabuja|university of abuja)\b/i },
  { logo: "/logos/cu.png", match: /\b(covenant university)\b|^cu$/i },
];

export function schoolLogo(school: {
  name?: string;
  logoUrl?: string | null;
}): string | null {
  if (school.logoUrl) return school.logoUrl;
  const name = (school.name ?? "").trim();
  return BUNDLED.find((entry) => entry.match.test(name))?.logo ?? null;
}
