

## Email con Resultados del Assessment

### Resumen
Agregar captura de email en el Step 1 del baby form y crear un edge function que envie automaticamente un email con los resultados del assessment cuando el usuario lo complete. Usaremos **Resend** como servicio de email (gratis hasta 3,000 emails/mes).

### Flujo

```text
Step 1 (BabyForm)          Assessment           Completion
+------------------+    +---------------+    +------------------+
| Name (optional)  | -> | Milestones... | -> | Mark completed   |
| Email (required) |    |               |    | Call edge fn     |
+------------------+    +---------------+    | -> Send email    |
                                              | -> Redirect      |
                                              +------------------+
```

### Cambios necesarios

**1. Agregar campo de email en BabyForm (Step 1)**
- Agregar un input de email debajo del nombre del bebe
- El nombre sigue siendo opcional, pero el email sera requerido
- Validacion basica de formato de email
- Guardar el email en la columna `email` de la tabla `babies` (ya existe)

**2. Crear edge function `send-report-email`**
- Recibe: `assessment_id`, `baby_id`
- Consulta las respuestas del assessment y calcula resultados por area/skill
- Genera un email HTML bonito con:
  - Nombre del bebe y edad
  - Resumen por area (percentil, milestones completados)
  - Un CTA para descargar la app de Kinedu
- Envia el email usando Resend API

**3. Triggear el email al completar el assessment**
- En `AssessmentNew.tsx`, cuando se marca `completed_at`, llamar al edge function antes de redirigir
- Tambien en `handleSkipArea` cuando es la ultima area

### Requisitos

- **API Key de Resend**: Necesitaras crear una cuenta gratuita en [resend.com](https://resend.com) y obtener tu API key. El plan gratis incluye 3,000 emails/mes.
- **Dominio verificado (opcional)**: Sin dominio verificado, los emails se envian desde `onboarding@resend.dev`. Para usar tu propio dominio (ej. `noreply@kinedu.com`) necesitas verificarlo en Resend.

### Seccion tecnica

**BabyForm.tsx**:
- Nuevo state: `parentEmail`
- Input type="email" con validacion zod o nativa
- Se pasa al insert de `babies` en el campo `email`

**Edge function `send-report-email/index.ts`**:
- Lee assessment_responses + babies para obtener datos
- Consulta la base externa para percentiles
- Construye HTML del email con los resultados
- Llama a Resend API (`POST https://api.resend.com/emails`)
- Requiere secret `RESEND_API_KEY`

**AssessmentNew.tsx**:
- Antes de `window.location.href = '...'`, hacer `fetch` al edge function con el assessment_id
- No bloquear la redireccion (fire-and-forget para no hacer esperar al usuario)

