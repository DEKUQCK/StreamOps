/**
 * "Sofort-Broadcast": unlike the scheduled reminders, this is meant to
 * feel instant, so it's polled on its own much shorter interval
 * (see BROADCAST_POLL_INTERVAL_SECONDS in index.js) independent of the
 * regular reminder check.
 */
export async function processPendingBroadcasts({ supabase, discordClient, botSecret }) {
  const { data: rows, error } = await supabase.rpc("bot_get_pending_broadcasts", {
    p_secret: botSecret,
  });

  if (error) {
    console.error("Failed to fetch pending broadcasts:", error.message);
    return;
  }

  if (!rows || rows.length === 0) return;

  const byBroadcastId = new Map();
  for (const row of rows) {
    if (!byBroadcastId.has(row.broadcast_id)) byBroadcastId.set(row.broadcast_id, []);
    byBroadcastId.get(row.broadcast_id).push(row);
  }

  for (const [broadcastId, recipients] of byBroadcastId) {
    const { event_name: eventName, message } = recipients[0];
    const text = `🚨 **${eventName}**: ${message}`;

    for (const recipient of recipients) {
      try {
        const user = await discordClient.users.fetch(recipient.discord_user_id);
        await user.send(text);
        console.log(
          `Sent broadcast ${broadcastId} to ${recipient.display_name} (${recipient.discord_user_id}).`,
        );
      } catch (err) {
        console.error(
          `Could not DM ${recipient.display_name} (${recipient.discord_user_id}) for broadcast ${broadcastId}: ${err.message}`,
        );
      }
    }

    const { error: markError } = await supabase.rpc("bot_mark_broadcast_sent", {
      p_secret: botSecret,
      p_broadcast_id: broadcastId,
    });
    if (markError) {
      console.error(`Failed to mark broadcast ${broadcastId} sent:`, markError.message);
    }
  }
}
