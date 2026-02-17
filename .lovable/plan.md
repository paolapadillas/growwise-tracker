
# Fix: Prevenir emails duplicados

## Problema
El email de reporte se envia multiples veces porque se dispara desde 4 lugares diferentes sin ninguna proteccion contra duplicados:

1. `AssessmentNew.tsx` - al completar assessment (2 code paths)
2. `Report.tsx` - cada vez que se carga la pagina del reporte
3. `Report.tsx` - al hacer unlock con email
4. La edge function no tiene logica de deduplicacion

## Solucion

### 1. Agregar columna `email_sent_at` a la tabla `assessments`
Crear una migracion que agregue una columna para rastrear si ya se envio el email para ese assessment.

```sql
ALTER TABLE assessments ADD COLUMN email_sent_at timestamptz DEFAULT NULL;
```

### 2. Modificar la Edge Function `send-report-email`
Agregar verificacion de deduplicacion al inicio de la funcion:
- Antes de enviar, verificar si `email_sent_at` ya tiene valor para ese assessment
- Si ya se envio, retornar `{ skipped: true, reason: 'already_sent' }` con status 200
- Despues de enviar exitosamente, actualizar `email_sent_at = now()` en el assessment

### 3. Simplificar los disparadores en el frontend
- **AssessmentNew.tsx**: Mantener solo UN disparo al completar (eliminar el duplicado)
- **Report.tsx linea 127**: Mantener el disparo al cargar (Path A), pero ahora es seguro porque la edge function lo deduplica
- **Report.tsx linea 263**: Mantener el disparo del unlock (Path B), tambien seguro con dedup

## Detalles tecnicos

### Migracion SQL
```sql
ALTER TABLE public.assessments 
ADD COLUMN email_sent_at timestamptz DEFAULT NULL;
```

### Edge Function - cambios clave
Al inicio del handler, despues de obtener el assessment:
```typescript
// Check if email already sent for this assessment
if (assessment.email_sent_at) {
  return new Response(JSON.stringify({ 
    skipped: true, 
    reason: 'Email already sent',
    sent_at: assessment.email_sent_at 
  }), {
    status: 200, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
```

Despues de enviar exitosamente via Resend:
```typescript
// Mark email as sent
await supabase
  .from('assessments')
  .update({ email_sent_at: new Date().toISOString() })
  .eq('id', assessment_id)
```

### AssessmentNew.tsx
Eliminar el disparo duplicado - actualmente hay 2 `fetch` identicos al completar assessment (lineas 520 y 576). Consolidar a solo uno.

## Resultado esperado
- Cada assessment recibe maximo 1 email sin importar cuantas veces se cargue el reporte
- El flujo sigue funcionando igual para Path A y Path B
- Si se refresca la pagina, no se reenvia el email
