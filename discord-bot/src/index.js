import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { createClient } from "@supabase/supabase-js";
import { processPendingReminders } from "./reminders.js";

const {
  DISCORD_BOT_TOKEN,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  BOT_SECRET,
  PORTAL_BASE_URL = "http://localhost:3000",
  POLL_INTERVAL_MINUTES = "15",
} = process.env;

for (const [name, value] of Object.entries({
  DISCORD_BOT_TOKEN,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  BOT_SECRET,
})) {
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds],
});

discordClient.once("clientReady", () => {
  console.log(`Logged in as ${discordClient.user.tag}.`);

  const tick = () =>
    processPendingReminders({
      supabase,
      discordClient,
      botSecret: BOT_SECRET,
      portalBaseUrl: PORTAL_BASE_URL,
    }).catch((err) => console.error("Reminder check failed:", err));

  tick();
  setInterval(tick, Number(POLL_INTERVAL_MINUTES) * 60_000);
});

discordClient.login(DISCORD_BOT_TOKEN);
