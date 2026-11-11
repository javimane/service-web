"use client";

import React from "react";
import Navbar from "@/components/Navbar/Navbar";
import BuyerOrdersSection from "@/views/Dashboard/sections/BuyerOrdersSection";
import "./PurchasesPage.css";

export default function PurchasesPage() {
  return (
    <div className="purchases-page-wrapper">
      <Navbar />
      <main className="purchases-page-main">
        <BuyerOrdersSection />
      </main>
    </div>
  );
}
