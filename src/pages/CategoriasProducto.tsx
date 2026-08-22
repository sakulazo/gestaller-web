// Categorías de producto.

import CategoryManager from '../components/CategoryManager'
import {
  createProductCategory,
  deleteProductCategory,
  listProductCategories,
  restoreProductCategory,
  updateProductCategory,
} from '../services'

export default function CategoriasProducto() {
  return (
    <CategoryManager
      title="Categorías de producto"
      queryKey="product-categories"
      list={listProductCategories}
      create={createProductCategory}
      update={updateProductCategory}
      remove={deleteProductCategory}
      createPermission="product_categories.create"
      editPermission="product_categories.edit"
      deletePermission="product_categories.delete"
      restore={restoreProductCategory}
    />
  )
}
