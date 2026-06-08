import Link from "next/link";
import "./SpecialistCard.css";
import { ROUTES } from "../../routes/paths";

export interface ProfessionalCategory {
  Category: {
    id: number;
    name: string;
  };
  category_services_id: number;
}

export interface ProfessionalAddress {
  id: number;
  latitude: number;
  longitude: number;
  province_id: number;
  street_name: string;
  department_id: number;
  street_number: string;
  floor_apartment?: string;
  is_main_address: boolean;
  zip_code: string;
  professional_id: number;
}

export interface ProfessionalProfile {
  avatar_url: string | null;
  portfolio_image_url?: string | null;
}

export interface CompanyArca {
  is_verified: boolean;
}

export interface ProfessionalSubscription {
  plan: string;
}

export interface ProfessionalSpecialist {
  id: number;
  bio: string | null;
  ratingAvg?: number;
  rating_avg?: number;
  isActive: boolean;
  accountType: string;
  subscription?: ProfessionalSubscription[];
  address?: ProfessionalAddress[];
  professional_categories?: ProfessionalCategory[];
  company_name: string | null;
  profile?: ProfessionalProfile | null;
  is_matriculate?: boolean;
  emergency?: boolean;
  specialty: string | null;
  company_arca?: CompanyArca | null;
  seo_path?: string | null;
  seoPath?: string | null;
  has_promotions?: boolean;
}

interface SpecialistCardProps {
  specialist: ProfessionalSpecialist;
}

export default function SpecialistCard({ specialist }: SpecialistCardProps) {
  const {
    id,
    company_name,
    specialty,
    ratingAvg,
    rating_avg,
    profile,
    company_arca,
    has_promotions,
    professional_categories = [],
    seo_path,
    seoPath,
  } = specialist;

  const displayRating = ratingAvg ?? rating_avg ?? 5.0;
  const avatar =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(company_name || "P")}&background=random`;
  const linkHref = `${ROUTES.profile}${seo_path}`;
  const isVerified = company_arca?.is_verified ?? false;

  return (
    <article className="specialist-card">
      {/* Yellow Promotion Badge */}
      {has_promotions && (
        <span className="specialist-card__promo-badge">Tiene Promos</span>
      )}

      {/* Avatar Wrapper */}
      <div className="specialist-card__avatar-wrap">
        <Link href={linkHref}>
          <div
            className={`specialist-card__avatar-frame ${
              isVerified ? "specialist-card__avatar-frame--verified" : ""
            }`}
          >
            <img
              className="specialist-card__avatar"
              src={avatar}
              alt={company_name || "Profesional"}
              loading="lazy"
            />
            {/* Green check icon badge */}
            {isVerified && (
              <span className="specialist-card__verified-badge">✓</span>
            )}
          </div>
        </Link>
      </div>

      <div className="specialist-card__body">
        {/* Company Name */}
        <Link href={linkHref} className="specialist-card__link">
          <h3 className="specialist-card__name">
            {company_name || "Profesional"}
          </h3>
        </Link>

        {/* Specialty (replacing bio text) */}
        <span className="specialist-card__specialty">
          {specialty || "Servicios Profesionales"}
        </span>

        {/* Categories list */}
        {professional_categories.length > 0 && (
          <div className="specialist-card__categories">
            {professional_categories.map((pc, idx) => {
              const catName = pc.Category?.name;
              if (!catName) return null;
              return (
                <span key={idx} className="specialist-card__category-tag">
                  {catName}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="specialist-card__footer">
        <div className="specialist-card__rating-value">
          {displayRating.toFixed(1)}
        </div>
      </div>
    </article>
  );
}
