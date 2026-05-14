"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Trash2,
  User,
  Star,
  MapPin,
  MessageSquare,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { favoritesService } from "../../services/favoritesService";
import { ROUTES } from "../../routes/paths";
import "./FavoritesPage.css";

// Fallback data for demonstration if API fails or returns empty
const mockFavorites = [
  {
    id: "prof-1",
    name: "Carlos Méndez",
    specialty: "Plomero Gasista",
    rating: 4.9,
    reviews: 124,
    location: "Palermo, CABA",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80",
    verified: true,
  },
  {
    id: "prof-2",
    name: "Elena Rodríguez",
    specialty: "Diseño de Interiores",
    rating: 4.8,
    reviews: 89,
    location: "San Isidro, GBA",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
    verified: true,
  },
];

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await favoritesService.getFavorites();
      setFavorites(data?.data ?? []);
    } catch (error) {
      console.error("Error loading favorites:", error);
      // For demo purposes, if API fails, we use mock data
      setFavorites(mockFavorites);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setRemovingId(id);
      await favoritesService.removeFavorite(id);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Error removing favorite:", error);
      // Even if API fails, we remove it from UI for this demo
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="favorites-page">
      <Navbar />

      <main className="favorites-page__main container">
        <header className="favorites-page__header">
          <button className="favorites-back-btn" onClick={() => router.back()}>
            <ArrowLeft size={20} />
            <span>Volver</span>
          </button>
          <div className="favorites-title-wrap">
            <Heart
              className="favorites-icon-glow"
              size={32}
              fill="var(--accent-primary)"
              stroke="var(--accent-primary)"
            />
            <h1 className="favorites-title">Tus Favoritos</h1>
          </div>
          <p className="favorites-subtitle">
            Gestioná tus profesionales prefereidos para contactarlos
            rápidamente.
          </p>
        </header>

        <section className="favorites-list-container">
          {loading ? (
            <div className="favorites-loading">
              <Loader2 className="animate-spin" size={40} />
              <p>Cargando tus favoritos...</p>
            </div>
          ) : favorites.length > 0 ? (
            <div className="favorites-list">
              {favorites.map((professional) => (
                <div
                  key={professional.id}
                  className={`favorite-item ${removingId === professional.id ? "removing" : ""}`}
                  onClick={() =>
                    router.push(`${ROUTES.profile}/${professional.id}`)
                  }
                >
                  <div className="favorite-item__avatar-wrap">
                    <img
                      src={
                        professional.avatar || "https://via.placeholder.com/150"
                      }
                      alt={professional.name}
                      className="favorite-item__avatar"
                    />
                    {professional.verified && (
                      <div
                        className="favorite-item__verified"
                        title="Verificado"
                      >
                        <Star size={10} fill="currentColor" />
                      </div>
                    )}
                  </div>

                  <div className="favorite-item__info">
                    <div className="favorite-item__header">
                      <h3 className="favorite-item__name">
                        {professional.name}
                      </h3>
                      <span className="favorite-item__specialty">
                        {professional.specialty}
                      </span>
                    </div>

                    <div className="favorite-item__meta">
                      <div className="meta-pill">
                        <Star
                          size={14}
                          fill="var(--star-color)"
                          stroke="var(--star-color)"
                        />
                        <span>{professional.rating}</span>
                        <span className="meta-count">
                          ({professional.reviews})
                        </span>
                      </div>
                      <div className="meta-pill">
                        <MapPin size={14} />
                        <span>{professional.location || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="favorite-item__actions">
                    <button
                      className="action-btn action-btn--chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(ROUTES.messages);
                      }}
                      title="Enviar mensaje"
                    >
                      <MessageSquare size={18} />
                    </button>
                    <button
                      className="action-btn action-btn--remove"
                      onClick={(e) => handleRemove(e, professional.id)}
                      disabled={removingId === professional.id}
                      title="Eliminar de favoritos"
                    >
                      {removingId === professional.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                    <button className="action-btn action-btn--profile">
                      <User size={18} />
                      <span>Ver Perfil</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="favorites-empty">
              <div className="empty-icon-wrap">
                <Heart size={48} strokeWidth={1} />
              </div>
              <h3>No tenés profesionales favoritos</h3>
              <p>Explorá las categorías y guardá a los que más te gusten.</p>
              <button
                className="explore-btn"
                onClick={() => router.push(ROUTES.categories)}
              >
                Explorar Categorías
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
