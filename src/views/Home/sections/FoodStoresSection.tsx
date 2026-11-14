"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Utensils } from "lucide-react";
import { getProfessionalsAction } from "@/app/actions/professionals";
import { getProfilePath } from "@/utils/utils";
import "./FoodStoresSection.css";

type FoodStore = {
  id: number;
  seo_path?: string;
  company_name?: string;
  delivery_eta_minutes?: number | null;
  profile?: { display_name?: string; avatar_url?: string; portfolio_image_url?: string };
};

export default function FoodStoresSection({ provinceId }: { provinceId?: number }) {
  const { data: stores = [] } = useQuery<FoodStore[]>({
    queryKey: ["food-stores", provinceId],
    queryFn: async () => {
      const result = await getProfessionalsAction({ provinceId, limit: 20, is_gastronomic: true });
      if (result?.serverError) throw new Error(result.serverError);
      const data = result?.data;
      return Array.isArray(data) ? data : data?.items ?? [];
    },
    staleTime: 5 * 60_000,
  });

  if (!stores.length) return null;

  return (
    <section className="food-stores home-section-container" aria-label="Tiendas de comidas">
      <h2>Tiendas de comidas</h2>
      <div className="food-stores__rail">
        {stores.map((store) => {
          const name = store.company_name || store.profile?.display_name || "Tienda de comidas";
          const eta = store.delivery_eta_minutes;
          return (
            <Link key={store.id} className="food-stores__card" href={getProfilePath(store.id, store.seo_path) + "/tienda?comidas=1"}>
              <div className="food-stores__cover">
                {store.profile?.portfolio_image_url
                  ? <img src={store.profile.portfolio_image_url} alt="" loading="lazy" />
                  : <Utensils aria-hidden="true" />}
              </div>
              <div className="food-stores__details">
                <div className="food-stores__logo">
                  {store.profile?.avatar_url
                    ? <img src={store.profile.avatar_url} alt="" loading="lazy" />
                    : <span aria-hidden="true">{name.charAt(0).toUpperCase()}</span>}
                </div>
                <div className="food-stores__info">
                  <h3>{name}</h3>
                  {typeof eta === "number" && eta > 0 && (
                    <span className="food-stores__eta">Demora de {eta} min</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
