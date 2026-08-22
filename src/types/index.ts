// Tipos compartidos que reflejan los schemas del backend (API v2 en inglés).

export type WorkOrderStatus = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
export type QuoteStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'convertido'
export type InvoiceStatus = 'emitida' | 'anulada'
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
  is_active: boolean
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

export interface Vehicle extends Base {
  client_id: number
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
  is_active: boolean
  is_self_propelled: boolean
}

export interface ServiceCategory extends Base {
  name: string
  description: string | null
  is_active: boolean
}

export interface Service extends Base {
  name: string
  description: string | null
  category_id: number
  price: number
  duration_minutes: number | null
  is_active: boolean
}

export interface ProductCategory extends Base {
  name: string
  description: string | null
  is_active: boolean
}

export interface Product extends Base {
  code: string
  name: string
  description: string | null
  brand: string | null
  category_id: number
  price: number
  is_active: boolean
  provider_ids?: number[]
}

export interface Provider extends Base {
  name: string
  tax_id: string | null
  phone: string | null
  email: string | null
  address: string | null
  is_active: boolean
}

export interface Inventory extends Base {
  product_id: number
  quantity: number
  min_quantity: number
  location: string | null
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
}

export interface WorkOrderItem extends Item {
  work_order_id: number
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

export interface WorkOrder extends Base {
  number: string
  client_id: number
  motor_vehicle_id: number | null
  trailer_vehicle_id: number | null
  mileage: number | null
  status: WorkOrderStatus
  description: string | null
  notes: string | null
  total: number
  date: string
  completed_at: string | null
  items: Item[]
  motor_vehicle: Vehicle | null
  trailer_vehicle: Vehicle | null
}

export interface Quote extends Base {
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

export interface Invoice extends Base {
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
  motor_vehicle: Vehicle | null
  trailer_vehicle: Vehicle | null
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

export interface VehicleInput {
  client_id: number
  category_id?: number | null
  plate: string
  make: string
  model?: string | null
  year?: number | null
  color?: string | null
}

export interface ServiceInput {
  name: string
  description?: string | null
  category_id: number
  price?: number
  duration_minutes?: number | null
  is_active?: boolean
}

export interface ProductInput {
  code: string
  name: string
  description?: string | null
  brand?: string | null
  category_id: number
  price?: number
  is_active?: boolean
  provider_ids?: number[]
}

export interface InventoryInput {
  product_id: number
  quantity?: number
  min_quantity?: number
  location?: string | null
}

export interface WorkOrderInput {
  client_id: number
  motor_vehicle_id?: number | null
  trailer_vehicle_id?: number | null
  mileage?: number | null
  status?: WorkOrderStatus
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
  is_active?: boolean
  permission_codes?: string[]
}
