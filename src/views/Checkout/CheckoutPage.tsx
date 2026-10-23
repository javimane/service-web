"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { useAuth } from "@/context/AuthContext";
import ProductPaymentModal from "@/views/Products/components/ProductPaymentModal";
import ServicePaymentModal from "@/views/Services/components/ServicePaymentModal";
import WithdrawalReviewNotice from "@/components/WithdrawalReviewNotice/WithdrawalReviewNotice";
import "./CheckoutPage.css";

const AGE_RESTRICTED_SUBCATEGORIES = new Set([
  "2d6c30b1-95b8-4a2a-b43f-f9f09e5c507a",
  "fb762aba-7df9-4f6c-b507-651323fab7bb",
  "ea1d5cc2-5ed0-4227-a5e3-0f292d4ec67a",
]);

type Props = {
  kind: "producto" | "servicio";
  item: any;
  initialQuantity: number;
};

export default function CheckoutPage({ kind, item, initialQuantity }: Props) {
  const router = useRouter();
  const { user, isAgeVerified } = useAuth();
  const backUrl = `/${kind === "producto" ? "productos" : "servicios"}/${item.id}`;
  const professionalProduct = item?.ProfessionalProducts?.[0];
  const professional = kind === "producto"
    ? professionalProduct?.Professional
    : item?.professional ?? item?.Professional;
  const profile = professional?.Profile ?? professional?.profile;
  const companyData = professional?.Company ?? professional?.Companies ?? professional?.company ?? professional?.companies;
  const company = Array.isArray(companyData) ? companyData[0] : companyData;
  const professionalName = company?.name || profile?.display_name || "Profesional independiente";
  const addressData = professional?.Address ?? professional?.address;
  const address = Array.isArray(addressData) ? addressData[0] : addressData;
  const subcategoryId = item?.subcategory_id ?? item?.SubCategory?.id ?? item?.subCategory?.id;
  const categoryId = item?.category_id ?? item?.Category?.id ?? item?.category?.id;
  const isAgeRestricted = Boolean(subcategoryId && AGE_RESTRICTED_SUBCATEGORIES.has(String(subcategoryId).toLowerCase()));
  const currencyCode = professionalProduct?.currency_code ?? item?.currency_code ?? item?.Product?.currency_code ?? "ARG";
  const canPurchase = ![45, 46].includes(Number(categoryId)) && String(currencyCode).toUpperCase() !== "USD" &&
    (!isAgeRestricted || (Boolean(user) && isAgeVerified));

  return (
    <div className="checkout-page">
      <Navbar />
      <main className="checkout-page__main">
        <div className="checkout-page__topline">
          <Link href={backUrl} className="checkout-page__back">
            <ArrowLeft size={18} aria-hidden="true" /> Volver al detalle
          </Link>
          <span className="checkout-page__secure"><LockKeyhole size={16} aria-hidden="true" /> Pago seguro</span>
        </div>
        <div className="checkout-page__heading">
          <span className="checkout-page__eyebrow">ÚLTIMO PASO</span>
          <h1>{kind === "producto" ? "Finalizar compra" : "Contratar servicio"}</h1>
          <p>Revisá el pedido y elegí cómo querés pagar.</p>
        </div>
        <WithdrawalReviewNotice />
        {kind === "producto" ? (
          canPurchase ? <ProductPaymentModal
            pageMode isOpen onClose={() => router.push(backUrl)}
            product={{ ...item, ...professionalProduct, name: item.name }}
            professionalId={Number(professional?.id ?? professionalProduct?.professional_id ?? 0)}
            professionalProductId={professionalProduct?.id}
            sellerName={professionalName}
            sellerProvince={address?.Province?.name ?? address?.province?.name}
            companyFreeShippingCountry={Boolean(company?.free_shipping_country)}
            companyFreeShippingCountryMinAmount={Number(company?.free_shipping_country_min_amount ?? 0)}
            isAgeRestricted={isAgeRestricted}
            canPurchase={canPurchase}
            initialQuantity={initialQuantity}
          /> : <div className="checkout-page__unavailable" role="alert">
            Este producto no está disponible para la compra con esta cuenta.
          </div>
        ) : (
          <ServicePaymentModal
            pageMode isOpen onClose={() => router.push(backUrl)}
            service={item}
            professionalId={item?.professional_id ?? professional?.id ?? 0}
            professionalName={professionalName}
            professionalPhone={profile?.phone ?? profile?.phone_number ?? professional?.phone ?? company?.phone}
          />
        )}
        <p className="checkout-page__assurance"><ShieldCheck size={18} aria-hidden="true" /> Tus datos de pago se procesan de forma segura.</p>
      </main>
      <Footer />
    </div>
  );
}
