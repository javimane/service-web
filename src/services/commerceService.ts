import { apiClient } from './apiClient';
import { API_ENDPOINTS } from './api.config';

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
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready_for_pickup'
  | 'ready_for_dispatch'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export type DeliveryType = 'pickup' | 'shipment' | 'coordinate_with_merchant';

export type LiquidationsReportType = 'settlement' | 'sale' | 'full';

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
  quantity: number | null;
  created_at: string;
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
    };
  } | null;
  service?: {
    id: string;
    name: string;
    price?: number;
  } | null;
  service_id?: string | null;
  appointment_status?: 'pending_appointment' | 'scheduled' | 'completed' | 'cancelled' | null;
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
  invoice_status?: 'issued' | 'not_issued' | null;
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
    product_name?: string;
    product_image?: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  branch_id?: string | null;
  branch?: Branch | null;
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
  id: string;
  status: 'available' | 'pending' | 'in_process' | 'settled' | 'withheld' | string;
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
  street?: string | null;
  number?: string | null;
  floor?: string | null;
  zip_code?: string | null;
  province_id?: number | null;
  department_id?: number | null;
  lat?: number | null;
  lng?: number | null;
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
  medal: 'Novato' | 'Bronce' | 'Plata' | 'Oro' | 'Platino' | 'Mercado Lider' | 'Supremo' | string;
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
  card_type?: 'credit' | 'debit' | string;
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
  card_type?: 'credit' | 'debit' | string;
  bank_name?: string;
  card_holder_name?: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default?: boolean;
};

export type RiderVehicle = {
  id: string;
  vehicle_type: 'motorcycle' | 'car' | 'pickup' | 'van' | 'truck' | string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  license_plate?: string | null;
  capacity_kg?: number | null;
  capacity_m3?: number | null;
  is_active: boolean;
};

export type RiderDocument = {
  id: string;
  document_type: 'driving_license' | 'vehicle_registration' | 'insurance' | 'vtv_rto' | 'criminal_record' | string;
  storage_path: string;
  file_name: string;
  mime_type?: string | null;
  expires_at?: string | null;
};

export type RiderEmployee = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  dni?: string;
  phone?: string;
  photo_url?: string;
  status?: 'active' | 'on_trip' | 'inactive';
  vehicle?: RiderVehicle | null;
  vehicles?: RiderVehicle[];
  documents?: RiderDocument[];
};

export type FleetTrackingItem = {
  id: string;
  driver_id: string;
  driver_name: string;
  driver_phone?: string;
  driver_status: 'available' | 'on_trip' | 'offline';
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
  id: number;
  professional_product_id: string;
  name: string;
  attribute_name: string;
  attribute_value: string;
  use_product_price?: boolean;
  price?: number;
  offer_price?: number;
  wholesale_price?: number;
  wholesale_unit?: number;
  installments_enabled?: boolean;
  max_installments?: number;
  free_shipping?: boolean;
  price_difference: number;
  stock: number;
  sku?: string | null;
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
  variant_id?: number | null;
  variant?: ProductVariant | null;
  product?: {
    id: string;
    name: string;
    image_url?: string | null;
    price: number;
    stock?: number | null;
    installments_enabled?: boolean;
    max_installments?: number;
    is_food_perishable?: boolean;
    category?: { id: number; name: string } | null;
    professional?: { id: number; name?: string; commercial_name?: string } | null;
  } | null;
  service?: {
    id: string;
    name: string;
    price: number;
    professional?: { id: number; name?: string; commercial_name?: string } | null;
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
  variant_id?: string | number;
  quantity?: number;
  installments?: number;
  delivery_type?: DeliveryType;
  delivery_address_id?: string;
  branch_id?: string;
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
  delivery_type: DeliveryType | 'carrier';
  title: string;
  price: number;
  estimated_delivery: string;
};

export type MarketplaceCommission = {
  id: number;
  installments: number;
  commission_pct: number;
  iva_pct: number;
  iva_commission_pct: number;
  total_commission_pct: number;
  description?: string;
  is_active: boolean;
};

export type PlatformShippingRate = {
  id: number;
  vehicle_code: 'bicycle' | 'motorcycle' | 'car' | 'van' | 'truck' | string;
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
};

export type TaxCondition = 'consumidor_final' | 'responsable_inscripto';

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
  professional_id: number;
  professional_product_id?: string;
  variant_id?: number;
  service_id?: string;
  quantity?: number;
  items?: Array<{
    professional_product_id?: string;
    variant_id?: number;
    service_id?: string;
    quantity: number;
    unit_price?: number;
  }>;
  delivery_type: DeliveryType;
  branch_id?: string;
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
  payment_method: 'getnet' | 'getnet_card' | 'paycloud_qr';
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
  logistics_role?: 'company' | 'transport_company' | 'delivery' | 'buyer' | null;
  has_commercial_account?: boolean;
};

const query = (params: Record<string, string | number | undefined | null>) => {
  const value = new URLSearchParams();
  Object.entries(params).forEach(([key, item]) => {
    if (item !== undefined && item !== null && item !== '') {
      value.set(key, String(item));
    }
  });
  return value.toString() ? `?${value}` : '';
};

export const commerceService = {
  // Orders
  merchantOrders: (page = 1, limit = 10, status?: string, branch_id?: string) =>
    apiClient<PageResponse<OrderSummary>>(
      `${API_ENDPOINTS.orders.merchant}${query({ page, limit, status, branch_id })}`
    ),

  buyerOrders: (page = 1, limit = 10, status?: string) =>
    apiClient<PageResponse<OrderSummary>>(
      `${API_ENDPOINTS.orders.mine}${query({ page, limit, status })}`
    ),

  orderDetail: (id: string) =>
    apiClient<OrderSummary>(API_ENDPOINTS.orders.detail(id)),

  confirmOrder: (id: string) =>
    apiClient<OrderSummary>(API_ENDPOINTS.orders.confirm(id), { method: 'POST' }),

  cancelOrder: (id: string, reason?: string) =>
    apiClient<OrderSummary>(API_ENDPOINTS.orders.cancel(id), {
      method: 'POST',
      body: { reason },
    }),

  verifyPickup: (id: string, code: string) =>
    apiClient<{ success: boolean; message: string }>(
      API_ENDPOINTS.orders.pickupVerify(id),
      { method: 'POST', body: { code } }
    ),

  uploadInvoice: (id: string, invoiceUrl: string) =>
    apiClient<{ success: boolean; invoice_url: string }>(
      API_ENDPOINTS.orders.invoice(id),
      { method: 'POST', body: { invoice_url: invoiceUrl } }
    ),

  updateTransportShipment: (
    id: string,
    data: { carrier_name: string; tracking_number: string; tracking_url?: string }
  ) =>
    apiClient<OrderSummary>(API_ENDPOINTS.orders.transportShipment(id), {
      method: 'POST',
      body: data,
    }),

  calculateShipping: (data: CalculateShippingDto) =>
    apiClient<CalculateShippingResponse>(API_ENDPOINTS.orders.calculateShipping, {
      method: 'POST',
      body: data,
    }),

  commissions: () =>
    apiClient<MarketplaceCommission[]>(API_ENDPOINTS.orders.commissions),

  shippingRates: () =>
    apiClient<PlatformShippingRate[]>(API_ENDPOINTS.orders.shippingRates),

  // Billing Data methods
  getMyBillingData: () =>
    apiClient<UserBillingData[]>(API_ENDPOINTS.billingData.my),

  createBillingData: (data: CreateUserBillingDataDto) =>
    apiClient<UserBillingData>(API_ENDPOINTS.billingData.base, {
      method: 'POST',
      body: data,
    }),

  updateBillingData: (id: string, data: UpdateUserBillingDataDto) =>
    apiClient<UserBillingData>(API_ENDPOINTS.billingData.detail(id), {
      method: 'PUT',
      body: data,
    }),

  deleteBillingData: (id: string) =>
    apiClient<{ success: boolean }>(API_ENDPOINTS.billingData.detail(id), {
      method: 'DELETE',
    }),

  attachOrderBillingData: (orderId: string, billingDataId: string) =>
    apiClient<{ success: boolean; order_id: string; billing_data_id: string; billing_data: any }>(
      API_ENDPOINTS.orders.attachBillingData(orderId),
      {
        method: 'PATCH',
        body: { billing_data_id: billingDataId },
      },
    ),

  // User Delivery Addresses
  getUserAddresses: () =>
    apiClient<UserAddress[]>(API_ENDPOINTS.userAddresses.base),

  createUserAddress: (data: CreateUserAddressDto) =>
    apiClient<UserAddress>(API_ENDPOINTS.userAddresses.base, {
      method: 'POST',
      body: data,
    }),

  updateUserAddress: (id: string, data: Partial<CreateUserAddressDto>) =>
    apiClient<UserAddress>(API_ENDPOINTS.userAddresses.detail(id), {
      method: 'PUT',
      body: data,
    }),

  setDefaultUserAddress: (id: string) =>
    apiClient<UserAddress>(API_ENDPOINTS.userAddresses.setDefault(id), {
      method: 'PATCH',
    }),

  deleteUserAddress: (id: string) =>
    apiClient<{ ok: boolean }>(API_ENDPOINTS.userAddresses.detail(id), {
      method: 'DELETE',
    }),

  checkout: (data: CheckoutDto) =>
    apiClient<{
      order: OrderSummary;
      qr?: PayCloudQrResponse;
      payment_status: 'approved' | 'pending' | 'rejected';
      redirect_url?: string;
    }>(API_ENDPOINTS.orders.checkout, { method: 'POST', body: data }),

  // Shipments workflow
  orderShipment: (orderId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.byOrder(orderId)),

  preparingShipment: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.preparing(shipmentId), { method: 'POST' }),

  readyShipment: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.ready(shipmentId), { method: 'POST' }),

  uploadShipmentImage: (shipmentId: string, imageUrl: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.uploadImage(shipmentId), {
      method: 'POST',
      body: { image_url: imageUrl },
    }),

  handToCarrier: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.handToCarrier(shipmentId), {
      method: 'POST',
    }),

  inTransitShipment: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.inTransit(shipmentId), { method: 'POST' }),

  deliveredShipment: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.delivered(shipmentId), { method: 'POST' }),

  confirmReceipt: (shipmentId: string) =>
    apiClient<any>(API_ENDPOINTS.shipments.confirmReceipt(shipmentId), {
      method: 'POST',
    }),

  // Branches
  branches: async (companyId?: number): Promise<Branch[]> => {
    const res = await apiClient<any>(
      companyId ? API_ENDPOINTS.branches.byCompany(companyId) : API_ENDPOINTS.branches.base
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.items)) return res.items;
    return [];
  },

  createBranch: (data: Partial<Branch>) =>
    apiClient<Branch>(API_ENDPOINTS.branches.base, { method: 'POST', body: data }),

  updateBranch: (id: string, data: Partial<Branch>) =>
    apiClient<Branch>(API_ENDPOINTS.branches.detail(id), {
      method: 'PATCH',
      body: data,
    }),

  deleteBranch: (id: string) =>
    apiClient<{ success: boolean }>(API_ENDPOINTS.branches.detail(id), {
      method: 'DELETE',
    }),

  // Liquidations
  liquidations: (page = 1, limit = 10, status?: string) =>
    apiClient<PageResponse<Liquidation>>(
      `${API_ENDPOINTS.liquidations.base}${query({ page, limit, status })}`
    ),

  liquidationDetail: (id: string) =>
    apiClient<Liquidation>(API_ENDPOINTS.liquidations.detail(id)),

  requestLiquidationsReport: (data: {
    reportType: LiquidationsReportType;
    dateFrom: string;
    dateTo: string;
    includeTaxes: boolean;
    branchId?: number;
    language: 'es' | 'en';
  }) =>
    apiClient<{ queued: boolean; message: string }>(
      API_ENDPOINTS.reports.merchantLiquidations,
      { method: 'POST', body: data },
    ),

  getGeneratedReports: () =>
    apiClient<GeneratedReportNotification[]>(API_ENDPOINTS.notifications.base),

  // Logistics & Fleet (Carrier)
  fleetTracking: () =>
    apiClient<FleetTrackingItem[]>(API_ENDPOINTS.logistics.fleetTracking),

  fleetMetrics: () =>
    apiClient<FleetMetrics>(API_ENDPOINTS.logistics.metrics),

  employees: () =>
    apiClient<RiderEmployee[]>(API_ENDPOINTS.logistics.employees),

  createEmployee: (data: Partial<RiderEmployee> & { password?: string }) =>
    apiClient<RiderEmployee>(API_ENDPOINTS.logistics.employees, {
      method: 'POST',
      body: data,
    }),

  updateEmployee: (id: string, data: Partial<Omit<RiderEmployee, 'id' | 'vehicle' | 'vehicles' | 'documents'>>) =>
    apiClient<RiderEmployee>(API_ENDPOINTS.logistics.employeeDetail(id), {
      method: 'PUT',
      body: data,
    }),

  updateEmployeePassword: (id: string, password: string) =>
    apiClient<{ ok: boolean }>(API_ENDPOINTS.logistics.employeePassword(id), {
      method: 'PUT',
      body: { password },
    }),

  deleteEmployee: (id: string) =>
    apiClient<{ ok: boolean }>(API_ENDPOINTS.logistics.employeeDetail(id), {
      method: 'DELETE',
    }),

  vehicles: (employeeId: string) =>
    apiClient<RiderVehicle[]>(API_ENDPOINTS.logistics.vehicles(employeeId)),

  createVehicle: (employeeId: string, data: Omit<RiderVehicle, 'id'>) =>
    apiClient<RiderVehicle>(API_ENDPOINTS.logistics.vehicles(employeeId), {
      method: 'POST',
      body: data,
    }),

  documents: (employeeId: string) =>
    apiClient<RiderDocument[]>(API_ENDPOINTS.logistics.documents(employeeId)),

  createDocumentUploadUrl: (employeeId: string, fileName: string) =>
    apiClient<{ signedUrl: string; token: string; storage_path: string }>(
      API_ENDPOINTS.logistics.documentUploadUrl(employeeId),
      { method: 'POST', body: { file_name: fileName } }
    ),

  createDocument: (employeeId: string, data: Omit<RiderDocument, 'id'>) =>
    apiClient<RiderDocument>(API_ENDPOINTS.logistics.documents(employeeId), {
      method: 'POST',
      body: data,
    }),

  // User Profile & Roles
  getUserProfile: () =>
    apiClient<UserProfile>(API_ENDPOINTS.users.profile),

  // User Data Bank (CBU / Alias)
  getUserBankData: () =>
    apiClient<UserDataBank | null>(API_ENDPOINTS.userDataBank.my),

  saveUserBankData: (data: UserDataBank) =>
    apiClient<UserDataBank>(API_ENDPOINTS.userDataBank.base, {
      method: 'POST',
      body: data,
    }),

  // Product Variants
  variants: (professionalProductId: string) =>
    apiClient<ProductVariant[]>(API_ENDPOINTS.products.variants(professionalProductId)),

  createVariant: (data: Omit<ProductVariant, 'id' | 'created_at'>) =>
    apiClient<ProductVariant>(API_ENDPOINTS.products.variants(data.professional_product_id), {
      method: 'POST',
      body: data,
    }),

  updateVariant: (id: number, data: Partial<ProductVariant>) =>
    apiClient<ProductVariant>(API_ENDPOINTS.products.variantDetail(id), {
      method: 'PUT',
      body: data,
    }),

  deleteVariant: (id: number) =>
    apiClient<{ success: boolean }>(API_ENDPOINTS.products.variantDetail(id), {
      method: 'DELETE',
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
      free_shipping_radius_km?: number;
      free_shipping_min_amount?: number;
      free_shipping_max_weight?: number;
    },
  ) => {
    const payload = {
      free_shipping: data.free_shipping,
      category_id: data.category_id ?? data.categoryId,
      subcategory_id: data.subcategory_id ?? data.subcategoryId,
      product_ids: data.product_ids ?? data.productIds,
      free_shipping_radius_km: data.free_shipping_radius_km,
      free_shipping_min_amount: data.free_shipping_min_amount,
      free_shipping_max_weight: data.free_shipping_max_weight,
    };
    return apiClient<{ updatedCount: number }>(
      API_ENDPOINTS.products.freeShippingBulk(professionalId),
      {
        method: 'PUT',
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
        method: 'PUT',
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
    variant_id?: number;
  }) =>
    apiClient<Cart>(API_ENDPOINTS.users.cartItems, { method: 'POST', body: data }),

  updateCartItem: (id: string, quantity: number) =>
    apiClient<Cart>(API_ENDPOINTS.users.cartItem(id), {
      method: 'PATCH',
      body: { quantity },
    }),

  removeCartItem: (id: string) =>
    apiClient<Cart>(API_ENDPOINTS.users.cartItem(id), { method: 'DELETE' }),

  clearCart: () => apiClient<Cart>(API_ENDPOINTS.users.cart, { method: 'DELETE' }),

  // Favorites
  favorites: () =>
    apiClient<{
      data?: Array<{
        id: string;
        favorite_id?: string;
        type: 'professional' | 'product' | 'service';
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
      method: 'POST',
      body: data,
    }),

  removeFavorite: (id: string) =>
    apiClient<{ success: boolean }>(API_ENDPOINTS.users.favoriteDetail(id), {
      method: 'DELETE',
    }),

  // Service Appointments
  assignServiceAppointment: (
    orderId: string,
    data: { appointment_date: string; appointment_time: string; notes?: string },
  ) =>
    apiClient<{ success: boolean; appointment: OrderServiceAppointment; message?: string }>(
      API_ENDPOINTS.orders.serviceAppointment(orderId),
      {
        method: 'POST',
        body: data,
      },
    ),

  getServiceAppointment: (orderId: string) =>
    apiClient<OrderServiceAppointment>(API_ENDPOINTS.orders.serviceAppointment(orderId)),

  // Scoring & Reputation
  getProfessionalScore: (professionalId: number | string) =>
    apiClient<ProfessionalScore>(API_ENDPOINTS.scoring.professional(professionalId)),

  getProfessionalReviews: (professionalId: number | string) =>
    apiClient<ProfessionalReview[]>(API_ENDPOINTS.reviews.byProfessional(professionalId)),

  // User Payment Methods (Saved Cards)
  getUserPaymentMethods: () =>
    apiClient<UserPaymentMethod[]>(API_ENDPOINTS.paymentMethods.base),

  createUserPaymentMethod: (data: CreatePaymentMethodDto) =>
    apiClient<UserPaymentMethod>(API_ENDPOINTS.paymentMethods.base, {
      method: 'POST',
      body: data,
    }),

  deleteUserPaymentMethod: (id: string) =>
    apiClient<void>(API_ENDPOINTS.paymentMethods.detail(id), {
      method: 'DELETE',
    }),

  setDefaultPaymentMethod: (id: string) =>
    apiClient<UserPaymentMethod>(API_ENDPOINTS.paymentMethods.setDefault(id), {
      method: 'PATCH',
    }),
};
