# 40-Day Accountability Challenge App

A lightweight multi-page tracker for the mutual yoga accountability plan backed by SQLite.

## What it includes
- 40-day date range from 4/7/2026 to 5/16/2026
- Morning and evening tracking for both people
- Click-to-cycle statuses: Pending, Done
- Optional note per cell
- SQLite persistence with a tiny Python server
- Separate login, participant, and admin pages

## Run it
Start the lightweight server:

```bash
python3 server.py
```

Then open `http://127.0.0.1:8000`.

The server creates the SQLite database automatically on first run. If you want a reset, stop the server and delete `data/accountability.sqlite3`.