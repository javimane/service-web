"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Utensils } from "lucide-react";
import { getProductCategoriesAction, getProductSubcategoriesAction } from "@/app/actions/categories";

import "./FoodCategoryCarousel.css";

const foodIcons: Record<string, string> = {
  "Sushi": "sushi",
  "Tartas": "tartas",
  "Helados": "helados",
  "Ensaladas": "ensaladas",
  "Panadería": "panaderia",
  "Papas y acompañamientos": "papas-y-acompanamientos",
  "Sándwiches": "sandwiches",
  "Pollo": "pollo",
  "Hamburguesas": "hamburguesas",
  "Desayunos y meriendas": "desayunos-y-meriendas",
  "Comidas vegetarianas": "comidas-vegetarianas",
  "Café": "cafe",
  "Pizzas": "pizzas",
  "Viandas": "viandas",
  "Pastas": "pastas",
  "Parrilla": "parrilla",
  "Lomos": "lomos",
  "Postres": "postres",
  "Bebidas": "bebidas",
  "Pastelería": "pasteleria",
  "Empanadas": "empanadas",
  "Milanesas": "milanesas",
};

export default function FoodCategoryCarousel() {
  const { data: category } = useQuery({
    queryKey: ["prepared-food-category"],
    queryFn: async () => {
      const result = await getProductCategoriesAction();
      return result?.data?.find((item: { name: string }) => item.name === "Comidas elaboradas") ?? null;
    },
  });
  const { data: subcategories = [] } = useQuery({
    queryKey: ["prepared-food-subcategories", category?.id],
    enabled: Boolean(category),
    queryFn: async () => {
      const result = await getProductSubcategoriesAction({ categoryId: String(category.id) });
      return result?.data ?? [];
    },
  });

  if (!category) return null;
  const href = "/productos?categoryId=" + category.id;
  return (
    <section className="food-category-carousel home-section-container">
      <h2 className="section-title"><Link href={href}>Comidas y alimentos</Link></h2>
      <nav aria-label="Subcategorías de comidas" className="food-category-carousel__track">
        {subcategories.map((item: { id: string; name: string }) => {
          const icon = foodIcons[item.name.trim()];
          return (
            <Link key={item.id} href={href + "&subcategoryId=" + encodeURIComponent(item.id)}
              className="food-category-carousel__item">
              <div className="food-category-carousel__image">
                {icon ? (
                  <Image src={`/food-categories/${icon}.webp`} alt="" width={160} height={160} unoptimized />
                ) : (
                  <Utensils size={40} aria-hidden="true" />
                )}
              </div>
              <span className="food-category-carousel__label">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
