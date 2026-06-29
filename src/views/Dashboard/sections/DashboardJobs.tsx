"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getJobsAction,
  createJobAction,
  updateJobAction,
  deleteJobAction,
  getJobByIdAction,
  Job,
} from "@/app/actions/jobs";
import { getProvincesAction } from "@/app/actions/provinces";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Plus, Edit2, Trash2, MapPin, Briefcase, Lock } from "lucide-react";
import { getAccessToken } from "@/utils/auth";
import "./DashboardJobs.css";

interface DashboardJobsProps {
  professionalId: number;
}

export default function DashboardJobs({ professionalId }: DashboardJobsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    is_remote: false,
    is_in_person: false,
    is_hybrid: false,
    is_full_time: false,
    is_half_day: false,
    province_id: 0,
  });

  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: async () => {
      const res = await getProvincesAction();
      if (res?.serverError) throw new Error(res.serverError);
      return res?.data || [];
    },
  });

  const { subscriptionPlan } = useAuth();
  const canCreate = ["basico", "premium", "profesional-basico", "profesional-premium"].includes(
    subscriptionPlan?.toLowerCase() || ""
  );

  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["dashboard-jobs", professionalId],
    queryFn: async () => {
      const res = await getJobsAction({
        professional_id: professionalId,
        limit: 50,
        page: 1,
      });
      if (res.serverError) throw new Error(res.serverError);
      return res.data?.items || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = getAccessToken();
      const res = await createJobAction({
        ...data,
        token: token || "",
      });
      if (res?.serverError) throw new Error(res.serverError);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-jobs", professionalId],
      });
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = getAccessToken();
      const res = await updateJobAction({
        id,
        ...data,
        token: token || "",
      });
      if (res?.serverError) throw new Error(res.serverError);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-jobs", professionalId],
      });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = getAccessToken();
      const res = await deleteJobAction({
        id,
        token: token || "",
      });
      if (res?.serverError) throw new Error(res.serverError);
      return res?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["dashboard-jobs", professionalId],
      });
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "province_id") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditClick = async (job: Job) => {
    try {
      setIsFetchingDetails(job.id);
      const res = await getJobByIdAction({ id: job.id });
      if (res?.serverError) throw new Error(res.serverError);
      openForm(res.data);
    } catch (err: any) {
      console.error(err);
      openForm(job); // Fallback to what we have
    } finally {
      setIsFetchingDetails(null);
    }
  };

  const openForm = (job?: Job) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        title: job.title || "",
        description: job.description || "",
        requirements: job.requirements || "",
        is_remote: !!job.is_remote,
        is_in_person: !!job.is_in_person,
        is_hybrid: !!job.is_hybrid,
        is_full_time: !!job.is_full_time,
        is_half_day: !!job.is_half_day,
        province_id: job.province_id || 0,
      });
    } else {
      setEditingJob(null);
      setFormData({
        title: "",
        description: "",
        requirements: "",
        is_remote: false,
        is_in_person: false,
        is_hybrid: false,
        is_full_time: false,
        is_half_day: false,
        province_id: 0,
      });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingJob(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este empleo?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-jobs__loading">
        <Loader2 size={32} className="animate-spin" />
        <p>Cargando empleos...</p>
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="dashboard-jobs">
      <div className="dashboard-jobs__header">
        <h2 className="dashboard-jobs__title">Mis Empleos</h2>
        <button 
          className="btn-primary" 
          onClick={() => {
            if (!canCreate) {
              alert("Debes tener un plan Básico o Premium para crear empleos.");
              return;
            }
            openForm();
          }}
        >
          {canCreate ? <Plus size={18} /> : <Lock size={18} />} Crear Empleo
        </button>
      </div>

      {!canCreate && !isFormOpen && jobs.length === 0 && (
        <div className="dashboard-jobs__upgrade-notice" style={{
          background: "var(--surface-soft)",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          textAlign: "center",
          marginBottom: "var(--space-4)"
        }}>
          <Lock size={32} style={{ color: "var(--text-secondary)", margin: "0 auto var(--space-2)" }} />
          <p style={{ color: "var(--text-secondary)", fontWeight: "var(--weight-medium)" }}>
            La creación de empleos es una funcionalidad exclusiva para planes Básico y Premium.
          </p>
        </div>
      )}

      {isFormOpen && (
        <div className="dashboard-jobs__form-card">
          <h3>{editingJob ? "Editar Empleo" : "Crear Nuevo Empleo"}</h3>
          <form onSubmit={handleSubmit} className="dashboard-jobs__form">
            <div className="form-group">
              <label>Título del puesto</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Ej. Desarrollador Web Frontend"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                placeholder="Describe las responsabilidades del puesto..."
              />
            </div>

            <div className="form-group">
              <label>Requisitos</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={4}
                placeholder="Conocimientos, experiencia, etc..."
              />
            </div>

            <div className="form-group">
              <label>Provincia (Opcional)</label>
              <select
                name="province_id"
                value={formData.province_id}
                onChange={handleInputChange}
                className="dashboard-jobs__select"
              >
                <option value={0}>Seleccionar provincia...</option>
                {provinces.map((prov: any) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="dashboard-jobs__checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_remote"
                  checked={formData.is_remote}
                  onChange={handleInputChange}
                />
                Remoto
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_in_person"
                  checked={formData.is_in_person}
                  onChange={handleInputChange}
                />
                Presencial
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_hybrid"
                  checked={formData.is_hybrid}
                  onChange={handleInputChange}
                />
                Híbrido
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_full_time"
                  checked={formData.is_full_time}
                  onChange={handleInputChange}
                />
                Full-time
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_half_day"
                  checked={formData.is_half_day}
                  onChange={handleInputChange}
                />
                Part-time
              </label>
            </div>

            <div className="dashboard-jobs__form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={closeForm}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Guardando...
                  </>
                ) : editingJob ? (
                  "Actualizar Empleo"
                ) : (
                  "Crear Empleo"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isFormOpen && (
        <div className="dashboard-jobs__list">
          {jobs.length === 0 ? (
            <div className="dashboard-jobs__empty">
              <Briefcase size={40} className="dashboard-jobs__empty-icon" />
              <p>No tienes empleos publicados.</p>
            </div>
          ) : (
            jobs.map((job: Job) => (
              <div key={job.id} className="dashboard-job-card">
                <div className="dashboard-job-card__info">
                  <h4>{job.title}</h4>
                  <div className="dashboard-job-card__badges">
                    {job.is_remote && <span>Remoto</span>}
                    {job.is_in_person && <span>Presencial</span>}
                    {job.is_hybrid && <span>Híbrido</span>}
                    {job.is_full_time && <span>Full-time</span>}
                    {job.is_half_day && <span>Part-time</span>}
                  </div>
                </div>
                <div className="dashboard-job-card__actions">
                  <button
                    className="btn-icon btn-icon--edit"
                    onClick={() => handleEditClick(job)}
                    title="Editar"
                    disabled={isFetchingDetails === job.id}
                  >
                    {isFetchingDetails === job.id ? <Loader2 size={18} className="animate-spin" /> : <Edit2 size={18} />}
                  </button>
                  <button
                    className="btn-icon btn-icon--delete"
                    onClick={() => handleDelete(job.id)}
                    title="Eliminar"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
