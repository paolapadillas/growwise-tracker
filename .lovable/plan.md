
# Agregar Pace promedio al email (area cards)

## Que cambia
En las 4 tarjetas de area del email (Physical, Cognitive, Language, Social), se reemplaza el porcentaje grande (47%) por el Pace promedio del area (ej. 1.2x), y se mueve el porcentaje a un texto secundario.

## Cambio visual

**Antes:**
```text
Physical    47%
[===-----]
30 of 64 milestones
```

**Despues:**
```text
Physical   1.2x
[===-----]
30 of 64 milestones (47%)
```

El valor del Pace usa la misma logica `calculatePace()` que ya existe en la edge function (linea 54). El color del Pace cambia segun el valor (verde si >= 1.0, azul si < 1.0) usando `getPaceColor()` que tambien ya existe.

## Detalles tecnicos

### Archivo: `supabase/functions/send-report-email/index.ts`

Modificar la funcion `areaCard()` (lineas 123-144):

1. Calcular el pace del area usando `a.pace` (ya viene en AreaResult)
2. Cambiar el numero grande de `${a.percentage}%` a `${a.pace}x`
3. Colorear el pace con `getPaceColor(a.pace)`
4. En la linea de milestones, agregar el porcentaje: `30 of 64 milestones (47%)`

Solo se modifica esta funcion. Todo lo demas del email queda igual.
