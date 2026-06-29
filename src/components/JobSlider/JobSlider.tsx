"use client";

import React, { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Briefcase,
  MapPin,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "../../routes/paths";
import { getJobsAction, Job } from "@/app/actions/jobs";
import "./JobSlider.css";

interface JobSliderProps {
  provinceId?: number;
}

export default function JobSlider({ provinceId }: JobSliderProps) {
  const router = useRouter();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs-slider", provinceId],
    queryFn: async () => {
      const res = await getJobsAction({
        limit: 20,
        page: 1,
        province_id: provinceId,
      });
      if (res.serverError) throw new Error(res.serverError);
      return res.data?.items || [];
    },
  });

  const checkScrollButtons = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, [jobs]);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  const handleJobClick = (seoPath: string) => {
    const finalPath = seoPath.startsWith('empleo/') ? `/${seoPath}` : `${ROUTES.job}/${seoPath}`;
    router.push(finalPath);
  };

  const handleViewAll = () => {
    router.push(ROUTES.jobs);
  };

  if (isLoading) {
    return (
      <div className="job-slider__loading">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return null;
  }

  return (
    <section className="job-slider">
      <div className="home-section-container">
        <div className="job-slider__header">
          <div className="job-slider__title-wrapper">
            <h2 className="job-slider__section-title">Ofertas de Empleo</h2>
            <p className="job-slider__section-subtitle">
              Encontrá nuevas oportunidades laborales
            </p>
          </div>
          <div className="job-slider__actions">
            <button className="job-slider__view-all" onClick={handleViewAll}>
              Ver todos
            </button>
            <div className="job-slider__nav-buttons">
              <button
                className={`job-slider__nav-btn ${!canScrollLeft ? "job-slider__nav-btn--disabled" : ""}`}
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                aria-label="Anterior"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                className={`job-slider__nav-btn ${!canScrollRight ? "job-slider__nav-btn--disabled" : ""}`}
                onClick={scrollRight}
                disabled={!canScrollRight}
                aria-label="Siguiente"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>

        <div
          className="job-slider__track"
          ref={sliderRef}
          onScroll={checkScrollButtons}
        >
          {jobs.map((job: Job) => {
            const companyName =
              job.professional?.companies?.[0]?.name || "Empresa";
            const companyAvatar = job.professional?.profile?.avatar_url || null;

            return (
              <div
                key={job.id}
                className="job-slider__card"
                onClick={() => handleJobClick(job.seo_path)}
              >
                <div className="job-slider__card-header">
                  {companyAvatar ? (
                    <img
                      src={companyAvatar}
                      alt={companyName}
                      className="job-slider__avatar"
                    />
                  ) : (
                    <div className="job-slider__avatar-placeholder">
                      {companyName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="job-slider__company-info">
                    <span className="job-slider__company-name">
                      {companyName}
                    </span>
                    {job.province?.name && (
                      <span className="job-slider__location">
                        <MapPin size={12} /> {job.province.name}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="job-slider__card-title">{job.title}</h3>

                <div className="job-slider__badges">
                  {job.is_remote && (
                    <span className="job-slider__badge job-slider__badge--remote">
                      Remoto
                    </span>
                  )}
                  {job.is_in_person && (
                    <span className="job-slider__badge job-slider__badge--person">
                      Presencial
                    </span>
                  )}
                  {job.is_hybrid && (
                    <span className="job-slider__badge job-slider__badge--hybrid">
                      Híbrido
                    </span>
                  )}
                  {job.is_full_time && (
                    <span className="job-slider__badge job-slider__badge--time">
                      Full-time
                    </span>
                  )}
                  {job.is_half_day && (
                    <span className="job-slider__badge job-slider__badge--time">
                      Part-time
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
