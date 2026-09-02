# StreamOps

Event-Management-Dashboard für Creator-Agenturen: Kalender & Slot-Buchung,
rollenbasierter Asset-Tresor, Sponsoren-Checklisten und ein sicherer
"Stream-Proof" Info-Hub für Teilnehmer ohne eigenen Account.

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase
(Postgres, Auth, RLS).

## Setup

```bash
npm install
cp .env.example .env.local   # mit den Werten aus dem Supabase-Projekt füllen
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

## Datenbank

Das Schema liegt unter `supabase/migrations/`. Organizer-Zugriff läuft über
Supabase Auth + Row-Level-Security (Mitgliedschaft in `organization_members`).
Teilnehmer ohne Login greifen ausschließlich über ihren persönlichen
Magic-Link (`/portal/[token]`) und dedizierte `security definer`-RPCs
(`get_participant_portal`, `set_rsvp_status`, `complete_checklist_item`) zu –
keine Tabelle ist für die `anon`-Rolle direkt lesbar.
