# Claude News Bot

A lightweight bot that monitors an RSS feed for [@ClaudeAI](https://x.com/ClaudeAI) tweets and posts them to a Slack channel via incoming webhook.

## How it works

- Polls an RSS feed on a configurable interval (default: every 5 minutes)
- Only posts tweets published **after the bot starts** — no backfill spam on fresh deploys
- Deduplicates in memory so the same tweet is never posted twice in a session
- Posts arrive in chronological order with a "View on X" button and Slack link preview

## Setup

### 1. Create a Slack webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. Under **Incoming Webhooks**, toggle on and click **Add New Webhook to Workspace**
3. Pick your channel and copy the webhook URL

### 2. Get an RSS feed URL

The bot works with any RSS feed. By default it's configured for [@ClaudeAI](https://x.com/ClaudeAI) via [rss.app](https://rss.app).

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
RSS_FEED_URL=https://rss.app/feeds/...
POLL_INTERVAL=300   # optional, seconds
```

### 4. Run with Docker

```bash
docker compose up --build -d
```

Check logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SLACK_WEBHOOK_URL` | Yes | — | Slack incoming webhook URL |
| `RSS_FEED_URL` | Yes | — | RSS feed to monitor |
| `POLL_INTERVAL` | No | `300` | Poll frequency in seconds (min: 10) |

## Development

Requires Node 20+.

```bash
npm install
npm run dev
```
