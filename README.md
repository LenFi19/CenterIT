# CenterIT

CenterIT ist ein modernes, self-hosted Homelab-Dashboard auf Basis von **Next.js**, **TypeScript**, **Tailwind CSS**, **Prisma** und **SQLite**.

## Features

- Smartphone-ähnliche Kachelansicht für lokale Dienste
- Suchfunktion und Favoritenbereich
- Kategorien für Dienste (Medien, Infrastruktur, Docker, Smart Home, Entwicklung)
- Statusprüfung der Dienste alle 30 Sekunden (online/offline)
- Rollenlogik (Gast/Admin) inkl. AdminOnly-Services
- Einstellungen für Titel, Logo, Akzentfarbe, Dark Mode und Server-Adresse
- REST-API für Service-Verwaltung
- Docker-Unterstützung für einfache Bereitstellung

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ShadCN-inspirierte UI-Komponenten
- Prisma ORM
- SQLite
- Docker / Docker Compose

## Datenmodell

Prisma-Modelle:

- `Service`
- `Category`
- `Settings`
- `User`

## Schnellstart (lokal)

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Danach ist CenterIT unter `http://localhost:3000` erreichbar.

## REST API

- `GET /api/services`
- `POST /api/services`
- `PUT /api/services/[id]`
- `DELETE /api/services/[id]`

Erweiterte Endpunkte:

- `POST /api/services/status`
- `GET /api/categories`
- `GET /api/settings`
- `PUT /api/settings`

> Schreibende Endpunkte erwarten den Header `x-centerit-role: admin`.

## Docker

```bash
docker compose up --build -d
```

CenterIT läuft danach unter `http://localhost:3000`.

## Projektstruktur

```text
app/
  api/
  settings/
components/
  dashboard/
  ui/
lib/
prisma/
```

## Später geplanter Installer

Langfristig kann ein Installer im Stil von CasaOS ergänzt werden, z. B.:

```bash
curl -fsSL https://install.servdock.io | sh
```

mit anschließendem Zugriff über `http://servdock`.
