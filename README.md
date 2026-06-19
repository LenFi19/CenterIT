# CenterIT

CenterIT ist ein schlankes, self-hosted Homelab-Dashboard auf Basis von Next.js, TypeScript, Tailwind, ShadCN-UI-Komponenten, Prisma und SQLite.

## Features

- Responsive Dashboard in Kachelansicht
- Suche und Favoritenbereich
- Kategorien und Sortierung
- Statusprüfung (alle 30 Sekunden)
- Rollenlogik (Gast/Admin)
- Service-REST-API
- Docker-Setup

## Entwicklung

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## API

- `GET /api/services`
- `POST /api/services`
- `PUT /api/services/[id]`
- `DELETE /api/services/[id]`

Schreibzugriffe benötigen `x-centerit-admin-token: <CENTERIT_ADMIN_TOKEN>` oder eine aktive Admin-Session.
Die Admin-Ansicht im Dashboard wird über die Token-Eingabe im Header aktiviert (ohne Token in der URL).

## Docker

```bash
docker compose up -d --build
```

Danach ist die Anwendung unter `http://localhost:3000` erreichbar.
