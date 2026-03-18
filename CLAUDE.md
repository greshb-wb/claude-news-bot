# CLAUDE.md

## Project overview

A Node.js/TypeScript bot that polls an RSS feed and posts new items to Slack via incoming webhook. Designed to run indefinitely in Docker.

## Key design decisions

- **No persistent state** — deduplication uses an in-memory `Set`. On restart the bot ignores all tweets published before startup (`startedAt` timestamp), so there's no repost storm and no need for a state file or volume.
- **No overlapping polls** — uses `setTimeout` (not `setInterval`) so the next poll only schedules after the current one finishes.
- **Graceful shutdown** — handles `SIGTERM`/`SIGINT` so Docker can stop the container cleanly mid-poll.
- **Slack embeds** — the top-level `text` field is set to the tweet URL so Slack unfurls it into a rich preview card. The `blocks` field carries the formatted message.

## Architecture

```
src/
  config.ts   — environment variable parsing and validation
  index.ts    — RSS polling, deduplication, Slack posting, main loop
```

## Environment variables

Both `RSS_FEED_URL` and `SLACK_WEBHOOK_URL` are required — the bot will exit with an error if either is missing. `POLL_INTERVAL` defaults to 300s with a minimum of 10s.

## Running locally

```bash
docker compose up --build
```

The `.env` file is gitignored. Never commit it.

## Common tasks

**Test by posting existing feed items:** temporarily comment out the `startedAt` filter in `poll()` and rebuild.

**Check logs:**
```bash
docker compose logs -f
```

**Rebuild after code changes:**
```bash
docker compose down && docker compose up --build -d
```
