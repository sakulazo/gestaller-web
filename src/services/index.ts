// Servicios de la API por módulo (API v2 en inglés).

import api from './api'
import type {
  ActivityReport,
  Client,
  ClientInput,
  DashboardReport,
  Inventory,
  InventoryInput,
  Invoice,
  InvoiceInput,
  InvoiceItem,
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
  Service,
  ServiceCategory,
  ServiceInput,
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

// Clientes
export const listClients = (): Promise<Client[]> =>
  api.get<Client[]>('/clients').then((r) => r.data)
export const createClient = (payload: ClientInput): Promise<Client> =>
  api.post<Client>('/clients', payload).then((r) => r.data)
export const updateClient = (id: number, payload: Partial<ClientInput>): Promise<Client> =>
  api.put<Client>(`/clients/${id}`, payload).then((r) => r.data)
export const deleteClient = (id: number): Promise<void> =>
  api.delete(`/clients/${id}`)

// Vehículos
export const listVehicles = (): Promise<Vehicle[]> =>
  api.get<Vehicle[]>('/vehicles').then((r) => r.data)
export const createVehicle = (payload: VehicleInput): Promise<Vehicle> =>
  api.post<Vehicle>('/vehicles', payload).then((r) => r.data)
export const updateVehicle = (id: number, payload: Partial<VehicleInput>): Promise<Vehicle> =>
  api.put<Vehicle>(`/vehicles/${id}`, payload).then((r) => r.data)
export const deleteVehicle = (id: number): Promise<void> =>
  api.delete(`/vehicles/${id}`)

// Categorías de vehículo
export const listVehicleCategories = (): Promise<VehicleCategory[]> =>
  api.get<VehicleCategory[]>('/vehicle-categories').then((r) => r.data)
export const createVehicleCategory = (payload: Partial<VehicleCategory>): Promise<VehicleCategory> =>
  api.post<VehicleCategory>('/vehicle-categories', payload).then((r) => r.data)
export const updateVehicleCategory = (id: number, payload: Partial<VehicleCategory>): Promise<VehicleCategory> =>
  api.put<VehicleCategory>(`/vehicle-categories/${id}`, payload).then((r) => r.data)
export const deleteVehicleCategory = (id: number): Promise<void> =>
  api.delete(`/vehicle-categories/${id}`)

// Categorías de servicio
export const listServiceCategories = (): Promise<ServiceCategory[]> =>
  api.get<ServiceCategory[]>('/service-categories').then((r) => r.data)
export const createServiceCategory = (payload: Partial<ServiceCategory>): Promise<ServiceCategory> =>
  api.post<ServiceCategory>('/service-categories', payload).then((r) => r.data)
export const updateServiceCategory = (id: number, payload: Partial<ServiceCategory>): Promise<ServiceCategory> =>
  api.put<ServiceCategory>(`/service-categories/${id}`, payload).then((r) => r.data)
export const deleteServiceCategory = (id: number): Promise<void> =>
  api.delete(`/service-categories/${id}`)

// Servicios
export const listServices = (): Promise<Service[]> =>
  api.get<Service[]>('/services').then((r) => r.data)
export const createService = (payload: ServiceInput): Promise<Service> =>
  api.post<Service>('/services', payload).then((r) => r.data)
export const updateService = (id: number, payload: Partial<ServiceInput>): Promise<Service> =>
  api.put<Service>(`/services/${id}`, payload).then((r) => r.data)
export const deleteService = (id: number): Promise<void> =>
  api.delete(`/services/${id}`)

// Categorías de producto
export const listProductCategories = (): Promise<ProductCategory[]> =>
  api.get<ProductCategory[]>('/product-categories').then((r) => r.data)
export const createProductCategory = (payload: Partial<ProductCategory>): Promise<ProductCategory> =>
  api.post<ProductCategory>('/product-categories', payload).then((r) => r.data)
export const updateProductCategory = (id: number, payload: Partial<ProductCategory>): Promise<ProductCategory> =>
  api.put<ProductCategory>(`/product-categories/${id}`, payload).then((r) => r.data)
export const deleteProductCategory = (id: number): Promise<void> =>
  api.delete(`/product-categories/${id}`)

// Productos
export const listProducts = (): Promise<Product[]> =>
  api.get<Product[]>('/products').then((r) => r.data)
export const createProduct = (payload: ProductInput): Promise<Product> =>
  api.post<Product>('/products', payload).then((r) => r.data)
export const updateProduct = (id: number, payload: Partial<ProductInput>): Promise<Product> =>
  api.put<Product>(`/products/${id}`, payload).then((r) => r.data)
export const deleteProduct = (id: number): Promise<void> =>
  api.delete(`/products/${id}`)

// Proveedores
export const listProviders = (): Promise<Provider[]> =>
  api.get<Provider[]>('/providers').then((r) => r.data)
export const createProvider = (payload: Partial<Provider>): Promise<Provider> =>
  api.post<Provider>('/providers', payload).then((r) => r.data)
export const updateProvider = (id: number, payload: Partial<Provider>): Promise<Provider> =>
  api.put<Provider>(`/providers/${id}`, payload).then((r) => r.data)
export const deleteProvider = (id: number): Promise<void> =>
  api.delete(`/providers/${id}`)

// Inventario
export const listInventory = (): Promise<Inventory[]> =>
  api.get<Inventory[]>('/inventory').then((r) => r.data)
export const createInventory = (payload: InventoryInput): Promise<Inventory> =>
  api.post<Inventory>('/inventory', payload).then((r) => r.data)
export const updateInventory = (id: number, payload: Partial<InventoryInput>): Promise<Inventory> =>
  api.put<Inventory>(`/inventory/${id}`, payload).then((r) => r.data)
export const deleteInventory = (id: number): Promise<void> =>
  api.delete(`/inventory/${id}`)

// Órdenes de trabajo
export const listWorkOrders = (): Promise<WorkOrder[]> =>
  api.get<WorkOrder[]>('/work-orders').then((r) => r.data)
export const createWorkOrder = (payload: WorkOrderInput): Promise<WorkOrder> =>
  api.post<WorkOrder>('/work-orders', payload).then((r) => r.data)
export const updateWorkOrder = (id: number, payload: Partial<WorkOrderInput>): Promise<WorkOrder> =>
  api.put<WorkOrder>(`/work-orders/${id}`, payload).then((r) => r.data)
export const completeWorkOrder = (id: number): Promise<WorkOrder> =>
  api.post<WorkOrder>(`/work-orders/${id}/complete`).then((r) => r.data)
export const deleteWorkOrder = (id: number): Promise<void> =>
  api.delete(`/work-orders/${id}`)

// Presupuestos
export const listQuotes = (): Promise<Quote[]> =>
  api.get<Quote[]>('/quotes').then((r) => r.data)
export const createQuote = (payload: QuoteInput): Promise<Quote> =>
  api.post<Quote>('/quotes', payload).then((r) => r.data)
export const updateQuote = (id: number, payload: Partial<QuoteInput>): Promise<Quote> =>
  api.put<Quote>(`/quotes/${id}`, payload).then((r) => r.data)
export const convertQuote = (id: number): Promise<Invoice> =>
  api.post<Invoice>(`/quotes/${id}/convert`).then((r) => r.data)
export const deleteQuote = (id: number): Promise<void> =>
  api.delete(`/quotes/${id}`)

// Facturas (sin DELETE: las facturas no se eliminan, se anulan)
export const listInvoices = (): Promise<Invoice[]> =>
  api.get<Invoice[]>('/invoices').then((r) => r.data)
export const createInvoice = (payload: InvoiceInput): Promise<Invoice> =>
  api.post<Invoice>('/invoices', payload).then((r) => r.data)
export const updateInvoice = (id: number, payload: Partial<InvoiceInput>): Promise<Invoice> =>
  api.put<Invoice>(`/invoices/${id}`, payload).then((r) => r.data)
export const voidInvoice = (id: number): Promise<Invoice> =>
  api.post<Invoice>(`/invoices/${id}/void`).then((r) => r.data)

// Usuarios
export const listUsers = (): Promise<User[]> =>
  api.get<User[]>('/users').then((r) => r.data)
export const createUser = (payload: UserInput): Promise<User> =>
  api.post<User>('/users', payload).then((r) => r.data)
export const updateUser = (id: number, payload: Partial<UserInput>): Promise<User> =>
  api.put<User>(`/users/${id}`, payload).then((r) => r.data)
export const deleteUser = (id: number): Promise<void> =>
  api.delete(`/users/${id}`)

// Roles
export const listRoles = (): Promise<Role[]> =>
  api.get<Role[]>('/roles').then((r) => r.data)
export const createRole = (payload: RoleInput): Promise<Role> =>
  api.post<Role>('/roles', payload).then((r) => r.data)
export const updateRole = (id: number, payload: Partial<RoleInput>): Promise<Role> =>
  api.put<Role>(`/roles/${id}`, payload).then((r) => r.data)
export const deleteRole = (id: number): Promise<void> =>
  api.delete(`/roles/${id}`)

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
export const listWorkOrderItems = (): Promise<WorkOrderItem[]> =>
  api.get<WorkOrderItem[]>('/work-order-items').then((r) => r.data)
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
