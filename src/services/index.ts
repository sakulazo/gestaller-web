// Servicios de la API por módulo (API v2 en inglés).

import api from './api'
import type { ListParams, Paginated } from '../types'
import type {
  ActivityReport,
  Client,
  ClientInput,
  CompanyProfile,
  CompanyProfileInput,
  DashboardReport,
  Invoice,
  InvoiceInput,
  InvoiceItem,
  ItemInput,
  MonthlyBilling,
  Permission,
  PermissionCatalog,
  Product,
  ProductCategory,
  ProductInput,
  ProductProvider,
  Provider,
  Quote,
  QuoteInput,
  QuoteItem,
  Role,
  RoleInput,
  RolePermission,
  RoleTemplate,
  Service,
  ServiceCategory,
  ServiceInput,
  SystemParameter,
  SystemParameterInput,
  TaxRate,
  TaxRateInput,
  User,
  UserRole,
  UserInput,
  Vehicle,
  VehicleCategory,
  VehicleInput,
  WorkOrder,
  WorkOrderInput,
  WorkOrderItem,
} from '../types'

/** Traduce ListParams del frontend al query param del contrato (snake_case). */
const pageParams = (params?: ListParams) => ({
  page: params?.page,
  page_size: params?.pageSize,
  all: params?.all,
  search: params?.search,
})

// Clientes
export const listClients = (params?: ListParams) =>
  api
    .get<Paginated<Client>>('/clients', { params: pageParams(params) })
    .then((r) => r.data)
export const createClient = (payload: ClientInput): Promise<Client> =>
  api.post<Client>('/clients', payload).then((r) => r.data)
export const updateClient = (id: number, payload: Partial<ClientInput>): Promise<Client> =>
  api.put<Client>(`/clients/${id}`, payload).then((r) => r.data)
export const deleteClient = (id: number): Promise<void> =>
  api.delete(`/clients/${id}`)

// Perfil del taller (fila única; GET devuelve null si aún no está configurado)
export const getCompanyProfile = (): Promise<CompanyProfile | null> =>
  api.get<CompanyProfile>('/company-profile').then((r) => r.data)
export const updateCompanyProfile = (payload: CompanyProfileInput): Promise<CompanyProfile> =>
  api.put<CompanyProfile>('/company-profile', payload).then((r) => r.data)

// Vehículos
export const listVehicles = (params?: ListParams) =>
  api
    .get<Paginated<Vehicle>>('/vehicles', { params: pageParams(params) })
    .then((r) => r.data)
export const createVehicle = (payload: VehicleInput): Promise<Vehicle> =>
  api.post<Vehicle>('/vehicles', payload).then((r) => r.data)
export const updateVehicle = (id: number, payload: Partial<VehicleInput>): Promise<Vehicle> =>
  api.put<Vehicle>(`/vehicles/${id}`, payload).then((r) => r.data)
export const deleteVehicle = (id: number): Promise<void> =>
  api.delete(`/vehicles/${id}`)

// Categorías de vehículo
export const listVehicleCategories = (params?: ListParams) =>
  api
    .get<Paginated<VehicleCategory>>('/vehicle-categories', {
      params: pageParams(params),
    })
    .then((r) => r.data)
export const createVehicleCategory = (payload: Partial<VehicleCategory>): Promise<VehicleCategory> =>
  api.post<VehicleCategory>('/vehicle-categories', payload).then((r) => r.data)
export const updateVehicleCategory = (id: number, payload: Partial<VehicleCategory>): Promise<VehicleCategory> =>
  api.put<VehicleCategory>(`/vehicle-categories/${id}`, payload).then((r) => r.data)
export const deleteVehicleCategory = (id: number): Promise<void> =>
  api.delete(`/vehicle-categories/${id}`)

// Categorías de servicio
export const listServiceCategories = (params?: ListParams) =>
  api
    .get<Paginated<ServiceCategory>>('/service-categories', {
      params: pageParams(params),
    })
    .then((r) => r.data)
export const createServiceCategory = (payload: Partial<ServiceCategory>): Promise<ServiceCategory> =>
  api.post<ServiceCategory>('/service-categories', payload).then((r) => r.data)
export const updateServiceCategory = (id: number, payload: Partial<ServiceCategory>): Promise<ServiceCategory> =>
  api.put<ServiceCategory>(`/service-categories/${id}`, payload).then((r) => r.data)
export const deleteServiceCategory = (id: number): Promise<void> =>
  api.delete(`/service-categories/${id}`)

// Servicios
export const listServices = (params?: ListParams) =>
  api
    .get<Paginated<Service>>('/services', { params: pageParams(params) })
    .then((r) => r.data)
export const createService = (payload: ServiceInput): Promise<Service> =>
  api.post<Service>('/services', payload).then((r) => r.data)
export const updateService = (id: number, payload: Partial<ServiceInput>): Promise<Service> =>
  api.put<Service>(`/services/${id}`, payload).then((r) => r.data)
export const deleteService = (id: number): Promise<void> =>
  api.delete(`/services/${id}`)

// Categorías de producto
export const listProductCategories = (params?: ListParams) =>
  api
    .get<Paginated<ProductCategory>>('/product-categories', {
      params: pageParams(params),
    })
    .then((r) => r.data)
export const createProductCategory = (payload: Partial<ProductCategory>): Promise<ProductCategory> =>
  api.post<ProductCategory>('/product-categories', payload).then((r) => r.data)
export const updateProductCategory = (id: number, payload: Partial<ProductCategory>): Promise<ProductCategory> =>
  api.put<ProductCategory>(`/product-categories/${id}`, payload).then((r) => r.data)
export const deleteProductCategory = (id: number): Promise<void> =>
  api.delete(`/product-categories/${id}`)

// Productos
export const listProducts = (params?: ListParams) =>
  api
    .get<Paginated<Product>>('/products', { params: pageParams(params) })
    .then((r) => r.data)
export const createProduct = (payload: ProductInput): Promise<Product> =>
  api.post<Product>('/products', payload).then((r) => r.data)
export const updateProduct = (id: number, payload: Partial<ProductInput>): Promise<Product> =>
  api.put<Product>(`/products/${id}`, payload).then((r) => r.data)
export const deleteProduct = (id: number): Promise<void> =>
  api.delete(`/products/${id}`)

// Proveedores
export const listProviders = (params?: ListParams) =>
  api
    .get<Paginated<Provider>>('/providers', { params: pageParams(params) })
    .then((r) => r.data)
export const createProvider = (payload: Partial<Provider>): Promise<Provider> =>
  api.post<Provider>('/providers', payload).then((r) => r.data)
export const updateProvider = (id: number, payload: Partial<Provider>): Promise<Provider> =>
  api.put<Provider>(`/providers/${id}`, payload).then((r) => r.data)
export const deleteProvider = (id: number): Promise<void> =>
  api.delete(`/providers/${id}`)

// Órdenes de trabajo
export const listWorkOrders = (params?: ListParams) =>
  api
    .get<Paginated<WorkOrder>>('/work-orders', { params: pageParams(params) })
    .then((r) => r.data)
export const listWorkOrderHistory = (params?: ListParams) =>
  api
    .get<Paginated<WorkOrder>>('/work-orders/history', {
      params: pageParams(params),
    })
    .then((r) => r.data)
export const getWorkOrder = (id: number): Promise<WorkOrder> =>
  api.get<WorkOrder>(`/work-orders/${id}`).then((r) => r.data)
export const createWorkOrder = (payload: WorkOrderInput): Promise<WorkOrder> =>
  api.post<WorkOrder>('/work-orders', payload).then((r) => r.data)
export const updateWorkOrder = (id: number, payload: Partial<WorkOrderInput>): Promise<WorkOrder> =>
  api.put<WorkOrder>(`/work-orders/${id}`, payload).then((r) => r.data)
export const checkInWorkOrder = (id: number): Promise<WorkOrder> =>
  api.post<WorkOrder>(`/work-orders/${id}/check-in`).then((r) => r.data)
export const deliverWorkOrder = (id: number): Promise<WorkOrder> =>
  api.post<WorkOrder>(`/work-orders/${id}/deliver`).then((r) => r.data)
export const cancelWorkOrder = (id: number): Promise<WorkOrder> =>
  api.post<WorkOrder>(`/work-orders/${id}/cancel`).then((r) => r.data)
export const reactivateWorkOrder = (id: number): Promise<WorkOrder> =>
  api.post<WorkOrder>(`/work-orders/${id}/reactivate`).then((r) => r.data)
export const deleteWorkOrder = (id: number): Promise<void> =>
  api.delete(`/work-orders/${id}`)
// Ítems de órdenes de trabajo
export const getWorkOrderItems = (workOrderId: number): Promise<WorkOrderItem[]> =>
  api.get<WorkOrderItem[]>(`/work-orders/${workOrderId}/items`).then((r) => r.data)
export const createWorkOrderItem = (workOrderId: number, payload: ItemInput): Promise<WorkOrderItem> =>
  api.post<WorkOrderItem>(`/work-orders/${workOrderId}/items`, payload).then((r) => r.data)
export const updateWorkOrderItem = (workOrderId: number, id: number, payload: Partial<ItemInput>): Promise<WorkOrderItem> =>
  api.patch<WorkOrderItem>(`/work-orders/${workOrderId}/items/${id}`, payload).then((r) => r.data)
export const deleteWorkOrderItem = (workOrderId: number, id: number): Promise<void> =>
  api.delete(`/work-orders/${workOrderId}/items/${id}`)
export const completeWorkOrderItem = (workOrderId: number, id: number): Promise<WorkOrderItem> =>
  api.post<WorkOrderItem>(`/work-orders/${workOrderId}/items/${id}/complete`).then((r) => r.data)
export const cancelWorkOrderItem = (workOrderId: number, id: number): Promise<WorkOrderItem> =>
  api.post<WorkOrderItem>(`/work-orders/${workOrderId}/items/${id}/cancel`).then((r) => r.data)

// Presupuestos
export const listQuotes = (params?: ListParams) =>
  api
    .get<Paginated<Quote>>('/quotes', { params: pageParams(params) })
    .then((r) => r.data)
export const createQuote = (payload: QuoteInput): Promise<Quote> =>
  api.post<Quote>('/quotes', payload).then((r) => r.data)
export const updateQuote = (id: number, payload: Partial<QuoteInput>): Promise<Quote> =>
  api.put<Quote>(`/quotes/${id}`, payload).then((r) => r.data)
export const convertQuote = (id: number): Promise<Invoice> =>
  api.post<Invoice>(`/quotes/${id}/convert`).then((r) => r.data)
export const deleteQuote = (id: number): Promise<void> =>
  api.delete(`/quotes/${id}`)

// Facturas (sin DELETE: las facturas no se eliminan, se anulan)
export const listInvoices = (params?: ListParams) =>
  api
    .get<Paginated<Invoice>>('/invoices', { params: pageParams(params) })
    .then((r) => r.data)
export const getInvoice = (id: number): Promise<Invoice> =>
  api.get<Invoice>(`/invoices/${id}`).then((r) => r.data)
export const createInvoice = (payload: InvoiceInput): Promise<Invoice> =>
  api.post<Invoice>('/invoices', payload).then((r) => r.data)
export const updateInvoice = (id: number, payload: Partial<InvoiceInput>): Promise<Invoice> =>
  api.put<Invoice>(`/invoices/${id}`, payload).then((r) => r.data)

// Tasas de impuesto (IVA)
export const listTaxRates = (params?: ListParams) =>
  api
    .get<Paginated<TaxRate>>('/tax-rates', { params: pageParams(params) })
    .then((r) => r.data)
export const createTaxRate = (payload: TaxRateInput): Promise<TaxRate> =>
  api.post<TaxRate>('/tax-rates', payload).then((r) => r.data)
export const updateTaxRate = (id: number, payload: Partial<TaxRateInput>): Promise<TaxRate> =>
  api.put<TaxRate>(`/tax-rates/${id}`, payload).then((r) => r.data)
export const deleteTaxRate = (id: number): Promise<void> =>
  api.delete(`/tax-rates/${id}`)

// Parámetros de configuración
export const getSettings = (): Promise<SystemParameter[]> =>
  api.get<SystemParameter[]>('/settings').then((r) => r.data)
export const updateSetting = (
  key: string,
  payload: SystemParameterInput,
): Promise<SystemParameter> =>
  api.put<SystemParameter>(`/settings/${key}`, payload).then((r) => r.data)
export const restoreTaxRate = (id: number): Promise<unknown> =>
  api.post(`/tax-rates/${id}/restore`).then((r) => r.data)

// Usuarios
export const listUsers = (params?: ListParams) =>
  api
    .get<Paginated<User>>('/users', { params: pageParams(params) })
    .then((r) => r.data)
export const createUser = (payload: UserInput): Promise<User> =>
  api.post<User>('/users', payload).then((r) => r.data)
export const updateUser = (id: number, payload: Partial<UserInput>): Promise<User> =>
  api.put<User>(`/users/${id}`, payload).then((r) => r.data)
export const deleteUser = (id: number): Promise<void> =>
  api.delete(`/users/${id}`)

// Roles
export const listRoles = (params?: ListParams) =>
  api
    .get<Paginated<Role>>('/roles', { params: pageParams(params) })
    .then((r) => r.data)
export const createRole = (payload: RoleInput): Promise<Role> =>
  api.post<Role>('/roles', payload).then((r) => r.data)
export const updateRole = (id: number, payload: Partial<RoleInput>): Promise<Role> =>
  api.put<Role>(`/roles/${id}`, payload).then((r) => r.data)
export const deleteRole = (id: number): Promise<void> =>
  api.delete(`/roles/${id}`)

// Plantillas de roles (definiciones del backend, seed_data/roles.json)
export const listRoleTemplates = (): Promise<RoleTemplate[]> =>
  api.get<RoleTemplate[]>('/roles/templates').then((r) => r.data)

// Permisos (catálogo, solo lectura)
export const listPermissions = (): Promise<Permission[]> =>
  api.get<Permission[]>('/permissions').then((r) => r.data)

// Catálogo agrupado de permisos (fuente de verdad del backend)
export const fetchPermissionCatalog = (): Promise<PermissionCatalog> =>
  api.get<PermissionCatalog>('/permissions/catalog').then((r) => r.data)

// Reportes
export const getDashboard = (): Promise<DashboardReport> =>
  api.get<DashboardReport>('/reports/dashboard').then((r) => r.data)
export const getMonthlyBilling = (): Promise<MonthlyBilling[]> =>
  api.get<MonthlyBilling[]>('/reports/billing').then((r) => r.data)
export const getActivity = (): Promise<ActivityReport[]> =>
  api.get<ActivityReport[]>('/reports/activity').then((r) => r.data)

// Datos crudos (solo lectura para la página /data, incluye soft-deleted)
export const fetchTableData = (table: string): Promise<Record<string, unknown>[]> =>
  api.get<Record<string, unknown>[]>(`/data/${table}`).then((r) => r.data)

// Legacy endpoints para otras partes de la app (sin deleted)
export const listQuoteItems = (): Promise<QuoteItem[]> =>
  api.get<QuoteItem[]>('/quote-items').then((r) => r.data)
export const listInvoiceItems = (): Promise<InvoiceItem[]> =>
  api.get<InvoiceItem[]>('/invoice-items').then((r) => r.data)
export const listUserRoles = (): Promise<UserRole[]> =>
  api.get<UserRole[]>('/user-roles').then((r) => r.data)
export const listRolePermissions = (): Promise<RolePermission[]> =>
  api.get<RolePermission[]>('/role-permissions').then((r) => r.data)
export const listProductProviders = (): Promise<ProductProvider[]> =>
  api.get<ProductProvider[]>('/product-providers').then((r) => r.data)

// Restaurar registros soft-deleted
export const restoreServiceCategory = (id: number): Promise<unknown> =>
  api.post(`/service-categories/${id}/restore`).then((r) => r.data)
export const restoreProductCategory = (id: number): Promise<unknown> =>
  api.post(`/product-categories/${id}/restore`).then((r) => r.data)
export const restoreVehicleCategory = (id: number): Promise<unknown> =>
  api.post(`/vehicle-categories/${id}/restore`).then((r) => r.data)
export const restoreService = (id: number): Promise<unknown> =>
  api.post(`/services/${id}/restore`).then((r) => r.data)
export const restoreClient = (id: number): Promise<unknown> =>
  api.post(`/clients/${id}/restore`).then((r) => r.data)
export const restoreVehicle = (id: number): Promise<unknown> =>
  api.post(`/vehicles/${id}/restore`).then((r) => r.data)
export const restoreProduct = (id: number): Promise<unknown> =>
  api.post(`/products/${id}/restore`).then((r) => r.data)
export const restoreProvider = (id: number): Promise<unknown> =>
  api.post(`/providers/${id}/restore`).then((r) => r.data)
export const restoreUser = (id: number): Promise<unknown> =>
  api.post(`/users/${id}/restore`).then((r) => r.data)
export const restoreRole = (id: number): Promise<unknown> =>
  api.post(`/roles/${id}/restore`).then((r) => r.data)
