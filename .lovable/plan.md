

## Tres cambios en AreaSummary

### 1. Rank sin bold
Cambiar el texto del porcentaje de `text-xl font-extrabold` a `text-xl font-semibold` en la columna Rank.

### 2. "Recommended Activities" mas chiquito y bonito
Reducir el texto del boton colapsable de `text-sm font-semibold` a `text-xs font-medium`, y acortar el texto a solo "Recommended Activity".

### 3. Arreglar la grafica MiniPaceGauge
El problema visual es que el arco del SVG tiene "blobs" en los extremos. Se va a:
- Ajustar el `centerY` para que el arco se dibuje correctamente dentro del viewBox
- Usar `strokeLinecap="butt"` en el fondo para evitar artefactos
- Incrementar ligeramente el tamaño para mejor legibilidad

### Archivo a editar
- `src/components/assessment/AreaSummary.tsx` (linea 300 para Rank, linea 18-51 para gauge)
- `src/components/AreaActivityRecommendation.tsx` (linea 74-79 para el texto)

