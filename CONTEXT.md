# Glosario del Dominio — American Advisor Inspection

## Hallazgo (Finding)

Una no-conformidad, defecto u observación detectada durante la ejecución de una Inspección. Un Hallazgo siempre pertenece a una Inspección específica.

## Responsable del Hallazgo

El contacto del Cliente que debe ejecutar la corrección del equipo o proceso defectuoso. American Advisor detecta y reporta — no ejecuta las correcciones. El Responsable es externo al sistema y se registra como texto libre (nombre/referencia del cliente).

## Acción Correctiva

La descripción de qué debe hacerse (o se hizo) para resolver el Hallazgo. Texto libre. La empresa auditada tiene 30 días desde la fecha de la Inspección para ejecutar la corrección.

## Plazo de Corrección

El período de 30 días desde la fecha de la Inspección dentro del cual la empresa auditada debe corregir el Hallazgo. Vencido el plazo sin corrección, el Hallazgo queda vencido.

## Historial del Hallazgo

Registro cronológico de cada transición de estado de un Hallazgo. Cada entrada registra: estado anterior, estado nuevo, usuario que realizó el cambio, fecha y nota opcional. La nota es obligatoria solo al pasar a `RESOLVED` o `CLOSED`.

## Estado del Hallazgo

Ciclo de vida de un Hallazgo. Los supervisores/admins pueden transicionar a cualquier estado (incluyendo reabrir). Los inspectores solo pueden avanzar, no retroceder.

- `OPEN` — detectado, sin asignar
- `IN_REVIEW` — bajo análisis, responsable asignado
- `CORRECTIVE_ACTION` — acción correctiva en curso
- `RESOLVED` — acción ejecutada, pendiente de cierre formal (nota obligatoria)
- `CLOSED` — cerrado definitivamente (nota obligatoria)

## Severidad del Hallazgo

Clasificación del impacto del Hallazgo: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. Definida al crear el Hallazgo, puede editarse por supervisor/admin.

## Inspector

Usuario con rol `inspector`. Ejecuta Inspecciones en campo y detecta Hallazgos. No puede asignar Hallazgos ni retroceder su estado.

## Supervisor

Usuario con rol `supervisor`. Revisa Inspecciones, aprueba o devuelve, asigna Responsables a Hallazgos y controla el ciclo de vida completo.

## Inspección

Proceso de evaluación de un Equipo siguiendo una Plantilla de preguntas. Tiene un ciclo de vida propio: `NOT_STARTED → IN_PROGRESS → SUBMITTED → APPROVED | RETURNED`.

## Transición

Cambio de Estado de una entidad (Hallazgo, Inspección, Orden de Trabajo). Cada entidad tiene su propio conjunto de Transiciones permitidas según el Estado actual y el rol del usuario.

## Acción Disponible

Una Transición que un usuario concreto puede ejecutar ahora mismo, dado el Estado actual, su rol y —cuando aplica— si es el dueño de la entidad. Es lo que decide qué botones/opciones muestra la UI. Las reglas viven en un único módulo por entidad (`lib/transitions/*`), no dispersas en las pantallas. Una Acción puede requerir una nota obligatoria (ej. resolver/cerrar un Hallazgo). La fuente de verdad última es el backend; el módulo del frontend refleja la regla para gobernar la UI.
