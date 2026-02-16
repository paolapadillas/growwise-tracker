

## Rediseno del Email HTML inspirado en el /report

El email actual es funcional pero basico. Lo vamos a redisenar para que se vea similar al reporte web, adaptado a las limitaciones de HTML para email (sin CSS moderno, todo inline).

### Estructura del nuevo email

1. **Header** - Logo Kinedu + titulo "{babyName}'s Development Report" + edad (igual al actual pero mas limpio)

2. **Snapshot Card** (nuevo) - Tarjeta amarilla/ambar similar a la del reporte web:
   - Titulo: "{babyName}'s Snapshot"
   - Texto: "{babyName} is progressing well overall"
   - Lista de las 2 skills con menor porcentaje (las mas debiles)
   - Mensaje: "The next 60 days are key..."

3. **Development Progress** (mejorado) - Card centrada con el overall pace:
   - Titulo: "Development Progress"
   - Valor grande: "0.8x" con color segun pace
   - Mensaje contextual debajo

4. **Area Cards** (nuevo) - Una card por area (Physical, Cognitive, Linguistic, Socio-Emotional):
   - Nombre del area con su color y pace (ej: "Cognitive - 0.9x")
   - Borde superior de color del area (como el reporte web)
   - Key Skills listados con su porcentaje de avance
   - Skills categorizados en iconos (mastered/on-track/needs-practice)

5. **CTA** - "Start 7-Day Free Trial" con link a Kinedu

6. **Footer** - Copyright

### Datos adicionales necesarios

Para mostrar las skills por area en el email, necesitamos enriquecer la logica del edge function:
- Agrupar responses por `skill_id` ademas de por `area_id`
- Consultar la tabla externa `skills_locales` para obtener nombres de skills (via el external Supabase)
- Calcular pace por area (no solo overall)

Como no podemos conectar al Supabase externo desde el edge function de manera sencilla, usaremos los datos que ya tenemos: agrupar por `skill_id` y usar un mapeo basico de skill names basado en la data disponible en `assessment_responses`.

### Seccion tecnica

**Archivo a modificar:** `supabase/functions/send-report-email/index.ts`

**Cambios principales:**

1. Agregar interface `SkillResult` con `skill_id`, `skill_name`, `area_id`, `mastered`, `total`, `percentage`

2. Agrupar responses por `skill_id` y `area_id` para calcular scores por skill

3. Consultar `skills_locales` del Supabase externo (usando el URL y key del env de kinedu) para obtener nombres de skills -- **alternativa**: como no tenemos acceso al DB externo desde el edge function, usaremos los `skill_id` y buscaremos en una tabla interna o simplemente mostraremos los datos por area sin desglose de skills individuales

4. Calcular pace **por area** usando `calculatePace()` en cada area

5. Reescribir `buildEmailHtml()` con el nuevo layout:
   - Snapshot card con fondo ambar/amarillo
   - Overall pace card con fondo gradiente azul claro
   - Area cards con borde superior de color, titulo "Area - Pace", y listado de skills
   - CTA mejorado

6. Los colores de las areas se actualizan para coincidir con el reporte web:
   - Physical: `#00A3E0` (azul claro)
   - Cognitive: `#00C853` (verde)
   - Linguistic: `#FF8A00` (naranja)
   - Socio-Emotional: `#F06292` (rosa)

**Limitaciones del email HTML:**
- No podemos usar CSS Grid/Flexbox avanzado (usamos tablas)
- No podemos usar gradientes en todos los clientes (fallback a color solido)
- La barra de gauge del pace se simulara con bloques de color en tabla
