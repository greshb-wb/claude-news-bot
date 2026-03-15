import Parser from "rss-parser";
import fs from "fs";
import path from "path";
import { config } from "./config";

const parser = new Parser();

// --- State persistence (track which tweets we've already posted) ---

function loadPosted(): Set<string> {
  try {
    const dir = path.dirname(config.stateFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(config.stateFile)) return new Set();
    const data = JSON.parse(fs.readFileSync(config.stateFile, "utf-8"));
    return new Set(data);
  } catch {
    return new Set();
  }
}

function savePosted(posted: Set<string>): void {
  const dir = path.dirname(config.stateFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(config.stateFile, JSON.stringify([...posted]));
}

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

  const posted = loadPosted();
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

  savePosted(posted);
  console.log(`  ${newCount} new tweet(s) posted, ${posted.size} total tracked.`);
}

// --- Entry point ---

async function main(): Promise<void> {
  if (!config.slackWebhookUrl) {
    console.error("SLACK_WEBHOOK_URL is required. Set it as an environment variable.");
    process.exit(1);
  }

  console.log("Claude News Bot starting...");
  console.log(`  Feed:     ${config.rssFeedUrl}`);
  console.log(`  Interval: ${config.pollInterval}s`);

  // Initial poll
  await poll();

  // Schedule recurring polls
  setInterval(poll, config.pollInterval * 1000);
}

main();
