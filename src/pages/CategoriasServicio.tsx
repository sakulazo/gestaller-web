// Categorías de servicio.

import CategoryManager from '../components/CategoryManager'
import {
  createServiceCategory,
  deleteServiceCategory,
  listServiceCategories,
  restoreServiceCategory,
  updateServiceCategory,
} from '../services'

export default function CategoriasServicio() {
  return (
    <CategoryManager
      title="Categorías de servicio"
      queryKey="service-categories"
      list={listServiceCategories}
      create={createServiceCategory}
      update={updateServiceCategory}
      remove={deleteServiceCategory}
      createPermission="service_categories.create"
      editPermission="service_categories.edit"
      deletePermission="service_categories.delete"
      restore={restoreServiceCategory}
    />
  )
}
