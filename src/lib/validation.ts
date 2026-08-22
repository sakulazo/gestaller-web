// Schemas de validación Zod para cada entidad del formulario.
//
// Estos schemas se usan en el frontend para validación de UX antes de
// enviar a la API. La validación definitiva siempre es la del backend.

import { z } from 'zod'

// ---------- Clientes ----------
export const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  tax_id: z.string().min(1, 'El NIF es obligatorio'),
  phone: z.string().nullable().optional(),
  email: z.string().email('El email no es valido').nullable().optional(),
  address: z.string().min(1, 'La direccion es obligatoria'),
  postal_code: z.string().min(1, 'El codigo postal es obligatorio'),
  state: z.string().min(1, 'La provincia es obligatoria'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  country: z.string().min(2).max(2).default('ES'),
  notes: z.string().nullable().optional(),
})

export type ClientSchemaValues = z.input<typeof clientSchema>

// ---------- Vehiculos ----------
export const vehicleSchema = z.object({
  client_id: z.number().min(1, 'El cliente es obligatorio'),
  category_id: z.number().nullable().optional(),
  plate: z.string().min(1, 'La matricula es obligatoria'),
  make: z.string().min(1, 'La marca es obligatoria'),
  model: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  color: z.string().nullable().optional(),
})

export type VehicleSchemaValues = z.input<typeof vehicleSchema>

// ---------- Servicios ----------
export const serviceSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(150, 'El nombre no puede superar 150 caracteres'),
  description: z
    .string()
    .trim()
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(500, 'La descripción no puede superar 500 caracteres'),
  category_id: z.number().min(1, 'La categoria es obligatoria'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  duration_minutes: z.number().positive('La duración debe ser mayor que cero'),
  is_active: z.boolean().default(true),
})

export type ServiceSchemaValues = z.input<typeof serviceSchema>

// ---------- Productos ----------
export const productSchema = z.object({
  code: z.string().min(1, 'El codigo es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  category_id: z.number().min(1, 'La categoria es obligatoria'),
  price: z.number().min(0, 'El precio no puede ser negativo').default(0),
  is_active: z.boolean().default(true),
  provider_ids: z.array(z.number()).optional(),
})

export type ProductSchemaValues = z.input<typeof productSchema>

// ---------- Proveedores ----------
export const providerSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  tax_id: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email('El email no es valido').nullable().optional(),
  address: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
})

export type ProviderSchemaValues = z.input<typeof providerSchema>

// ---------- Usuarios ----------
export const userCreateSchema = z.object({
  username: z.string().min(1, 'El nombre del usuario es obligatorio'),
  email: z.string().email('El email no es valido'),
  name: z.string().min(1, 'El nombre completo y real del usuario es obligatorio'),
  is_active: z.boolean().default(true),
  password: z.preprocess(
    (v) => (v === undefined || v === null ? '' : v),
    z.string().min(1, 'La contraseña es obligatoria').min(8, 'La contrasena debe tener al menos 8 caracteres'),
  ),
  role_ids: z.array(z.number()).optional(),
})

export const userUpdateSchema = z.object({
  username: z.string().min(1, 'El nombre del usuario es obligatorio'),
  email: z.string().email('El email no es valido'),
  name: z.string().min(1, 'El nombre completo y real del usuario es obligatorio'),
  is_active: z.boolean().default(true),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres').optional().or(z.literal('')),
  role_ids: z.array(z.number()).optional(),
})

export type UserCreateSchemaValues = z.input<typeof userCreateSchema>
export type UserUpdateSchemaValues = z.input<typeof userUpdateSchema>

// ---------- Roles ----------
export const roleSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  permission_codes: z.array(z.string()).optional(),
})

export type RoleSchemaValues = z.input<typeof roleSchema>

// ---------- Categorias ----------
export const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
})

export type CategorySchemaValues = z.input<typeof categorySchema>

// ---------- Inventario ----------
export const inventorySchema = z.object({
  product_id: z.number().min(1, 'El producto es obligatorio'),
  quantity: z.number().min(0, 'La cantidad no puede ser negativa').default(0),
  min_quantity: z.number().min(0).default(0),
  location: z.string().nullable().optional(),
})

export type InventorySchemaValues = z.input<typeof inventorySchema>

// ---------- Ordenes de trabajo ----------
const workOrderBase = z.object({
  client_id: z.number().min(1, 'El cliente es obligatorio'),
  motor_vehicle_id: z.number().nullable().optional(),
  trailer_vehicle_id: z.number().nullable().optional(),
  mileage: z.number().nullable().optional(),
  status: z.enum(['pendiente', 'en_progreso', 'completada', 'cancelada']).optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const workOrderSchema = workOrderBase.refine(
  (d) => d.motor_vehicle_id != null || d.trailer_vehicle_id != null,
  { message: 'Se requiere al menos un vehiculo (motor o remolque)', path: ['motor_vehicle_id'] },
).refine(
  (d) => d.motor_vehicle_id == null || (d.mileage != null && d.mileage > 0),
  { message: 'El kilometraje es obligatorio cuando hay vehiculo a motor', path: ['mileage'] },
)

// ---------- Presupuestos ----------
const quoteBase = z.object({
  client_id: z.number().min(1, 'El cliente es obligatorio'),
  motor_vehicle_id: z.number().nullable().optional(),
  trailer_vehicle_id: z.number().nullable().optional(),
  mileage: z.number().nullable().optional(),
  status: z.enum(['pendiente', 'aprobado', 'rechazado', 'convertido']).optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  validity_days: z.number().min(1, 'La validez debe ser al menos 1 dia').optional(),
})

export const quoteSchema = quoteBase.refine(
  (d) => d.motor_vehicle_id != null || d.trailer_vehicle_id != null,
  { message: 'Se requiere al menos un vehiculo (motor o remolque)', path: ['motor_vehicle_id'] },
).refine(
  (d) => d.motor_vehicle_id == null || (d.mileage != null && d.mileage > 0),
  { message: 'El kilometraje es obligatorio cuando hay vehiculo a motor', path: ['mileage'] },
)

// ---------- Facturas ----------
export const invoiceSchema = z.object({
  client_id: z.number().min(1, 'El cliente es obligatorio'),
  motor_vehicle_id: z.number().nullable().optional(),
  trailer_vehicle_id: z.number().nullable().optional(),
  mileage: z.number().nullable().optional(),
  work_order_id: z.number().nullable().optional(),
  quote_id: z.number().nullable().optional(),
  status: z.enum(['emitida', 'anulada']).optional(),
  notes: z.string().nullable().optional(),
  taxes: z.number().min(0, 'Los impuestos no pueden ser negativos').optional(),
})
