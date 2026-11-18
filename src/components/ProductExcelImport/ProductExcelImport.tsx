"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import api from "@/services/apiClient";
import { API_BASE_URL } from "@/services/api.config";
import "./ProductExcelImport.css";

type Job = {
  id: string;
  status: "uploading" | "queued" | "failed" | "succeeded";
  file_name: string;
  created_at: string;
  queue_error: boolean;
  result?: {
    products: number;
    variants: number;
    total: number;
    reused_catalog?: number;
    skipped_listings?: number;
  };
  errors: Array<{ row: number; column: string; message: string }>;
};
const endpoint = `${API_BASE_URL}/api/product-imports`;
const statusLabel = {
  uploading: "Guardando archivo",
  queued: "En cola o procesando",
  failed: "Archivo rechazado",
  succeeded: "Importación completada",
};

export default function ProductExcelImport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const requestId = useRef("");
  const locations = useQuery({
    queryKey: ["product-import-locations", user?.id],
    enabled: open,
    queryFn: async () =>
      (
        await api.get<Array<{ id: string; name: string }>>(
          `${endpoint}/locations`,
        )
      ).data,
  });
  const jobs = useQuery({
    queryKey: ["product-import-jobs", user?.id],
    enabled: open && Boolean(user?.id),
    staleTime: 0,
    refetchOnReconnect: false,
    queryFn: async () => (await api.get<Job[]>(endpoint)).data,
  });
  const upload = useMutation({
    mutationFn: async () => {
      if (!file || !location)
        throw new Error("Elegí un archivo y una sucursal.");
      if (!requestId.current) requestId.current = crypto.randomUUID();
      const data = new FormData();
      data.append("file", file);
      data.append("location_id", location);
      data.append("request_id", requestId.current);
      return (
        await api.post<Job>(endpoint, data, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000,
        })
      ).data;
    },
    onSuccess: async (job) => {
      setMessage(
        job.status === "failed"
          ? "No se pudo procesar el archivo. Revisá el detalle."
          : "Archivo recibido. Te avisaremos cuando termine la importación.",
      );
      await jobs.refetch();
    },
    onError: (error: Error) => setMessage(error.message),
  });
  const retry = useMutation({
    mutationFn: (id: string) => api.post(`${endpoint}/${id}/retry`),
    onSuccess: async () => {
      await jobs.refetch();
    },
    onError: (error: Error) => setMessage(error.message),
  });
  const download = async () => {
    setDownloading(true);
    setMessage("");
    try {
      const { data } = await api.get(endpoint + "/template", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "sercio-productos.xlsx";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setMessage("No se pudo descargar la plantilla. Intentá nuevamente.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="dash-products__add-btn"
        onClick={() => setOpen(true)}
      >
        <FileSpreadsheet size={18} aria-hidden="true" /> Importación masiva de
        productos
      </button>
      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          void queryClient.invalidateQueries({
            queryKey: ["professional-products"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["professional-product-categories"],
          });
        }}
        title="Importación masiva de productos"
        maxWidth="850px"
      >
        <div className="product-excel-import">
          <ol>
            <li>
              Descargá la plantilla y leé la hoja Instrucciones. Copiá los ID de
              Categorias y Subcategorias.
            </li>
            <li>
              Completá Productos con hasta 1000 filas. Precios numéricos en ARS
              y stock entero. No uses fórmulas.
            </li>
            <li>
              Asigná un codigo único a cada fila. Para variantes, completá
              codigo_padre con el código de un principal del archivo. Cada
              variante lleva precio y stock propios.
            </li>
            <li>
              Elegí la sucursal que recibirá el stock y subí el archivo .xlsx de
              hasta 5 MB.
            </li>
          </ol>
          <p>
            Si hay errores, se rechaza todo el archivo. Corregí las filas
            indicadas y volvé a subirlo. Los códigos ya importados se editan
            desde el catálogo.
          </p>
          <p>
            Si el EAN existe, se usa el producto del catálogo. Si ya está
            publicado por tu comercio, se conserva su precio y stock. Las
            variantes existentes se vinculan al mismo principal.
          </p>
          <div className="product-excel-import__actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={download}
              disabled={downloading}
            >
              {downloading && (
                <Loader2 size={16} className="btn-spinner" aria-hidden="true" />
              )}
              {downloading
                ? "Descargando…"
                : "Descargar plantilla e instructivo"}
            </button>
          </div>
          <label htmlFor="import-stock-location">
            Sucursal para asignar el stock
          </label>
          <select
            id="import-stock-location"
            value={location}
            disabled={upload.isPending}
            onChange={(event) => {
              setLocation(event.target.value);
              requestId.current = "";
            }}
          >
            <option value="">Elegí una sucursal</option>
            {locations.data?.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {locations.isError && (
            <p role="alert">
              No pudimos consultar tus sucursales. Cerrá y volvé a abrir la
              importación.
            </p>
          )}
          {locations.data?.length === 0 && (
            <p>
              Completá la dirección de tu comercio o creá una sucursal antes de
              importar.
            </p>
          )}
          <label htmlFor="product-import-file">Archivo Excel</label>
          <input
            id="product-import-file"
            type="file"
            accept=".xlsx"
            disabled={upload.isPending}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              requestId.current = "";
              setMessage("");
              if (!selected) {
                setFile(null);
                return;
              }
              if (
                !/\.xlsx$/i.test(selected.name) ||
                selected.size > 5 * 1024 * 1024
              ) {
                setFile(null);
                setMessage("Elegí un Excel .xlsx de hasta 5 MB.");
                return;
              }
              setFile(selected);
            }}
          />

          <div className="product-excel-import__actions">
            <button
              type="button"
              className="btn-primary"
              disabled={!file || !location || upload.isPending}
              onClick={() => upload.mutate()}
            >
              {upload.isPending && (
                <Loader2 size={16} className="btn-spinner" aria-hidden="true" />
              )}
              {upload.isPending ? "Subiendo…" : "Subir e importar"}
            </button>

          </div>
          {message && <p role="status">{message}</p>}
          {jobs.isError && (
            <p role="alert">
              No pudimos consultar los trabajos. Cerrá y volvé a abrir la importación.
            </p>
          )}
          {jobs.data?.map((job) => (
            <section className="product-excel-import__job" key={job.id}>
              <strong>{job.file_name}</strong>
              <p>{statusLabel[job.status]}</p>
              {job.result && (
                <p>
                  {job.result.products} productos principales y{" "}
                  {job.result.variants} variantes publicados.
                  {Boolean(job.result.reused_catalog) && (
                    <>
                      {" "}
                      {job.result.reused_catalog} productos reutilizados del
                      catálogo.
                    </>
                  )}
                  {Boolean(job.result.skipped_listings) && (
                    <>
                      {" "}
                      {job.result.skipped_listings} publicaciones que ya tenías
                      se conservaron.
                    </>
                  )}
                </p>
              )}
              {job.status === "queued" && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate(job.id)}
                >
                  {retry.isPending && (
                    <Loader2
                      size={16}
                      className="btn-spinner"
                      aria-hidden="true"
                    />
                  )}
                  {retry.isPending
                    ? "Reenviando…"
                    : "Reenviar trabajo pendiente"}
                </button>
              )}
              {job.errors.length > 0 && (
                <div className="product-excel-import__errors">
                  <table>
                    <thead>
                      <tr>
                        <th>Fila</th>
                        <th>Columna</th>
                        <th>Corrección</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.errors.map((error, index) => (
                        <tr key={index}>
                          <td>{error.row || "Archivo"}</td>
                          <td>{error.column}</td>
                          <td>{error.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      </Modal>
    </>
  );
}
