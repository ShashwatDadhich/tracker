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

## Render deployment
If you want data to survive restarts and deploys on Render, add a Persistent Disk and set `DB_PATH` to the disk mount path, for example `/var/data/accountability.sqlite3`.

Recommended Render settings:
- Build Command: `pip install -r requirements.txt`
- Start Command: `python server.py`
- Environment Variable: `DB_PATH=/var/data/accountability.sqlite3`

Without a mounted persistent disk, SQLite will be recreated when Render replaces the instance filesystem.