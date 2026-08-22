// Configuración de rutas de la aplicación.

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider, emitToast } from './components/Toast'
import { toApplicationError } from './types/errors'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import RequirePermission from './components/RequirePermission'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Vehiculos from './pages/Vehiculos'
import CategoriasVehiculo from './pages/CategoriasVehiculo'
import Servicios from './pages/Servicios'
import CategoriasServicio from './pages/CategoriasServicio'
import Ordenes from './pages/Ordenes'
import Presupuestos from './pages/Presupuestos'
import Facturas from './pages/Facturas'
import Productos from './pages/Productos'
import CategoriasProducto from './pages/CategoriasProducto'
import Proveedores from './pages/Proveedores'
import Inventario from './pages/Inventario'
import Usuarios from './pages/Usuarios'
import Roles from './pages/Roles'
import Reportes from './pages/Reportes'
import Datos from './pages/Datos'
import NotFound from './pages/NotFound'

// Los errores de las queries (listados) se notifican de forma global:
// un fallo de red o un 500 nunca debe parecer una lista vacía.
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      emitToast('error', toApplicationError(error).message)
    },
  }),
})

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clients" element={<RequirePermission module="/clients"><Clientes /></RequirePermission>} />
                  <Route path="/vehicles" element={<RequirePermission module="/vehicles"><Vehiculos /></RequirePermission>} />
                  <Route path="/vehicle-categories" element={<RequirePermission module="/vehicle-categories"><CategoriasVehiculo /></RequirePermission>} />
                  <Route path="/services" element={<RequirePermission module="/services"><Servicios /></RequirePermission>} />
                  <Route path="/service-categories" element={<RequirePermission module="/service-categories"><CategoriasServicio /></RequirePermission>} />
                  <Route path="/work-orders" element={<RequirePermission module="/work-orders"><Ordenes /></RequirePermission>} />
                  <Route path="/quotes" element={<RequirePermission module="/quotes"><Presupuestos /></RequirePermission>} />
                  <Route path="/invoices" element={<RequirePermission module="/invoices"><Facturas /></RequirePermission>} />
                  <Route path="/products" element={<RequirePermission module="/products"><Productos /></RequirePermission>} />
                  <Route path="/product-categories" element={<RequirePermission module="/product-categories"><CategoriasProducto /></RequirePermission>} />
                  <Route path="/providers" element={<RequirePermission module="/providers"><Proveedores /></RequirePermission>} />
                  <Route path="/inventory" element={<RequirePermission module="/inventory"><Inventario /></RequirePermission>} />
                  <Route path="/users" element={<RequirePermission module="/users"><Usuarios /></RequirePermission>} />
                  <Route path="/roles" element={<RequirePermission module="/roles"><Roles /></RequirePermission>} />
                  <Route path="/reports" element={<RequirePermission module="/reports"><Reportes /></RequirePermission>} />
                  <Route path="/data" element={<RequirePermission module="/data"><Datos /></RequirePermission>} />
                  <Route path="/clientes" element={<Navigate to="/clients" replace />} />
                  <Route path="/vehiculos" element={<Navigate to="/vehicles" replace />} />
                  <Route path="/categorias-vehiculo" element={<Navigate to="/vehicle-categories" replace />} />
                  <Route path="/servicios" element={<Navigate to="/services" replace />} />
                  <Route path="/categorias-servicio" element={<Navigate to="/service-categories" replace />} />
                  <Route path="/ordenes" element={<Navigate to="/work-orders" replace />} />
                  <Route path="/presupuestos" element={<Navigate to="/quotes" replace />} />
                  <Route path="/facturas" element={<Navigate to="/invoices" replace />} />
                  <Route path="/recambios" element={<Navigate to="/products" replace />} />
                  <Route path="/categorias-producto" element={<Navigate to="/product-categories" replace />} />
                  <Route path="/proveedores" element={<Navigate to="/providers" replace />} />
                  <Route path="/inventario" element={<Navigate to="/inventory" replace />} />
                  <Route path="/usuarios" element={<Navigate to="/users" replace />} />
                  <Route path="/reportes" element={<Navigate to="/reports" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
