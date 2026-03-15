export const config = {
  // RSS feed for @ClaudeAI tweets — uses RSSHub by default.
  // Swap this URL if your RSSHub instance differs or you prefer another source.
  rssFeedUrl: process.env.RSS_FEED_URL || "https://rsshub.app/twitter/user/ClaudeAI",

  // Slack incoming webhook URL — required
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || "",

  // How often to poll (in seconds)
  pollInterval: parseInt(process.env.POLL_INTERVAL || "300", 10),

  // File to track already-posted tweet IDs
  stateFile: process.env.STATE_FILE || "/data/posted.json",
};
