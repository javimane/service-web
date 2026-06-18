"use client";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Plus,
  Calendar,
  X,
  FileText,
  CheckCircle,
  Eye,
  Send,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getChatClientsAction } from "../../../app/actions/chat";
import { getProfileAction } from "../../../app/actions/profile";
import { getProfessionalMeAction } from "../../../app/actions/professionals";
import { createProposalAction } from "../../../app/actions/proposals";
import { getAccessToken } from "../../../utils/auth";
import AddItemModal from "./AddItemModal";
import PdfPreviewModal from "./PdfPreviewModal";
import "./ProposalCreator.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImage from "../../../images/Logo solo nombre sin fondo.png";
import {
  getFileSignedUrl,
  getProposalSignedUrl,
  uploadProposalPdf,
} from "../../../services/storageUploads";
import { useRouter } from "next/navigation";

export default function ProposalCreator({ onBack }) {
  const { user } = useAuth();
  const [items, setItems] = useState([
    {
      id: 1,
      name: "Structural Design Consultation",
      qty: 12,
      rate: 150,
      total: 1800,
    },
  ]);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<
    "services" | "products"
  >("services");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [estimatedDate, setEstimatedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isCustomClientMode, setIsCustomClientMode] = useState(false);
  const [customClientName, setCustomClientName] = useState("");
  const router = useRouter();

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.slice(0, 8);

    if (val.length >= 5) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }

    setter(val);
  };

  // Fetch chat clients
  const { data: chatClients = [] } = useQuery({
    queryKey: ["chat-clients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await getChatClientsAction({ userId: user.id });
      return res.data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch professional profile
  const { data: profileData } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await getProfileAction({ id: user.id });
      return res.data || null;
    },
    enabled: !!user?.id,
  });

  // Fetch professional details
  const { data: myProfessional } = useQuery({
    queryKey: ["professional-me", user?.id],
    queryFn: async () => {
      const token = getAccessToken();
      const result = await getProfessionalMeAction(
        token ? { token } : undefined,
      );
      return result?.data ?? null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const professionalCompany = useMemo(() => {
    if (!myProfessional) return null;
    let company = myProfessional.companies || myProfessional.Company;
    if (Array.isArray(company)) company = company[0];
    return company || null;
  }, [myProfessional]);

  const professionalAddress = useMemo(() => {
    if (!myProfessional) return null;
    const company = myProfessional.companies || myProfessional.Company;
    const actualCompany = Array.isArray(company) ? company[0] : company;
    const mainAddress =
      actualCompany?.address ||
      (Array.isArray(myProfessional?.address)
        ? myProfessional?.address.find((a: any) => a.is_main_address)
        : myProfessional?.address);
    if (!mainAddress) return null;
    const streetName = mainAddress.street_name || mainAddress.streetName;
    const streetNumber = mainAddress.street_number || mainAddress.streetNumber;
    if (streetName) {
      return `${streetName} ${streetNumber || ""}`.trim();
    }
    return null;
  }, [myProfessional]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return chatClients;
    return chatClients.filter(
      (client: any) =>
        client.display_name
          ?.toLowerCase()
          .includes(clientSearch.toLowerCase()) ||
        client.email?.toLowerCase().includes(clientSearch.toLowerCase()),
    );
  }, [chatClients, clientSearch]);

  const [currency, setCurrency] = useState<"USD" | "ARS">("ARS");
  const [taxRate, setTaxRate] = useState<number>(0.21);
  const [taxMethod, setTaxMethod] = useState<"added" | "included">("added");

  const currencySymbol = currency === "ARS" ? "$" : "u$s";

  // Calculations
  const itemsSum = useMemo(
    () => items.reduce((acc, item) => acc + item.total, 0),
    [items],
  );

  const { subtotal, tax, total } = useMemo(() => {
    if (taxMethod === "added") {
      const sub = itemsSum;
      const t = itemsSum * taxRate;
      const tot = sub + t;
      return { subtotal: sub, tax: t, total: tot };
    } else {
      const tot = itemsSum;
      const sub = itemsSum / (1 + taxRate);
      const t = tot - sub;
      return { subtotal: sub, tax: t, total: tot };
    }
  }, [itemsSum, taxRate, taxMethod]);

  const handleAddItems = (newItems) => {
    const formattedItems = newItems.map((item, idx) => ({
      id: Date.now() + idx,
      name: item.name,
      qty: Number(item.qty),
      rate: Number(item.rate),
      total: Number(item.qty) * Number(item.rate),
    }));
    setItems([...items, ...formattedItems]);
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const generatePdfBlob = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. Top Right: Factura & Date
    doc.setFontSize(10);
    doc.setTextColor("#000000");
    doc.text("Presupuesto", pageWidth - 40, 50, { align: "right" });

    doc.setFontSize(12);
    doc.setTextColor("#ff4d4f"); // Red color for number

    // Date box
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = String(today.getFullYear()).slice(-2);

    doc.setDrawColor("#000000");
    doc.rect(pageWidth - 160, 80, 120, 20); // main box
    doc.line(pageWidth - 110, 80, pageWidth - 110, 100);
    doc.line(pageWidth - 85, 80, pageWidth - 85, 100);
    doc.line(pageWidth - 60, 80, pageWidth - 60, 100);
    doc.setTextColor("#000000");
    doc.setFontSize(9);
    doc.text("FECHA", pageWidth - 155, 93);
    doc.text(day, pageWidth - 100, 93);
    doc.text(month, pageWidth - 75, 93);
    doc.text(year, pageWidth - 50, 93);

    // 2. Logo
    try {
      const img = new window.Image();
      img.src = logoImage.src;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      doc.addImage(img, "PNG", 40, 40, 120, 60);
    } catch (err) {
      doc.setFontSize(24);
      doc.text("Tu logo aquí", 40, 70);
    }

    // 2b. Professional Avatar & Company
    let textX = 40;
    const professional = {
      name:
        profileData?.display_name ||
        user?.user_metadata?.full_name ||
        user?.display_name ||
        "Profesional",
      email: user?.email || "",
      address: professionalAddress || "",
      companyName: professionalCompany?.name || "",
      avatarUrl:
        profileData?.avatar_url ||
        user?.user_metadata?.avatar_url ||
        user?.avatar_url ||
        "",
    };
    if (professional.avatarUrl) {
      try {
        const img = new window.Image();
        img.src = professional.avatarUrl;
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        doc.addImage(img, "JPEG", 40, 110, 40, 40);
        textX = 90;
      } catch (err) {
        console.error("Error loading professional avatar:", err);
      }
    }

    doc.setFontSize(10);
    doc.setTextColor("#000000");
    if (professional.companyName) {
      doc.setFont("helvetica", "bold");
      doc.text(professional.companyName, textX, 125);
      doc.setFont("helvetica", "normal");
      doc.text(`Prof: ${professional.name}`, textX, 140);
    } else {
      doc.setFont("helvetica", "bold");
      doc.text(professional.name, textX, 135);
    }

    // 3. Client details
    doc.setFontSize(10);
    doc.setTextColor("#000000");
    doc.setFont("helvetica", "normal");
    const startY = 180;
    const client = {
      name: isCustomClientMode
        ? customClientName
        : selectedClient
          ? selectedClient.display_name || ""
          : clientSearch,
      phone: selectedClient?.phone || "",
      address: selectedClient?.address || "",
      email: selectedClient?.email || (selectedClient ? "" : clientSearch),
    };
    doc.text(`Cliente:     ${client.name || ""}`, 40, startY);
    doc.line(80, startY + 2, 260, startY + 2); // line for client

    doc.text(`Teléfono:  ${client.phone || ""}`, 300, startY);
    doc.line(345, startY + 2, pageWidth - 40, startY + 2);

    doc.text(`Dirección: ${client.address || ""}`, 40, startY + 30);
    doc.line(90, startY + 32, 260, startY + 32);

    doc.text(`Correo:    ${client.email || ""}`, 300, startY + 30);
    doc.line(340, startY + 32, pageWidth - 40, startY + 32);

    // 4. Table
    const tableStartY = startY + 60;
    const tableBody =
      items.length > 0
        ? items.map((item: any) => [
            item.qty?.toString() || "1",
            item.name || "Servicio",
            `${currencySymbol} ${(item.rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            `${currencySymbol} ${(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          ])
        : [];

    while (tableBody.length < 12) {
      tableBody.push(["", "", "", ""]);
    }

    autoTable(doc, {
      startY: tableStartY,
      head: [["Cantidad", "Producto", "Precio", "Total"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [180, 180, 180],
        lineWidth: 1,
        halign: "center",
        fontStyle: "bold",
      },
      bodyStyles: {
        lineColor: [180, 180, 180],
        lineWidth: 1,
        minCellHeight: 25,
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 70 },
        1: { halign: "left" },
        2: { halign: "center", cellWidth: 80 },
        3: { halign: "center", cellWidth: 80 },
      },
      margin: { left: 40, right: 40 },
    });

    // 5. Total Block
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    let blockHeight = 25;
    const hasTax = tax > 0;
    if (hasTax) {
      blockHeight = 65;
    }

    doc.setFillColor(255, 240, 240);
    doc.rect(pageWidth - 220, finalY, 180, blockHeight, "F");
    doc.setFontSize(10);
    doc.setTextColor("#000000");

    if (hasTax) {
      doc.setFont("helvetica", "normal");
      doc.text("Subtotal", pageWidth - 210, finalY + 17);
      doc.text(
        `${currencySymbol} ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        pageWidth - 50,
        finalY + 17,
        { align: "right" },
      );

      const taxPercent =
        subtotal > 0 ? Math.round((tax / subtotal) * 1000) / 10 : 0;
      doc.text(`IVA (${taxPercent}%)`, pageWidth - 210, finalY + 34);
      doc.text(
        `${currencySymbol} ${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        pageWidth - 50,
        finalY + 34,
        { align: "right" },
      );

      doc.setDrawColor("#b8b8b8");
      doc.line(pageWidth - 210, finalY + 42, pageWidth - 50, finalY + 42);

      doc.setFont("helvetica", "bold");
      doc.text("Total", pageWidth - 210, finalY + 57);
      doc.text(
        `${currencySymbol} ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        pageWidth - 50,
        finalY + 57,
        { align: "right" },
      );
    } else {
      doc.setFont("helvetica", "bold");
      doc.text("Total", pageWidth - 210, finalY + 17);
      doc.text(
        `${currencySymbol} ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        pageWidth - 50,
        finalY + 17,
        { align: "right" },
      );
    }

    // Disclaimer
    doc.setFontSize(8);
    doc.setTextColor("#666666");
    doc.setFont("helvetica", "italic");
    doc.text(
      "* Nota: Los valores expresados son referenciales y pueden sufrir modificaciones",
      40,
      pageHeight - 95,
    );
    doc.text(
      "debido a factores externos o fluctuaciones económicas.",
      40,
      pageHeight - 85,
    );

    // 6. Footer (Red block)
    doc.setFillColor(255, 77, 79);
    doc.rect(0, pageHeight - 80, pageWidth, 80, "F");
    doc.setTextColor("#ffffff");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(
      `Dirección: ${professional.address || "Sin Dirección"}`,
      40,
      pageHeight - 40,
    );
    doc.text(
      `Correo: ${professional.email || "Sin Email"}`,
      pageWidth / 2 - 50,
      pageHeight - 40,
    );

    return doc.output("blob");
  };

  const handleSend = async () => {
    if (isCustomClientMode) {
      alert(
        "No puedes enviar el presupuesto a través de la plataforma usando un nombre manual. Solo puedes descargarlo como PDF desde la previsualización.",
      );
      return;
    }

    if (!selectedClient) {
      alert(
        "Por favor, selecciona un cliente de la lista para poder registrar y enviar el presupuesto.",
      );
      return;
    }

    setIsSending(true);
    try {
      const pdfBlob = await generatePdfBlob();

      const uploadResult = await uploadProposalPdf({
        file: pdfBlob,
        contentType: "application/pdf",
      });

      if (!uploadResult?.publicUrl) {
        throw new Error("No se pudo obtener la URL del archivo subido.");
      }

      const publicUrl = await getProposalSignedUrl(uploadResult.publicUrl);

      const res = await createProposalAction({
        data: {
          file_url: publicUrl,
          user_id: selectedClient.id,
          accepted: false,
          professional_name:
            profileData?.display_name ||
            user?.user_metadata?.full_name ||
            user?.display_name ||
            "Profesional",
        },
        token: getAccessToken(),
      });

      if (res?.serverError) {
        throw new Error(res.serverError);
      }

      alert(
        "¡Presupuesto creado y guardado con éxito! Redirigiendo a tus mensajes...",
      );

      const params = new URLSearchParams();
      params.set("prefillAttachmentUrl", publicUrl);
      router.push(`/mensajes?${params.toString()}`);
    } catch (error: any) {
      console.error("Error creating and sending proposal:", error);
      alert(
        error.message ||
          "Ocurrió un error al procesar el presupuesto. Intentá nuevamente.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="proposal-creator">
      <header className="proposal-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <h1>Crear Nuevo Presupuesto</h1>
        </div>
        <div className="header-actions">
          <button
            className="btn-primary"
            onClick={() => setIsPreviewOpen(true)}
          >
            Previsualizar
          </button>
        </div>
      </header>

      <div className="proposal-grid">
        {/* Left Column: Steps 01 & 02 */}
        <div className="proposal-col">
          <section className="proposal-card step-card">
            <header className="card-header">
              <span className="step-label">PASO 01</span>
              <h3>Información del Cliente</h3>
            </header>

            <div className="form-group">
              <label>SELECCIONAR CLIENTE</label>
              {isCustomClientMode ? (
                <div className="custom-client-input-wrapper">
                  <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                    <input
                      type="text"
                      placeholder="Nombre del cliente..."
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color)",
                      }}
                    />
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setIsCustomClientMode(false);
                        setCustomClientName("");
                      }}
                    >
                      X
                    </button>
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      marginTop: "8px",
                    }}
                  >
                    Modo local: El presupuesto solo se podrá descargar en PDF,
                    no enviar.
                  </p>
                </div>
              ) : (
                <>
                  <div className="search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Buscar cliente guardado..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setSelectedClient(null);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowClientDropdown(false), 200)
                      }
                    />
                    <div className="dropdown-arrow">▼</div>

                    {showClientDropdown && filteredClients.length > 0 && (
                      <ul className="proposal-client-dropdown">
                        {filteredClients.map((client: any) => (
                          <li
                            key={client.id}
                            className="proposal-client-item"
                            onClick={() => {
                              setClientSearch(
                                client.display_name || client.email,
                              );
                              setSelectedClient(client);
                              setShowClientDropdown(false);
                            }}
                          >
                            {client.avatar_url ? (
                              <img
                                src={client.avatar_url}
                                alt={client.display_name}
                                className="proposal-client-avatar"
                              />
                            ) : (
                              <div className="proposal-client-avatar-placeholder">
                                {(client.display_name ||
                                  client.email ||
                                  "U")[0].toUpperCase()}
                              </div>
                            )}
                            <div className="proposal-client-info">
                              <span className="proposal-client-name">
                                {client.display_name || "Usuario"}
                              </span>
                              <span className="proposal-client-email">
                                {client.email}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    className="add-new-btn"
                    onClick={() => {
                      setIsCustomClientMode(true);
                      setSelectedClient(null);
                      setClientSearch("");
                      setShowClientDropdown(false);
                    }}
                  >
                    <Plus size={14} /> AÑADIR NOMBRE MANUAL
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="proposal-card step-card">
            <header className="card-header">
              <span className="step-label">PASO 02</span>
              <h3>Plazos del Proyecto</h3>
            </header>

            <div className="form-row">
              <div className="form-group">
                <label>FINALIZACIÓN ESTIMADA</label>
                <div className="date-input-wrapper">
                  <input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={estimatedDate}
                    onChange={(e) => handleDateChange(e, setEstimatedDate)}
                  />
                  <Calendar size={18} className="date-icon" />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>VENCIMIENTO DEL PRESUPUESTO</label>
                <div className="date-input-wrapper">
                  <input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={dueDate}
                    onChange={(e) => handleDateChange(e, setDueDate)}
                  />
                  <Calendar size={18} className="date-icon" />
                </div>
              </div>
            </div>
          </section>

          <section className="proposal-card step-card">
            <header className="card-header">
              <span className="step-label">PASO 03</span>
              <h3>Configuración Financiera</h3>
            </header>

            <div className="form-row">
              <div className="form-group">
                <label>MONEDA</label>
                <div className="select-input-wrapper">
                  <select
                    value={currency}
                    onChange={(e) =>
                      setCurrency(e.target.value as "USD" | "ARS")
                    }
                    className="settings-select"
                  >
                    <option value="ARS">Pesos ($)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                  <div className="dropdown-arrow">▼</div>
                </div>
              </div>
            </div>

            <div className="form-row proposal-form-row">
              <div className="form-group">
                <label>TASA DE IVA</label>
                <div className="select-input-wrapper">
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="settings-select"
                  >
                    <option value={0}>Sin IVA (0%)</option>
                    <option value={0.105}>IVA 10.5%</option>
                    <option value={0.21}>IVA 21%</option>
                  </select>
                  <div className="dropdown-arrow">▼</div>
                </div>
              </div>
            </div>

            <div className="form-row proposal-form-row">
              <div className="form-group">
                <label>MÉTODO DE IVA</label>
                <div className="select-input-wrapper">
                  <select
                    value={taxMethod}
                    onChange={(e) =>
                      setTaxMethod(e.target.value as "added" | "included")
                    }
                    className="settings-select"
                  >
                    <option value="added">Sumar al total (Precio + IVA)</option>
                    <option value="included">
                      Incluido en el total (Discriminar)
                    </option>
                  </select>
                  <div className="dropdown-arrow">▼</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Step 04 */}
        <div className="proposal-col">
          <section className="proposal-card items-card">
            <header className="card-header items-header">
              <div className="label-group">
                <span className="step-label">PASO 04</span>
                <h3>Detalle de Servicios y Productos</h3>
              </div>
              <div className="items-header-actions">
                <button
                  className="add-item-trigger"
                  onClick={() => {
                    setModalInitialTab("services");
                    setIsAddItemOpen(true);
                  }}
                >
                  <Plus size={14} /> AÑADIR SERVICIO
                </button>
                <button
                  className="add-item-trigger"
                  onClick={() => {
                    setModalInitialTab("products");
                    setIsAddItemOpen(true);
                  }}
                >
                  <Plus size={14} /> AÑADIR PRODUCTO
                </button>
              </div>
            </header>

            <div className="items-list-container">
              {items.length === 0 ? (
                <div className="empty-items">
                  Aún no se han añadido ítems. Haz clic en "+ AÑADIR" para
                  comenzar.
                </div>
              ) : (
                <div className="items-scroll">
                  {items.map((item) => (
                    <div key={item.id} className="item-row">
                      <button
                        className="remove-item"
                        onClick={() => removeItem(item.id)}
                      >
                        <X size={16} />
                      </button>
                      <div className="item-info">
                        <span className="item-label">
                          DESCRIPCIÓN / NOMBRE DEL ÍTEM
                        </span>
                        <p className="item-name">{item.name}</p>
                      </div>
                      <div className="item-metrics">
                        <div className="metric">
                          <span className="item-label">CANTIDAD</span>
                          <p>{item.qty}</p>
                        </div>
                        <div className="metric">
                          <span className="item-label">
                            UNITARIO ({currencySymbol})
                          </span>
                          <p>
                            {currencySymbol} {item.rate}
                          </p>
                        </div>
                        <div className="metric total">
                          <span className="item-label">TOTAL</span>
                          <p>
                            {currencySymbol} {item.total.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Summary Section */}
      <section className="proposal-summary-card">
        <div className="summary-info">
          <h3>Resumen del Presupuesto</h3>
          <p>
            Todos los cálculos de subtotal, impuestos e importes totales se
            generan automáticamente.
          </p>
          <div className="summary-badges">
            <div className="summary-badge">
              <span className="badge-label">MONEDA</span>
              <div className="badge-value">
                {currency === "ARS" ? "Pesos ($)" : "Dólares (USD)"}
              </div>
            </div>
          </div>
        </div>

        <div className="summary-values">
          <div className="value-row">
            <span>Subtotal</span>
            <span>
              {currencySymbol}{" "}
              {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="value-row">
            <span>
              IVA ({taxRate * 100}%){" "}
              {taxMethod === "included" ? "(Incluido)" : ""}
            </span>
            <span>
              {currencySymbol}{" "}
              {tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="value-divider"></div>
          <div className="total-amount-row">
            <span className="total-label">MONTO TOTAL</span>
            <h2 className="total-value">
              {currencySymbol}{" "}
              {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginTop: "1rem",
              fontStyle: "italic",
              textAlign: "right",
            }}
          >
            * Nota: Los valores expresados son referenciales y pueden sufrir
            <br />
            modificaciones debido a factores externos o fluctuaciones
            económicas.
          </p>
        </div>
      </section>

      {/* Footer Actions */}
      <footer className="proposal-footer">
        <div className="footer-meta">
          <div className="meta-item">
            <div className="meta-icon">
              <FileText size={18} />
            </div>
            <div>
              <span className="meta-label">TIPO DE DOCUMENTO</span>
              <p>Presupuesto Comercial</p>
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-icon">
              <CheckCircle size={18} />
            </div>
            <div>
              <span className="meta-label">VERIFICACIÓN</span>
              <p>Auto-validado</p>
            </div>
          </div>
        </div>

        <div className="footer-btns">
          <button
            className="btn-preview"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye size={18} /> PREVISUALIZAR PRESUPUESTO
          </button>
          <button
            className="btn-send"
            onClick={handleSend}
            disabled={isSending}
          >
            <Send size={18} />{" "}
            {isSending ? "ENVIANDO..." : "ENVIAR PRESUPUESTO"}
          </button>
        </div>
      </footer>

      {/* Modals */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAdd={handleAddItems}
        initialTab={modalInitialTab}
      />

      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        items={items}
        totals={{ subtotal, tax, total }}
        currencySymbol={currencySymbol}
        client={{
          name: isCustomClientMode
            ? customClientName
            : selectedClient
              ? selectedClient.display_name || ""
              : clientSearch,
          phone: selectedClient?.phone || "",
          address: selectedClient?.address || "",
          email: selectedClient?.email || "",
        }}
        professional={{
          name:
            profileData?.display_name ||
            user?.user_metadata?.full_name ||
            user?.display_name ||
            "Profesional",
          email: user?.email || "",
          address: professionalAddress || "",
          companyName: professionalCompany?.name || "",
          avatarUrl:
            profileData?.avatar_url ||
            user?.user_metadata?.avatar_url ||
            user?.avatar_url ||
            "",
        }}
      />
    </div>
  );
}
