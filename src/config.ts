function parsePollInterval(raw: string | undefined): number {
  const parsed = parseInt(raw || "300", 10);
  if (!Number.isFinite(parsed) || parsed < 10) {
    console.warn(
      `Invalid POLL_INTERVAL "${raw}", falling back to 300s`
    );
    return 300;
  }
  return parsed;
}

export const config = {
  // RSS feed for @ClaudeAI tweets — uses RSSHub by default.
  // Swap this URL if your RSSHub instance differs or you prefer another source.
  rssFeedUrl: process.env.RSS_FEED_URL || "",

  // Slack incoming webhook URL — required
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || "",

  // How often to poll (in seconds)
  pollInterval: parsePollInterval(process.env.POLL_INTERVAL),
};
