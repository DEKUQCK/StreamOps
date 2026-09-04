function formatDate(iso) {
  return new Date(iso).toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function buildReminderMessage(reminder, appBaseUrl) {
  const myEventsUrl = `${appBaseUrl}/dashboard/my-events`;

  if (reminder.reminder_type === "rsvp_pending") {
    const slotLine = reminder.slot_starts_at
      ? ` (Slot: ${formatDate(reminder.slot_starts_at)})`
      : "";
    return (
      `Hey **${reminder.display_name}**! Bitte bestätige oder sage ab für ` +
      `**${reminder.event_name}**${slotLine}.\n` +
      `Melde dich an: ${myEventsUrl}`
    );
  }

  if (reminder.reminder_type === "checklist_due") {
    const dueLine = reminder.due_at
      ? ` (fällig ${formatDate(reminder.due_at)})`
      : "";
    return (
      `Hey **${reminder.display_name}**! Nicht vergessen für ` +
      `**${reminder.event_name}**: ${reminder.description}${dueLine}.\n` +
      `Hak's ab: ${myEventsUrl}`
    );
  }

  throw new Error(`Unknown reminder_type: ${reminder.reminder_type}`);
}

/**
 * Fetches due reminders, DMs each participant, and marks each one sent -
 * one at a time so a single failed DM (bot not sharing a server with that
 * user, DMs disabled, etc.) doesn't block the rest of the batch.
 */
export async function processPendingReminders({ supabase, discordClient, botSecret, appBaseUrl }) {
  const { data: reminders, error } = await supabase.rpc("bot_get_pending_reminders", {
    p_secret: botSecret,
  });

  if (error) {
    console.error("Failed to fetch pending reminders:", error.message);
    return;
  }

  if (!reminders || reminders.length === 0) {
    console.log("No pending reminders.");
    return;
  }

  console.log(`Found ${reminders.length} pending reminder(s).`);

  for (const reminder of reminders) {
    try {
      const user = await discordClient.users.fetch(reminder.discord_user_id);
      await user.send(buildReminderMessage(reminder, appBaseUrl));

      const { error: markError } = await supabase.rpc("bot_mark_reminder_sent", {
        p_secret: botSecret,
        p_event_participant_id: reminder.event_participant_id,
        p_reminder_type: reminder.reminder_type,
        p_checklist_item_id: reminder.checklist_item_id,
      });
      if (markError) {
        console.error(
          `Sent DM but failed to mark reminder sent (event_participant_id=${reminder.event_participant_id}):`,
          markError.message,
        );
        continue;
      }

      console.log(
        `Sent ${reminder.reminder_type} reminder to ${reminder.display_name} (${reminder.discord_user_id}).`,
      );
    } catch (err) {
      console.error(
        `Could not DM ${reminder.display_name} (${reminder.discord_user_id}): ${err.message}. ` +
          "The bot and the participant need to share a Discord server for DMs to work.",
      );
    }
  }
}
