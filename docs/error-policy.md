# Política unificada de errores y validación

## Contrato de errores de la API

Todas las respuestas de error siguen el formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Hay errores en los datos enviados.",
    "fields": {
      "email": "El email no es válido."
    }
  }
}
```

Los campos `code` y `message` son obligatorios. `fields` es opcional y solo aparece cuando hay errores asociados a campos concretos.

## Códigos de error

| Código | HTTP Status | Significado |
|--------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Error de validación (Pydantic o reglas de negocio) |
| `AUTHENTICATION_REQUIRED` | 401 | Credenciales inválidas o token ausente |
| `FORBIDDEN` | 403 | Usuario autenticado sin permisos |
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `CONFLICT` | 409 | Conflicto (duplicado, borrado lógico, estado inválido) |
| `RATE_LIMITED` | 429 | Demasiadas peticiones |
| `INTERNAL_ERROR` | 500 | Error interno del servidor |

## Errores por campo vs errores generales

### Errores de campo (VALIDATION_ERROR con `fields`)

Se muestran **junto al campo** correspondiente, no como Toast.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Hay errores en los datos enviados.",
    "fields": {
      "email": "El email no es válido.",
      "name": "El nombre es obligatorio."
    }
  }
}
```

### Errores generales (sin `fields`)

Se muestran como **Toast** de error.

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "No se ha podido completar la operación."
  }
}
```

### Conflictos con soft-delete (`CONFLICT` + `deleted_id`)

Se muestran como **diálogo de restauración**, no como Toast.

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Ya existe un cliente borrado con ese NIF",
    "fields": {"tax_id": "Ya existe un cliente borrado con ese NIF"},
    "deleted_id": 42
  }
}
```

## Tratamiento por HTTP status

| Status | Comportamiento en frontend |
|--------|---------------------------|
| **401** | Limpia token del localStorage, redirige a `/login` |
| **403** | Se muestra la página `SinAcceso.tsx` (via `RequirePermission`) |
| **404** | Se muestra la página `NotFound.tsx` (via React Router catch-all) |
| **422** | Si tiene `fields`, se muestran junto a los campos. Si no, Toast |
| **409** | Si tiene `deleted_id`, diálogo de restauración. Si no, Toast |
| **500** | Toast con mensaje genérico. Nunca se muestra stack trace |

## Errores de red

Cuando no se puede contactar con el servidor:

```json
{
  "code": "NETWORK_ERROR",
  "message": "No se ha podido conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo."
}
```

Se muestra como Toast.

## Validación frontend (Zod)

Los schemas de validación están en `src/lib/validation.ts`. Se usan para validación de UX antes de enviar a la API.

**La validación del backend siempre es la autoridad definitiva.** El frontend puede validar por debajo o por encima, pero el backend rechazará datos inválidos.

### Flujo

```
Usuario pulsa Guardar
        ↓
Validación Zod (frontend)
        ↓
¿Hay errores?
    Sí → mostrar errores junto al campo (fieldErrors)
    No → enviar a API
        ↓
API responde
        ↓
¿Error?
    Sí →(fields) → errores junto al campo
       → (sin fields) → Toast de error
       → (CONFLICT + deleted_id) → diálogo de restaurar
    No → Toast de éxito
```

## Cómo implementar en una nueva funcionalidad

### 1. Backend: Crear endpoint con errores consistentes

```python
from app.core.exceptions import ConflictError, NotFoundError

@router.post("/items")
def crear_item(data: ItemCreate, db: Session = Depends(get_db)):
    if db.scalar(select(Item).where(Item.name == data.name)):
        raise ConflictError("Ya existe un item con ese nombre", fields={"name": "Ya existe un item con ese nombre"})
    ...
```

### 2. Frontend: Usar useFormMutation

```tsx
import { useFormMutation } from '../hooks/useFormMutation'
import { useToast } from '../components/Toast'
import { itemSchema } from '../lib/validation'
import { FormInput } from '../components/Form'

function MiFormulario() {
  const toast = useToast()
  const { mutate, isPending, fieldErrors } = useFormMutation<Item, ItemInput>({
    mutationFn: createItem,
    schema: itemSchema,
    onSuccess: () => {
      toast.success('Item creado correctamente')
      closeModal()
    },
  })

  return (
    <form noValidate>
      <FormInput name="name" label="Nombre" error={fieldErrors.name} required />
      <button type="submit" disabled={isPending}>Guardar</button>
    </form>
  )
}
```

## Accesibilidad

- Todos los formularios usan `<form noValidate>`
- Los campos con error tienen `aria-invalid="true"`
- Los mensajes de error tienen `role="alert"` y están asociados al campo via `aria-describedby`
- No se depende solo del color para indicar errores
- Los toasts tienen `role="alert"` implícito
