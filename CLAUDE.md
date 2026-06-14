# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Red Talento TP** — a LinkedIn-style platform for Chilean technical-vocational schools (colegios técnico-profesionales). Connects three actors: students, companies, and schools. Full-stack monorepo with a Next.js 14 frontend and a NestJS backend.

## Commands

### Frontend (`frontend/`)

```bash
npm run dev          # Dev server → http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit (no separate test suite exists yet)
```

### Backend (`backend/`)

```bash
npm run start:dev    # Dev server with watch → http://localhost:3001/api
npm run build        # Compile TypeScript
npm run start:prod   # Run compiled dist/main.js
npm run lint         # ESLint --fix
npm run test         # Jest (*.spec.ts files, rootDir: src/)
npm run seed         # Seed database via ts-node src/seed.ts

# TypeORM migrations (production only; dev uses synchronize: true)
npm run migration:generate
npm run migration:run
npm run migration:revert
```

### Environment setup

- Frontend: copy `frontend/.env.example` → `frontend/.env.local`, set `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
- Backend: create `backend/.env` with DB credentials, JWT secrets, and `NODE_ENV=development`
- PostgreSQL: create database `red_talento_tp`; TypeORM `synchronize: true` auto-creates tables in dev

## Architecture

### Frontend — Next.js 14 App Router

Routes are split by actor role, each with its own layout and nav component:

| Route prefix | Actor | Nav component |
|---|---|---|
| `/student/*` | Estudiante | `StudentNav.tsx` |
| `/empresa/*` | Empresa | `EmpresaNav.tsx` |
| `/colegio/*` | Colegio | `ColegioNav.tsx` |
| `/auth/*` | Public | — |
| `/public/*` | Public | — |

**State & data flow:**
- `src/store/auth.store.ts` — Zustand `persist` store: holds `user`, `tokens`, `isAuthenticated`. Tokens are also mirrored to `localStorage` as `access_token` / `refresh_token`.
- `src/lib/api-client.ts` — Axios instance with two interceptors: request attaches JWT from `localStorage`; response handles 401 by calling `/auth/refresh` then retrying. Exports a typed `api` helper (`.get`, `.post`, `.patch`, `.delete`, `.upload`).
- `src/lib/mock-data.ts` — standalone mock layer, drop-in replacement for real API calls, used when backend is unavailable.
- `src/types/index.ts` — 25+ shared TypeScript interfaces for the whole frontend.

### Backend — NestJS modular API

Each feature is an independent NestJS module under `backend/src/`:

| Module | Purpose |
|---|---|
| `auth` | JWT access + refresh tokens, bcrypt passwords, Passport strategies, `@Public` / `@Roles` / `@CurrentUser` decorators |
| `users` | Base `User` entity (id, email, password, role: `student \| empresa \| colegio`) |
| `students` | `StudentProfile`, skills, portfolio evidences, readiness score calculation |
| `companies` | `CompanyProfile` |
| `schools` | `SchoolProfile` |
| `skills` | Add/remove skills, school validation (validated badge) |
| `opportunities` | Job offers CRUD + match score via `MatchService` |
| `match` | Compatibility engine: 70% technical / 30% soft skills weighted score + evidence bonus (max 5 pts), uses `skills-catalog.ts` for normalization and synonym matching |
| `applications` | Apply to offers, pipeline status changes |
| `messages` | Messaging + `chat.gateway.ts` (Socket.io WebSocket gateway) |
| `publications` | Feed posts, stories, likes |
| `media` | Multer file upload (avatar, cover, evidence, publication images) |
| `notifications` | In-app notifications |
| `follows` | Follow/unfollow between actors |
| `health` | Health check endpoint |

**Auth flow:** `JwtAuthGuard` is global (registered in `AuthModule`). Routes opt out with `@Public()`. `RolesGuard` reads the role from the JWT payload (no DB query on each request).

**Database:** TypeORM with `autoLoadEntities: true`. In development, `synchronize: true` updates the schema automatically. The `app.module.ts` has a duplicate `TypeOrmModule.forRoot` (the second one is a static fallback from an earlier iteration) — only the `forRootAsync` block is the active config-driven connection.

## Design System

CSS design tokens in `frontend/src/styles/globals.css` and `frontend/tailwind.config.ts`:
- Primary: `#0056D2` (Deep Blue)
- Display font: Plus Jakarta Sans; body font: Inter
- Surfaces separated by tone (no 1px borders)
- Nav glassmorphism: `backdrop-blur: 20px`
- Shadows tinted with `rgba(0,24,71,0.08)`

## Demo accounts (frontend without backend)

| Role | Email | Password |
|---|---|---|
| Estudiante | matias@colegio.cl | demo123 |
| Empresa | rrhh@techcorp.cl | demo123 |
| Colegio | admin@itm.cl | demo123 |

Swagger docs when backend is running: `http://localhost:3001/api/docs`
