import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobByIdAction, Job } from "@/app/actions/jobs";
import JobDetailPage from "@/views/Jobs/JobDetailPage";

type Props = {
  params: Promise<{ seoPath: string; id: string }>;
};

async function getJob(id: string): Promise<Job | null> {
  if (!id) return null;
  try {
    const res = await getJobByIdAction({ id });
    return res?.data ?? null;
  } catch {
    return null;
  }
}

function getModalityText(job: Job): string {
  const parts: string[] = [];
  if (job.is_remote) parts.push("Remoto");
  else if (job.is_hybrid) parts.push("Híbrido");
  else if (job.is_in_person) parts.push("Presencial");

  if (job.is_full_time) parts.push("Jornada Completa");
  else if (job.is_half_day) parts.push("Media Jornada");

  return parts.join(", ") || "A convenir";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seoPath, id } = await params;
  const fullPath = `/empleo/${seoPath}/${id}`;
  const job = await getJob(id);

  if (!job) {
    return {
      title: "Empleo no encontrado | Sercio",
    };
  }

  const companyName =
    job.professional?.companies?.[0]?.name ||
    job.professional?.profile?.display_name ||
    "Empresa";
  const provinceName = job.province?.name;
  const modality = getModalityText(job);

  const title = `${job.title} en ${companyName}${provinceName ? ` (${provinceName})` : ""} - Empleos Sercio`;
  const description =
    job.description?.slice(0, 160) ||
    `${companyName} busca ${job.title}${provinceName ? ` en ${provinceName}` : ""}. Modalidad: ${modality}. Postulate y conocé los requisitos en Sercio.`;

  const companyAvatar = job.professional?.profile?.avatar_url;

  return {
    title,
    description,
    alternates: {
      canonical: `https://sercio.com.ar${fullPath}`,
    },
    openGraph: {
      title,
      description,
      url: `https://sercio.com.ar${fullPath}`,
      siteName: "Sercio",
      images: companyAvatar ? [{ url: companyAvatar }] : [],
    },
  };
}

export default async function Page({ params }: Props) {
  const { seoPath, id } = await params;
  const fullPath = `/empleo/${seoPath}/${id}`;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  const companyName =
    job.professional?.companies?.[0]?.name ||
    job.professional?.profile?.display_name ||
    "Empresa";
  const companyAvatar = job.professional?.profile?.avatar_url;
  const provinceName = job.province?.name;

  const professionalSeo = job.professional?.seo_path
    ? `/perfil${job.professional.seo_path.startsWith("/") ? job.professional.seo_path : `/${job.professional.seo_path}`}`
    : `/perfil/${job.professional_id || ""}`;

  const validThroughDate = job.created_at
    ? new Date(
        new Date(job.created_at).getTime() + 90 * 24 * 60 * 60 * 1000,
      ).toISOString()
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description:
      job.description ||
      job.requirements ||
      `<p>${job.title} en ${companyName}. Modalidad: ${getModalityText(job)}.</p>`,
    datePosted: job.created_at,
    validThrough: validThroughDate,
    employmentType: job.is_full_time
      ? "FULL_TIME"
      : job.is_half_day
        ? "PART_TIME"
        : "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: companyName,
      sameAs: `https://sercio.com.ar${professionalSeo}`,
      ...(companyAvatar ? { logo: companyAvatar } : {}),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressRegion: provinceName || "Argentina",
        addressCountry: "AR",
      },
    },
    ...(job.is_remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {
            "@type": "Country",
            name: "Argentina",
          },
        }
      : {}),
    directApply: true,
    url: `https://sercio.com.ar${fullPath}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JobDetailPage initialData={job} jobId={id} />
    </>
  );
}
