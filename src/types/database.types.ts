export interface ProfileRow {
  readonly id: string;
  readonly email: string | null;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
  readonly updated_at: string | null;
}

export interface AddressRow {
  readonly id: number;
  readonly professional_id: number;
  readonly province_id: number;
  readonly department_id: number;
  readonly street_name: string;
  readonly street_number: string | null;
  readonly floor_apartment: string | null;
  readonly zip_code: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly is_main_address: boolean | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
  // Relationships
  readonly Professional?: ProfessionalRow;
  readonly Province?: ProvinceRow;
  readonly Department?: ProvinceDepartmentRow;
}

export interface ApiErrorLogRow {
  readonly id: string;
  readonly authenticated_user_id: string | null;
  readonly error_id: string;
  readonly status_code: number | null;
  readonly request_method: string | null;
  readonly request_path: string | null;
  readonly request_query: any | null;
  readonly user_agent: string | null;
  readonly trace_id: string | null;
  readonly error_message: string | null;
  readonly created_at: string;
  // Relationships
  readonly Profile?: ProfileRow;
}

export interface CategoryProductRow {
  readonly id: number;
  readonly name: string;
}

export interface CategoryServiceRow {
  readonly id: number;
  readonly name: string;
}

export interface CompanyRow {
  readonly id: number;
  readonly name: string | null;
  readonly tax_code: string | null;
  readonly arca_file: string | null;
  readonly created_at: string;
  readonly updated_at: string | null;
  readonly professional_id: number;
  readonly address_id: number;
  readonly business_type: string | null;
  readonly public_trade: boolean | null;
  // Relationships
  readonly Professional?: ProfessionalRow;
  readonly Address?: AddressRow;
}

export interface CompaniesArcaRow {
  readonly id: number;
  readonly company_id: number;
  readonly valid_from: string;
  readonly valid_to: string;
  readonly is_verified: boolean | null;
  readonly verified_at: string | null;
  readonly created_at: string | null;
  readonly token: string | null;
  readonly token_expires_at: string | null;
  // Relationships
  readonly Company?: CompanyRow;
}

export interface ContactRequestRow {
  readonly id: number;
  readonly user_id: string | null;
  readonly professional_id: number;
  readonly message: string | null;
  readonly status: string;
  readonly created_at: string;
  readonly updated_at: string;
  // Relationships
  readonly Profile?: ProfileRow;
  readonly Professional?: ProfessionalRow;
}

export interface MessageRow {
  readonly id: number;
  readonly contact_request_id: number;
  readonly sender_id: string;
  readonly content: string;
  readonly is_read: boolean | null;
  readonly created_at: string | null;
  // Relationships
  readonly ContactRequest?: ContactRequestRow;
}

export interface ProductRow {
  readonly id: number;
  readonly ean: string;
  readonly name: string;
  readonly description: string | null;
  readonly brand: string | null;
  readonly image_url: string | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
  readonly categories_products_id: number | null;
  readonly is_foreign: boolean | null;
  // Relationships
  readonly CategoryProduct?: CategoryProductRow;
}

export interface ProfessionalAvailabilityRow {
  readonly id: number;
  readonly professional_id: number;
  readonly day_of_week: number | null;
  readonly start_time: string;
  readonly end_time: string;
  // Relationships
  readonly Professional?: ProfessionalRow;
}

export interface ProfessionalCategoryRow {
  readonly professional_id: number;
  readonly category_services_id: number;
  // Relationships
  readonly Professional?: ProfessionalRow;
  readonly CategoryService?: CategoryServiceRow;
}

export interface ProfessionalCredentialRow {
  readonly id: number;
  readonly professional_id: number;
  readonly credential_url: string;
  readonly title: string;
  readonly issuer: string | null;
  readonly type: string | null;
  readonly issued_at: string | null;
  readonly expires_at: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  // Relationships
  readonly Professional?: ProfessionalRow;
}

export interface ProfessionalImageRow {
  readonly id: number;
  readonly professional_id: number;
  readonly image_url: string;
  readonly caption: string | null;
  readonly display_order: number;
  readonly created_at: string;
  readonly updated_at: string;
  readonly review_id: number | null;
  // Relationships
  readonly Professional?: ProfessionalRow;
  readonly Review?: ReviewRow;
}

export interface ProfessionalProductRow {
  readonly id: number;
  readonly professional_id: number;
  readonly product_id: number;
  readonly price: number;
  readonly sale_type: string;
  readonly is_active: boolean | null;
  readonly stock: number | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
  // Relationships
  readonly Professional?: ProfessionalRow;
  readonly Product?: ProductRow;
}

export interface ProfessionalPromotionRow {
  readonly id: number;
  readonly professional_id: number;
  readonly image_url: string;
  readonly description: string;
  readonly discount_percentage: number;
  readonly amount: number;
  readonly expires_at: string | null;
  readonly state: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  // Relationships
  readonly Professional?: ProfessionalRow;
}

export interface ProfessionalProposalRow {
  readonly id: string;
  readonly file_url: string;
  readonly accepted: boolean;
  readonly professional_name: string;
  readonly professional_id: number;
  readonly user_id: string;
  readonly created_at: string;
  // Relationships
  readonly Professional?: ProfessionalRow;
  readonly Profile?: ProfileRow;
}

export interface ProfessionalQuoteRow {
  readonly id: number;
  readonly professional_id: number;
  readonly user_id: string | null;
  readonly quote_url: string;
  readonly title: string | null;
  readonly description: string | null;
  readonly created_at: string;
  // Relationships
  readonly Professional?: ProfessionalRow;
  readonly Profile?: ProfileRow;
}

export interface ProfessionalRankingRow {
  readonly id: number;
  readonly professional_id: number;
  readonly category_services_id: number;
  readonly score: number | null;
  readonly rank_position: number | null;
  readonly updated_at: string | null;
  // Relationships
  readonly Professional?: ProfessionalRow;
  readonly CategoryService?: CategoryServiceRow;
}

export interface ProfessionalReelRow {
  readonly id: number;
  readonly professional_id: number;
  readonly video_url: string;
  readonly thumbnail_url: string | null;
  readonly title: string | null;
  readonly description: string | null;
  readonly views_count: number | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
  readonly likes: number | null;
  // Relationships
  readonly Professional?: ProfessionalRow;
}

export interface ProfessionalVideoRow {
  readonly id: number;
  readonly professional_id: number;
  readonly video_url: string;
  readonly title: string | null;
  readonly description: string | null;
  readonly thumbnail_url: string | null;
  readonly duration_seconds: number | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
  readonly likes: number | null;
  readonly views_count: number | null;
  // Relationships
  readonly Professional?: ProfessionalRow;
}

export interface ProfessionalRow {
  readonly id: number;
  readonly user_id: string;
  readonly bio: string | null;
  readonly rating_avg: number;
  readonly is_active: boolean;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted_at: string | null;
  readonly web_url: string | null;
  readonly account_type: "individual" | "company" | null;
  readonly is_matriculate: boolean | null;
  readonly emergency: boolean | null;
  readonly profile_views: number | null;
  // Relationships
  readonly Profile?: ProfileRow;
}

export interface ProvinceRow {
  readonly id: number;
  readonly name: string;
  readonly created_at: string | null;
}

export interface ProvinceDepartmentRow {
  readonly id: number;
  readonly province_id: number;
  readonly name: string;
  readonly created_at: string | null;
  // Relationships
  readonly Province?: ProvinceRow;
}

export type Product = ProductRow;
export type ProfessionalProduct = ProfessionalProductRow;

export interface HealthStatusResponse {
  readonly status: "ok";
  readonly service: "cercio-api";
  readonly timestamp: string;
}

export interface ReviewRow {
  readonly id: number;
  readonly user_id: string | null;
  readonly professional_id: number;
  readonly rating: number;
  readonly comment: string | null;
  readonly created_at: string;
  readonly image_url: string | null;
  // Relationships
  readonly Profile?: ProfileRow;
  readonly Professional?: ProfessionalRow;
}

export interface RoleRow {
  readonly id: number;
  readonly name: string;
}

export interface ServiceRow {
  readonly id: number;
  readonly professional_id: number;
  readonly category_services_id: number;
  readonly name: string;
  readonly description: string | null;
  readonly base_price: number | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
  // Relationships
  readonly Professional?: ProfessionalRow;
  readonly CategoryService?: CategoryServiceRow;
}

export interface SubscriptionRow {
  readonly id: number;
  readonly professional_id: number;
  readonly plan: string;
  readonly status: string;
  readonly amount_paid: number;
  readonly currency: string;
  readonly payment_method: string | null;
  readonly payment_reference: string | null;
  readonly started_at: string;
  readonly expires_at: string;
  readonly created_at: string;
  readonly updated_at: string;
  // Relationships
  readonly Professional?: ProfessionalRow;
}

export interface UserFavoriteRow {
  readonly user_id: string;
  readonly professional_id: number;
  readonly created_at: string | null;
  // Relationships
  readonly Profile?: ProfileRow;
  readonly Professional?: ProfessionalRow;
}

export interface SuscriptionPrice {
  readonly id: number;
  readonly amount: number;
}

export interface Database {
  public: {
    Tables: {
      address: { Row: AddressRow; Insert: any; Update: any };
      api_error_logs: { Row: ApiErrorLogRow; Insert: any; Update: any };
      categories_products: {
        Row: CategoryProductRow;
        Insert: any;
        Update: any;
      };
      categories_services: {
        Row: CategoryServiceRow;
        Insert: any;
        Update: any;
      };
      companies: { Row: CompanyRow; Insert: any; Update: any };
      companies_arca: { Row: CompaniesArcaRow; Insert: any; Update: any };
      contact_requests: { Row: ContactRequestRow; Insert: any; Update: any };
      messages: { Row: MessageRow; Insert: any; Update: any };
      products: { Row: ProductRow; Insert: any; Update: any };
      professional_availability: {
        Row: ProfessionalAvailabilityRow;
        Insert: any;
        Update: any;
      };
      professional_categories: {
        Row: ProfessionalCategoryRow;
        Insert: any;
        Update: any;
      };
      professional_credentials: {
        Row: ProfessionalCredentialRow;
        Insert: any;
        Update: any;
      };
      professional_images: {
        Row: ProfessionalImageRow;
        Insert: any;
        Update: any;
      };
      professional_products: {
        Row: ProfessionalProductRow;
        Insert: any;
        Update: any;
      };
      professional_promotions: {
        Row: ProfessionalPromotionRow;
        Insert: any;
        Update: any;
      };
      professional_proposals: {
        Row: ProfessionalProposalRow;
        Insert: any;
        Update: any;
      };
      professional_quotes: {
        Row: ProfessionalQuoteRow;
        Insert: any;
        Update: any;
      };
      professional_ranking: {
        Row: ProfessionalRankingRow;
        Insert: any;
        Update: any;
      };
      professional_reels: {
        Row: ProfessionalReelRow;
        Insert: any;
        Update: any;
      };
      professional_videos: {
        Row: ProfessionalVideoRow;
        Insert: any;
        Update: any;
      };
      professionals: { Row: ProfessionalRow; Insert: any; Update: any };
      profiles: { Row: ProfileRow; Insert: any; Update: any };
      provinces: { Row: ProvinceRow; Insert: any; Update: any };
      provinces_department: {
        Row: ProvinceDepartmentRow;
        Insert: any;
        Update: any;
      };
      reviews: { Row: ReviewRow; Insert: any; Update: any };
      roles: { Row: RoleRow; Insert: any; Update: any };
      services: { Row: ServiceRow; Insert: any; Update: any };
      subscriptions: { Row: SubscriptionRow; Insert: any; Update: any };
      user_favorites: { Row: UserFavoriteRow; Insert: any; Update: any };
      suscription_price: { Row: SuscriptionPrice };
    };
  };
}
