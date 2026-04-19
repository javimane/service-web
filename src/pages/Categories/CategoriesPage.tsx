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
import "./CategoriesPage.css";

type ProviderType = "Todos" | "Comercio" | "Autónomo";

type CategoryProfile = {
  id: number;
  name: string;
  specialty: string;
  category: string;
  province: string;
  city: string;
  providerType: Exclude<ProviderType, "Todos">;
  emergency: boolean;
  verified: boolean;
  rating: number;
  jobs: number;
  responseTime: string;
  priceLabel: string;
  avatar: string;
  coverImage: string;
  description: string;
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

const mockProfiles: CategoryProfile[] = [
  {
    id: 1,
    name: "Lucía Herrera",
    specialty: "Diseño integral de interiores",
    category: "Interior Design",
    province: "Buenos Aires",
    city: "La Plata",
    providerType: "Autónomo",
    emergency: false,
    verified: true,
    rating: 4.9,
    jobs: 124,
    responseTime: "Responde en 20 min",
    priceLabel: "Desde $18.000",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=80",
    description:
      "Proyectos residenciales, optimización de espacios y ambientación premium.",
  },
  {
    id: 2,
    name: "Estudio Norte",
    specialty: "Ingeniería estructural y cálculo",
    category: "Engineering",
    province: "Córdoba",
    city: "Córdoba",
    providerType: "Comercio",
    emergency: true,
    verified: true,
    rating: 4.8,
    jobs: 89,
    responseTime: "Responde en 10 min",
    priceLabel: "Desde $25.000",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80",
    description:
      "Documentación técnica, inspecciones y refuerzos para obras nuevas y reformas.",
  },
  {
    id: 3,
    name: "Matías Silva",
    specialty: "Domótica y automatización",
    category: "Smart Systems",
    province: "Mendoza",
    city: "Mendoza",
    providerType: "Autónomo",
    emergency: true,
    verified: false,
    rating: 4.7,
    jobs: 63,
    responseTime: "Responde en 35 min",
    priceLabel: "Desde $14.500",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1558002038-1055907df827?w=900&q=80",
    description:
      "Instalación de cámaras, sensores, cerraduras inteligentes y control remoto.",
  },
  {
    id: 4,
    name: "Verde Vivo",
    specialty: "Paisajismo y riego",
    category: "Paisajismo",
    province: "Buenos Aires",
    city: "Mar del Plata",
    providerType: "Comercio",
    emergency: false,
    verified: true,
    rating: 4.9,
    jobs: 78,
    responseTime: "Responde en 50 min",
    priceLabel: "Desde $11.000",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
    description:
      "Diseño exterior, patios, terrazas verdes y mantenimiento estacional.",
  },
  {
    id: 5,
    name: "Clínica Bienestar",
    specialty: "Kinesiología y rehabilitación",
    category: "Salud",
    province: "Capital Federal",
    city: "CABA",
    providerType: "Comercio",
    emergency: true,
    verified: true,
    rating: 4.8,
    jobs: 140,
    responseTime: "Responde en 15 min",
    priceLabel: "Desde $9.800",
    avatar:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=80",
    description:
      "Atención en consultorio y a domicilio con turnos rápidos y seguimiento.",
  },
  {
    id: 6,
    name: "Sabor de Barrio",
    specialty: "Catering para eventos y viandas",
    category: "Alimentos",
    province: "Buenos Aires",
    city: "Bahía Blanca",
    providerType: "Comercio",
    emergency: false,
    verified: false,
    rating: 4.6,
    jobs: 54,
    responseTime: "Responde en 1 h",
    priceLabel: "Desde $7.500",
    avatar:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80",
    description:
      "Menús corporativos, mesas dulces y servicio para reuniones privadas.",
  },
  {
    id: 7,
    name: "Profe Alma",
    specialty: "Clases particulares de apoyo",
    category: "Educación",
    province: "Córdoba",
    city: "Villa Carlos Paz",
    providerType: "Autónomo",
    emergency: false,
    verified: true,
    rating: 5,
    jobs: 101,
    responseTime: "Responde en 25 min",
    priceLabel: "Desde $6.000",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&q=80",
    description:
      "Apoyo escolar y preparación de exámenes con clases online o presenciales.",
  },
  {
    id: 8,
    name: "Patitas Center",
    specialty: "Guardería y paseo de mascotas",
    category: "Mascotas",
    province: "Mendoza",
    city: "San Rafael",
    providerType: "Comercio",
    emergency: true,
    verified: false,
    rating: 4.7,
    jobs: 68,
    responseTime: "Responde en 30 min",
    priceLabel: "Desde $5.500",
    avatar:
      "https://images.unsplash.com/photo-1546961329-78bef0414d7c?w=300&q=80",
    coverImage:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=900&q=80",
    description:
      "Cuidado diario, traslados, urgencias veterinarias y acompañamiento.",
  },
];

const providerTypes: ProviderType[] = ["Todos", "Comercio", "Autónomo"];

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "Todas";
  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("Todas");
  const [selectedCity, setSelectedCity] = useState("Todas");
  const [selectedProviderType, setSelectedProviderType] =
    useState<ProviderType>("Todos");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const provinceOptions = useMemo(
    () => [
      "Todas",
      ...Array.from(new Set(mockProfiles.map((profile) => profile.province))),
    ],
    [],
  );

  const cityOptions = useMemo(() => {
    const scopedProfiles =
      selectedProvince === "Todas"
        ? mockProfiles
        : mockProfiles.filter(
            (profile) => profile.province === selectedProvince,
          );

    return [
      "Todas",
      ...Array.from(new Set(scopedProfiles.map((profile) => profile.city))),
    ];
  }, [selectedProvince]);

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "Todas");
  }, [searchParams]);

  const selectedCategoryInfo =
    categoryOptions.find((category) => category.label === selectedCategory) ??
    categoryOptions[0];

  const filteredProfiles = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return mockProfiles.filter((profile) => {
      const matchesCategory =
        selectedCategory === "Todas" || profile.category === selectedCategory;
      const matchesProvince =
        selectedProvince === "Todas" || profile.province === selectedProvince;
      const matchesCity =
        selectedCity === "Todas" || profile.city === selectedCity;
      const matchesProvider =
        selectedProviderType === "Todos" ||
        profile.providerType === selectedProviderType;
      const matchesUrgency = !urgentOnly || profile.emergency;
      const matchesVerified = !verifiedOnly || profile.verified;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          profile.name,
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
        matchesProvider &&
        matchesUrgency &&
        matchesVerified &&
        matchesQuery
      );
    });
  }, [
    searchTerm,
    selectedCategory,
    selectedProvince,
    selectedCity,
    selectedProviderType,
    urgentOnly,
    verifiedOnly,
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
                  {providerTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={selectedProviderType === type ? "active" : ""}
                      onClick={() => setSelectedProviderType(type)}
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

            <div className="api-card">
              <h3 className="api-card__title">Endpoints listos para API</h3>
              <ul className="api-card__list">
                <li>
                  <strong>GET</strong> {CATEGORIES_API_ENDPOINTS.listCategories}
                </li>
                <li>
                  <strong>GET</strong> {CATEGORIES_API_ENDPOINTS.listProfiles}
                </li>
                <li>
                  <strong>GET</strong> {CATEGORIES_API_ENDPOINTS.profileDetail}
                </li>
                <li>
                  <strong>GET</strong>{" "}
                  {CATEGORIES_API_ENDPOINTS.citiesByProvince}
                </li>
              </ul>
            </div>
          </aside>

          <div className="results-panel">
            <div className="results-panel__header">
              <div>
                <p className="results-panel__eyebrow">Resultados</p>
                <h2>{filteredProfiles.length} especialistas encontrados</h2>
              </div>
            </div>

            <div className="profiles-grid">
              {filteredProfiles.map((profile) => (
                <article
                  key={profile.id}
                  className="profile-result-card"
                  onClick={() => navigate(`${ROUTES.profile}?id=${profile.id}`)}
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
                        alt={profile.name}
                        className="profile-result-card__avatar"
                      />
                      <div>
                        <h3>{profile.name}</h3>
                        <p>{profile.specialty}</p>
                      </div>
                    </div>

                    <div className="profile-result-card__tags">
                      <span className="tag">
                        <MapPin size={14} /> {profile.city}, {profile.province}
                      </span>
                      <span className="tag">
                        <Store size={14} /> {profile.providerType}
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
                        <span>{profile.responseTime}</span>
                      </div>

                      <button
                        type="button"
                        className="profile-result-card__button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`${ROUTES.profile}?id=${profile.id}`);
                        }}
                      >
                        <UserRound size={16} /> Ver perfil
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredProfiles.length === 0 && (
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
