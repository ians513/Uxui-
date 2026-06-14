# Spec: Vida en pantalla Observar + Endorsements visibles

**Fecha:** 2026-04-15
**Archivos afectados:**
- `frontend/src/app/public/observar/page.tsx`
- `frontend/src/app/student/ver/[userId]/page.tsx`
- `frontend/src/components/ui/SkillPill.tsx`

**Restricción principal:** Cambios incrementales — no romper funcionalidad existente. Solo datos reales, sin mocks ni simulaciones.

---

## Parte 1: `/public/observar` — Animaciones y engagement

### 1.1 Contadores animados en el hero

Los tres números del hero (Activos, Disponibles, Especialidades) arrancan en `0` y cuentan hasta su valor real usando `requestAnimationFrame`.

**Implementación:**
- Hook `useCountUp(target: number, duration = 1200)` dentro del mismo archivo (no extraer a util)
- Solo corre cuando el componente ya tiene los datos del servidor (no durante loading)
- Duración: 1200ms, easing lineal

### 1.2 Podio con animación de entrada

Las tres barras del podio crecen desde altura 0 hasta su altura final al montar el componente.

**Implementación:**
- Estado `podiumVisible: boolean`, empieza en `false`
- `useEffect` con `setTimeout(200ms)` al montar → setea `podiumVisible = true`
- Las barras usan `style={{ height: podiumVisible ? finalHeight : 0 }}` + `transition: height 700ms ease-out`
- Stagger por posición: pos 2 → 0ms delay, pos 1 → 100ms delay, pos 3 → 200ms delay
- El emoji 👑 hace `animate-bounce` una sola vez (se detiene a los 1s)

### 1.3 Cards con scroll-reveal escalonado

Cada card del grid aparece con fade-in + slide-up al entrar en el viewport.

**Implementación:**
- `IntersectionObserver` con `threshold: 0.1` aplicado al contenedor del grid
- Cada card tiene clase inicial `opacity-0 translate-y-4` → al observar, agrega `opacity-100 translate-y-0 transition-all duration-500`
- Stagger: `transition-delay: ${index % 3 * 80}ms` (grupos de 3 columnas, 80ms entre cada una)
- Observer se desconecta después de que todos los elementos son visibles (cleanup)

### 1.4 Card hover expandido con CTA pulsante

Al hacer hover sobre una card, el botón "Regístrate para contactar" cambia de apariencia para llamar más la atención.

**Implementación:**
- La card ya tiene `group` — el botón usa `group-hover:bg-primary group-hover:text-on-primary` (ya existe)
- Agregar: `group-hover:shadow-md group-hover:scale-[1.02]` a la card completa
- El botón agrega `group-hover:animate-pulse` para un pulso suave (solo en hover, se detiene al salir)

---

## Parte 2: `/student/ver/[userId]` — Endorsements visibles + animación

### 2.1 Botón endorse rediseñado

El botón de endorsar pasa de un texto `+1` pequeño a un botón explícito con estado visual claro.

**Diseño del botón:**
```
Estado no endorsado:  [ 👍 Respaldar ]  — borde outline, texto primary
Estado endorsado:     [ ✓ Respaldado ]  — fondo verde claro, texto verde, sin cursor pointer
```

**Implementación:**
- Reemplazar el `<button className="text-[10px] text-primary font-bold ml-1 hover:underline">+1</button>`
- Nuevo botón: `px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all`
- Estado no endorsado: `border-primary/30 text-primary hover:bg-primary-fixed/40 hover:border-primary/60`
- Estado endorsado: `bg-green-50 border-green-300 text-green-700 cursor-default`
- Disabled mientras `endorsedIds` no está cargado (loading state)

### 2.2 Burst de partículas al endorsar

Al hacer clic en "Respaldar", 6 partículas pequeñas explotan desde el centro del botón y desaparecen.

**Implementación:**
- Estado local `burstSkillId: string | null` — qué skill está explotando
- Al llamar `handleEndorse(skillId)`: setear `burstSkillId = skillId`, luego limpiar a los 600ms
- Las partículas se renderizan con `position: absolute` relativas al wrapper del botón
- 6 partículas con ángulos distribuidos en 60° cada una (0°, 60°, 120°, 180°, 240°, 300°)
- CSS keyframe `@keyframes burst-particle`: `transform: translate(dx, dy) scale(0) → scale(1) → scale(0)`, `opacity: 1 → 0`, duración 500ms
- Colores: 3 en `bg-primary`, 3 en `bg-amber-400`, tamaño 6px × 6px, `rounded-full`
- Se definen en `<style jsx>` o como clase global en `globals.css`

### 2.3 Counter flip animation

El número de endorsements sube con una pequeña animación al cambiar.

**Implementación:**
- Estado local `animatingSkillId: string | null`
- Al actualizar el contador, setear `animatingSkillId = skillId`, limpiar a los 300ms
- El span del contador tiene clase condicional: cuando `animatingSkillId === skill.id`, aplica `animate-bounce` (una iteración)

### 2.4 SkillPill — badge de endorsements prominente

El contador de endorsements pasa de `+3` gris pequeño a una pastilla visible.

**Cambio en `SkillPill.tsx`:**
- Condición actual: `{(skill.endorsements ?? 0) > 0 && <span className="text-[9px] font-bold text-outline ml-0.5">+{skill.endorsements}</span>}`
- Nueva: una pastilla `👍 {n}` en color `text-primary bg-primary-fixed/60 border border-primary/20` de `text-[10px]`, solo cuando `endorsements > 0`
- Sin nueva prop — aplica globalmente (el cambio es solo visual, no de comportamiento)

---

## Archivos a modificar

| Archivo | Cambios |
|---|---|
| `frontend/src/app/public/observar/page.tsx` | Hook countUp, podio animado, scroll-reveal en cards, hover CTA |
| `frontend/src/app/student/ver/[userId]/page.tsx` | Botón endorse rediseñado, burst particles, counter flip |
| `frontend/src/components/ui/SkillPill.tsx` | Badge endorsements prominente |

## Lo que NO cambia

- Lógica de negocio (endpoints, handlers)
- Estructura de datos / tipos
- Cualquier otro uso de SkillPill (el badge es visual, no rompe nada)
- Backend — cero cambios

---

## Criterio de éxito

- Las animaciones no bloquean el render — todo funciona igual si JS está lento
- El burst es satisfactorio y no molesta (dura < 600ms)
- Las cards del observar se ven completas incluso sin animación (graceful degradation)
- El botón endorse deja claro su estado (ya endorsado vs disponible) sin ambigüedad
