// Categorías de vehículo.

import CategoryManager from '../components/CategoryManager'
import {
  createVehicleCategory,
  deleteVehicleCategory,
  listVehicleCategories,
  restoreVehicleCategory,
  updateVehicleCategory,
} from '../services'

export default function CategoriasVehiculo() {
  return (
    <CategoryManager
      title="Categorías de vehículo"
      queryKey="vehicle-categories"
      list={listVehicleCategories}
      create={createVehicleCategory}
      update={updateVehicleCategory}
      remove={deleteVehicleCategory}
      createPermission="vehicle_categories.create"
      editPermission="vehicle_categories.edit"
      deletePermission="vehicle_categories.delete"
      showSelfPropelled
      restore={restoreVehicleCategory}
    />
  )
}
