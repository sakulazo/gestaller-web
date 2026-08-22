// Plantillas de roles (lógica pura de UI).

export interface RoleTemplateDef {
  key: string
  label: string
  description: string
  codes: string[]
}

export const ROLE_TEMPLATE_DEFS: RoleTemplateDef[] = [
  {
    key: 'admin',
    label: 'Administrador',
    description: 'Acceso total al sistema',
    codes: ['*'],
  },
  {
    key: 'readonly',
    label: 'Solo lectura',
    description: 'Ver todos los módulos sin modificar',
    codes: ['*.view'],
  },
  {
    key: 'mecanico',
    label: 'Mecánico',
    description: 'Taller: clientes, vehículos, órdenes y presupuestos',
    codes: [
      'clients.view',
      'clients.create',
      'vehicles.view',
      'vehicles.create',
      'vehicle_categories.view',
      'products.view',
      'inventory.view',
      'reports.view',
      'work_orders.view',
      'work_orders.create',
      'work_orders.edit',
      'work_orders.delete',
      'work_orders.complete',
      'quotes.view',
      'quotes.create',
      'quotes.edit',
      'quotes.delete',
      'quotes.convert',
    ],
  },
  {
    key: 'vendedor',
    label: 'Vendedor',
    description: 'Comercial: clientes, presupuestos y facturas',
    codes: [
      'clients.view',
      'clients.create',
      'clients.edit',
      'vehicles.view',
      'vehicles.create',
      'vehicles.edit',
      'services.view',
      'products.view',
      'providers.view',
      'work_orders.view',
      'quotes.view',
      'quotes.create',
      'quotes.edit',
      'quotes.convert',
      'invoices.view',
      'invoices.create',
      'invoices.edit',
      'invoices.void',
      'reports.view',
    ],
  },
]

export function resolveTemplateCodes(key: string, allCodes: string[]): string[] {
  const def = ROLE_TEMPLATE_DEFS.find((t) => t.key === key)
  if (!def) return []
  if (def.codes.includes('*')) return allCodes
  if (def.codes.includes('*.view')) return allCodes.filter((c) => c.endsWith('.view'))
  return def.codes
}
