import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "./api.config";
import { requestIdentityVerification } from "@/utils/identityVerification";

export type PageResponse<T> = {
  data?: T[];
  items?: T[];
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasPrev?: boolean;
  hasNext?: boolean;
};

export type OrderStatus =
  | "pending"
  | "pending_payment"
  | "paid"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "ready_for_dispatch"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "refunded";

export type DeliveryType = "pickup" | "shipment" | "coordinate_with_merchant";

export type LiquidationsReportType = "settlement" | "sale" | "full";

export type GeneratedReportNotification = {
  id: string;
  type: string;
  title: string;
  content: string;
  created_at: string;
};

export type OrderSummary = {
  id: string;
  order_number?: string | null;
  status: OrderStatus;
  delivery_type: DeliveryType;
  total_amount: number | null;
  shipping_cost?: number | null;
  delivery_eta_minutes?: number | null;
  scheduled_delivery_date?: string | null;
  quantity: number | null;
  created_at: string;
  paid_at?: string | null;
  cancelled_at?: string | null;
  delivered_at?: string | null;
  cancel_reason?: string | null;
  payment_method?: string | null;
  payment_provider?: string | null;
  installments?: number | null;
  withdrawal_eligible?: boolean;
  withdrawal_requested?: boolean;
  claim_requested?: boolean;
  claim_resolution_confirmable?: boolean;
  return_ticket_available?: boolean;
  shipment_id?: string | null;
  shipment_status?: string | null;
  user_id?: string;
  professional_id?: number;
  buyer?: {
    id?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    phone_number?: string;
  } | null;
  user?: {
    id?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email?: string;
    phone?: string;
    phone_number?: string;
  } | null;
  professional_product?: {
    product?: {
      id: string;
      name: string;
      image_url?: string | null;
      price?: number;
      brand?: string | null;
      ean?: string | null;
      color?: string | null;
      size_letter?: string | null;
      size_number?: number | null;
      attributes?: Array<{ name: string; value: string }> | null;
      products_images?: Array<{ image_url: string; display_order?: number | null }> | null;
    };
  } | null;
  service?: {
    id: string;
    name: string;
    price?: number;
  } | null;
  service_id?: string | null;
  appointment_status?:
    | "pending_appointment"
    | "scheduled"
    | "completed"
    | "cancelled"
    | null;
  appointment?: OrderServiceAppointment | null;
  shipping_address?: {
    street?: string;
    street_name?: string;
    number?: string;
    street_number?: string;
    floor?: string;
    apartment_number?: string;
    floor_apartment?: string;
    block?: string;
    between_streets?: string;
    notes?: string;
    city?: string;
    department?: string;
    state?: string;
    province?: string;
    zip_code?: string;
    postal_code?: string;
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    phone?: string;
  } | null;
  delivery_address?: UserAddress | null;
  invoice_url?: string | null;
  invoice_status?: "issued" | "not_issued" | null;
  pickup_code?: string | null;
  billing_data_id?: string | null;
  billing_data?: UserBillingData | any;
  billing_profile?: UserBillingData | any;
  transport_shipment?: {
    carrier_name?: string | null;
    tracking_number?: string | null;
    tracking_url?: string | null;
  } | null;
  items?: Array<{
    id: string;
    product_id?: string | null;
    service_id?: string | null;
    item_type?: "product" | "service";
    product?: {
      id: string;
      name: string;
      brand?: string | null;
      ean?: string | null;
      color?: string | null;
      size_letter?: string | null;
      size_number?: number | null;
      attributes?: Array<{ name?: string; value?: string }> | Record<string, string> | null;
      products_images?: Array<{ image_url: string; display_order?: number | null }> | null;
    } | null;
    service?: { id: string; name: string } | null;
    product_name?: string;
    product_image?: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  branch_id?: string | null;
  origin_address_id?: number | null;
  branch?: Branch | null;
  origin_address?: {
    id: number;
    street_name?: string | null;
    street_number?: string | null;
    floor_apartment?: string | null;
    zip_code?: string | null;
    phone?: string | null;
  } | null;
};

export type ReturnTicket = {
  id: string;
  order_id: string;
  created_at: string;
  status: string;
  received_at: string | null;
  delivery_type: DeliveryType;
  destination: {
    company_name: string;
    branch_name: string;
    street_name?: string | null;
    street_number?: string | null;
    floor_apartment?: string | null;
    zip_code?: string | null;
    phone?: string | null;
    province?: string | null;
    department?: string | null;
  };
  buyer: { name: string; phone?: string | null; email?: string | null; address?: string | null; zip_code?: string | null };
  items: Array<{ name: string; quantity: number; ean?: string | null; attributes?: unknown }>;
};

export type OrderServiceAppointment = {
  id?: string;
  order_id?: string;
  appointment_date: string;
  appointment_time: string;
  appointment_at?: string;
  status?: string;
  notes?: string | null;
  created_at?: string;
};

export type Liquidation = {
  branch_id?: string | null;
  origin_address_id?: number | null;
  id: string;
  status:
    | "available"
    | "pending"
    | "in_process"
    | "settled"
    | "withheld"
    | string;
  amount?: number;
  platform_fee?: number;
  tax_withholding?: number;
  net_amount?: number;
  created_at: string;
  cutoff_date?: string;
  scheduled_release_at?: string | null;
  paid_to_merchant_at?: string | null;
  receipt_url?: string | null;
  orders?: OrderSummary[];
};

export type Branch = {
  id: string;
  company_id: number;
  name: string;
  is_main?: boolean;
  address_id?: number | null;
  street_name?: string | null;
  street_number?: string | null;
  floor_apartment?: string | null;
  zip_code?: string | null;
  province_id?: number | null;
  department_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  delivery_radius_km?: number | null;
  delivery_eta_minutes?: number | null;
  own_riders_available?: boolean;
  independent_riders_available?: boolean;
  delivery_available?: boolean;
  phone?: string | null;
  opening_hours?: string | null;
  is_open?: boolean;
  company_covers_shipping?: boolean;
  is_pickup_point: boolean;
  auto_print_tickets?: boolean;
  created_at?: string;
};

export type ProfessionalScore = {
  id?: string;
  professional_id?: number;
  score: number;
  medal:
    | "Novato"
    | "Bronce"
    | "Plata"
    | "Oro"
    | "Platino"
    | "Mercado Lider"
    | "Supremo"
    | string;
  level?: string;
  tier?: string;
  total_completed_orders?: number;
  completed_services_rate?: number;
  average_rating?: number;
  total_reviews?: number;
  penalties_count?: number;
  next_tier_score?: number;
  created_at?: string;
  updated_at?: string;
};

export type ProfessionalReview = {
  id: string;
  professional_id: number;
  user_id?: string;
  user?: {
    full_name?: string;
    avatar?: string;
  };
  client_name?: string;
  customer_name?: string;
  rating: number;
  comment?: string;
  created_at: string;
};

export type UserDataBank = {
  id?: string;
  company_id?: number;
  cbu_cvu: string;
  alias?: string | null;
  bank_name?: string | null;
  account_holder?: string | null;
  cuit_cuil?: string | null;
};

export type UserPaymentMethod = {
  id: string;
  user_id: string;
  getnet_card_token: string;
  last_four: string;
  card_brand?: string;
  card_type?: "credit" | "debit" | string;
  bank_name?: string;
  card_holder_name?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
};

export type CreatePaymentMethodDto = {
  getnet_card_token: string;
  last_four?: string;
  card_brand?: string;
  card_type?: "credit" | "debit" | string;
  bank_name?: string;
  card_holder_name?: string;
  card_holder_dni?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default?: boolean;
};

export type IdentityVerificationStatus = {
  is_age_verified: boolean;
  purchase_eligible: boolean;
  session?: {
    status?: string;
    identity_verified?: boolean;
    age_verified?: boolean;
  } | null;
};

export type RiderVehicle = {
  id: string;
  vehicle_type: "motorcycle" | "car" | "pickup" | "van" | "truck" | string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  license_plate?: string | null;
  capacity_kg?: number | null;
  capacity_m3?: number | null;
  is_active: boolean;
};

export type FleetVehicle = RiderVehicle & {
  employer_id: string;
  assigned_rider_id: string | null;
  documents: RiderDocument[];
};

export type RiderDocument = {
  id: string;
  rider_vehicle_id?: string | null;
  document_type:
    | "driving_license"
    | "vehicle_registration"
    | "insurance"
    | "criminal_record"
    | string;
  storage_path: string;
  file_name: string;
  mime_type?: string | null;
  expires_at?: string | null;
  created_at?: string;
};

export type RiderEmployee = {
  id: string;
  username?: string | null;
  first_name?: string;
  last_name?: string;
  email?: string;
  dni?: string;
  phone?: string;
  photo_url?: string;
  status?: "active" | "on_trip" | "inactive";
  is_blocked?: boolean;
  blocked_reason?: string | null;
  blocked_at?: string | null;
  is_paused?: boolean;
  paused_reason?: string | null;
  paused_at?: string | null;
  verification_status?: "pending" | "under_review" | "verified" | "rejected";
  verification_note?: string | null;
  vehicle?: RiderVehicle | null;
  vehicles?: RiderVehicle[];
  documents?: RiderDocument[];
  fleet_vehicle_id?: string | null;
  own_vehicle_id?: string | null;
  own_vehicle?: RiderVehicle | null;
  activation?: {
    has_vehicle: boolean;
    missing_documents: string[];
    is_active: boolean;
  };
};

export type FleetTrackingItem = {
  id: string;
  driver_id: string;
  driver_name: string;
  driver_phone?: string;
  driver_status: "available" | "on_trip" | "offline";
  vehicle_type: string;
  current_lat: number;
  current_lng: number;
  current_shipment?: {
    id: string;
    order_id: string;
    merchant_name: string;
    origin_lat: number;
    origin_lng: number;
    destination_address: string;
    destination_lat: number;
    destination_lng: number;
    status: string;
    eta_minutes?: number;
  } | null;
  route_polyline?: Array<[number, number]>;
};

export type FleetMetrics = {
  active_drivers: number;
  trips_in_progress: number;
  completed_today: number;
  delayed_orders: number;
};

export type ProductVariant = {
  id: string;
  professional_product_id: string;
  product_id: string;
  parent_product_id: string;
  is_main: boolean;
  ean?: string | null;
  is_active?: boolean;
  name: string;
  attributes: Array<{ name: string; value: string }>;
  price?: number;
  offer_price?: number;
  wholesale_price?: number;
  wholesale_unit?: number;
  offer_2x1?: boolean;
  offer_3x2?: boolean;
  installments_enabled?: boolean;
  max_installments?: number;
  free_shipping?: boolean;
  stock: number;
  image_url?: string | null;
  images?: string[];
  images_to_save?: string[];
  images_to_delete?: string[];
  video_url?: string | null;
  videos?: string[];
  videos_to_save?: string[];
  videos_to_delete?: string[];
  created_at?: string;
  updated_at?: string;
};

export type ShippingPolicy = {
  professional_id?: number;
  has_own_riders: boolean;
  free_shipping_enabled?: boolean;
  free_shipping_radius_km: number;
  free_shipping_min_amount: number;
  free_shipping_max_weight: number;
  local_free_km?: number;
  local_price_per_km?: number;
  min_units_free?: number;
  base_weight_allowance?: number;
  local_price_per_extra_kg?: number;
  national_flat_price?: number;
  national_price_per_extra_kg?: number;
};

export type CartItem = {
  id: string;
  product_id?: string | null;
  professional_product_id?: string | null;
  service_id?: string | null;
  quantity: number;
  subtotal: number;
  unit_price?: number;
  professional_product?: {
    installments_enabled?: boolean;
    max_installments?: number;
  } | null;
  product?: {
    id: string;
    name: string;
    image_url?: string | null;
    price: number;
    offer_price?: number | null;
    wholesale?: boolean;
    wholesale_price?: number | null;
    wholesale_unit?: number | null;
    offer_2x1?: boolean;
    offer_3x2?: boolean;
    stock?: number | null;
    installments_enabled?: boolean;
    max_installments?: number;
    is_food_perishable?: boolean;
    category?: { id: number; name: string } | null;
    professional?: {
      id: number;
      name?: string;
      commercial_name?: string;
    } | null;
  } | null;
  service?: {
    id: string;
    name: string;
    price: number;
    installments_enabled?: boolean;
    max_installments?: number;
    category?: { no_installments?: boolean } | null;
    professional?: {
      id: number;
      name?: string;
      commercial_name?: string;
    } | null;
  } | null;
};

export type Cart = {
  id: string | null;
  professional_id: number | null;
  items: CartItem[];
  total: number;
};

export type CalculateShippingDto = {
  merchant_id?: number;
  professional_product_id?: string;
  items?: Array<{ professional_product_id: string; quantity: number }>;
  quantity?: number;
  installments?: number;
  delivery_type?: DeliveryType;
  delivery_address_id?: string;
  branch_id?: string;
  origin_address_id?: number;
  shipping_address?: {
    street?: string;
    number?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
  };
  destination_zip?: string;
  destination_lat?: number;
  destination_lng?: number;
  items_count?: number;
  total_weight_kg?: number;
};

export type ShippingRate = {
  delivery_type: DeliveryType | "carrier";
  title: string;
  price: number;
  estimated_delivery: string;
};

export type MarketplaceCommission = {
  id: number;
  installments: number;
  commission_pct: number;
  effective_commission_pct?: number;
  commission_benefit_pct?: number;
  iva_pct: number;
  iva_commission_pct: number;
  total_commission_pct: number;
  description?: string;
  is_active: boolean;
};

export type PlatformShippingRate = {
  id: number;
  vehicle_code: "bicycle" | "motorcycle" | "car" | "van" | "truck" | string;
  name: string;
  price_per_km: number;
  min_price_first_km: number;
  night_price_per_km: number;
  extra_price_per_kg: number;
  max_weight_kg: number;
  is_active: boolean;
};

export type CalculateShippingResponse = {
  shippingCost: number;
  product_subtotal?: number;
  paid_units?: number;
  buyer_shipping_amount?: number;
  carrier_shipping_cost?: number;
  merchant_shipping_subsidy?: number;
  shipping_cost?: number;
  unitPrice: number;
  professionalProduct?: any;
  commission_preview?: any;
  vehicle?: {
    code: string;
    name: string;
    is_heavy?: boolean;
    max_weight_kg?: number;
    price_per_km?: number;
    min_price_first_km?: number;
    night_price_per_km?: number;
    extra_price_per_kg?: number;
  };
  distance_km?: number;
  total_weight_kg?: number;
  estimated_weight_kg?: number;
  is_night?: boolean;
  is_night_rate?: boolean;
  is_free_shipping?: boolean;
  free_shipping_reason?: string;
  requires_heavy_vehicle?: boolean;
  delivery_estimate?: string;
  estimated_delivery_minutes?: number | null;
  requires_scheduled_delivery?: boolean;
  scheduled_delivery_date?: string | null;
};

export type TaxCondition = "consumidor_final" | "responsable_inscripto";

export type UserBillingData = {
  id: string;
  user_id: string;
  full_name: string;
  cuit: string;
  tax_condition: TaxCondition;
  company_name?: string | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CreateUserBillingDataDto = {
  full_name: string;
  cuit: string;
  tax_condition: TaxCondition;
  company_name?: string | null;
  is_default?: boolean;
};

export type UpdateUserBillingDataDto = {
  full_name?: string;
  cuit?: string;
  tax_condition?: TaxCondition;
  company_name?: string | null;
  is_default?: boolean;
};

export type UserAddress = {
  id: string;
  user_id?: string;
  name?: string;
  phone?: string;
  street?: string;
  street_name?: string;
  number?: string;
  street_number?: string;
  apartment_number?: string;
  floor?: string;
  floor_apartment?: string;
  block?: string;
  between_streets?: string;
  notes?: string;
  department_id?: number | null;
  department?: string;
  city?: string;
  province_id?: number | null;
  province?: string;
  postal_code?: string;
  zip_code?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CreateUserAddressDto = {
  name?: string;
  phone?: string;
  street?: string;
  street_name?: string;
  number?: string;
  street_number?: string;
  apartment_number?: string;
  floor?: string;
  floor_apartment?: string;
  block?: string;
  between_streets?: string;
  notes?: string;
  department_id?: number | null;
  department?: string;
  city?: string;
  province_id?: number | null;
  province?: string;
  postal_code?: string;
  zip_code?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
};

export type CheckoutDto = {
  idempotency_key?: string;
  expected_total_amount?: number;
  professional_id: number;
  professional_product_id?: string;
  service_id?: string;
  quantity?: number;
  items?: Array<{
    professional_product_id?: string;
    service_id?: string;
    quantity: number;
    unit_price?: number;
  }>;
  delivery_type: DeliveryType;
  branch_id?: string;
  origin_address_id?: number;
  delivery_address_id?: string;
  schedule_for_next_day?: boolean;
  shipping_address?: {
    street: string;
    number: string;
    floor?: string;
    city: string;
    state: string;
    zip_code: string;
    lat?: number;
    lng?: number;
  };
  shipping_cost?: number;
  billing_data_id?: string;
  payment_method: "getnet" | "getnet_card" | "paycloud_qr";
  card_token?: string;
  installments?: number;
  card_details?: {
    card_number?: string;
    cardholder_name?: string;
    expiration?: string;
    cvv?: string;
    dni?: string;
  };
};

export type PayCloudQrResponse = {
  order_id: string;
  qr_data: string;
  qr_image_url?: string;
  expires_at: string;
  total_amount: number;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
  logistics_role?:
    | "company"
    | "transport_company"
    | "delivery"
    | "buyer"
    | null;
  has_commercial_account?: boolean;
};

const query = (params: Record<string, string | number | undefined | null>) => {
  const value = new URLSearchParams();
  Object.entries(params).forEach(([key, item]) => {
    if (item !== undefined && item !== null && item !== "") {
      value.set(key, String(item));
    }
  });
  return value.toString() ? `?${value}` : "";
};

export const commerceService = {
  // Orders
  merchantOrders: (
    page = 1,
    limit = 10,
    status?: string,
    branch_id?: string,
    dates: {
      sale_date_from?: string;
      sale_date_to?: string;
      paid_date_from?: string;
      paid_date_to?: string;
      delivered_date_from?: string;
      delivered_date_to?: string;
    } = {},
  ) =>
    apiClient<PageResponse<OrderSummary>>(
      `${API_ENDPOINTS.orders.merchant}${query({ page, limit, status, branch_id, ...dates })}`,
    ),

  buyerOrders: (page = 1, limit = 10, status?: string) =>
    apiClient<PageResponse<OrderSummary>>(
      `${API_ENDPOINTS.orders.mine}${query({ page, limit, status })}`,
    ),

  orderDetail: (id: string) =>
    apiClient<OrderSummary>(API_ENDPOINTS.orders.detail(id)),

  confirmOrder: (id: string) =>
    apiClient<OrderSummary>(API_ENDPOINTS.orders.confirm(id), {
      method: "POST",
    }),

  cancelOrder: (id: string, reason?: string) =>
    apiClient<OrderSummary>(API_ENDPOINTS.orders.cancel(id), {
      method: "POST",
      body: { reason },
    }),

  requestWithdrawal: (id: string, reason?: string) =>
    apiClient<{ id: string }>(API_ENDPOINTS.orders.withdrawal(id), {
      method: "POST",
      body: { reason },
    }),

  createClaim: (id: string, reason: string) =>
    apiClient<{ id: string }>(API_ENDPOINTS.orders.claim(id), {
      method: "POST",
      body: { reason },
    }),

  confirmClaimResolved: (id: string) =>
    apiClient<{ id: string; order_id: string; status: string; resolution: string }>(
      API_ENDPOINTS.orders.confirmClaimResolved(id),
      { method: "POST" },
    ),

  returnTicket: (id: string) =>
    apiClient<ReturnTicket>(API_ENDPOINTS.orders.returnTicket(id)),

  receiveReturn: (code: string) =>
    apiClient<{ id: string; order_id: string; return_received_at: string }>(
      API_ENDPOINTS.orders.receiveReturn(code),
      { method: "POST" },
    ),

  verifyPickup: (id: string, code: string) =>
    apiClient<{ success: boolean; message: string }>(
      API_ENDPOINTS.orders.pickupVerify(id),
      { method: "POST", body: { code } },
    ),

  uploadInvoice: (id: string, invoiceUrl: string) =>
    apiClient<{ success: boolean; invoice_url: string }>(
      API_ENDPOINTS.orders.invoice(id),
      { method: "POST", body: { invoice_url: invoiceUrl } },
    ),

  updateTransportShipment: (
    id: string,
    data: {
      carrier_name: string;
      tracking_number: string;
      tracking_url?: string;
    },
  ) =>
    apiClient<OrderSummary>(API_ENDPOINTS.orders.transportShipment(id), {
      method: "POST",
      body: data,
    }),

  calculateShipping: (data: CalculateShippingDto) =>
    apiClient<CalculateShippingResponse>(
      API_ENDPOINTS.orders.calculateShipping,
      {
        method: "POST",
        body: data,
      },
    ),

  calculateServiceCheckout: (serviceId: string, quantity: number, installments: number) =>
    apiClient<{ totalAmount: number; financingSurchargeAmount: number }>(
      API_ENDPOINTS.orders.calculateShipping,
      {
        method: "POST",
        body: {
          service_id: serviceId,
          quantity,
          installments,
          delivery_type: "coordinate_with_merchant",
          payment_method: "getnet_card",
        },
      },
    ),

  commissions: () =>
    apiClient<MarketplaceCommission[]>(API_ENDPOINTS.orders.commissions),
  publicCommissions: () =>
    apiClient<MarketplaceCommission[]>(API_ENDPOINTS.orders.publicCommissions),

  shippingRates: () =>
    apiClient<PlatformShippingRate[]>(API_ENDPOINTS.orders.shippingRates),

  // Billing Data methods
  getMyBillingData: () =>
    apiClient<UserBillingData[]>(API_ENDPOINTS.billingData.my),

  createBillingData: (data: CreateUserBillingDataDto) =>
    apiClient<UserBillingData>(API_ENDPOINTS.billingData.base, {
      method: "POST",
      body: data,
    }),

  updateBillingData: (id: string, data: UpdateUserBillingDataDto) =>
    apiClient<UserBillingData>(API_ENDPOINTS.billingData.detail(id), {
      method: "PUT",
      body: data,
    }),

  deleteBillingData: (id: string) =>
    apiClient<{ success: boolean }>(API_ENDPOINTS.billingData.detail(id), {
      method: "DELETE",
    }),

  attachOrderBillingData: (orderId: string, billingDataId: string) =>
    apiClient<{
      success: boolean;
      order_id: string;
      billing_data_id: string;
      billing_data: any;
    }>(API_ENDPOINTS.orders.attachBillingData(orderId), {
      method: "PATCH",
      body: { billing_data_id: billingDataId },
    }),

  // User Delivery Addresses
  getUserAddresses: () =>
    apiClient<UserAddress[]>(API_ENDPOINTS.userAddresses.base),

  createUserAddress: (data: CreateUserAddressDto) =>
    apiClient<UserAddress>(API_ENDPOINTS.userAddresses.base, {
      method: "POST",
      body: data,
    }),

  updateUserAddress: (id: string, data: Partial<CreateUserAddressDto>) =>
    apiClient<UserAddress>(API_ENDPOINTS.userAddresses.detail(id), {
      method: "PUT",
      body: data,
    }),

  setDefaultUserAddress: (id: string) =>
    apiClient<UserAddress>(API_ENDPOINTS.userAddresses.setDefault(id), {
      method: "PATCH",
    }),

  deleteUserAddress: (id: string) =>
    apiClient<{ ok: boolean }>(API_ENDPOINTS.userAddresses.detail(id), {
      method: "DELETE",
    }),

  checkout: async (data: CheckoutDto) => {
    // Keep the same key after a timeout or lost response. The API claims it
    // atomically before contacting a payment provider.
    const intent = JSON.stringify({
      professional_id: data.professional_id,
      professional_product_id: data.professional_product_id,
      service_id: data.service_id,
      items: data.items,
      quantity: data.quantity,
      delivery_type: data.delivery_type,
      branch_id: data.branch_id,
      origin_address_id: data.origin_address_id,
      delivery_address_id: data.delivery_address_id,
      schedule_for_next_day: data.schedule_for_next_day,
      payment_method: data.payment_method,
      installments: data.installments,
      billing_data_id: data.billing_data_id,
    });
    const storageKey = `checkout-attempt:${intent}`;
    const expiryKey = `${storageKey}:qr-expiry`;
    if (typeof window !== "undefined") {
      const expiry = window.sessionStorage.getItem(expiryKey);
      if (expiry && Date.now() >= Number(expiry)) {
        window.sessionStorage.removeItem(storageKey);
        window.sessionStorage.removeItem(expiryKey);
      }
    }
    const key = data.idempotency_key ||
      (typeof window !== "undefined" ? window.sessionStorage.getItem(storageKey) : null) ||
      crypto.randomUUID();
    if (typeof window !== "undefined") window.sessionStorage.setItem(storageKey, key);
    const response = await apiClient<{
      order_id: string;
      payment_method: string;
      total_amount: number;
      qr_code?: string;
      qr_image_url?: string;
      qr_expires_at?: string;
    }>(API_ENDPOINTS.orders.checkout, {
      method: "POST",
      body: { ...data, idempotency_key: key },
    }).catch((error: { data?: { error_code?: string } }) => {
      if (error.data?.error_code === "IDENTITY_VERIFICATION_REQUIRED") {
        requestIdentityVerification();
      }
      if (
        typeof window !== "undefined" &&
        ["QR_GENERATION_REJECTED", "CHECKOUT_FAILED"].includes(error.data?.error_code ?? "")
      ) {
        window.sessionStorage.removeItem(storageKey);
        window.sessionStorage.removeItem(expiryKey);
      }
      throw error;
    });
    // A confirmed card response ends this attempt. Keep QR attempts until they
    // are resolved so reopening the checkout cannot issue a second QR.
    if (!response.qr_code && typeof window !== "undefined") {
      window.sessionStorage.removeItem(storageKey);
      window.sessionStorage.removeItem(expiryKey);
    } else if (response.qr_expires_at && typeof window !== "undefined") {
      window.sessionStorage.setItem(expiryKey, String(new Date(response.qr_expires_at).getTime()));
    }
    return {
      order: { id: response.order_id, total_amount: response.total_amount } as OrderSummary,
      qr: response.qr_code
        ? {
            order_id: response.order_id,
            qr_data: response.qr_code,
            qr_image_url: response.qr_image_url,
            expires_at: response.qr_expires_at || "",
            total_amount: response.total_amount,
          }
        : undefined,
      payment_status: response.qr_code
        ? ("pending" as const)
        : ("approved" as const),
    };
  },

  // Shipments workflow
  orderShipment: (orderId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.byOrder(orderId)),

  preparingShipment: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.preparing(shipmentId), {
      method: "POST",
    }),

  readyShipment: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.ready(shipmentId), {
      method: "POST",
    }),

  uploadShipmentImage: (shipmentId: string, imageUrl: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.uploadImage(shipmentId), {
      method: "POST",
      body: { image_url: imageUrl },
    }),

  handToCarrier: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.handToCarrier(shipmentId), {
      method: "POST",
    }),

  inTransitShipment: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.inTransit(shipmentId), {
      method: "POST",
    }),

  deliveredShipment: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.delivered(shipmentId), {
      method: "POST",
    }),

  confirmReceipt: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.confirmReceipt(shipmentId), {
      method: "POST",
    }),

  // Branches
  branches: async (companyId?: number): Promise<Branch[]> => {
    const res = await apiClient<any>(
      companyId
        ? API_ENDPOINTS.branches.locations(companyId)
        : API_ENDPOINTS.branches.base,
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.items)) return res.items;
    return [];
  },

  professionalLocations: (
    professionalId: number,
    destinationProvinceId?: number | null,
    destinationDepartmentId?: number | null,
  ): Promise<Branch[]> =>
    apiClient<Branch[]>(
      `${API_ENDPOINTS.branches.professionalLocations(professionalId)}${
        destinationProvinceId != null
          ? `?destination_province_id=${destinationProvinceId}${
              destinationDepartmentId != null
                ? `&destination_department_id=${destinationDepartmentId}`
                : ""
            }`
          : ""
      }`,
    ),

  createBranch: (data: Partial<Branch>) =>
    apiClient<Branch>(API_ENDPOINTS.branches.base, {
      method: "POST",
      body: data,
    }),

  updateBranch: (id: string, data: Partial<Branch>) =>
    apiClient<Branch>(
      id.startsWith("main:")
        ? API_ENDPOINTS.branches.main(Number(id.slice(5)))
        : API_ENDPOINTS.branches.detail(id),
      {
        method: "PUT",
        body: data,
      },
    ),

  deleteBranch: (id: string) =>
    apiClient<{ success: boolean }>(API_ENDPOINTS.branches.detail(id), {
      method: "DELETE",
    }),

  // Liquidations
  liquidations: (
    page = 1,
    limit = 10,
    status?: string,
    branch_id?: string,
    dates: {
      date_from?: string;
      date_to?: string;
      paid_from?: string;
      paid_to?: string;
      scheduled_from?: string;
      scheduled_to?: string;
    } = {},
  ) =>
    apiClient<PageResponse<Liquidation>>(
      `${API_ENDPOINTS.liquidations.base}${query({ page, limit, status, branch_id, ...dates })}`,
    ),

  liquidationDetail: (id: string) =>
    apiClient<Liquidation>(API_ENDPOINTS.liquidations.detail(id)),

  requestLiquidationsReport: (data: {
    reportType: LiquidationsReportType;
    dateFrom: string;
    dateTo: string;
    includeTaxes: boolean;
    branchId?: string;
    language: "es" | "en";
  }) =>
    apiClient<{ queued: boolean; message: string }>(
      API_ENDPOINTS.reports.merchantLiquidations,
      { method: "POST", body: data },
    ),

  getGeneratedReports: () =>
    apiClient<GeneratedReportNotification[]>(API_ENDPOINTS.notifications.base),

  // Logistics & Fleet (Carrier)
  fleetTracking: () =>
    apiClient<FleetTrackingItem[]>(API_ENDPOINTS.logistics.fleetTracking),

  fleetMetrics: () => apiClient<FleetMetrics>(API_ENDPOINTS.logistics.metrics),

  employees: () =>
    apiClient<RiderEmployee[]>(API_ENDPOINTS.logistics.employees),

  fleetVehicles: () =>
    apiClient<FleetVehicle[]>(API_ENDPOINTS.logistics.fleetVehicles),

  createFleetVehicle: (data: Omit<RiderVehicle, "id" | "is_active">) =>
    apiClient<FleetVehicle>(API_ENDPOINTS.logistics.fleetVehicles, {
      method: "POST",
      body: data,
    }),

  updateFleetVehicle: (
    vehicleId: string,
    data: Omit<RiderVehicle, "id" | "is_active">,
  ) =>
    apiClient<FleetVehicle>(API_ENDPOINTS.logistics.fleetVehicle(vehicleId), {
      method: "PUT",
      body: data,
    }),

  deleteFleetVehicle: (vehicleId: string) =>
    apiClient<void>(API_ENDPOINTS.logistics.fleetVehicle(vehicleId), {
      method: "DELETE",
    }),

  assignFleetVehicle: (employeeId: string, vehicleId: string | null) =>
    apiClient<{ fleet_vehicle_id: string | null }>(
      API_ENDPOINTS.logistics.assignedVehicle(employeeId),
      {
        method: "PUT",
        body: { fleet_vehicle_id: vehicleId },
      },
    ),

  setOwnVehicle: (
    employeeId: string,
    vehicle: Omit<RiderVehicle, "id" | "is_active">,
  ) =>
    apiClient<RiderVehicle>(API_ENDPOINTS.logistics.ownVehicle(employeeId), {
      method: "PUT",
      body: vehicle,
    }),

  createFleetDocumentUploadUrl: (vehicleId: string, fileName: string) =>
    apiClient<{ signedUrl: string; token: string; storage_path: string }>(
      API_ENDPOINTS.logistics.fleetVehicleDocumentUploadUrl(vehicleId),
      { method: "POST", body: { file_name: fileName } },
    ),

  createFleetDocument: (vehicleId: string, data: Omit<RiderDocument, "id">) =>
    apiClient<RiderDocument>(
      API_ENDPOINTS.logistics.fleetVehicleDocuments(vehicleId),
      {
        method: "POST",
        body: data,
      },
    ),

  createEmployee: (data: Partial<RiderEmployee> & { password?: string }) =>
    apiClient<RiderEmployee>(API_ENDPOINTS.logistics.employees, {
      method: "POST",
      body: data,
    }),

  updateEmployee: (
    id: string,
    data: Partial<
      Omit<RiderEmployee, "id" | "vehicle" | "vehicles" | "documents">
    >,
  ) =>
    apiClient<RiderEmployee>(API_ENDPOINTS.logistics.employeeDetail(id), {
      method: "PUT",
      body: data,
    }),

  updateEmployeePassword: (id: string, password: string) =>
    apiClient<{ ok: boolean }>(API_ENDPOINTS.logistics.employeePassword(id), {
      method: "PUT",
      body: { password },
    }),

  deleteEmployee: (id: string) =>
    apiClient<{ ok: boolean }>(API_ENDPOINTS.logistics.employeeDetail(id), {
      method: "DELETE",
    }),

  vehicles: (employeeId: string) =>
    apiClient<RiderVehicle[]>(API_ENDPOINTS.logistics.vehicles(employeeId)),

  createVehicle: (employeeId: string, data: Omit<RiderVehicle, "id">) =>
    apiClient<RiderVehicle>(API_ENDPOINTS.logistics.vehicles(employeeId), {
      method: "POST",
      body: data,
    }),

  documents: (employeeId: string) =>
    apiClient<RiderDocument[]>(API_ENDPOINTS.logistics.documents(employeeId)),

  riderDocumentUrl: (employeeId: string, documentId: string) =>
    apiClient<{ url: string }>(
      API_ENDPOINTS.logistics.documentUrl(employeeId, documentId),
    ),

  fleetVehicleDocumentUrl: (vehicleId: string, documentId: string) =>
    apiClient<{ url: string }>(
      API_ENDPOINTS.logistics.fleetVehicleDocumentUrl(vehicleId, documentId),
    ),

  createDocumentUploadUrl: (employeeId: string, fileName: string) =>
    apiClient<{ signedUrl: string; token: string; storage_path: string }>(
      API_ENDPOINTS.logistics.documentUploadUrl(employeeId),
      { method: "POST", body: { file_name: fileName } },
    ),

  createDocument: (employeeId: string, data: Omit<RiderDocument, "id">) =>
    apiClient<RiderDocument>(API_ENDPOINTS.logistics.documents(employeeId), {
      method: "POST",
      body: data,
    }),

  // User Profile & Roles
  getUserProfile: () => apiClient<UserProfile>(API_ENDPOINTS.users.profile),

  // User Data Bank (CBU / Alias)
  getUserBankData: () =>
    apiClient<UserDataBank | null>(API_ENDPOINTS.userDataBank.my),

  saveUserBankData: (data: UserDataBank) =>
    apiClient<UserDataBank>(API_ENDPOINTS.userDataBank.base, {
      method: "POST",
      body: data,
    }),

  // Product Variants
  variants: (professionalProductId: string) =>
    apiClient<ProductVariant[]>(
      API_ENDPOINTS.products.variants(professionalProductId),
    ),

  linkVariant: (professionalProductId: string, productId: string) =>
    apiClient<{ parent_product_id: string; child_product_id: string }>(
      API_ENDPOINTS.products.variants(professionalProductId),
      {
        method: "POST",
        body: { product_id: productId },
      },
    ),

  deleteVariant: (id: string) =>
    apiClient<{ success: boolean }>(API_ENDPOINTS.products.variantDetail(id), {
      method: "DELETE",
    }),

  // Free Shipping & Logistics Policies
  bulkUpdateFreeShipping: (
    professionalId: number,
    data: {
      free_shipping: boolean;
      categoryId?: number;
      category_id?: number;
      subcategoryId?: string;
      subcategory_id?: string;
      productIds?: (string | number)[];
      product_ids?: (string | number)[];
    },
  ) => {
    const payload = {
      free_shipping: data.free_shipping,
      categoryId: data.category_id ?? data.categoryId,
      subcategoryId: data.subcategory_id ?? data.subcategoryId,
      productIds: data.product_ids ?? data.productIds,
    };
    return apiClient<{ updatedCount: number }>(
      API_ENDPOINTS.products.freeShippingBulk(professionalId),
      {
        method: "PUT",
        body: payload,
      },
    );
  },

  getShippingPolicy: (professionalId: number) =>
    apiClient<ShippingPolicy | null>(
      API_ENDPOINTS.products.shippingPolicy(professionalId),
    ),

  updateShippingPolicy: (
    professionalId: number,
    data: Partial<ShippingPolicy>,
  ) =>
    apiClient<ShippingPolicy>(
      API_ENDPOINTS.products.shippingPolicy(professionalId),
      {
        method: "PUT",
        body: data,
      },
    ),

  // Cart
  cart: () => apiClient<Cart>(API_ENDPOINTS.users.cart),

  addCartItem: (data: {
    product_id?: string;
    professional_product_id?: string;
    service_id?: string;
    quantity: number;
  }) =>
    apiClient<Cart>(API_ENDPOINTS.users.cartItems, {
      method: "POST",
      body: data,
    }),

  updateCartItem: (id: string, quantity: number) =>
    apiClient<Cart>(API_ENDPOINTS.users.cartItem(id), {
      method: "PATCH",
      body: { quantity },
    }),

  removeCartItem: (id: string) =>
    apiClient<Cart>(API_ENDPOINTS.users.cartItem(id), { method: "DELETE" }),

  clearCart: () =>
    apiClient<Cart>(API_ENDPOINTS.users.cart, { method: "DELETE" }),

  // Favorites
  favorites: () =>
    apiClient<{
      data?: Array<{
        id: string;
        favorite_id?: string;
        type: "professional" | "product" | "service";
        product_id?: string;
        service_id?: string;
        professional_id?: number;
        name: string;
        title?: string;
        price?: number;
        image_url?: string;
        avatar_url?: string;
        seo_path?: string;
        rating?: number;
        category?: string;
      }>;
      merchants: Array<{
        id: string;
        name: string;
        commercial_name?: string;
        image_url?: string;
        avatar_url?: string;
        category?: string;
        rating?: number;
        seo_path?: string;
        professional_id?: number;
      }>;
      products: Array<{
        id: string;
        product_id?: string;
        name: string;
        price: number;
        image_url?: string;
        seo_path?: string;
        professional_id?: number;
      }>;
      services: Array<{
        id: string;
        service_id?: string;
        name: string;
        price: number;
        image_url?: string;
        seo_path?: string;
        professional_id?: number;
      }>;
      total?: number;
    }>(API_ENDPOINTS.users.favorites),

  addFavorite: (data: {
    professionalId?: number | string;
    productId?: string;
    serviceId?: string;
    professional_id?: number | string;
    product_id?: string;
    service_id?: string;
  }) =>
    apiClient<any>(API_ENDPOINTS.users.favorites, {
      method: "POST",
      body: data,
    }),

  removeFavorite: (id: string) =>
    apiClient<{ success: boolean }>(API_ENDPOINTS.users.favoriteDetail(id), {
      method: "DELETE",
    }),

  // Service Appointments
  assignServiceAppointment: (
    orderId: string,
    data: {
      appointment_date: string;
      appointment_time: string;
      notes?: string;
    },
  ) =>
    apiClient<{
      success: boolean;
      appointment: OrderServiceAppointment;
      message?: string;
    }>(API_ENDPOINTS.orders.serviceAppointment(orderId), {
      method: "POST",
      body: data,
    }),

  getServiceAppointment: (orderId: string) =>
    apiClient<OrderServiceAppointment>(
      API_ENDPOINTS.orders.serviceAppointment(orderId),
    ),

  // Scoring & Reputation
  getProfessionalScore: (professionalId: number | string) =>
    apiClient<ProfessionalScore>(
      API_ENDPOINTS.scoring.professional(professionalId),
    ),

  getProfessionalReviews: (professionalId: number | string) =>
    apiClient<ProfessionalReview[]>(
      API_ENDPOINTS.reviews.byProfessional(professionalId),
    ),

  // User Payment Methods (Saved Cards)
  getIdentityVerificationStatus: () =>
    apiClient<IdentityVerificationStatus>(API_ENDPOINTS.identityVerification.me),

  getUserPaymentMethods: () =>
    apiClient<UserPaymentMethod[]>(API_ENDPOINTS.paymentMethods.base),

  createUserPaymentMethod: (data: CreatePaymentMethodDto) =>
    apiClient<UserPaymentMethod>(API_ENDPOINTS.paymentMethods.base, {
      method: "POST",
      body: data,
    }),

  deleteUserPaymentMethod: (id: string) =>
    apiClient<void>(API_ENDPOINTS.paymentMethods.detail(id), {
      method: "DELETE",
    }),

  setDefaultPaymentMethod: (id: string) =>
    apiClient<UserPaymentMethod>(API_ENDPOINTS.paymentMethods.setDefault(id), {
      method: "PATCH",
    }),
};
