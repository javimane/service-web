"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Search,
  ShieldCheck,
  Store,
  UserRound,
  Zap,
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { categories } from "../../data/categories";
import { ROUTES } from "../../routes/paths";
import { locationService } from "../../services/locationService";
import { getProfessionalsAction, incrementProfessionalViewsAction } from "../../app/actions/professionals";
import { getProvincesAction, getDepartmentsAction } from "../../app/actions/locations";
import SEO from "../../components/SEO/SEO";
import "./CategoriesPage.css";

type AccountType = "Todos" | "Comercio" | "Autónomo";

type CategoryProfile = {
  id: number;
  companyName: string;
  specialty: string;
  category: string;
  province: string;
  city: string;
  accountType: Exclude<AccountType, "Todos">;
  emergency: boolean;
  verified: boolean;
  rating: number;
  jobs: number;
  priceLabel: string;
  avatar: string;
  coverImage: string;
  description: string;
  hasPublicStore?: boolean;
  seoPath?: string | null;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80";

const categoryOptions = [
  {
    label: "Todas",
    subtitle: "Encontrá especialistas por rubro y ubicación",
    description:
      "Elegí una categoría y filtrá por provincia, ciudad, tipo de prestador y atención de urgencias.",
    image: fallbackImage,
  },
  ...categories.map((category) => ({
    label: category.label,
    subtitle: category.type,
    description: `Perfiles activos y verificados dentro de ${category.label}.`,
    image: category.image || fallbackImage,
  })),
] as const;

const accountTypes: AccountType[] = ["Todos", "Comercio", "Autónomo"];

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams?.get("category") || "Todas";
  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("Todas");
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [selectedAccountType, setSelectedAccountType] =
    useState<AccountType>("Todos");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [publicStoreOnly, setPublicStoreOnly] = useState(false);

  const { data: professionalsData, isLoading } = useQuery({
    queryKey: [
      "categories-professionals",
      selectedCategory,
      selectedProvince,
      urgentOnly,
      verifiedOnly,
      publicStoreOnly,
      searchTerm,
    ],
    queryFn: async () => {
      // Find category ID
      const categoryId =
        selectedCategory === "Todas"
          ? undefined
          : categories.find((c) => c.label === selectedCategory)?.id;

      // Find province ID
      const provinceId =
        selectedProvince === "Todas"
          ? undefined
          : provinces.find((p) => p.name === selectedProvince)?.id;

      const result = await getProfessionalsAction({
        categoryId: categoryId?.toString(),
        provinceId: provinceId?.toString(),
        isMatriculate: verifiedOnly ? "true" : undefined,
        emergency: urgentOnly ? "true" : undefined,
        publicTrade: publicStoreOnly ? "true" : undefined,
        query: searchTerm.length >= 3 ? searchTerm : undefined,
        limit: 100,
      });

      if (result?.data) return result.data;
      return [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const professionals = professionalsData || [];

  const profiles = useMemo(() => {
    return professionals.map((prof: any) => {
      // Mapping based on the new backend response structure
      const profCategoryName =
        prof.CategoryServices?.[0]?.CategoryService?.name ||
        prof.category ||
        "General";
      
      const catInfo =
        categoryOptions.find((c) => c.label === profCategoryName) ||
        categoryOptions[0];

      let minPrice = 0;
      // Handle both backend naming conventions
      const services = prof.Services || prof.services || [];
      if (services.length > 0) {
        minPrice = Math.min(...services.map((s: any) => s.base_price || 0));
      }

      const acceptedJobs = prof.accepted_proposals_count || 0;
      
      const isCompany = prof.accountType === "company" || prof.account_type === "company";
      const companyData = prof.company?.[0] || prof.Company?.[0] || prof.company_arca;
      const hasPublicStore = isCompany && (companyData?.public_trade === true || prof.publicTrade === true);

      // Extract location info from address array
      const mainAddress = prof.address?.[0] || prof.Addresses?.[0];

      return {
        id: prof.id,
        companyName: prof.name || prof.Profile?.display_name || "Profesional",
        specialty: prof.specialty || profCategoryName,
        category: profCategoryName,
        province:
          mainAddress?.Province?.name || 
          prof.company_provinces?.[0]?.Province?.name || 
          "Desconocida",
        city:
          mainAddress?.Department?.name || 
          prof.city || 
          "Desconocida",
        accountType: isCompany ? "Comercio" : "Autónomo",
        emergency: prof.emergency || false,
        verified: prof.is_matriculate || prof.isMatriculate || false,
        rating: prof.ratingAvg || prof.rating_avg || 0,
        jobs: acceptedJobs,
        priceLabel:
          minPrice > 0
            ? `Desde $${minPrice.toLocaleString("es-AR")}`
            : "Consultar precio",
        avatar: prof.profile?.avatar_url || prof.Profile?.avatar_url || fallbackImage,
        coverImage: catInfo.image,
        description: prof.bio || prof.description || "Sin descripción",
        hasPublicStore,
        seoPath: prof.seo_path || null,
      } as CategoryProfile;
    });
  }, [professionals]);

  const { data: provinces = [] } = useQuery({
    queryKey: ["categories-provinces"],
    queryFn: async () => {
      const result = await getProvincesAction();
      return result?.data || [];
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
  });

  const selectedProvinceId = useMemo(() => {
    if (selectedProvince === "Todas") return null;
    const province = provinces.find((p) => p.name === selectedProvince);
    return province?.id ?? null;
  }, [selectedProvince, provinces]);

  const { data: departments = [] } = useQuery({
    queryKey: ["categories-departments", selectedProvinceId],
    queryFn: async () => {
      const result = await getDepartmentsAction({ provinceId: selectedProvinceId as number });
      return result?.data || [];
    },
    enabled: !!selectedProvinceId,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 6,
  });

  const provinceOptions = useMemo(
    () => ["Todas", ...provinces.map((province) => province.name)],
    [provinces],
  );

  const cityOptions = useMemo(() => {
    if (!selectedProvinceId) return ["Todas"];
    return ["Todas", ...departments.map((department) => department.name)];
  }, [selectedProvinceId, departments]);

  useEffect(() => {
    setSelectedCategory(searchParams?.get("category") || "Todas");
  }, [searchParams]);

  const selectedCategoryInfo =
    categoryOptions.find((category) => category.label === selectedCategory) ??
    categoryOptions[0];

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Todas");
    setSelectedProvince("Todas");
    setSelectedCity("Todas");
    setSelectedAccountType("Todos");
    setUrgentOnly(false);
    setVerifiedOnly(false);
    setPublicStoreOnly(false);
  };

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return profiles.filter((profile) => {
      // These are now handled by the server, but we keep client-side checks for city and account type
      const matchesCity =
        selectedCity === "Todas" || profile.city === selectedCity;
      const matchesAccount =
        selectedAccountType === "Todos" ||
        profile.accountType === selectedAccountType;
      
      // If query is short, we might want to still filter on client if server didn't handle it
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          profile.companyName,
          profile.specialty,
          profile.category,
          profile.city,
          profile.province,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesCity && matchesAccount && matchesQuery;
    });
  }, [
    profiles,
    searchTerm,
    selectedCategory,
    selectedProvince,
    selectedCity,
    selectedAccountType,
    urgentOnly,
    verifiedOnly,
    publicStoreOnly,
  ]);

  return (
    <div className="categories-page">
      <SEO
        title={
          selectedCategory === "Todas"
            ? "Categorías y Especialistas"
            : `${selectedCategory} - Especialistas y Profesionales`
        }
        description={selectedCategoryInfo.description}
        image={selectedCategoryInfo.image}
      />
      <Navbar />

      <main className="categories-page__main">
        <header
          className="categories-page__hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${selectedCategoryInfo.image})`,
          }}
        >
          <div className="container">
            <div className="categories-page__hero-glass">
              <span className="hero__eyebrow">Categorías y especialistas</span>
              <h1 className="hero__title">{selectedCategoryInfo.label}</h1>
              <p className="hero__description">
                {selectedCategoryInfo.description}
              </p>

              <div className="hero__stats">
                <div className="hero__stat-pill">
                  <span className="digit">{filteredProfiles.length}</span>
                  <span className="label">perfiles disponibles</span>
                </div>
                <div className="hero__stat-pill">
                  <span className="label">{selectedCategoryInfo.subtitle}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="categories-page__content container">
          <aside className="sidebar">
            <div className="filter-card">
              <div className="filter-card__header">
                <h2 className="filter-card__title">
                  Encontrá a tu profesional
                </h2>
                <p className="filter-card__subtitle">
                  Ajustá la búsqueda por categoría, ubicación y tipo de perfil.
                </p>
              </div>

              <div className="search-container">
                <Search size={20} className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar nombre, rubro, o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-section">
                <span className="section-label">CATEGORÍA:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="Todas">Profesiones y Oficios</option>
                  {categoryOptions
                    .filter((c) => c.label !== "Todas")
                    .map((cat) => (
                      <option key={cat.label} value={cat.label}>
                        {cat.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="filter-section">
                <span className="section-label">UBICACIÓN:</span>
                <div className="location-stack">
                  <select
                    value={selectedProvince}
                    onChange={(e) => {
                      setSelectedProvince(e.target.value);
                      setSelectedCity("Todas");
                    }}
                  >
                    <option value="Todas">Provincia</option>
                    {provinceOptions
                      .filter((p) => p !== "Todas")
                      .map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                  </select>

                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={selectedProvince === "Todas"}
                  >
                    <option value="Todas">Ciudad</option>
                    {cityOptions
                      .filter((c) => c !== "Todas")
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="filter-section">
                <span className="section-label">TIPO DE PERFIL:</span>
                <div className="profile-type-switcher">
                  {accountTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={selectedAccountType === type ? "active" : ""}
                      onClick={() => setSelectedAccountType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="preferences-box">
                <span className="section-label">PREFERENCIAS:</span>
                <div className="preferences-list">
                  <div className="pref-row">
                    <label className="ios-toggle">
                      <input
                        type="checkbox"
                        checked={urgentOnly}
                        onChange={() => setUrgentOnly((v) => !v)}
                      />
                      <span className="ios-toggle__slider" />
                    </label>
                    <span className="pref-label">SOLO URGENCIAS</span>
                  </div>

                  <div className="pref-row">
                    <label className="ios-toggle">
                      <input
                        type="checkbox"
                        checked={publicStoreOnly}
                        onChange={() => setPublicStoreOnly((v) => !v)}
                      />
                      <span className="ios-toggle__slider" />
                    </label>
                    <span className="pref-label">COMERCIO AL PÚBLICO</span>
                  </div>

                  <div className="pref-row">
                    <label className="ios-toggle">
                      <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={() => setVerifiedOnly((v) => !v)}
                      />
                      <span className="ios-toggle__slider" />
                    </label>
                    <span className="pref-label">SOLO VERIFICADOS</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="reset-filters-btn" onClick={handleResetFilters}>
              Limpiar filtros
            </button>
          </aside>

          <div className="results-panel">
            <div className="results-panel__header">
              <div>
                <p className="results-panel__eyebrow">Resultados</p>
                <h2>
                  {isLoading
                    ? "Buscando especialistas..."
                    : `${filteredProfiles.length} especialistas encontrados`}
                </h2>
              </div>
            </div>

            {isLoading ? (
              <div
                className="loading-state"
                style={{
                  padding: "4rem 2rem",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                }}
              >
                <div
                  className="spinner"
                  style={{
                    margin: "0 auto 1rem",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "3px solid var(--border-color)",
                    borderTopColor: "var(--primary-color)",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <p>Cargando perfiles...</p>
              </div>
            ) : (
              <div className="profiles-grid">
                {filteredProfiles.map((profile) => (
                  <article
                    key={profile.id}
                    className="profile-result-card"
                    onClick={() => {
                      incrementProfessionalViewsAction({ id: profile.id });
                      router.push(`${ROUTES.profile}/${profile.seoPath}`);
                    }}
                  >
                    <div
                      className="profile-result-card__cover"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(9, 12, 20, 0.15), rgba(9, 12, 20, 0.65)), url(${profile.coverImage})`,
                      }}
                    >
                      <span className="profile-result-card__price">
                        {profile.priceLabel}
                      </span>
                    </div>

                    <div className="profile-result-card__body">
                      <div className="profile-result-card__user">
                        <img
                          src={profile.avatar}
                          alt={profile.companyName}
                          className="profile-result-card__avatar"
                        />
                        <div>
                          <h3>{profile.companyName}</h3>
                          <p>{profile.specialty}</p>
                        </div>
                      </div>

                      <div className="profile-result-card__tags">
                        <span className="tag">
                          <MapPin size={14} /> {profile.city},{" "}
                          {profile.province}
                        </span>
                        <span className="tag">
                          <Store size={14} /> {profile.accountType}
                        </span>
                        {profile.emergency && (
                          <span className="tag tag--urgent">
                            <Zap size={14} /> Urgencias
                          </span>
                        )}
                        {profile.verified && (
                          <span className="tag tag--verified">
                            <ShieldCheck size={14} /> Verificado
                          </span>
                        )}
                      </div>

                      <p className="profile-result-card__description">
                        {profile.description}
                      </p>

                      <div className="profile-result-card__footer">
                        <div className="profile-result-card__stats">
                          <span>★ {profile.rating}</span>
                          <span>{profile.jobs} trabajos</span>
                        </div>

                        <button
                          type="button"
                          className="profile-result-card__button"
                          onClick={(event) => {
                            event.stopPropagation();
                            incrementProfessionalViewsAction({ id: profile.id });
                            router.push(`${ROUTES.profile}/${profile.seoPath}`);
                          }}
                        >
                          <UserRound size={16} /> Ver perfil
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!isLoading && filteredProfiles.length === 0 && (
              <div className="empty-state">
                <h3>No hay resultados con esos filtros</h3>
                <p>
                  Probá con otra categoría, otra provincia o desactivá
                  urgencias.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
