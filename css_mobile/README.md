# ASR CSS Mobile

React Native (Expo) enterprise app for the ASR CSS Management System.

## Architecture

Feature-based architecture with a shared module:

```text
src/
├── app/           # navigation, providers, store, App.tsx
├── shared/        # reusable UI, theme, services, utils
├── features/      # auth, dashboard, company, individual, ...
└── assets/        # images, icons, fonts
```

Path aliases:

- `@/shared/*`
- `@/features/*`
- `@/app/*`
- `@/assets/*`

## Setup

```bash
cd css_mobile
npm install
cp .env.example .env
```

## Run

```bash
npm start
npm run ios
npm run android
npm run web
```

## Scripts

```bash
npm run typecheck
npm run lint
npm run format
```

## State Management

- **Local state**: forms, modals, tabs, filters
- **Redux Toolkit**: auth, user profile, permissions, theme
- **TanStack Query**: API calls, caching, mutations

## Default Login (dev)

| Field | Value |
|-------|-------|
| Port Number | `1001` |
| Email | `admin@example.com` |
| Password | `123456` |

## API

Set `EXPO_PUBLIC_API_URL` in `.env` (default: `http://localhost:5002`).

See `MOBILE_SCREEN_SPEC.md` for full screen documentation.
