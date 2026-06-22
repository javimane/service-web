"use client";
import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SEO from "../../components/SEO/SEO";
import FAQSection from "./FAQSection";
import "./FAQPage.css";

export default function FAQPage() {
  return (
    <div className="faq-page">
      <SEO
        title="Preguntas Frecuentes - Sercio"
        description="Encuentra respuestas a las preguntas más frecuentes sobre cómo usar Sercio."
      />
      <Navbar />

      <main className="faq-main">
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
}
