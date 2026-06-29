"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getJobsAction, Job } from "@/app/actions/jobs";
import { getProvincesAction } from "@/app/actions/provinces";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/routes/paths";
import {
  Loader2,
  Share2,
  MapPin,
  Briefcase,
  RefreshCw,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import "./JobsPage.css";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export default function JobsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    is_remote: false,
    is_in_person: false,
    is_hybrid: false,
    is_full_time: false,
    is_half_day: false,
  });
  const [selectedProvince, setSelectedProvince] = useState("");

  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 20;

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const res = await getProvincesAction();
      if (res?.serverError) throw new Error(res.serverError);
      return res?.data || [];
    },
  });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["jobs-list", searchTerm, filters, selectedProvince, page, limit],
    queryFn: async () => {
      const activeFilters: any = {};
      if (searchTerm) activeFilters.title = searchTerm;

      if (filters.is_remote) activeFilters.is_remote = true;
      if (filters.is_in_person) activeFilters.is_in_person = true;
      if (filters.is_hybrid) activeFilters.is_hybrid = true;
      if (filters.is_full_time) activeFilters.is_full_time = true;
      if (filters.is_half_day) activeFilters.is_half_day = true;
      if (selectedProvince) activeFilters.province_id = Number(selectedProvince);

      const res = await getJobsAction({
        limit,
        page,
        ...activeFilters,
      });

      if (res?.serverError) throw new Error(res.serverError);
      return res?.data?.items || [];
    },
  });

  const jobs = data || [];

  const handleShare = (e: React.MouseEvent, seoPath: string) => {
    e.stopPropagation();
    const finalPath = seoPath.startsWith('empleo/') ? `/${seoPath}` : `${ROUTES.job}/${seoPath}`;
    const url = `${window.location.origin}${finalPath}`;
    if (navigator.share) {
      navigator
        .share({
          title: "¡Mirá este empleo en Sercio!",
          url: url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  const handleJobClick = (seoPath: string) => {
    const finalPath = seoPath.startsWith('empleo/') ? `/${seoPath}` : `${ROUTES.job}/${seoPath}`;
    router.push(finalPath);
  };

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="jobs-page-wrapper">
      <Navbar />
      <main className="jobs-page">
        <div className="container jobs-page__container">
          <header className="jobs-page__header">
            <div>
              <h1 className="jobs-page__title">Empleos</h1>
              <p className="jobs-page__subtitle">
                Encontrá tu próxima oportunidad laboral
              </p>
            </div>
            <button
              className="jobs-page__refresh-btn"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw
                size={20}
                className={isRefetching ? "animate-spin" : ""}
              />
              <span>Actualizar</span>
            </button>
          </header>

          <div className="jobs-page__search-section">
            <div className="jobs-page__search-bar">
              <Search size={20} className="jobs-page__search-icon" />
              <input
                type="text"
                placeholder="Buscar empleo por título..."
                className="jobs-page__search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="jobs-page__province-filter">
              <select
                className="jobs-page__select"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="">Todas las provincias</option>
                {provinces.map((prov: any) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="jobs-page__filters">
              <button
                className={`jobs-page__filter-btn ${filters.is_remote ? "active" : ""}`}
                onClick={() => toggleFilter("is_remote")}
              >
                Remoto
              </button>
              <button
                className={`jobs-page__filter-btn ${filters.is_in_person ? "active" : ""}`}
                onClick={() => toggleFilter("is_in_person")}
              >
                Presencial
              </button>
              <button
                className={`jobs-page__filter-btn ${filters.is_hybrid ? "active" : ""}`}
                onClick={() => toggleFilter("is_hybrid")}
              >
                Híbrido
              </button>
              <button
                className={`jobs-page__filter-btn ${filters.is_full_time ? "active" : ""}`}
                onClick={() => toggleFilter("is_full_time")}
              >
                Full-time
              </button>
              <button
                className={`jobs-page__filter-btn ${filters.is_half_day ? "active" : ""}`}
                onClick={() => toggleFilter("is_half_day")}
              >
                Part-time
              </button>
            </div>
          </div>

          <div className="jobs-page__content">
            {isLoading ? (
              <div className="jobs-page__loading">
                <Loader2 size={32} className="animate-spin" />
                <p>Buscando empleos...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="jobs-page__empty">
                <Briefcase size={48} className="jobs-page__empty-icon" />
                <h3>No se encontraron empleos</h3>
                <p>Intentá ajustando los filtros o la búsqueda.</p>
              </div>
            ) : (
              <div className="jobs-page__list">
                {jobs.map((job: Job) => {
                  const companyName =
                    job.professional?.companies?.[0]?.name || "Empresa";
                  const companyAvatar =
                    job.professional?.profile?.avatar_url || null;
                  const timeAgo = formatDistanceToNow(
                    new Date(job.created_at),
                    {
                      addSuffix: true,
                      locale: es,
                    },
                  );

                  return (
                    <div
                      key={job.id}
                      className="job-card"
                      onClick={() => handleJobClick(job.seo_path)}
                    >
                      <div className="job-card__header">
                        <div className="job-card__company">
                          {companyAvatar ? (
                            <img
                              src={companyAvatar}
                              alt={companyName}
                              className="job-card__avatar"
                            />
                          ) : (
                            <div className="job-card__avatar-placeholder">
                              {companyName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="job-card__company-info">
                            <span className="job-card__company-name">
                              {companyName}
                            </span>
                            {job.province?.name && (
                              <span className="job-card__location">
                                <MapPin size={12} /> {job.province.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="job-card__share-btn"
                          onClick={(e) => handleShare(e, job.seo_path)}
                          aria-label="Compartir empleo"
                        >
                          <Share2 size={18} />
                        </button>
                      </div>

                      <h2 className="job-card__title">{job.title}</h2>

                      <div className="job-card__badges">
                        {job.is_remote && (
                          <span className="job-card__badge job-card__badge--remote">
                            Remoto
                          </span>
                        )}
                        {job.is_in_person && (
                          <span className="job-card__badge job-card__badge--person">
                            Presencial
                          </span>
                        )}
                        {job.is_hybrid && (
                          <span className="job-card__badge job-card__badge--hybrid">
                            Híbrido
                          </span>
                        )}
                        {job.is_full_time && (
                          <span className="job-card__badge job-card__badge--time">
                            Full-time
                          </span>
                        )}
                        {job.is_half_day && (
                          <span className="job-card__badge job-card__badge--time">
                            Part-time
                          </span>
                        )}
                      </div>

                      <div className="job-card__footer">
                        <span className="job-card__date">{timeAgo}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
