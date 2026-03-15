import Parser from "rss-parser";
import { config } from "./config";

const parser = new Parser();
const startedAt = new Date();
const posted = new Set<string>();

// --- Slack ---

async function postToSlack(text: string, link: string): Promise<void> {
  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New from <https://x.com/ClaudeAI|@ClaudeAI>*\n\n${text}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View on X" },
            url: link,
          },
        ],
      },
    ],
  };

  const res = await fetch(config.slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook failed: ${res.status} ${await res.text()}`);
  }
}

// --- Main loop ---

async function poll(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Polling ${config.rssFeedUrl}`);

  let feed;

  try {
    feed = await parser.parseURL(config.rssFeedUrl);
  } catch (err) {
    console.error("Failed to fetch RSS feed:", err);
    return;
  }

  // Process oldest-first so Slack gets them in chronological order
  const items = (feed.items || []).reverse();
  let newCount = 0;

  for (const item of items) {
    const id = item.guid || item.link || item.title || "";
    if (!id || posted.has(id)) continue;

    // Skip items published before the bot came online
    const pubDate = item.pubDate ? new Date(item.pubDate) : null;
    if (!pubDate || pubDate < startedAt) {
      posted.add(id);
      continue;
    }

    const text = item.contentSnippet || item.title || "(no content)";
    const link = item.link || `https://x.com/ClaudeAI`;

    try {
      await postToSlack(text, link);
      console.log(`  Posted: ${text.slice(0, 80)}...`);
      posted.add(id);
      newCount++;
    } catch (err) {
      console.error(`  Failed to post to Slack:`, err);
    }
  }

  console.log(`  ${newCount} new tweet(s) posted, ${posted.size} total tracked.`);
}

// --- Entry point ---

let polling = false;
let shuttingDown = false;
let timer: ReturnType<typeof setTimeout> | null = null;

async function scheduledPoll(): Promise<void> {
  if (polling || shuttingDown) return;
  polling = true;
  try {
    await poll();
  } finally {
    polling = false;
    if (!shuttingDown) {
      timer = setTimeout(scheduledPoll, config.pollInterval * 1000);
    }
  }
}

function shutdown(signal: string): void {
  console.log(`\n${signal} received, shutting down gracefully...`);
  shuttingDown = true;
  if (timer) clearTimeout(timer);
  if (!polling) process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

async function main(): Promise<void> {
  if (!config.rssFeedUrl) {
    console.error("RSS_FEED_URL is required. Set it as an environment variable.");
    process.exit(1);
  }
  if (!config.slackWebhookUrl) {
    console.error("SLACK_WEBHOOK_URL is required. Set it as an environment variable.");
    process.exit(1);
  }

  console.log("Claude News Bot starting...");
  console.log(`  Feed:     ${config.rssFeedUrl}`);
  console.log(`  Interval: ${config.pollInterval}s`);

  await scheduledPoll();
}

main();
