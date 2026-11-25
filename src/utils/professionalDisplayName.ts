type CompanyName = { name?: string | null };

type ProfessionalNameSource = {
  Companies?: CompanyName | CompanyName[] | null;
  Company?: CompanyName | CompanyName[] | null;
  companies?: CompanyName | CompanyName[] | null;
  company_name?: string | null;
  companyName?: string | null;
  Profile?: { display_name?: string | null } | null;
};

export function getProfessionalDisplayName(
  professional: ProfessionalNameSource | null | undefined,
  fallback = "Profesional",
): string {
  for (const relation of [professional?.Companies, professional?.Company, professional?.companies]) {
    const companies = Array.isArray(relation) ? relation : relation ? [relation] : [];
    const name = companies.find((company) => company?.name?.trim())?.name?.trim();
    if (name) return name;
  }
  return professional?.company_name?.trim() ||
    professional?.companyName?.trim() ||
    professional?.Profile?.display_name?.trim() ||
    fallback;
}
