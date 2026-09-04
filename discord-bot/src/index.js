import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { createClient } from "@supabase/supabase-js";
import { processPendingReminders } from "./reminders.js";
import { processPendingBroadcasts } from "./broadcasts.js";

const {
  DISCORD_BOT_TOKEN,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  BOT_SECRET,
  APP_BASE_URL = "http://localhost:3000",
  POLL_INTERVAL_MINUTES = "15",
  BROADCAST_POLL_INTERVAL_SECONDS = "20",
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
      appBaseUrl: APP_BASE_URL,
    }).catch((err) => console.error("Reminder check failed:", err));

  tick();
  setInterval(tick, Number(POLL_INTERVAL_MINUTES) * 60_000);

  const broadcastTick = () =>
    processPendingBroadcasts({
      supabase,
      discordClient,
      botSecret: BOT_SECRET,
    }).catch((err) => console.error("Broadcast check failed:", err));

  broadcastTick();
  setInterval(broadcastTick, Number(BROADCAST_POLL_INTERVAL_SECONDS) * 1000);
});

discordClient.login(DISCORD_BOT_TOKEN);
