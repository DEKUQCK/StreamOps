# StreamOps Discord Bot

Sendet automatische Erinnerungen per Discord-DM:

- **RSVP-Reminder**: Teilnehmer mit offenem Status ("eingeladen"), deren Slot
  oder Event in den nächsten 48h beginnt.
- **Sponsoren-Checklisten-Reminder**: zugesagte Teilnehmer, die eine
  Sponsoren-Vorgabe noch nicht abgehakt haben und die in den nächsten 2h
  fällig wird.

Jede Erinnerung wird nur einmal verschickt (siehe `reminder_log`-Tabelle).

## Sicherheit

Der Bot bekommt **keinen** `service_role`-Key. Er nutzt denselben
`anon`-Publishable-Key wie die Next.js-App und ruft ausschließlich zwei
eigens dafür angelegte, durch ein Secret geschützte Datenbank-Funktionen
auf: `bot_get_pending_reminders` und `bot_mark_reminder_sent`. Ohne das
korrekte `BOT_SECRET` liefern beide Funktionen einen Fehler.

## Setup

1. **Discord-Bot anlegen**: [Discord Developer Portal](https://discord.com/developers/applications) →
   "New Application" → Tab "Bot" → "Reset Token" (den Token brauchst du
   gleich) → unter "Privileged Gateway Intents" ist nichts Zusätzliches
   nötig.
2. **Bot zum Server einladen**: Tab "OAuth2" → "URL Generator" → Scope
   `bot`, Berechtigung "Send Messages" reicht. Den generierten Link öffnen
   und den Bot auf den Discord-Server der Agentur einladen.
   Wichtig: Discord erlaubt Bots nur DMs an Nutzer, die **mindestens einen
   gemeinsamen Server** mit dem Bot haben – die Streamer müssen also auf
   dem Server sein, auf dem der Bot läuft.
3. **Env-Datei anlegen**:
   ```bash
   cp .env.example .env
   ```
   und ausfüllen:
   - `DISCORD_BOT_TOKEN` – aus Schritt 1
   - `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` – dieselben Werte wie in
     `../.env.local` der Next.js-App
   - `BOT_SECRET` – das Secret, das beim Anlegen der Datenbank generiert
     wurde (nicht im Repo, wird separat weitergegeben)
   - `PORTAL_BASE_URL` – die URL, unter der die StreamOps-App erreichbar
     ist (für lokale Tests `http://localhost:3000`)
4. **Starten**:
   ```bash
   npm install
   npm start
   ```

Der Bot prüft beim Start sofort auf fällige Erinnerungen und danach alle
`POLL_INTERVAL_MINUTES` (Standard: 15) erneut.
