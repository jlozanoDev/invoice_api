# API de Gestión de Facturas — Documento de Diseño

## Requisitos

1. **Creación de facturas**: Guardar factura con datos del emisor y del cliente, base imponible e IVA.
2. **Numeración correlativa**: Formato `{prefijo}0001`, `{prefijo}0002`, etc. El prefijo es configurable por el usuario (ej. `BT`, `INV`, `F-`).
3. **Ciclo de vida**: Dos estados — `borrador` y `definitivo`.
   - Al crear, la factura nace en estado `borrador` sin número asignado.
   - Solo se puede eliminar una factura en estado `borrador`.
   - Al confirmar una factura (pasar a `definitivo`), se le asigna el siguiente número correlativo disponible.

## Modelo de datos (Invoice)

| Campo           | Tipo     | Descripción                                    |
|-----------------|----------|------------------------------------------------|
| id              | UUID     | Identificador único                            |
| number          | string?  | Número correlativo (ej. `BT0001`), solo si es definitivo. El prefijo se define en la configuración del sistema |
| status          | enum     | `borrador` \| `definitivo`                     |
| issuer_name     | string   | Razón social del emisor                        |
| issuer_nif      | string   | NIF del emisor                                 |
| issuer_address  | string   | Dirección completa del emisor                  |
| client_name     | string   | Razón social del cliente                       |
| client_cif      | string   | CIF del cliente                                |
| client_address  | string   | Dirección completa del cliente                 |
| issue_date      | date     | Fecha de emisión de la factura                 |
| operation_date  | date     | Fecha de la operación                          |
| description     | string   | Concepto / descripción de la factura           |
| base_amount     | decimal  | Base imponible                                 |
| vat_rate        | decimal  | Tipo de IVA aplicado (ej. 21.00)               |
| vat_amount      | decimal  | Importe del IVA                                |
| total_amount    | decimal  | Base + IVA                                     |
| created_at      | datetime | Fecha de creación                              |
| updated_at      | datetime | Fecha de última modificación                   |

## Endpoints propuestos

### `POST /api/v1/invoices`
Crear una factura en estado `borrador`.

**Body:**
```json
{
  "issuer_name": "Mi Empresa S.L.",
  "issuer_nif": "A12345678",
  "issuer_address": "Calle Mayor 1, 28001 Madrid",
  "client_name": "Cliente S.A.",
  "client_cif": "B12345678",
  "client_address": "Av. Principal 100, 08001 Barcelona",
  "issue_date": "2026-05-25",
  "operation_date": "2026-05-25",
  "description": "Servicios de consultoría - Mayo 2026",
  "base_amount": 100.00,
  "vat_rate": 21.00,
  "vat_amount": 21.00
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "number": null,
  "status": "borrador",
  "issuer_name": "Mi Empresa S.L.",
  "issuer_nif": "A12345678",
  "issuer_address": "Calle Mayor 1, 28001 Madrid",
  "client_name": "Cliente S.A.",
  "client_cif": "B12345678",
  "client_address": "Av. Principal 100, 08001 Barcelona",
  "issue_date": "2026-05-25",
  "operation_date": "2026-05-25",
  "description": "Servicios de consultoría - Mayo 2026",
  "base_amount": 100.00,
  "vat_rate": 21.00,
  "vat_amount": 21.00,
  "total_amount": 121.00,
  "created_at": "...",
  "updated_at": "..."
}
```

---

### `GET /api/v1/invoices`
Listar facturas con filtros opcionales.

**Query parameters:**
| Parámetro      | Tipo     | Descripción                                    |
|----------------|----------|------------------------------------------------|
| status         | string   | Filtrar por estado: `borrador` o `definitivo`  |
| client_cif     | string   | Filtrar por CIF del cliente (búsqueda exacta)  |
| client_name    | string   | Filtrar por razón social del cliente (búsqueda parcial, case-insensitive) |
| issuer_nif     | string   | Filtrar por NIF del emisor                     |
| number         | string   | Filtrar por número de factura (ej. `BT0001`)   |
| description    | string   | Búsqueda parcial en el concepto (case-insensitive) |
| date_from      | date     | Filtrar facturas con `issue_date >=`           |
| date_to        | date     | Filtrar facturas con `issue_date <=`           |
| min_base       | decimal  | Filtrar con `base_amount >=`                   |
| max_base       | decimal  | Filtrar con `base_amount <=`                   |
| min_total      | decimal  | Filtrar con `total_amount >=`                  |
| max_total      | decimal  | Filtrar con `total_amount <=`                  |
| sort_by        | string   | Campo por el que ordenar (ej. `issue_date`, `created_at`, `number`). Por defecto: `created_at` |
| sort_order     | string   | `asc` o `desc`. Por defecto: `desc`            |
| page           | integer  | Número de página (empieza en 1). Por defecto: 1 |
| limit          | integer  | Resultados por página. Por defecto: 20, máximo: 100 |

**Response (200):**
```json
{
  "data": [
    { /* factura */ },
    { /* factura */ }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

---

### `GET /api/v1/invoices/:id`
Obtener una factura por ID.

**Response (200):** Factura.

---

### `PATCH /api/v1/invoices/:id/confirm`
Confirmar factura: pasa a `definitivo` y asigna número correlativo.

Solo válido si la factura está en `borrador`. El número se genera con el prefijo configurado y el siguiente entero tras el último asignado (ej. si el prefijo es `BT` y el último fue `BT0003`, asigna `BT0004`).

**Response (200):** Factura actualizada con `status: "definitivo"` y `number` asignado.

---

### `DELETE /api/v1/invoices/:id`
Eliminar factura. Solo si está en estado `borrador`.

**Response (204):** Sin contenido. Si está en `definitivo`, devolver **409 Conflict**.

---

## Notas

- `total_amount` se calcula automáticamente como `base_amount + vat_amount`.
- `vat_rate` se almacena para dejar constancia del tipo aplicado, pero el cálculo se realiza con `base_amount * (vat_rate / 100)`. En un futuro `vat_amount` podría calcularse automáticamente a partir de `base_amount` y `vat_rate`.
- La numeración debe ser única y correlativa sin huecos. Se recomienda una tabla/contador separado o consultar el último número asignado dentro de una transacción para evitar race conditions.
- El prefijo de numeración se define en la configuración del sistema (variable de entorno o fichero de configuración).
- Los datos del emisor (`issuer_*`) se repiten en cada factura para garantizar la integridad legal aunque los datos fiscales del emisor cambien en el futuro.
