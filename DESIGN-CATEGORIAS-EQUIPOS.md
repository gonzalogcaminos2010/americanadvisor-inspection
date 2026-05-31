# Rediseño — Flujo de Categorías, Equipos y Plantillas

**Fecha:** 2026-05-30
**Estado:** Diseño aprobado, listo para implementación.
**Autor:** Sesión de diseño Gonzalo + Claude (grill-me).

---

## 1. Contexto y objetivo

### 1.1 Problemas detectados con el cliente

| Código | Problema | Origen |
|---|---|---|
| **A** | El inspector escribe marca/modelo/chasis/etc. **en el preliminar de papel** al final de la inspección, porque el sistema actual no le pide esos datos durante la inspección. | El equipment en el sistema queda incompleto; los datos sólo viven en el PDF firmado. |
| **B** | A veces el inspector va al sitio sabiendo sólo *"hay que inspeccionar un generador / una camioneta"* — no qué unidad concreta. La oficina no puede pre-cargar el `Equipment` específico. | Hoy `work_order_items.equipment_id` es `NOT NULL`, forzando a inventar equipos placeholder en la oficina. |
| **C** | Los **campos que describen un equipo dependen de su categoría**: livianos/pesados necesitan transmisión, tara, carga máx, chasis; perforadoras LF90 necesitan torre/profundidad/etc.; hidrogrúas otra cosa. La ficha "talla única" no encaja. | `equipments` tiene columnas fijas + JSON libre — sin esquema por categoría. |

### 1.2 Caso de uso del jefe que justifica todo esto

> *"Perforadora LF90 de G&C Andalgalá Perforaciones — ¿cuándo le toca nuevamente inspección?"*

El registry de equipos tiene que ser confiable y consultable: equipo unique por cliente, datos completos, fecha de próxima inspección queryable.

---

## 2. Decisiones tomadas (resumen ejecutivo)

| ID | Decisión | Resumen |
|---|---|---|
| **1** | **Categorías son el eje del modelo**. | Categoría → plantilla + esquema de campos del equipo + intervalo de próxima inspección. |
| **2 (c)** | **Identificación del equipo se llena durante la inspección y se sincroniza al `equipments.metadata` al submit**. | Inspector llena una sola vez. Equipo queda enriquecido. |
| **3 (P2 / W2)** | **WO Item puede crearse sólo con categoría (sin equipo concreto)**, pero implementado vía placeholder en backend (forward-compatible). | Oficina dice "OT para Cliente X: 2 LF90". Backend crea un equipo placeholder transparente. Flutter vieja sigue viendo `equipment_id` siempre. |
| **4 (Q3)** | **Default + override** para plantillas por categoría. | `template_categories.default_template_id` + `templates.category_id`. La oficina puede fijar plantilla o dejar que use la default. |
| **5 (R1)** | **`equipments.category_id` NOT NULL** con migración. | Backfill desde `equipments.type` actual; default categoría `SIN_CLASIFICAR`. |
| **6 (S2)** | **Esquema de campos del equipo vive por categoría**, en tabla aparte `category_equipment_fields`. | Plantilla = checklist; identificación = categoría. Cero drift entre plantillas hermanas. |
| **7 (T2)** | **Hard gate mínimo al iniciar inspección** (sólo `name` + `category_id`). Validación completa al submit. | Inspector arranca rápido; el sistema bloquea el submit si faltan campos `is_required`. |
| **8 (U2)** | **`is_mutable` por campo de identificación**. | Datos de identidad (chasis, dominio, marca, modelo, año, serie) read-only en inspecciones posteriores. Sólo mutables (próxima inspección, observaciones, km) se sobrescriben. Admin puede corregir desde ABM. |
| **9 (V3)** | **`next_inspection_due_at` híbrido**. | Inspector puede entrarla; si no, en el approve se setea = `now() + category.default_inspection_interval_months`. Supervisor puede sobrescribir en approve. Columna real, queryable, indexable. |
| **10 (W2)** | **Backend forward-compatible, frentes a su ritmo**. | Migraciones aditivas. Flutter vieja no rompe. Web sale antes; Flutter migra cuando esté listo. |
| **11 (D2 + P1)** | **Unique constraints `client_id + plate`, `client_id + serial_number`** (parciales, ignorando NULL). **Inspector tiene confianza plena** (sin lockdown de permisos). | Anti-duplicado barato sin UI extra. Permisos de configuración (admin) y operación (inspector). |

---

## 3. Cambios al modelo de datos

### 3.1 Nuevas tablas

#### `category_equipment_fields`

```sql
CREATE TABLE category_equipment_fields (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_category_id BIGINT UNSIGNED NOT NULL,
    key_name VARCHAR(64) NOT NULL,           -- e.g. 'transmision', 'carga_max', 'proxima_inspeccion'
    label VARCHAR(255) NOT NULL,             -- e.g. 'Transmisión (at/m)'
    type ENUM('text','number','date','select','boolean') NOT NULL,
    options JSON NULL,                       -- para type='select'
    unit VARCHAR(32) NULL,                   -- e.g. 'kg', 'm', 'hp'
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_mutable BOOLEAN NOT NULL DEFAULT TRUE, -- false = lock after first capture
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE KEY uq_cat_key (template_category_id, key_name),
    FOREIGN KEY (template_category_id) REFERENCES template_categories(id) ON DELETE CASCADE
);
```

### 3.2 Tablas modificadas

#### `template_categories`

```sql
ALTER TABLE template_categories
    ADD COLUMN default_template_id BIGINT UNSIGNED NULL,
    ADD COLUMN default_inspection_interval_months INT NULL,
    ADD FOREIGN KEY (default_template_id) REFERENCES inspection_templates(id) ON DELETE SET NULL;
```

#### `inspection_templates`

```sql
ALTER TABLE inspection_templates
    ADD COLUMN category_id BIGINT UNSIGNED NULL AFTER vehicle_type,
    ADD FOREIGN KEY (category_id) REFERENCES template_categories(id) ON DELETE RESTRICT;

-- Backfill seeder mapea vehicle_type (string) → category_id (FK):
-- UPDATE inspection_templates t JOIN template_categories c ON c.code = t.vehicle_type SET t.category_id = c.id;
-- Después: hacer category_id NOT NULL en una segunda migración una vez que el seeder cubrió todo.

-- vehicle_type queda como deprecated string por una release. NO se elimina en esta fase.
```

#### `equipments`

```sql
ALTER TABLE equipments
    ADD COLUMN category_id BIGINT UNSIGNED NULL AFTER type,
    ADD COLUMN next_inspection_due_at DATE NULL,
    ADD COLUMN last_inspection_completed_at TIMESTAMP NULL,
    ADD COLUMN last_inspection_id BIGINT UNSIGNED NULL,
    ADD FOREIGN KEY (category_id) REFERENCES template_categories(id) ON DELETE RESTRICT,
    ADD FOREIGN KEY (last_inspection_id) REFERENCES inspections(id) ON DELETE SET NULL,
    ADD INDEX idx_next_due (next_inspection_due_at),
    ADD INDEX idx_last_completed (last_inspection_completed_at);

-- Unique constraints parciales (MySQL 8+: usar generated columns o lógica en app si no soporta)
-- Alternativa: dejar como business rule + validación en app + index normal:
ALTER TABLE equipments
    ADD INDEX idx_client_plate (client_id, plate),
    ADD INDEX idx_client_serial (client_id, serial_number);
-- La validación de unicidad (ignorando NULL) se hace en Equipment::creating / EquipmentController@store.

-- Backfill seeder:
-- 1. Crear categoría SIN_CLASIFICAR si no existe.
-- 2. UPDATE equipments e LEFT JOIN template_categories c ON c.code = e.type SET e.category_id = COALESCE(c.id, (SELECT id FROM template_categories WHERE code='SIN_CLASIFICAR'));
-- 3. Migración final: ALTER equipments MODIFY category_id NOT NULL.

-- type queda como deprecated string por una release.
```

#### `work_order_items` (estrategia W2 — sin breaking)

```sql
ALTER TABLE work_order_items
    ADD COLUMN category_id BIGINT UNSIGNED NULL AFTER equipment_id,
    ADD COLUMN is_equipment_placeholder BOOLEAN NOT NULL DEFAULT FALSE,
    ADD FOREIGN KEY (category_id) REFERENCES template_categories(id) ON DELETE RESTRICT;

-- equipment_id se mantiene NOT NULL en esta fase.
-- Cuando el cliente cree un ítem "sólo categoría", el backend crea un equipo placeholder
-- (Equipment con name='A determinar — CAT_LABEL', category_id seteado, demás campos NULL)
-- y guarda equipment_id apuntando a ese placeholder + is_equipment_placeholder=true.
-- Cuando el inspector resuelve (elige existente o crea uno nuevo), el endpoint swap-ea
-- equipment_id al real y borra el placeholder (o lo marca como resolved).

-- inspection_template_id pasa a NULL-able:
ALTER TABLE work_order_items MODIFY inspection_template_id BIGINT UNSIGNED NULL;
-- Si es NULL al iniciar inspección, se resuelve a category.default_template_id (o el inspector elige).
```

---

## 4. Cambios al backend (Laravel API)

### 4.1 Nuevos endpoints

```
GET    /api/v1/template-categories                        -- listar (con campos default_template, interval, count)
POST   /api/v1/template-categories                        -- crear (admin)
PUT    /api/v1/template-categories/{id}                   -- update (admin)
DELETE /api/v1/template-categories/{id}                   -- soft-delete

GET    /api/v1/template-categories/{id}/equipment-fields  -- listar campos de identificación
POST   /api/v1/template-categories/{id}/equipment-fields  -- crear campo (admin)
PUT    /api/v1/category-equipment-fields/{id}             -- update
DELETE /api/v1/category-equipment-fields/{id}             -- delete

POST   /api/v1/work-order-items/{id}/resolve-equipment    -- inspector resuelve placeholder
       body: { equipment_id?, new_equipment?: { name, ...identificacion_fields } }
       behavior:
         - si trae equipment_id existente → valida que pertenezca al mismo client_id + category_id, swap
         - si trae new_equipment → crea (valida unicidad por plate/serial), swap
         - si era placeholder → borra el placeholder original

POST   /api/v1/inspections/{id}/equipment-data            -- inspector guarda parcial de identificación
       body: { fields: { transmision: 'AT', tara: 1500, ... } }
       behavior: guarda en una tabla intermedia (o en inspection.metadata.equipment_data)
       hasta el submit donde se sincroniza a equipments.metadata.

GET    /api/v1/equipment?next_due_before=YYYY-MM-DD       -- nuevos filtros para dashboards
GET    /api/v1/equipment?category_id=X
```

### 4.2 Endpoints modificados

```
POST /api/v1/work-orders
  - body.items[].equipment_id ahora opcional si trae category_id
  - si llega items[i] sin equipment_id pero con category_id → backend crea placeholder

POST /api/v1/inspections (start)
  - si work_order_item.inspection_template_id es null → resolver = category.default_template_id
  - si tampoco hay default → 422 con mensaje claro
  - body opcional: template_id_override (permite al inspector elegir otra plantilla de la misma categoría)

POST /api/v1/inspections/{id}/submit
  - antes de calcular overall_result/score:
    1. Validar que el ítem tiene equipment_id REAL (no placeholder). Si es placeholder → 422 "Resolver equipo antes de enviar".
    2. Validar que todos los campos is_required de category_equipment_fields tienen valor en inspection.equipment_data (o sus respuestas).
    3. Sincronizar inspection.equipment_data → equipments.metadata: sólo claves nuevas + sólo campos is_mutable=true (las inmutables ya tienen valor o se setean ahora si están vacías).
    4. Si trae next_inspection_due_at en equipment_data → guardar en equipments.next_inspection_due_at.

POST /api/v1/inspections/{id}/approve
  - hook al final (además del actual):
    1. equipments.last_inspection_completed_at = now()
    2. equipments.last_inspection_id = inspection.id
    3. Si equipments.next_inspection_due_at está vacío Y category.default_inspection_interval_months no es null
       → setear next_inspection_due_at = now() + months
    4. Si el body trae { next_inspection_due_at: 'YYYY-MM-DD' } como override del supervisor → ese gana.
```

### 4.3 Hooks / observers

- `Equipment::creating` — validar unicidad parcial `(client_id, plate)` y `(client_id, serial_number)` si no son null. Retornar 422 con el equipo existente que matchea.
- `Inspection::saved` — recalcular percentage progreso si cambian respuestas (ya existe).
- Nuevo middleware/policy `can:manage-categories` (admin) para los endpoints de configuración.

---

## 5. Cambios al panel web (Next.js)

### 5.1 Nuevas pantallas

- **Categorías ABM** (`/categories`):
  - Lista de categorías con counts (templates, equipos).
  - Editor por categoría con tabs:
    - **Configuración**: name, code, default_template_id (select de templates de esa categoría), default_inspection_interval_months.
    - **Campos del equipo**: drag-drop list de `category_equipment_fields` con form inline para agregar/editar (key_name, label, type, options si select, is_required, is_mutable, sort_order).
- **Equipo — vista detalle**: mostrar `next_inspection_due_at` con badge (verde / amarillo / rojo según proximidad) + `last_inspection_completed_at` + link a `last_inspection_id`.
- **Dashboard — widget**: "Equipos con inspección próxima a vencer (30 / 60 / 90 días)" usando el nuevo endpoint con `next_due_before`.

### 5.2 Pantallas modificadas

- **Equipment form**: el bloque "Datos del equipo" se vuelve dinámico — renderiza campos según `equipment.category_id` consultando `category_equipment_fields`. Para los `is_mutable=false` con valor ya cargado, mostrar read-only con icono de candado + tooltip "Sólo editable por admin".
- **Template form**: select `category_id` reemplaza el input libre `vehicle_type`. Mostrar warning "Esta plantilla será la default de [Categoría X]" si está marcada.
- **Work Order form**:
  - En cada ítem, dos modos:
    - **Equipo específico** (igual que hoy): elegir un equipo, plantilla se autocompleta con default de su categoría (override opcional).
    - **Sólo categoría** (nuevo): elegir categoría, plantilla opcional. El sistema crea el placeholder al guardar.
  - Cuando un ítem está como placeholder, se muestra con badge "A definir por el inspector" en el listado de la OT.
- **Inspection detail (supervisor approve)**: el panel de approve incluye un input opcional `next_inspection_due_at` (prefilled con lo que envió el inspector o con el cálculo automático).

### 5.3 Sin cambios

- Findings, certificates, reports, sidebar — todo lo demás sigue igual.
- El informe preliminar (PDF Laravel) sigue funcionando igual; opcionalmente se le agrega la sección con los campos de identificación leyendo de `equipment.metadata` (puede ser fase 2).

---

## 6. **Para el equipo Flutter (american-advisor-flutter)**

> ⚠️ Lea primero las decisiones (sección 2) y el modelo de datos (sección 3). Este resumen no reemplaza el contexto completo del MD.

### 6.1 Compatibilidad — lo importante primero

**La app vieja NO ROMPE**. Las migraciones de la fase 1 son aditivas:

- `work_order_items.equipment_id` se mantiene `NOT NULL`. Para los ítems "sólo categoría" la oficina los crea con un equipo placeholder transparente (la API lo materializa). La app vieja sigue viendo `equipment_id` siempre presente y puede inspeccionar normalmente.
- `equipments.type` y `templates.vehicle_type` siguen vivos como columnas (deprecated). La app puede seguir leyéndolos.
- Todos los endpoints existentes siguen respondiendo igual.

**Conclusión**: la actualización de la app **no es bloqueante** para el rollout de backend+web. Puede salir en una release posterior.

### 6.2 Qué tiene que aprender la app cuando se actualice

#### 6.2.1 Modelo de datos nuevo a parsear

- `Equipment`:
  - `category_id: int` (NOT NULL una vez completada la migración)
  - `next_inspection_due_at: DateTime?`
  - `last_inspection_completed_at: DateTime?`
  - `last_inspection_id: int?`
- `WorkOrderItem`:
  - `category_id: int?` (puede venir sólo categoría)
  - `inspection_template_id: int?` (puede ser null → se resuelve a default)
  - `is_equipment_placeholder: bool` (true → el equipo es un placeholder, el inspector debe resolverlo)
- `InspectionTemplate`:
  - `category_id: int`
- `TemplateCategory`:
  - `default_template_id: int?`
  - `default_inspection_interval_months: int?`
- Nuevo: `CategoryEquipmentField` (key_name, label, type, options, unit, is_required, is_mutable, sort_order).

#### 6.2.2 Nuevo flujo "Iniciar inspección"

Cuando el inspector tap en un ítem para iniciar inspección:

1. **Si `item.is_equipment_placeholder == true`** → mostrar modal **"Resolver equipo"**:
   - Botón "Elegir equipo existente": lista filtrada por `client_id + category_id` (endpoint `GET /equipment?client_id=X&category_id=Y`).
   - Botón "Crear equipo nuevo": form dinámico con los campos de `GET /template-categories/{id}/equipment-fields`. Mínimo requerido: `name` (resto opcional al crear; los `is_required` se validan al submit de la inspección).
   - Llamar `POST /work-order-items/{id}/resolve-equipment` con la elección.
   - Volver a fetch del item con el `equipment_id` resuelto.

2. **Si `item.inspection_template_id == null`** → usar `category.default_template_id`. Si el inspector quiere cambiarla, mostrar selector de templates filtrados por `category_id` (override opcional en el body del POST `/inspections`).

3. **Cargar campos de identificación de la categoría** vía `GET /template-categories/{id}/equipment-fields`.
4. Mostrar tab "Datos del equipo" siempre visible junto al checklist, con:
   - Campos prefilled desde `equipment.metadata`.
   - Campos `is_mutable=false` con valor → read-only (badge "verificado").
   - Campos `is_mutable=false` vacíos → editables esta vez (es la primera captura).
   - Campos `is_mutable=true` → editables siempre.
   - Auto-save de cambios vía `POST /inspections/{id}/equipment-data` (puede ser debounced o al cambiar de tab).

5. El checklist sigue funcionando igual que hoy.

#### 6.2.3 Cambios al submit

- Antes del submit, validar localmente que todos los `is_required` están completos. Si faltan, navegar a tab "Datos del equipo" con highlight de los faltantes.
- El backend bloqueará submit si: placeholder no resuelto + campos `is_required` faltantes.

#### 6.2.4 Próxima inspección

- Mostrar en la pantalla del equipo (si la app tiene una) el `next_inspection_due_at` con color según proximidad.
- En el form de identificación, si la categoría tiene un campo `key_name='proxima_inspeccion'`, ese campo escribe directamente a `equipments.next_inspection_due_at` (no a metadata).

#### 6.2.5 Anti-duplicado al crear equipo en campo

El endpoint `POST /work-order-items/{id}/resolve-equipment` con `new_equipment` puede responder 422 con:
```json
{
  "error": "duplicate_equipment",
  "matched_by": "plate" | "serial_number",
  "existing_equipment": { "id": 123, "name": "Hilux 2020", ... }
}
```

→ La app debe mostrar diálogo: *"Ya existe un equipo con esta patente / chasis: 'Hilux 2020'. ¿Usar el existente o cancelar y revisar el dato?"*. Si confirma "usar existente" → re-llamar con `equipment_id: existing.id` en vez de `new_equipment`.

### 6.3 Patrón offline

- El nuevo flujo "Resolver equipo" requiere conexión (POST que swap-ea equipment_id en el item).
- Si el inspector está offline:
  - Si el ítem tiene equipo concreto (no placeholder) → todo funciona igual que hoy (queue de respuestas offline ya existente).
  - Si el ítem es placeholder → mostrar mensaje "Esta inspección requiere resolver el equipo. Conéctese a internet o pida a la oficina que asigne un equipo concreto."
- La identificación que el inspector llena en la tab "Datos del equipo" se sincroniza como cualquier otro POST (queue offline).

### 6.4 Lista resumida de tareas para el Claude Code de Flutter

1. Parsear nuevos campos en `Equipment`, `WorkOrderItem`, `InspectionTemplate`, `TemplateCategory`. Agregar entidad `CategoryEquipmentField`.
2. Agregar endpoints nuevos en `api_endpoints.dart`:
   - `getEquipmentFields(int categoryId)`
   - `resolveEquipment(int workOrderItemId, ResolveEquipmentRequest)`
   - `saveInspectionEquipmentData(int inspectionId, Map<String, dynamic> fields)`
3. Implementar repositorio + métodos en `inspection_repository.dart` + `equipment_repository.dart`.
4. Pantalla "Resolver equipo" (modal o ruta) — sólo se activa si `item.is_equipment_placeholder == true`.
5. Form dinámico de creación de equipo a partir de `CategoryEquipmentField[]`.
6. Tab "Datos del equipo" en la pantalla de inspección — render dinámico + auto-save.
7. Validación pre-submit de `is_required`.
8. Diálogo de duplicado al recibir 422 `duplicate_equipment`.
9. Vista del equipo (si existe) con badge `next_inspection_due_at`.

---

## 7. Plan de rollout (W2 — backend forward-compatible)

### Fase 1 — Backend (semana 1)

1. PR backend: migraciones + seeders (categoría SIN_CLASIFICAR + backfills) + nuevos endpoints + hooks de submit/approve.
2. **Antes de deploy**: confirmar env vars MySQL persistidas en Easypanel → api → Environment (ver `easypanel-prod-infra` memoria).
3. Deploy manual del servicio `api` en Easypanel (autodeploy off).
4. Smoke test: endpoints nuevos responden, equipos viejos siguen funcionando, app Flutter vieja inicia inspecciones normalmente.

### Fase 2 — Web (semana 1-2, en paralelo)

5. PR web: ABM de categorías, ABM de campos de identificación por categoría, work order form con modo "sólo categoría", equipment form dinámico, dashboard widget.
6. Push a main, autodeploy se encarga.
7. Admin configura categorías iniciales (livianos/pesados, perforadoras LF90, hidrogrúas) con sus campos y defaults.

### Fase 3 — Flutter (semana 3+, sin urgencia)

8. Entregar este MD al Claude Code de `american-advisor-flutter` con el prompt: *"Implementar las tareas de la sección 6.4 de DESIGN-CATEGORIAS-EQUIPOS.md"*.
9. Cuando salga app actualizada, la oficina empieza a usar el modo "sólo categoría" en órdenes nuevas.

### Fase 4 — Cleanup (después)

10. Una vez que toda la flota Flutter está en versión nueva (verificable porque ya no hay inspecciones de la app vieja):
    - Migración para hacer `equipments.category_id NOT NULL` definitivamente (debería estar ya por backfill).
    - Migración para dropear `equipments.type` y `templates.vehicle_type`.
    - Migración para hacer `work_order_items.equipment_id NULLABLE` (eliminar el patrón placeholder) — opcional, ahorra una tabla menos sucia pero no es urgente.
    - Limpiar placeholders huérfanos.

---

## 8. Open questions / fuera de alcance (futuro)

- **Auditoría de cambios en `equipments.metadata`**: no se modela. La auditoría es implícita en las respuestas de cada inspección. Si después se quiere historial formal, agregar `equipment_audit_log`.
- **Diff de cambios al equipo en el approve del supervisor (U3)**: descartado por YAGNI. Reconsiderar si aparece drift.
- **Sugerencia de match por similitud (D3)**: descartado por YAGNI. La unicidad por plate/serial cubre el caso común.
- **Permisos junior_inspector con restricciones (P2)**: descartado por YAGNI. Agregar cuando la empresa crezca.
- **Optimización del PDF del informe preliminar (1.6 MB)**: queda pendiente de un proyecto anterior, no acoplado a este rediseño.
- **Versionado de templates**: no se toca acá. El `version` actual de InspectionTemplate sigue como está.

---

## 9. Anexo — checklist de implementación rápida

- [ ] Backend
  - [ ] Migración: `category_equipment_fields` (nueva).
  - [ ] Migración: `template_categories` (add default_template_id, default_inspection_interval_months).
  - [ ] Migración: `inspection_templates` (add category_id FK).
  - [ ] Migración: `equipments` (add category_id, next_inspection_due_at, last_inspection_completed_at, last_inspection_id, indexes).
  - [ ] Migración: `work_order_items` (add category_id, is_equipment_placeholder, inspection_template_id nullable).
  - [ ] Seeder: categoría `SIN_CLASIFICAR`.
  - [ ] Seeder: backfill equipments.category_id desde type.
  - [ ] Seeder: backfill templates.category_id desde vehicle_type.
  - [ ] Seeder: categorías iniciales (LIVIANO_PESADO, PERFORADORA_LF90, HIDROGRUA, GRUA_ARTICULADA) con sus campos.
  - [ ] Endpoints CRUD categorías + campos.
  - [ ] Endpoint `resolve-equipment`.
  - [ ] Endpoint `equipment-data`.
  - [ ] Hook submit: validar placeholder + is_required + sync metadata + next_due.
  - [ ] Hook approve: setear last_inspection + auto next_due.
  - [ ] Validación unicidad parcial en Equipment::creating.
  - [ ] Tests unitarios + integración de los nuevos endpoints.
- [ ] Web
  - [ ] Páginas `/categories` y subpáginas.
  - [ ] Equipment form dinámico.
  - [ ] Template form con select de categoría.
  - [ ] WO form modo "sólo categoría".
  - [ ] Dashboard widget de próximas inspecciones.
  - [ ] Tests unitarios de los componentes nuevos.
- [ ] Flutter (delegado a otro Claude Code, ver sección 6.4)
- [ ] Cleanup (fase 4)

---

**Fin del documento.** Cualquier ajuste pasarlo por este MD antes de empezar a codear.
