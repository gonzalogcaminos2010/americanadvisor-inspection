# Prompt para Backend Laravel - Fase 1: Motor de Inspecciones

## ⚠️ REGLA #1: NO ROMPER LO QUE YA FUNCIONA

El backend ya está en producción y funcionando. Estas son las reglas de seguridad:

1. **NO modificar migraciones existentes.** Solo crear migraciones NUEVAS. La migración para work_orders debe ser un ALTER TABLE que AGREGA la columna template_id, NO recrear la tabla.
2. **NO reemplazar modelos existentes.** El modelo WorkOrder ya existe. Solo AGREGAR el campo `template_id` al array `$fillable` y AGREGAR las nuevas relaciones (`template()`, `inspections()`). No tocar nada de lo que ya tiene.
3. **NO modificar controllers existentes** (ClientController, EquipmentController, etc). Solo crear controllers NUEVOS.
4. **NO modificar rutas existentes.** Solo AGREGAR rutas nuevas al archivo de rutas, sin tocar las que ya están.
5. **NO modificar el formato de respuesta.** Seguir el mismo formato `{ success, data, message }` y `{ success, data, meta, message }` que ya usan los endpoints existentes.
6. **NO correr `migrate:fresh` ni `migrate:refresh`.** Solo `php artisan migrate` para aplicar las nuevas migraciones.
7. **Hacer todo en una rama separada** y probar antes de mergear a producción.

---

## Contexto

Tengo un sistema de inspecciones para una empresa de medicina laboral, higiene y seguridad en San Juan, Argentina (sector minero/industrial). El frontend Next.js ya está construido y hace llamadas a estos endpoints que **aún no existen** en el backend Laravel. Necesito que crees todo lo necesario: migraciones, modelos, controllers, routes, form requests y resources.

El backend Laravel ya existe en producción con estas entidades funcionando:
- **clients** (id, code, name, tax_id, email, phone, address, city, state, country, postal_code, contact_person, contact_phone, contact_email, industry_type, notes, active)
- **equipment** (id, client_id FK, name, equipment_code, description, brand, model, serial_number, location, status ENUM, last_inspection_date, next_inspection_date, notes, active)
- **service_types** (id, name, code, description, active)
- **users** (id, name, email, role, password)
- **inspection_requests** (id, client_id FK, service_type_id FK, request_number, request_date, due_date, status ENUM, priority, amount, currency, description, notes)
- **work_orders** (id, inspection_request_id FK, equipment_id FK, assigned_to FK nullable users, order_number, status ENUM, priority, scheduled_date, started_at, completed_at, notes, findings)

La API usa el prefijo `/api/v1`. Todas las respuestas siguen este formato:

```json
// Respuesta única:
{ "success": true, "data": { ... }, "message": "OK" }

// Respuesta paginada:
{ "success": true, "data": [ ... ], "meta": { "current_page": 1, "last_page": 5, "per_page": 15, "total": 73, "from": 1, "to": 15 }, "message": "OK" }
```

Auth es via Laravel Sanctum con Bearer token.

---

## 1. MIGRACIONES (crear en este orden)

### 1.1 Migración: `create_inspection_templates_table`
```sql
inspection_templates:
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
  name              VARCHAR(255) NOT NULL
  code              VARCHAR(50) NOT NULL UNIQUE
  description       TEXT NULLABLE
  version           VARCHAR(20) NULLABLE DEFAULT '1.0'
  category          VARCHAR(100) NOT NULL
  client_id         BIGINT UNSIGNED NULLABLE (FK → clients.id ON DELETE SET NULL)
  is_active         BOOLEAN DEFAULT true
  created_by        BIGINT UNSIGNED NULLABLE (FK → users.id ON DELETE SET NULL)
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
```
Índices: `category`, `is_active`, `client_id`

### 1.2 Migración: `create_template_sections_table`
```sql
template_sections:
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
  template_id       BIGINT UNSIGNED NOT NULL (FK → inspection_templates.id ON DELETE CASCADE)
  title             VARCHAR(255) NOT NULL
  description       TEXT NULLABLE
  sort_order        INT DEFAULT 0
  is_required       BOOLEAN DEFAULT true
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
```
Índice: `template_id, sort_order`

### 1.3 Migración: `create_template_questions_table`
```sql
template_questions:
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
  section_id        BIGINT UNSIGNED NOT NULL (FK → template_sections.id ON DELETE CASCADE)
  question_text     TEXT NOT NULL
  question_type     VARCHAR(30) NOT NULL  -- valores: text, number, yes_no, multiple_choice, photo, signature, date, rating
  is_required       BOOLEAN DEFAULT false
  sort_order        INT DEFAULT 0
  options           JSON NULLABLE         -- array de strings para multiple_choice, ej: ["Bueno","Regular","Malo"]
  help_text         TEXT NULLABLE
  fail_values       JSON NULLABLE         -- array de strings que indican falla, ej: ["Malo","Crítico"]
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
```
Índice: `section_id, sort_order`

### 1.4 Migración: `create_inspections_table`
```sql
inspections:
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
  work_order_id     BIGINT UNSIGNED NOT NULL (FK → work_orders.id ON DELETE CASCADE)
  template_id       BIGINT UNSIGNED NOT NULL (FK → inspection_templates.id)
  inspector_id      BIGINT UNSIGNED NOT NULL (FK → users.id)
  status            VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED'  -- NOT_STARTED, IN_PROGRESS, COMPLETED, SUBMITTED
  started_at        TIMESTAMP NULLABLE
  completed_at      TIMESTAMP NULLABLE
  gps_latitude      DECIMAL(10,7) NULLABLE
  gps_longitude     DECIMAL(10,7) NULLABLE
  overall_result    VARCHAR(20) NULLABLE  -- PASS, FAIL, NEEDS_REVIEW
  notes             TEXT NULLABLE
  signature_data    LONGTEXT NULLABLE     -- base64 de la firma
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
```
Índices: `work_order_id`, `template_id`, `inspector_id`, `status`

### 1.5 Migración: `create_inspection_answers_table`
```sql
inspection_answers:
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
  inspection_id     BIGINT UNSIGNED NOT NULL (FK → inspections.id ON DELETE CASCADE)
  question_id       BIGINT UNSIGNED NOT NULL (FK → template_questions.id)
  answer_value      TEXT NULLABLE           -- para text, multiple_choice, date
  answer_number     DECIMAL(10,2) NULLABLE  -- para number, rating
  answer_boolean    BOOLEAN NULLABLE        -- para yes_no
  is_flagged        BOOLEAN DEFAULT false   -- true si la respuesta disparó un fail_value
  notes             TEXT NULLABLE
  answered_at       TIMESTAMP NULLABLE
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
```
Índice UNIQUE: `inspection_id, question_id`

### 1.6 Migración: `create_inspection_photos_table`
```sql
inspection_photos:
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
  inspection_id     BIGINT UNSIGNED NOT NULL (FK → inspections.id ON DELETE CASCADE)
  answer_id         BIGINT UNSIGNED NULLABLE (FK → inspection_answers.id ON DELETE SET NULL)
  finding_id        BIGINT UNSIGNED NULLABLE (FK → findings.id ON DELETE SET NULL)
  file_path         VARCHAR(500) NOT NULL
  file_name         VARCHAR(255) NOT NULL
  file_size         BIGINT UNSIGNED NOT NULL
  mime_type         VARCHAR(50) NOT NULL
  caption           VARCHAR(500) NULLABLE
  gps_latitude      DECIMAL(10,7) NULLABLE
  gps_longitude     DECIMAL(10,7) NULLABLE
  taken_at          TIMESTAMP NULLABLE
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
```

### 1.7 Migración: `create_findings_table`
```sql
findings:
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
  inspection_id     BIGINT UNSIGNED NOT NULL (FK → inspections.id ON DELETE CASCADE)
  answer_id         BIGINT UNSIGNED NULLABLE (FK → inspection_answers.id ON DELETE SET NULL)
  title             VARCHAR(255) NOT NULL
  description       TEXT NOT NULL
  severity          VARCHAR(20) NOT NULL    -- LOW, MEDIUM, HIGH, CRITICAL
  status            VARCHAR(30) NOT NULL DEFAULT 'OPEN'  -- OPEN, IN_REVIEW, CORRECTIVE_ACTION, RESOLVED, CLOSED
  corrective_action TEXT NULLABLE
  due_date          DATE NULLABLE
  resolved_at       TIMESTAMP NULLABLE
  resolved_by       BIGINT UNSIGNED NULLABLE (FK → users.id ON DELETE SET NULL)
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
```
Índices: `inspection_id`, `severity`, `status`

### 1.8 Migración: `add_template_id_to_work_orders_table`
**⚠️ Esta es una migración ALTER, NO crear tabla nueva. La tabla work_orders ya existe.**
```php
// En el método up():
Schema::table('work_orders', function (Blueprint $table) {
    $table->foreignId('template_id')->nullable()->constrained('inspection_templates')->nullOnDelete();
});
// En el método down():
Schema::table('work_orders', function (Blueprint $table) {
    $table->dropForeign(['template_id']);
    $table->dropColumn('template_id');
});
```

---

## 2. MODELOS ELOQUENT

### InspectionTemplate
```php
- fillable: name, code, description, version, category, client_id, is_active, created_by
- casts: is_active → boolean, options/fail_values no aplica aquí
- Relaciones:
  - sections(): hasMany(TemplateSection::class, 'template_id')->orderBy('sort_order')
  - client(): belongsTo(Client::class)
  - creator(): belongsTo(User::class, 'created_by')
  - inspections(): hasMany(Inspection::class, 'template_id')
- Atributos appended: sections_count, questions_count
  - sections_count = $this->sections()->count()
  - questions_count = sum de questions de todas las sections
```

### TemplateSection
```php
- fillable: template_id, title, description, sort_order, is_required
- casts: is_required → boolean
- Relaciones:
  - template(): belongsTo(InspectionTemplate::class, 'template_id')
  - questions(): hasMany(TemplateQuestion::class, 'section_id')->orderBy('sort_order')
```

### TemplateQuestion
```php
- fillable: section_id, question_text, question_type, is_required, sort_order, options, help_text, fail_values
- casts: is_required → boolean, options → array, fail_values → array
- Relaciones:
  - section(): belongsTo(TemplateSection::class, 'section_id')
```

### Inspection
```php
- fillable: work_order_id, template_id, inspector_id, status, started_at, completed_at, gps_latitude, gps_longitude, overall_result, notes, signature_data
- casts: started_at → datetime, completed_at → datetime, gps_latitude → float, gps_longitude → float
- Relaciones:
  - workOrder(): belongsTo(WorkOrder::class)
  - template(): belongsTo(InspectionTemplate::class)->with('sections.questions')
  - inspector(): belongsTo(User::class, 'inspector_id')
  - answers(): hasMany(InspectionAnswer::class)
  - photos(): hasMany(InspectionPhoto::class)
  - findings(): hasMany(Finding::class)
```

### InspectionAnswer
```php
- fillable: inspection_id, question_id, answer_value, answer_number, answer_boolean, is_flagged, notes, answered_at
- casts: answer_number → float, answer_boolean → boolean, is_flagged → boolean, answered_at → datetime
- Relaciones:
  - inspection(): belongsTo(Inspection::class)
  - question(): belongsTo(TemplateQuestion::class, 'question_id')
```

### InspectionPhoto
```php
- fillable: inspection_id, answer_id, finding_id, file_path, file_name, file_size, mime_type, caption, gps_latitude, gps_longitude, taken_at
- casts: file_size → integer, taken_at → datetime
- Relaciones:
  - inspection(): belongsTo(Inspection::class)
  - answer(): belongsTo(InspectionAnswer::class)
  - finding(): belongsTo(Finding::class)
```

### Finding
```php
- fillable: inspection_id, answer_id, title, description, severity, status, corrective_action, due_date, resolved_at, resolved_by
- casts: due_date → date, resolved_at → datetime
- Relaciones:
  - inspection(): belongsTo(Inspection::class)
  - answer(): belongsTo(InspectionAnswer::class)
  - resolvedByUser(): belongsTo(User::class, 'resolved_by')
  - photos(): hasMany(InspectionPhoto::class, 'finding_id')
```

### Modificar WorkOrder existente:
**⚠️ NO reescribir el modelo. Solo AGREGAR estas 3 cosas al modelo WorkOrder que ya existe:**
- AGREGAR `'template_id'` al array `$fillable` existente (no reemplazar el array, solo agregar el campo)
- AGREGAR esta relación al modelo: `public function template() { return $this->belongsTo(InspectionTemplate::class); }`
- AGREGAR esta relación al modelo: `public function inspections() { return $this->hasMany(Inspection::class, 'work_order_id'); }`
- **No tocar** ninguna otra propiedad, método o relación existente del modelo

---

## 3. ENDPOINTS API (Routes)

Todos bajo el prefijo `api/v1`, protegidos con `auth:sanctum`.

### 3.1 Templates CRUD

```
GET    /inspection-templates              → InspectionTemplateController@index
POST   /inspection-templates              → InspectionTemplateController@store
GET    /inspection-templates/{id}         → InspectionTemplateController@show
PUT    /inspection-templates/{id}         → InspectionTemplateController@update
DELETE /inspection-templates/{id}         → InspectionTemplateController@destroy
POST   /inspection-templates/{id}/duplicate → InspectionTemplateController@duplicate
```

**GET /inspection-templates** (index):
- Query params: `search` (busca en name, code), `page`, `per_page` (default 15), `category`, `is_active`
- Response: paginada con cada template incluyendo `sections_count` y `questions_count`
- Eager load: NO cargar sections/questions en el listado (solo counts)

**POST /inspection-templates** (store):
- El frontend envía TODO el template de una vez, con sections y questions anidados:
```json
{
  "name": "Inspección Camioneta 4x4",
  "code": "INS-CAM-001",
  "description": "...",
  "version": "1.0",
  "category": "camioneta_4x4",
  "client_id": null,
  "is_active": true,
  "sections": [
    {
      "title": "Estado Exterior",
      "description": "...",
      "sort_order": 0,
      "is_required": true,
      "questions": [
        {
          "question_text": "Estado de carrocería",
          "question_type": "multiple_choice",
          "is_required": true,
          "sort_order": 0,
          "options": ["Bueno", "Regular", "Malo", "Crítico"],
          "help_text": "Verificar abolladuras, óxido, pintura",
          "fail_values": ["Malo", "Crítico"]
        }
      ]
    }
  ]
}
```
- Crear el template, luego crear sections, luego crear questions dentro de cada section
- `created_by` = auth user id
- Retornar el template completo con sections.questions

**GET /inspection-templates/{id}** (show):
- Eager load: `sections.questions` (ordenados por sort_order)
- También cargar `client`, `sections_count`, `questions_count`

**PUT /inspection-templates/{id}** (update):
- Mismo formato que store
- **IMPORTANTE:** El frontend envía el template completo con todas las sections y questions
- Estrategia de sync:
  1. Actualizar campos del template
  2. Para sections: si tiene `id` → update, si no tiene `id` → create, eliminar las que no vinieron
  3. Para questions dentro de cada section: misma lógica (sync por id)
- También acepta update parcial (solo `{ "is_active": false }` para toggle)

**POST /inspection-templates/{id}/duplicate**:
- Clonar el template completo (template + sections + questions)
- Nuevo name = "Copia de {original_name}"
- Nuevo code = "{original_code}-COPY-{timestamp}"
- is_active = false
- Retornar el nuevo template

### 3.2 Inspections

```
POST   /work-orders/{id}/inspections      → InspectionController@store
GET    /inspections                        → InspectionController@index
GET    /inspections/{id}                   → InspectionController@show
POST   /inspections/{id}/answers           → InspectionController@saveAnswers
POST   /inspections/{id}/submit            → InspectionController@submit
POST   /inspections/{id}/photos            → InspectionController@uploadPhoto
POST   /inspections/{id}/findings          → InspectionController@createFinding
```

**POST /work-orders/{workOrderId}/inspections** (crear inspección):
- Body: `{ "template_id": 5 }`
- Crear inspección con:
  - work_order_id = del URL
  - template_id = del body
  - inspector_id = auth user, O assigned_to del work_order
  - status = "IN_PROGRESS"
  - started_at = now()
- Cambiar status del work_order a "IN_PROGRESS" si estaba en "PENDING"
- Retornar la inspección creada con template.sections.questions

**GET /inspections** (index):
- Query params: `search`, `page`, `per_page`, `status` (filtro)
- Eager load: `template` (solo name), `workOrder.equipment` (solo name), `inspector` (solo name)
- Retornar paginado

**GET /inspections/{id}** (show):
- **ESTO ES CRÍTICO.** El frontend depende de que retorne TODO:
  - La inspección con todos sus datos
  - `template` con `sections` con `questions` (todo anidado, ordenado por sort_order)
  - `answers` con la relación `question`
  - `photos`
  - `findings` con `photos`
  - `workOrder` con `equipment`
  - `inspector`
- JSON ejemplo de respuesta:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "work_order_id": 5,
    "template_id": 2,
    "inspector_id": 1,
    "status": "IN_PROGRESS",
    "started_at": "2026-02-18T15:00:00",
    "completed_at": null,
    "gps_latitude": null,
    "gps_longitude": null,
    "overall_result": null,
    "notes": null,
    "signature_data": null,
    "template": {
      "id": 2,
      "name": "Inspección Camioneta 4x4",
      "sections": [
        {
          "id": 10,
          "title": "Estado Exterior",
          "sort_order": 0,
          "is_required": true,
          "questions": [
            {
              "id": 50,
              "question_text": "Estado de carrocería",
              "question_type": "multiple_choice",
              "is_required": true,
              "sort_order": 0,
              "options": ["Bueno", "Regular", "Malo"],
              "fail_values": ["Malo"],
              "help_text": null
            }
          ]
        }
      ]
    },
    "answers": [
      {
        "id": 1,
        "question_id": 50,
        "answer_value": "Bueno",
        "answer_number": null,
        "answer_boolean": null,
        "is_flagged": false,
        "notes": null,
        "question": { "id": 50, "question_text": "Estado de carrocería", "question_type": "multiple_choice" }
      }
    ],
    "photos": [],
    "findings": [],
    "work_order": {
      "id": 5,
      "order_number": "OT-001",
      "equipment": { "id": 3, "name": "Toyota Hilux 2022", "equipment_code": "EQ-003" }
    },
    "inspector": { "id": 1, "name": "Juan Pérez" }
  }
}
```

**POST /inspections/{id}/answers** (guardar respuestas batch):
- Body:
```json
{
  "answers": [
    { "question_id": 50, "answer_value": "Bueno", "is_flagged": false },
    { "question_id": 51, "answer_number": 3.5, "is_flagged": false },
    { "question_id": 52, "answer_boolean": true, "is_flagged": false },
    { "question_id": 53, "answer_value": "Malo", "is_flagged": true, "notes": "Muy dañado" }
  ]
}
```
- Para cada answer: **upsert** por (inspection_id, question_id)
  - Si ya existe → update
  - Si no existe → create
- Setear `answered_at = now()` en cada uno
- Auto-detectar `is_flagged`: si la question tiene `fail_values` y el valor de la respuesta está en fail_values → `is_flagged = true`
- Retornar array de answers guardadas

**POST /inspections/{id}/submit** (finalizar inspección):
- Body: `{ "signature_data": "data:image/png;base64,...", "gps_latitude": -31.5, "gps_longitude": -68.5, "notes": "..." }`
- Calcular `overall_result`:
  - Si alguna answer tiene `is_flagged = true` → "FAIL"
  - Si no → "PASS"
  - (opcionalmente se puede poner "NEEDS_REVIEW" si hay hallazgos abiertos)
- Actualizar inspección:
  - status = "COMPLETED"
  - completed_at = now()
  - signature_data, gps_latitude, gps_longitude, notes = del body
  - overall_result = calculado
- Actualizar work_order: status = "COMPLETED", completed_at = now()
- Retornar la inspección completa

**POST /inspections/{id}/photos** (subir foto):
- Multipart form data: `photo` (file), `answer_id` (optional), `finding_id` (optional), `caption` (optional)
- Guardar archivo en storage (disk público o S3)
- Crear registro en inspection_photos
- Retornar el registro de la foto con file_path como URL accesible

**POST /inspections/{id}/findings** (crear hallazgo):
- Body: `{ "title": "...", "description": "...", "severity": "HIGH", "answer_id": 53, "corrective_action": "...", "due_date": "2026-03-01" }`
- Crear finding con status = "OPEN"
- Retornar el finding creado

### 3.3 Findings CRUD

```
GET    /findings                  → FindingController@index
GET    /findings/{id}             → FindingController@show
PUT    /findings/{id}             → FindingController@update
DELETE /findings/{id}             → FindingController@destroy
```

**GET /findings** (index):
- Query params: `search` (busca en title, description), `page`, `per_page`, `severity`, `status`
- Eager load: `inspection` (para mostrar inspection_id)
- Retornar paginado

**PUT /findings/{id}** (update):
- Body: `{ "title", "description", "severity", "status", "corrective_action", "due_date" }`
- Si status cambia a "RESOLVED" → setear resolved_at = now(), resolved_by = auth user
- Retornar finding actualizado

---

## 4. SEEDER DE EJEMPLO (IMPORTANTE)

Crear un seeder `InspectionTemplateSeeder` con un template de ejemplo real para que cuando se depliegue haya datos visibles:

**Template: "Inspección Camioneta 4x4 - Minería"** (code: INS-CAM-4X4-001, category: camioneta_4x4)

Secciones y preguntas:

1. **Datos Generales**
   - VIN / Número de chasis → text, required
   - Kilometraje actual → number, required
   - Nombre del operador → text, required
   - Fecha último service → date

2. **Estado Exterior**
   - Estado de carrocería → multiple_choice: [Bueno, Regular, Malo, Crítico], fail: [Malo, Crítico], required
   - Estado de vidrios (parabrisas, laterales, trasero) → multiple_choice: [Bueno, Regular, Malo], fail: [Malo], required
   - Estado de espejos retrovisores → multiple_choice: [Bueno, Regular, Malo], fail: [Malo]
   - Foto estado general exterior → photo, required

3. **Motor y Transmisión**
   - Estado general del motor → multiple_choice: [Bueno, Regular, Malo, Crítico], fail: [Malo, Crítico], required
   - Nivel de aceite motor → multiple_choice: [Normal, Bajo, Crítico], fail: [Crítico], required
   - Nivel de refrigerante → multiple_choice: [Normal, Bajo, Crítico], fail: [Crítico]
   - ¿Pérdidas visibles de fluidos? → yes_no, fail: [true (Sí)]
   - Estado de correas → multiple_choice: [Bueno, Desgastado, Dañado], fail: [Dañado]
   - Foto del motor → photo

4. **Sistema de Frenos**
   - Estado de frenos delanteros → multiple_choice: [Bueno, Regular, Malo, Crítico], fail: [Malo, Crítico], required
   - Estado de frenos traseros → multiple_choice: [Bueno, Regular, Malo, Crítico], fail: [Malo, Crítico], required
   - Estado de freno de estacionamiento → multiple_choice: [Funcional, No funcional], fail: [No funcional], required
   - Nivel de líquido de frenos → multiple_choice: [Normal, Bajo, Crítico], fail: [Crítico]

5. **Suspensión y Dirección**
   - Estado de amortiguadores → multiple_choice: [Bueno, Regular, Malo], fail: [Malo], required
   - Estado de dirección → multiple_choice: [Precisa, Con juego, Defectuosa], fail: [Defectuosa], required
   - Estado de rótulas y terminales → multiple_choice: [Bueno, Desgastado, Dañado], fail: [Dañado]

6. **Neumáticos**
   - Estado neumático delantero izquierdo → multiple_choice: [Bueno, Regular, Malo, Crítico], fail: [Malo, Crítico], required
   - Estado neumático delantero derecho → multiple_choice: [Bueno, Regular, Malo, Crítico], fail: [Malo, Crítico], required
   - Estado neumático trasero izquierdo → multiple_choice: [Bueno, Regular, Malo, Crítico], fail: [Malo, Crítico], required
   - Estado neumático trasero derecho → multiple_choice: [Bueno, Regular, Malo, Crítico], fail: [Malo, Crítico], required
   - Estado de rueda de auxilio → multiple_choice: [Bueno, Regular, Malo, Sin auxilio], fail: [Malo, Sin auxilio]
   - Profundidad de banda de rodamiento (mm) → number, help_text: "Mínimo legal: 1.6mm. Recomendado: >3mm"

7. **Sistema Eléctrico**
   - Luces delanteras (bajas y altas) → multiple_choice: [Funcionan, Parcial, No funcionan], fail: [No funcionan], required
   - Luces traseras y de freno → multiple_choice: [Funcionan, Parcial, No funcionan], fail: [No funcionan], required
   - Luces de giro → multiple_choice: [Funcionan, Parcial, No funcionan], fail: [No funcionan]
   - Estado de batería → multiple_choice: [Bueno, Regular, Malo], fail: [Malo]
   - Bocina → multiple_choice: [Funciona, No funciona], fail: [No funciona]

8. **Seguridad**
   - ¿Cinturones de seguridad funcionan? → yes_no, fail: [false (No)], required
   - ¿Extintor presente y vigente? → yes_no, fail: [false (No)], required
   - Fecha vencimiento extintor → date
   - ¿Balizas/triángulos de emergencia? → yes_no, fail: [false (No)], required
   - ¿Botiquín de primeros auxilios? → yes_no, fail: [false (No)]
   - ¿Chaleco reflectante? → yes_no, fail: [false (No)]

9. **Elementos de Emergencia Minería**
   - ¿Radio/comunicación operativa? → yes_no, fail: [false (No)], required
   - ¿Banderín de seguridad? → yes_no, fail: [false (No)]
   - ¿Cono/balizas de estacionamiento? → yes_no, fail: [false (No)]
   - ¿Cuñas para ruedas? → yes_no, fail: [false (No)]
   - ¿Kit antiderrame? → yes_no

10. **Observaciones Generales**
    - Calificación general del vehículo → rating, required
    - Observaciones adicionales → text
    - Foto adicional (si aplica) → photo
    - Firma del inspector → signature, required

**NOTA para el yes_no y fail_values:** En el frontend, yes_no guarda `answer_boolean: true/false`. Para fail_values en yes_no, usar los strings "true" o "false" en el JSON de fail_values. Por ejemplo: si "¿Extintor presente?" fail cuando la respuesta es No (false), entonces fail_values = ["false"]. La lógica de is_flagged debe comparar: `String(answer_boolean)` está en `fail_values`.

---

## 5. RESUMEN DE ARCHIVOS A CREAR

### Migraciones (8):
1. `create_inspection_templates_table`
2. `create_template_sections_table`
3. `create_template_questions_table`
4. `create_inspections_table`
5. `create_inspection_answers_table`
6. `create_inspection_photos_table`
7. `create_findings_table`
8. `add_template_id_to_work_orders_table`

### Modelos (7):
1. `InspectionTemplate`
2. `TemplateSection`
3. `TemplateQuestion`
4. `Inspection`
5. `InspectionAnswer`
6. `InspectionPhoto`
7. `Finding`
+ Modificar `WorkOrder` (agregar template_id, relaciones)

### Controllers (3):
1. `InspectionTemplateController` (index, store, show, update, destroy, duplicate)
2. `InspectionController` (index, show, store, saveAnswers, submit, uploadPhoto, createFinding)
3. `FindingController` (index, show, update, destroy)

### Form Requests (crear los que consideres necesarios para validación)

### API Resources (para formatear respuestas consistentes)

### Routes: agregar al archivo `routes/api.php` dentro del grupo v1

### Seeder: `InspectionTemplateSeeder`

---

## 6. NOTAS CRÍTICAS

1. **El endpoint show de inspections es el más importante.** El frontend carga TODO de una sola llamada (template con sections con questions, answers, photos, findings). Si falta algo, la app se rompe.

2. **El save answers es upsert.** El frontend envía TODAS las respuestas cada vez (no solo la nueva). Usar `updateOrCreate` por `(inspection_id, question_id)`.

3. **El store de templates recibe todo anidado.** Sections y questions vienen dentro del JSON del template. Crear todo en una transacción.

4. **El update de templates necesita sincronizar.** Items con `id` se actualizan, sin `id` se crean, los que no vinieron se eliminan.

5. **Las fotos van como multipart/form-data**, no JSON. El campo se llama `photo`.

6. **El campo `options` y `fail_values` en template_questions son JSON arrays de strings.** Laravel los castea automáticamente con `'options' => 'array'`.

7. **fail_values para yes_no** son strings "true" o "false" (no booleanos), porque así los compara el frontend.

8. **Correr el seeder después de migrar** para que haya un template de ejemplo visible inmediatamente.
