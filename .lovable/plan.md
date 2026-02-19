
# Integrar registro Kinedu desde el BabyForm

## Resumen

Crear una Edge Function proxy que registre usuarios en Kinedu QA cuando proporcionan nombre y email en el Step 3. Agregar columna `kinedu_registered` en la tabla `babies` para persistir el estado. Condicionar el CTA del Superwall en el Report a ese flag.

## Cambios

### 1. Secreto: KINEDU_STATIC_TOKEN

Almacenar el token estatico JWT como secreto del backend. Tambien agregar `KINEDU_API_BASE_URL` = `https://qa.kinedu.com/api/v6` para facilitar el switch a produccion.

### 2. Migracion: agregar columna `kinedu_registered` a tabla `babies`

```sql
ALTER TABLE public.babies
ADD COLUMN kinedu_registered BOOLEAN DEFAULT FALSE;
```

Se usa `babies` porque ya tiene el email y es la entidad central. Esto permite:
- Consultar el flag desde el Report sin joins adicionales
- Usarlo en la logica de emails de recuperacion (abandoned sessions)
- Trackear tasa de registro en analytics

### 3. Nueva Edge Function: `register-kinedu-user`

**Archivo**: `supabase/functions/register-kinedu-user/index.ts`

Logica:
1. Recibe `{ name, email, baby_id }` del frontend
2. Lee secretos `KINEDU_STATIC_TOKEN` y `KINEDU_API_BASE_URL`
3. POST a `{base_url}/general_projects/create_session/create_auth_token`
   - Intento 1: token como `Authorization: Bearer {token}`
   - Si falla (401/403): Intento 2: token en el body
4. Con el auth token temporal, POST a `{base_url}/general_projects/user_validation` con:
   - `name`: nombre del padre/madre
   - `lastname`: ""
   - `email`: email del form
   - `access_code`: ""
   - `entry_name`: "Lovable_Assessment"
5. Si exitoso: actualiza `babies.kinedu_registered = true` usando service role key
6. Retorna `{ success: true }` o `{ success: false, error: "..." }`

**Config** en `supabase/config.toml`:
```
[functions.register-kinedu-user]
verify_jwt = false
```

### 4. Modificar `src/pages/BabyForm.tsx` (Step 3)

Cambios en el Step 3:
- Agregar campo "Your name" (nombre del padre/madre) arriba del email
- Nuevo state: `parentName`
- Ambos campos son opcionales (si no llenan, pueden hacer Skip)

Al hacer clic en "Continue" con email + nombre:
- Mostrar loading state
- Llamar a la Edge Function `register-kinedu-user` via `supabase.functions.invoke()`
- Si hay error: mostrar toast informativo, continuar sin bloquear
- El registro es no-bloqueante: si falla, el assessment sigue normalmente

### 5. Modificar `src/pages/Report.tsx` y `MobileStickyCta.tsx`

**Report.tsx**: Al cargar el baby, leer `baby.kinedu_registered`.

**MobileStickyCta.tsx**: Recibir prop `kineduRegistered`:
- Si `true`: el CTA dice "Start {babyName}'s Plan -- 7 Days Free" y linkea a `https://kinedu.superwall.app/ia-report`
- Si `false`: mantener el comportamiento actual (link a `https://app.kinedu.com/ia-signuppage/?swc=ia-report`)

No hay auto-redirect. El usuario ve sus resultados normalmente y decide si hace clic en el CTA.

## Flujo del usuario

```text
Step 1: Baby name (sin cambios)
Step 2: Birthday (sin cambios)
Step 3: "Your name" + "Email"
        --> Si llena ambos y hace Continue:
            Edge Function registra en Kinedu (background)
            babies.kinedu_registered = true
        --> Si hace Skip:
            No se registra, kinedu_registered = false
Step 4: Area selection (sin cambios)
Assessment...
Report: CTA bottom apunta a Superwall si kinedu_registered=true
```

## Seccion tecnica

### Edge Function: Estrategia de autenticacion con retry

```text
1. POST create_auth_token con Bearer header
   |
   +--> 200 OK? --> extraer token --> continuar
   |
   +--> 401/403? --> reintentar con token en body
                     |
                     +--> 200 OK? --> extraer token --> continuar
                     |
                     +--> Error? --> retornar error al frontend
```

### Manejo de errores
- Email ya existe en Kinedu: toast "Account already exists", continuar flujo, marcar kinedu_registered=true
- Error de red/API: toast generico, continuar flujo, kinedu_registered=false
- El registro en Kinedu NUNCA bloquea el assessment

### RLS
La columna `kinedu_registered` hereda las politicas existentes de `babies` (SELECT para unclaimed o propias, UPDATE para propias o unclaimed). La Edge Function usa service role key para el update, asi que no hay problema de permisos.
