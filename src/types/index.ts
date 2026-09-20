// Tipos compartidos que reflejan los schemas del backend (API v2 en inglés).

// Envelope de respuestas paginadas (contrato de listados de la API).
export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// Parámetros de listado (page_size se serializa como snake_case en el backend).
export interface ListParams {
  page?: number
  pageSize?: number
  all?: boolean
  search?: string
}

export type WorkOrderStatus = 'abierta' | 'en_progreso' | 'completada' | 'entregada' | 'cancelada'
export type WorkOrderItemStatus = 'pendiente' | 'asignado' | 'completado' | 'cancelado' | 'producto'
export type QuoteStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'convertido'
export type InvoiceStatus = 'emitida'
export type ItemType = 'service' | 'product'

export interface Base {
  id: number
  created_at: string
  updated_at: string
}

export interface User extends Base {
  username: string
  email: string
  name: string
  is_active: boolean
  roles: string[]
  permissions: string[]
}

export interface Role extends Base {
  name: string
  description: string | null
  permission_codes: string[]
}

export interface Permission {
  id: number
  code: string
  name: string
  description: string | null
}

export interface PermissionCatalogItem {
  code: string
  name: string
  description: string | null
}

export interface PermissionModule {
  key: string
  label: string
  route: string
  permissions: PermissionCatalogItem[]
  dependencies: Record<string, string[]>
}

export interface PermissionCatalog {
  modules: PermissionModule[]
  route_permissions: Record<string, string[]>
}

export interface Client extends Base {
  name: string
  tax_id: string
  phone: string | null
  email: string | null
  address: string
  postal_code: string
  state: string
  city: string
  country: string
  notes: string | null
}

export interface CompanyProfile extends Base {
  legal_name: string
  tax_id: string | null
  rii_number: string | null
  address: string | null
  postal_code: string | null
  state: string | null
  city: string | null
  phone: string | null
  email: string | null
}

export interface Vehicle extends Base {
  client_id: number
  client_name: string | null
  category_id: number | null
  plate: string
  make: string
  model: string | null
  year: number | null
  color: string | null
}

export interface VehicleCategory extends Base {
  name: string
  description: string | null
  is_self_propelled: boolean
}

export interface ServiceCategory extends Base {
  name: string
  description: string | null
}

export interface Service extends Base {
  name: string
  description: string | null
  category_id: number
  price: number
  duration_minutes: number | null
}

export interface ProductCategory extends Base {
  name: string
  description: string | null
}

export interface Product extends Base {
  name: string
  description: string | null
  brand: string | null
  category_id: number
  price: number
  provider_ids?: number[]
}

export interface Provider extends Base {
  name: string
  tax_id: string | null
  phone: string | null
  email: string | null
  address: string | null
}

export interface TaxRate extends Base {
  name: string
  rate: number
  is_active: boolean
}

// Parámetros de configuración del sistema (clave-valor).
export interface SystemParameter extends Base {
  key: string
  value: string
  description: string | null
}

export interface SystemParameterInput {
  value: string
  description?: string | null
}

// Parámetros de configuración del sistema (clave-valor).
export interface SystemParameter {
  id: number
  key: string
  value: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface SystemParameterInput {
  value: string
  description?: string | null
}

export interface Item {
  id: number
  item_type: ItemType
  service_id: number | null
  product_id: number | null
  assigned_to: number | null
  description: string | null
  quantity: number
  unit_price: number
  discount: number
  duration_minutes: number | null
  tax_rate_id: number | null
  tax_rate?: number | null
  tax_rate_name?: string | null
}

// Snapshots de cabecera congelados en los documentos al emitirse/aprobarse
// (los maestros pueden cambiar después sin alterar documentos ya fijados).
export interface ClientSnapshot {
  client_name: string | null
  client_tax_id: string | null
  client_phone: string | null
  client_email: string | null
  client_address: string | null
  client_postal_code: string | null
  client_state: string | null
  client_city: string | null
  client_country: string | null
}

export interface VehicleSnapshot {
  motor_plate: string | null
  motor_make: string | null
  motor_model: string | null
  motor_year: number | null
  motor_color: string | null
  trailer_plate: string | null
  trailer_make: string | null
  trailer_model: string | null
  trailer_year: number | null
  trailer_color: string | null
}

export interface IssuerSnapshot {
  issuer_legal_name: string | null
  issuer_tax_id: string | null
  issuer_rii_number: string | null
  issuer_address: string | null
  issuer_postal_code: string | null
  issuer_state: string | null
  issuer_city: string | null
  issuer_phone: string | null
  issuer_email: string | null
}

export interface WorkOrderItem extends Item {
  work_order_id: number
  completed_at: string | null
  cancelled_at: string | null
  derived_status: WorkOrderItemStatus
  assigned_user?: { id: number; name: string } | null
  assigned_user_name?: string | null
}

export interface QuoteItem extends Item {
  quote_id: number
}

export interface InvoiceItem extends Item {
  invoice_id: number
}

export interface UserRole {
  user_id: number
  role_id: number
}

export interface RolePermission {
  role_id: number
  permission_id: number
}

export interface ProductProvider {
  product_id: number
  provider_id: number
}

export type ItemInput = Omit<Item, 'id'>

export interface WorkOrder extends Base, ClientSnapshot, VehicleSnapshot {
  number: string
  quote_id: number | null
  client_id: number
  motor_vehicle_id: number | null
  trailer_vehicle_id: number | null
  mileage: number | null
  description: string | null
  notes: string | null
  total: number
  opened_at: string | null
  checked_in_at: string | null
  completed_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  derived_status: WorkOrderStatus
  invoiced_at: string | null
  archived_at: string | null
  items: WorkOrderItem[]
  client_name: string | null
  motor_vehicle: Vehicle | null
  trailer_vehicle: Vehicle | null
}

export interface Quote extends Base, ClientSnapshot, VehicleSnapshot {
  number: string
  client_id: number
  motor_vehicle_id: number | null
  trailer_vehicle_id: number | null
  mileage: number | null
  status: QuoteStatus
  description: string | null
  notes: string | null
  total: number
  validity_days: number
  date: string
  valid_until: string
  items: Item[]
  motor_vehicle: Vehicle | null
  trailer_vehicle: Vehicle | null
}

export interface Invoice
  extends Base,
    ClientSnapshot,
    VehicleSnapshot,
    IssuerSnapshot {
  number: string
  client_id: number
  motor_vehicle_id: number | null
  trailer_vehicle_id: number | null
  mileage: number | null
  work_order_id: number | null
  quote_id: number | null
  status: InvoiceStatus
  notes: string | null
  subtotal: number
  taxes: number
  total: number
  date: string
  items: Item[]
  client: Client
  motor_vehicle: Vehicle | null
  trailer_vehicle: Vehicle | null
  work_order_number?: string | null
}

export interface DashboardReport {
  clients: number
  vehicles: number
  open_orders: number
  monthly_revenue: number
}

export interface MonthlyBilling {
  month: string
  total: number
}

export interface ActivityReport {
  status: string
  quantity: number
}

// Payloads de creación/actualización (lo que acepta la API).
export interface ClientInput {
  name: string
  tax_id: string
  phone?: string | null
  email?: string | null
  address: string
  postal_code: string
  state: string
  city: string
  country?: string
  notes?: string | null
}

export interface CompanyProfileInput {
  legal_name?: string
  tax_id?: string | null
  rii_number?: string | null
  address?: string | null
  postal_code?: string | null
  state?: string | null
  city?: string | null
  phone?: string | null
  email?: string | null
}

export interface VehicleInput {
  client_id: number
  category_id?: number | null
  plate: string
  make: string
  model?: string | null
  year?: number | null
  color?: string | null
}

export interface TaxRateInput {
  name: string
  rate?: number
  is_active?: boolean
}

export interface ServiceInput {
  name: string
  description?: string | null
  category_id: number
  price?: number
  duration_minutes?: number | null
}

export interface ProductInput {
  name: string
  description?: string | null
  brand?: string | null
  category_id: number
  price?: number
  provider_ids?: number[]
}

export interface WorkOrderInput {
  client_id: number
  motor_vehicle_id?: number | null
  trailer_vehicle_id?: number | null
  mileage?: number | null
  description?: string | null
  notes?: string | null
  items?: ItemInput[]
}

export interface QuoteInput {
  client_id: number
  motor_vehicle_id?: number | null
  trailer_vehicle_id?: number | null
  mileage?: number | null
  status?: QuoteStatus
  description?: string | null
  notes?: string | null
  validity_days?: number
  items?: ItemInput[]
}

export interface InvoiceInput {
  client_id: number
  motor_vehicle_id?: number | null
  trailer_vehicle_id?: number | null
  mileage?: number | null
  work_order_id?: number | null
  quote_id?: number | null
  status?: InvoiceStatus
  notes?: string | null
  taxes?: number
  items?: ItemInput[]
}

export interface UserInput {
  username: string
  email: string
  name: string
  is_active?: boolean
  password: string
  role_ids?: number[]
}

export interface RoleInput {
  name: string
  description?: string | null
  permission_codes?: string[]
}

export interface RoleTemplate {
  name: string
  description: string | null
  permission_codes: string[]
}
