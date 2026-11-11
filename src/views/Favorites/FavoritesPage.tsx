"use client";

import React from "react";
import Navbar from "@/components/Navbar/Navbar";
import FavoritesSection from "@/views/Dashboard/sections/FavoritesSection";
import "./FavoritesPage.css";

export default function FavoritesPage() {
  return (
    <div className="favorites-page-wrapper">
      <Navbar />
      <main className="favorites-page-main">
        <FavoritesSection />
      </main>
    </div>
  );
}
