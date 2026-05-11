import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { CATEGORIES_API_ENDPOINTS } from "../../services/categoriesApi";
import { professionalService } from "../../services/professionalService";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "Todas";
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

  const [profiles, setProfiles] = useState<CategoryProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setIsLoading(true);
        const response = await professionalService.list();
        const mappedProfiles: CategoryProfile[] = response.map((prof: any) => {
          const profCategoryName = prof.CategoryServices?.[0]?.CategoryService?.name || prof.category || "General";
          const catInfo = categoryOptions.find((c) => c.label === profCategoryName) || categoryOptions[0];
          
          let minPrice = 0;
          if (prof.Services && prof.Services.length > 0) {
            minPrice = Math.min(...prof.Services.map((s: any) => s.base_price || 0));
          } else if (prof.services && prof.services.length > 0) {
            minPrice = Math.min(...prof.services.map((s: any) => s.base_price || 0));
          }

          let acceptedJobs = 0;
          if (prof.Proposals) {
            acceptedJobs = prof.Proposals.filter((p: any) => p.accepted).length;
          } else if (prof.proposals) {
            acceptedJobs = prof.proposals.filter((p: any) => p.accepted).length;
          }

          const isCompany = prof.account_type === "company";
          const companyData = prof.Company?.[0] || prof.company?.[0];
          const hasPublicStore = isCompany && companyData?.public_trade === true;

          return {
            id: prof.id,
            companyName: prof.Profile?.display_name || prof.name || "Sin Nombre",
            specialty: prof.specialty || profCategoryName,
            category: profCategoryName,
            province: prof.Addresses?.[0]?.Province?.name || prof.province || "Desconocida",
            city: prof.Addresses?.[0]?.Department?.name || prof.city || "Desconocida",
            accountType: isCompany ? "Comercio" : "Autónomo",
            emergency: prof.emergency || false,
            verified: prof.is_matriculate || false,
            rating: prof.rating_avg || 0,
            jobs: acceptedJobs,
            priceLabel: minPrice > 0 ? `Desde $${minPrice.toLocaleString("es-AR")}` : "Consultar precio",
            avatar: prof.Profile?.avatar_url || fallbackImage,
            coverImage: catInfo.image,
            description: prof.bio || prof.description || "Sin descripción",
            hasPublicStore,
          };
        });
        setProfiles(mappedProfiles);
      } catch (error) {
        console.error("Error fetching professionals:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  const provinceOptions = useMemo(
    () => [
      "Todas",
      ...Array.from(new Set(profiles.map((profile) => profile.province))),
    ],
    [profiles],
  );

  const cityOptions = useMemo(() => {
    const scopedProfiles =
      selectedProvince === "Todas"
        ? profiles
        : profiles.filter((profile) => profile.province === selectedProvince);

    return [
      "Todas",
      ...Array.from(new Set(scopedProfiles.map((profile) => profile.city))),
    ];
  }, [selectedProvince, profiles]);

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "Todas");
  }, [searchParams]);

  const selectedCategoryInfo =
    categoryOptions.find((category) => category.label === selectedCategory) ??
    categoryOptions[0];

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return profiles.filter((profile) => {
      const matchesCategory =
        selectedCategory === "Todas" || profile.category === selectedCategory;
      const matchesProvince =
        selectedProvince === "Todas" || profile.province === selectedProvince;
      const matchesCity =
        selectedCity === "Todas" || profile.city === selectedCity;
      const matchesAccount =
        selectedAccountType === "Todos" ||
        profile.accountType === selectedAccountType;
      const matchesUrgency = !urgentOnly || profile.emergency;
      const matchesVerified = !verifiedOnly || profile.verified;
      const matchesPublicStore = !publicStoreOnly || profile.hasPublicStore;
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

      return (
        matchesCategory &&
        matchesProvince &&
        matchesCity &&
        matchesAccount &&
        matchesUrgency &&
        matchesVerified &&
        matchesPublicStore &&
        matchesQuery
      );
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
              <h3 className="filter-card__title">Encontrá a tu profesional</h3>
              <p className="filter-card__subtitle">
                Ajustá la búsqueda por categoría, ubicación y tipo de perfil.
              </p>

              <div className="filter-group">
                <span className="filter-label">Categoría</span>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  {categoryOptions.map((category) => (
                    <option key={category.label} value={category.label}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar nombre, rubro o ciudad"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <div className="filter-group">
                <span className="filter-label">Provincia</span>
                <select
                  value={selectedProvince}
                  onChange={(event) => {
                    setSelectedProvince(event.target.value);
                    setSelectedCity("Todas");
                  }}
                >
                  {provinceOptions.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Ciudad</span>
                <select
                  value={selectedCity}
                  onChange={(event) => setSelectedCity(event.target.value)}
                >
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Tipo</span>
                <div className="segmented-control">
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

              <div className="filter-group">
                <span className="filter-label">Preferencias</span>
                <div className="toggles-container">
                  <label className="switch-row">
                    <div className="switch">
                      <input
                        type="checkbox"
                        checked={urgentOnly}
                        onChange={() => setUrgentOnly((value) => !value)}
                      />
                      <span className="slider" />
                    </div>
                    <span>Solo urgencias</span>
                  </label>

                  <label className="switch-row">
                    <div className="switch">
                      <input
                        type="checkbox"
                        checked={publicStoreOnly}
                        onChange={() => setPublicStoreOnly((value) => !value)}
                      />
                      <span className="slider" />
                    </div>
                    <span>Comercio al público</span>
                  </label>

                  <label className="switch-row">
                    <div className="switch">
                      <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={() => setVerifiedOnly((value) => !value)}
                      />
                      <span className="slider" />
                    </div>
                    <span>Solo verificados</span>
                  </label>
                </div>
              </div>
            </div>

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
              <div className="loading-state" style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-secondary)" }}>
                <div className="spinner" style={{ margin: "0 auto 1rem", width: "40px", height: "40px", borderRadius: "50%", border: "3px solid var(--border-color)", borderTopColor: "var(--primary-color)", animation: "spin 1s linear infinite" }} />
                <p>Cargando perfiles...</p>
              </div>
            ) : (
              <div className="profiles-grid">
              {filteredProfiles.map((profile) => (
                <article
                  key={profile.id}
                  className="profile-result-card"
                  onClick={() => navigate(`${ROUTES.profile}/${profile.id}`)}
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
                        <MapPin size={14} /> {profile.city}, {profile.province}
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
                          navigate(`${ROUTES.profile}/${profile.id}`);
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
