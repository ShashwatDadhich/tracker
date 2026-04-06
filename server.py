from __future__ import annotations

import json
import os
import sqlite3
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data" / "accountability.sqlite3"
DEFAULT_PORT = int(os.environ.get("PORT", "8000"))
DAYS = 40
START_DATE = "2026-04-07"


def make_default_state() -> list[dict]:
    from datetime import date, timedelta

    start = date.fromisoformat(START_DATE)
    state = []
    for index in range(DAYS):
        current = start + timedelta(days=index)
        state.append(
            {
                "day": index + 1,
                "date": f"{current.month}/{current.day}/{current.year}",
                "entries": {
                    "kiran-am": {"state": "pending", "note": ""},
                    "kiran-pm": {"state": "pending", "note": ""},
                    "shashwat-am": {"state": "pending", "note": ""},
                    "shashwat-pm": {"state": "pending", "note": ""},
                },
            }
        )
    return state


def ensure_database() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    try:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS app_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        exists = connection.execute("SELECT 1 FROM app_state WHERE id = 1").fetchone()
        if not exists:
            connection.execute(
                "INSERT INTO app_state (id, payload) VALUES (1, ?)",
                (json.dumps(make_default_state()),),
            )
        connection.commit()
    finally:
        connection.close()


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/state":
            self.send_json(HTTPStatus.OK, load_state())
            return

        self.serve_static(parsed.path)

    def do_PUT(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/api/state":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        payload = self.read_json_body()
        if not isinstance(payload, list) or len(payload) != DAYS:
            self.send_error(HTTPStatus.BAD_REQUEST, "Invalid state payload")
            return

        save_state(payload)
        self.send_json(HTTPStatus.OK, {"ok": True})

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/api/reset":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        save_state(make_default_state())
        self.send_json(HTTPStatus.OK, {"ok": True})

    def serve_static(self, path: str) -> None:
        relative_path = path.lstrip("/") or "index.html"
        if relative_path.endswith("/"):
            relative_path += "index.html"

        candidate = (BASE_DIR / relative_path).resolve()
        if BASE_DIR not in candidate.parents and candidate != BASE_DIR:
            self.send_error(HTTPStatus.FORBIDDEN)
            return

        if candidate.is_dir():
            candidate = candidate / "index.html"

        if not candidate.exists() or not candidate.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        content_type = {
            ".html": "text/html; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".svg": "image/svg+xml",
        }.get(candidate.suffix.lower(), "application/octet-stream")

        with candidate.open("rb") as file_handle:
            body = file_handle.read()

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length) if content_length else b"{}"
        return json.loads(raw_body.decode("utf-8"))

    def send_json(self, status: HTTPStatus, payload: object) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return


def load_state() -> list[dict]:
    connection = sqlite3.connect(DB_PATH)
    try:
        row = connection.execute("SELECT payload FROM app_state WHERE id = 1").fetchone()
        if not row:
            return make_default_state()
        return json.loads(row[0])
    finally:
        connection.close()


def save_state(state: list[dict]) -> None:
    connection = sqlite3.connect(DB_PATH)
    try:
        connection.execute(
            "UPDATE app_state SET payload = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1",
            (json.dumps(state),),
        )
        connection.commit()
    finally:
        connection.close()


def main() -> None:
    ensure_database()
    server = ThreadingHTTPServer(("0.0.0.0", DEFAULT_PORT), RequestHandler)
    print(f"Serving on http://0.0.0.0:{DEFAULT_PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
