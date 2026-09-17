"use client";

import React from "react";
import Navbar from "@/components/Navbar/Navbar";
import CartSection from "@/views/Dashboard/sections/CartSection";
import "./CartPage.css";

export default function CartPage() {
  return (
    <div className="cart-page-wrapper">
      <Navbar />
      <main className="cart-page-main">
        <CartSection />
      </main>
    </div>
  );
}
