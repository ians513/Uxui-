# Auditoría y Plan de Implementación — Red Talento TP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir brechas críticas identificadas en la auditoría de rúbrica para maximizar la nota de evaluación.

**Architecture:** NestJS backend + Next.js 14 frontend + PostgreSQL. Sistema de roles (STUDENT/EMPRESA/COLEGIO) con JWT. Módulos: students, schools, companies, skills, opportunities, applications, messages, publications, follows, notifications.

**Tech Stack:** NestJS 10, Next.js 14 App Router, TypeORM, PostgreSQL, TypeScript, Tailwind CSS, Zustand, Axios

---

## FASE 1 — Cumplir rúbrica sí o sí

### Tarea 1.1: Conectar botón "Contactar" con mensajería
**Impacto:** Criterio 2.4 — Contacto empresa-estudiante (CRÍTICO)

**Files:**
- Modify: `frontend/src/app/empresa/buscar-estudiantes/page.tsx:305-310`
- Modify: `frontend/src/components/shared/MessagesLayout.tsx`

- [ ] **Step 1: Agregar onClick al botón "Contactar"**

En `buscar-estudiantes/page.tsx`, el botón actualmente es:
```tsx
<button className="flex items-center gap-1.5 px-4 py-2 rounded-lg editorial-gradient text-on-primary text-sm font-bold hover:opacity-90 transition-opacity">
  <span className="material-symbols-outlined text-[16px]">mail</span>
  Contactar
</button>
```

Cambiar a:
```tsx
<button
  onClick={() => router.push(`/empresa/mensajes?with=${student.userId}`)}
  className="flex items-center gap-1.5 px-4 py-2 rounded-lg editorial-gradient text-on-primary text-sm font-bold hover:opacity-90 transition-opacity"
>
  <span className="material-symbols-outlined text-[16px]">mail</span>
  Contactar
</button>
```

Importar `useRouter` de `next/navigation` al inicio del archivo.

- [ ] **Step 2: Leer param `with` en MessagesLayout para preseleccionar conversación**

En `MessagesLayout.tsx`, agregar después de los useState existentes:
```tsx
const searchParams = useSearchParams()
const withUserId = searchParams.get('with')
```

Agregar `useSearchParams` import de `next/navigation`. Agregar lógica en el useEffect de carga de conversaciones:
```tsx
useEffect(() => {
  if (!isAuthenticated) { setLoadingConvs(false); return }
  api.get<Conversation[]>('/messages/conversations')
    .then(data => {
      const convs = Array.isArray(data) ? data : []
      setConversations(convs)
      // Si viene param ?with=userId, preseleccionar o crear conversación
      if (withUserId) {
        const existing = convs.find(c => c.participantId === withUserId)
        if (existing) {
          loadThread(existing)
        } else {
          // Crear conversación nueva — mostrar panel de nuevo mensaje
          setNewConvUserId(withUserId)
        }
      }
    })
    .catch(() => {})
    .finally(() => setLoadingConvs(false))
}, [isAuthenticated, withUserId])
```

- [ ] **Step 3: Agregar estado `newConvUserId` y panel de nueva conversación**

Agregar estado:
```tsx
const [newConvUserId, setNewConvUserId] = useState<string | null>(null)
```

Si `newConvUserId` está seteado y no hay `selected`, mostrar el chat area con:
- Header: "Nueva conversación"  
- Input listo para escribir mensaje
- Al enviar, llamar `POST /messages` con `receiverId: newConvUserId` y `content: message`
- Después del envío exitoso, recargar conversaciones y seleccionar la nueva

- [ ] **Step 4: Verificar que el flujo funciona end-to-end**

Flujo: Empresa en buscar-estudiantes → clic "Contactar" → redirige a /empresa/mensajes?with=UUID → MessagesLayout carga con ese usuario preseleccionado → empresa puede escribir mensaje → mensaje se guarda via POST /messages → aparece en conversaciones del estudiante.

- [ ] **Step 5: Commit**
```bash
git add frontend/src/app/empresa/buscar-estudiantes/page.tsx frontend/src/components/shared/MessagesLayout.tsx
git commit -m "feat: conectar botón Contactar con mensajería en buscar-estudiantes"
```

---

### Tarea 1.2: Corregir `getPendingValidations` para filtrar por colegio
**Impacto:** Criterio 5 (seguridad) + Criterio 2.5 (funcionalidad)

**Files:**
- Modify: `backend/src/skills/skills.service.ts:90-95`

- [ ] **Step 1: Reemplazar la query de getPendingValidations**

Código actual (líneas 90-95):
```typescript
async getPendingValidations(schoolId: string) {
  return this.skillsRepo.find({
    where: { validationStatus: ValidationStatus.PENDIENTE },
    relations: ['student', 'student.user'],
    order: { createdAt: 'DESC' },
  })
}
```

Reemplazar por:
```typescript
async getPendingValidations(schoolUserId: string) {
  // Solo mostrar validaciones de estudiantes vinculados a este colegio
  const students = await this.studentsRepo.find({
    where: { schoolUserId },
    select: ['id'],
  })
  const studentIds = students.map(s => s.id)
  if (!studentIds.length) return []

  return this.skillsRepo.find({
    where: {
      validationStatus: ValidationStatus.PENDIENTE,
      studentId: In(studentIds),
    },
    relations: ['student', 'student.user'],
    order: { createdAt: 'DESC' },
  })
}
```

- [ ] **Step 2: Importar `In` de TypeORM en skills.service.ts**

Agregar al import existente de typeorm:
```typescript
import { Repository, In } from 'typeorm'
```

- [ ] **Step 3: Verificar que el campo `schoolUserId` en StudentProfile es el userId del colegio**

Confirmar en `student-profile.entity.ts` que `schoolUserId` almacena el `userId` del usuario colegio (no el `id` del SchoolProfile). Sí, en `students.service.ts` línea 67: `schoolUserId` se setea con `schoolUserId` que viene del JWT del colegio = `user.id`.

- [ ] **Step 4: Commit**
```bash
git add backend/src/skills/skills.service.ts
git commit -m "fix: filtrar getPendingValidations solo por estudiantes del colegio solicitante"
```

---

### Tarea 1.3: Badge de notificaciones no leídas en navigación
**Impacto:** Criterio 4 — Usabilidad

**Files:**
- Modify: `frontend/src/components/layout/StudentNav.tsx`
- Modify: `frontend/src/components/layout/EmpresaNav.tsx`  
- Modify: `frontend/src/components/layout/ColegioNav.tsx`

- [ ] **Step 1: Agregar hook de notificaciones a StudentNav**

Leer primero StudentNav para ver su estructura actual, luego agregar:
```tsx
const [unreadCount, setUnreadCount] = useState(0)

useEffect(() => {
  if (!isAuthenticated) return
  const fetchCount = () => {
    api.get<{ count: number }>('/notifications/unread-count')
      .then(data => setUnreadCount(data.count))
      .catch(() => {})
  }
  fetchCount()
  const interval = setInterval(fetchCount, 60_000) // cada 60s
  return () => clearInterval(interval)
}, [isAuthenticated])
```

- [ ] **Step 2: Agregar endpoint `/notifications/unread-count` en backend**

En `notifications.controller.ts`, agregar:
```typescript
@Get('unread-count')
getUnreadCount(@CurrentUser() user: any) {
  return this.notificationsService.getUnreadCount(user.id)
}
```

En `notifications.service.ts`, agregar:
```typescript
async getUnreadCount(userId: string): Promise<{ count: number }> {
  const count = await this.notificationsRepo.count({
    where: { userId, isRead: false },
  })
  return { count }
}
```

- [ ] **Step 3: Mostrar badge en el ícono de notificaciones**

En el nav, donde esté el link de notificaciones, envolver en `relative` y agregar:
```tsx
<div className="relative">
  <Link href="/student/notificaciones">
    <span className="material-symbols-outlined">notifications</span>
  </Link>
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</div>
```

- [ ] **Step 4: Repetir para EmpresaNav y ColegioNav**

## FASE 2 — Subir nota

### Tarea 2.1: Sello del colegio en perfil y CV
**Impacto:** Criterio 2.1, 2.2 — hacer visible y relevante el rol institucional

**Files:**
- Modify: `frontend/src/app/student/perfil/page.tsx`
- Modify: `frontend/src/app/cv/page.tsx`

- [ ] **Step 1: Agregar tarjeta de aval institucional en perfil del estudiante**

En `perfil/page.tsx`, dentro del Profile Header, después del nombre/headline:
```tsx
{student.schoolName && (
  <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200">
    <span className="material-symbols-outlined text-[14px] text-blue-600 icon-filled">verified</span>
    <span className="text-xs font-bold text-blue-700">Avalado por {student.schoolName}</span>
  </div>
)}
```

- [ ] **Step 2: Hacer más prominente el colegio en el CV**

En `cv/page.tsx`, dentro del header stripe del CV, resaltar el colegio con un estilo diferente:
```tsx
{schoolName && (
  <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-white/15 border border-white/30">
    <span className="material-symbols-outlined text-[13px] text-white icon-filled">school</span>
    <span className="text-white text-sm font-bold">Avalado por {schoolName}</span>
  </div>
)}
```

### Tarea 2.2: Match breakdown visual expandido
**Impacto:** Criterio 7 — innovación visible

**Files:**
- Modify: `frontend/src/components/shared/OpportunityCard.tsx`

- [ ] **Step 1: Leer OpportunityCard para ver estructura actual**

- [ ] **Step 2: Agregar tooltip/panel de desglose de match**

Al hacer clic en el badge de matchScore, mostrar un panel expandido con:
```tsx
{showMatchDetail && opp.matchBreakdown && (
  <div className="mt-3 p-4 rounded-xl bg-primary-fixed/20 border border-primary/10">
    <p className="text-xs font-bold text-on-surface mb-2">Desglose de compatibilidad</p>
    <div className="space-y-1.5">
      {/* Habilidades que coinciden */}
      {opp.matchBreakdown.details?.matched?.map(skill => (
        <div key={skill} className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-green-600 icon-filled">check_circle</span>
          <span className="text-xs text-on-surface">{skill}</span>
        </div>
      ))}
      {/* Habilidades que faltan */}
      {opp.matchBreakdown.details?.missing?.map(skill => (
        <div key={skill} className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-outline">radio_button_unchecked</span>
          <span className="text-xs text-outline">{skill} — <em>te falta esta habilidad</em></span>
        </div>
      ))}
    </div>
    {opp.matchBreakdown.tips?.length > 0 && (
      <p className="text-xs text-on-surface-variant mt-2 italic">{opp.matchBreakdown.tips[0]}</p>
    )}
  </div>
)}
```

- [ ] **Step 3: Commit**
---

### Tarea 2.3: Peer Endorsements (Respaldos entre estudiantes)
**Impacto:** Criterio 7 — innovación con sentido contextual  
**Nota:** El campo `endorsements` ya existe en `Skill` entity.

**Files:**
- Modify: `backend/src/skills/skills.service.ts`
- Modify: `backend/src/skills/skills.controller.ts`
- Modify: `frontend/src/app/student/ver/[userId]/page.tsx`

- [ ] **Step 1: Agregar endpoint `POST /skills/:skillId/endorse` en backend**

En `skills.service.ts`:
```typescript
async endorseSkill(viewerUserId: string, skillId: string): Promise<{ endorsements: number }> {
  const skill = await this.skillsRepo.findOne({ where: { id: skillId } })
  if (!skill) throw new NotFoundException('Habilidad no encontrada')
  
  // No auto-endorse
  const ownerProfile = await this.studentsRepo.findOne({ where: { id: skill.studentId } })
  if (ownerProfile?.userId === viewerUserId) throw new ForbiddenException('No puedes respaldarte a ti mismo')
  
  skill.endorsements = (skill.endorsements ?? 0) + 1
  await this.skillsRepo.save(skill)
  return { endorsements: skill.endorsements }
}
```

En `skills.controller.ts`:
```typescript
@Post(':skillId/endorse')
@UseGuards(RolesGuard)
@Roles(UserRole.STUDENT)
@ApiOperation({ summary: 'Respaldar habilidad de otro estudiante' })
endorseSkill(@CurrentUser() user: any, @Param('skillId') skillId: string) {
  return this.skillsService.endorseSkill(user.id, skillId)
}
```

- [ ] **Step 2: Mostrar endorsements en SkillPill**

En `SkillPill.tsx`, si `skill.endorsements > 0`, mostrar badge:
```tsx
{skill.endorsements > 0 && (
  <span className="text-[9px] font-bold text-outline ml-0.5">+{skill.endorsements}</span>
)}
```

- [ ] **Step 3: Botón de endorse en perfil público de estudiante**

En `ver/[userId]/page.tsx`, junto a cada skill mostrar botón "Respaldar" si el viewer no es el owner.

- [ ] **Step 4: Commit**

## FASE 3 — Pulido total

### Tarea 3.1: Botón "Compartir" con clipboard
**File:** `frontend/src/app/student/perfil/page.tsx:153`

```tsx
const handleShare = async () => {
  const url = window.location.href
  await navigator.clipboard.writeText(url)
  // Mostrar toast/feedback temporal
  alert('¡Link copiado al portapapeles!') // o usar un toast
}
```

### Tarea 3.2: Fix README — actualizar estado de media upload

En `README.md`, mover "Upload de archivos" de "Próximos pasos" a "Implementado" y agregar nota sobre cómo funciona.

### Tarea 3.3: Sección "Próximos eventos" — reemplazar por publicaciones del colegio seguido

En `student/inicio/page.tsx`, reemplazar la sección de eventos vacía por:
- Llamar `GET /publications/feed?page=1&limit=3` filtrado por publicaciones del colegio seguido
- O simplemente eliminar la sección si no hay datos

---

## Orden recomendado de ejecución

```
Prioridad absoluta (hace o quiebra la nota):
  1. Tarea 1.2 — Fix validaciones por colegio (30 min)
  2. Tarea 1.1 — Botón Contactar funcional (2h)
  3. Tarea 1.3 — Badge notificaciones (1h)

Alto impacto por tiempo invertido:
  4. Tarea 2.1 — Sello del colegio (30 min)
  5. Tarea 2.2 — Match breakdown (1h)
  6. Tarea 2.3 — Peer endorsements (2h)

Pulido final:
  7. Tarea 3.1 — Compartir con clipboard (15 min)
  8. Tarea 3.2 — Fix README (10 min)
```
