

# Mejora del Desglose de Assessment Individual

## Problemas Actuales

1. **Ultima Actividad muestra IDs crudos** - El skill_id y milestone_id se muestran como numeros en vez de nombres legibles.
2. **No hay timeline visual** - No se puede ver la secuencia cronologica de eventos del usuario (cuando empezo, cuando respondio cada pregunta, cuando abrio helpers, etc.).
3. **Metricas de tiempo sin contexto visual** - Los 3 bloques de tiempo estan bien pero no comunican si los valores son buenos o malos.
4. **No hay desglose de respuestas individuales** - Solo se ve cuantas respondio por skill, pero no que respondio a cada milestone especifico.
5. **El banner de abandono es muy denso** - Mucha informacion aplanada en texto, dificil de escanear.
6. **No se ve el user agent / dispositivo** - Util para saber si abandonaron en mobile vs desktop.

## Mejoras Propuestas

### 1. Agregar Timeline de Eventos
Mostrar una timeline vertical cronologica con todos los eventos del assessment:
- Inicio del assessment
- Cada respuesta (con el nombre del milestone, que respondio, y cuanto tardo)
- Helpers abiertos
- Navegacion (back/skip)
- Vista del reporte
- Clicks en CTAs
- Evento de salida

Cada entrada con timestamp relativo ("a los 2m 30s") y absoluto.

### 2. Mejorar el Banner de Status
Reorganizar el banner en un grid de mini-KPIs en vez de texto corrido:
- Progreso (X/Y respuestas) con barra
- Duracion total
- Tiempo promedio por pregunta
- Skills completados vs faltantes
- Vio reporte (si/no)
- CTA clicked (si/no)

### 3. Expandir Area Breakdown con Milestones Individuales
Dentro de cada skill, mostrar cada milestone con:
- Texto de la pregunta del milestone
- La respuesta del usuario (si/no) con color
- Tiempo que tardo en responder (si disponible del evento)

### 4. Resolver Nombres en Ultima Actividad
Usar los datos ya cargados de skills para mostrar nombres en vez de IDs en la seccion "Ultima Actividad".

### 5. Agregar Info de Dispositivo
Obtener el user_agent del primer evento y mostrar un badge con el tipo de dispositivo (Mobile/Desktop/Tablet).

### 6. Hacer la Timeline Collapsible
La timeline puede ser larga, asi que se muestra colapsada por defecto con un boton "Ver timeline completa".

---

## Detalles Tecnicos

### Cambios en Edge Function (`analytics-query/index.ts`)
No se necesitan cambios en la edge function. Toda la data necesaria ya se obtiene directamente en el componente via queries a Supabase.

### Cambios en `AssessmentBreakdownDialog.tsx`

1. **Fetch adicional**: Obtener `user_agent` del primer `assessment_event` y los datos de cada milestone (question text) desde la tabla `milestones`.

2. **Timeline component**: Construir una lista cronologica a partir de `allEvents` ya obtenidos, enriquecida con nombres de skills/areas del `skillNameMap`.

3. **Milestone-level breakdown**: Dentro de cada skill en el area breakdown, mostrar cada milestone con su pregunta y respuesta. Cruzar `responses` (que ya tienen `milestone_id`) con los datos de `milestones` para obtener el texto de la pregunta.

4. **Banner rediseñado**: Convertir el banner de texto corrido a un grid de 6 mini-cards con iconos.

5. **Device badge**: Parsear `user_agent` para detectar mobile/desktop/tablet y mostrar un badge junto al nombre del baby.

### Archivos a Modificar

- `src/components/AssessmentBreakdownDialog.tsx` -- Rediseño completo del dialog con timeline, milestone details, device info, y mejor layout del banner.

No se requieren cambios de base de datos ni de edge functions.

