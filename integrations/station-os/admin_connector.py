#!/usr/bin/env python3
"""Least-privilege Station OS <-> Website Admin connector.

It pushes a bounded projection and applies only an explicit allow-list of
Station operations through the local FastAPI service. It never listens on a
socket and never sends the Station write credential to the Website Admin.
"""

from __future__ import annotations

import json
import os
import sqlite3
import ssl
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


CUSTOMER_STATUSES = {"active", "inactive", "prospect", "archived"}
TASK_STATUSES = {"open", "in_progress", "completed", "cancelled"}
PRIORITIES = {"low", "normal", "high", "urgent"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def request_json(base_url: str, token: str, path: str, method: str = "GET", body: Any = None) -> Any:
    url = base_url.rstrip("/") + path
    payload = None if body is None else json.dumps(body, separators=(",", ":")).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=payload,
        method=method,
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            **({"Content-Type": "application/json"} if payload is not None else {}),
        },
    )
    context = ssl.create_default_context()
    with urllib.request.urlopen(request, timeout=15, context=context) as response:
        if response.status < 200 or response.status >= 300:
            raise RuntimeError(f"website_http_{response.status}")
        return json.load(response)


def snapshot(db: sqlite3.Connection) -> dict[str, Any]:
    db.row_factory = sqlite3.Row
    customers = [dict(row) for row in db.execute(
        "SELECT id,email,name,source,last_contact_at,status FROM customers ORDER BY last_contact_at DESC LIMIT 500"
    )]
    customer_ids = {row["id"] for row in customers}
    tasks = [dict(row) for row in db.execute(
        "SELECT id,customer_id,source,task_type,title,summary,priority,status,created_at,due_at,completed_at "
        "FROM tasks ORDER BY created_at DESC LIMIT 1000"
    ) if row["customer_id"] in customer_ids]
    generated = now_iso()
    return {
        "version": int(time.time_ns() // 1_000_000),
        "generatedAt": generated,
        "customers": [{
            "id": row["id"], "email": row["email"], "name": row["name"],
            "source": row["source"], "lastContactAt": row["last_contact_at"], "status": row["status"],
        } for row in customers],
        "tasks": [{
            "id": row["id"], "customerId": row["customer_id"], "source": row["source"],
            "type": row["task_type"], "title": row["title"], "summary": row["summary"],
            "priority": row["priority"], "status": row["status"], "createdAt": row["created_at"],
            "dueAt": row["due_at"], "completedAt": row["completed_at"],
        } for row in tasks],
        "operations": collect_operations(),
    }


def local_json(path: str, method: str = "GET", body: Any = None, write_token: str | None = None) -> Any:
    try:
        payload = None if body is None else json.dumps(body, separators=(",", ":")).encode("utf-8")
        headers = {"Accept": "application/json"}
        if payload is not None:
            headers["Content-Type"] = "application/json"
        if write_token:
            headers["X-Station-Write-Token"] = write_token
        request = urllib.request.Request("http://127.0.0.1:8099" + path, data=payload, method=method, headers=headers)
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.load(response)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        return None


def bounded_json_file(name: str) -> Any:
    path = Path(os.getenv("SGL_STATION_DATA_DIR", "/opt/sgl-station-os/data")) / "sync" / name
    try:
        if not path.is_file() or path.stat().st_size > 500_000:
            return None
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError, UnicodeDecodeError):
        return None


def collect_operations() -> dict[str, Any]:
    today = datetime.now(timezone.utc).date()
    monday = today.fromordinal(today.toordinal() - today.weekday())
    return {
        "daily": local_json(f"/ops/daily/{today.isoformat()}"),
        "inventory": local_json("/ops/inventory/status"),
        "inventoryLedger": local_json("/ops/inventory/ledger"),
        "purchaseSuggestions": local_json("/ops/purchase/suggestions"),
        "staff": local_json("/ops/staff/list"),
        "availability": local_json(f"/ops/availability/week/{monday.isoformat()}"),
        "schedule": local_json(f"/ops/schedule/week/{monday.isoformat()}"),
        "products": local_json("/ops/products/list"),
        "materials": local_json("/ops/materials/list"),
        "bom": local_json("/ops/bom/list"),
        "purchases": local_json("/ops/purchases/list"),
        "camera": local_json(f"/ops/camera/day/{today.isoformat()}"),
        "miniCatalog": bounded_json_file("products.json"),
        "miniOrders": bounded_json_file("orders.json"),
        "miniSales": bounded_json_file("daily_sales.json"),
    }


API_COMMANDS = {
    "station.product.upsert": ("/ops/products/upsert", "/ops/products/list", "products", "productId"),
    "station.material.upsert": ("/ops/materials/upsert", "/ops/materials/list", "materials", "materialId"),
    "station.bom.upsert": ("/ops/bom/upsert", "/ops/bom/list", "bom", "productId"),
    "station.purchase.add": ("/ops/purchases/add", "/ops/purchases/list", "purchases", "purchaseId"),
    "station.staff.upsert": ("/ops/staff/upsert", "/ops/staff/list", "staff", "staffId"),
    "station.availability.submit": ("/ops/availability/submit", None, None, None),
    "station.schedule.generate": (None, None, None, None),
}


def verify_list(path: str, list_key: str, id_key: str, entity_id: str) -> bool:
    result = local_json(path)
    if not isinstance(result, dict) or not isinstance(result.get(list_key), list):
        return False
    return any(isinstance(row, dict) and str(row.get(id_key)) == entity_id for row in result[list_key])


def apply_command(db: sqlite3.Connection, command: dict[str, Any], write_token: str) -> tuple[bool, str | None]:
    command_type = command.get("type")
    entity_id = command.get("entityId")
    changes = command.get("changes")
    if not isinstance(entity_id, str) or not isinstance(changes, dict):
        return False, "invalid_command"
    timestamp = now_iso()
    try:
        with db:
            if command_type == "station.customer.update":
                if set(changes) - {"name", "status"}:
                    return False, "invalid_customer_change"
                row = db.execute("SELECT id FROM customers WHERE id=?", (entity_id,)).fetchone()
                if not row:
                    return False, "customer_not_found"
                if "status" in changes and changes["status"] not in CUSTOMER_STATUSES:
                    return False, "invalid_customer_status"
                if "name" in changes and (not isinstance(changes["name"], str) or len(changes["name"].strip()) > 300):
                    return False, "invalid_customer_name"
                db.execute(
                    "UPDATE customers SET name=COALESCE(?,name),status=COALESCE(?,status),updated_at=? WHERE id=?",
                    (changes.get("name"), changes.get("status"), timestamp, entity_id),
                )
            elif command_type == "station.task.update":
                if set(changes) - {"status", "priority", "dueAt"}:
                    return False, "invalid_task_change"
                row = db.execute("SELECT id FROM tasks WHERE id=?", (entity_id,)).fetchone()
                if not row:
                    return False, "task_not_found"
                if "status" in changes and changes["status"] not in TASK_STATUSES:
                    return False, "invalid_task_status"
                if "priority" in changes and changes["priority"] not in PRIORITIES:
                    return False, "invalid_task_priority"
                completed = timestamp if changes.get("status") == "completed" else None
                db.execute(
                    "UPDATE tasks SET status=COALESCE(?,status),priority=COALESCE(?,priority),"
                    "due_at=CASE WHEN ? THEN ? ELSE due_at END,"
                    "completed_at=CASE WHEN ?='completed' THEN COALESCE(completed_at,?) WHEN ? IN ('open','in_progress') THEN NULL ELSE completed_at END,"
                    "updated_at=? WHERE id=?",
                    (changes.get("status"), changes.get("priority"), "dueAt" in changes, changes.get("dueAt"),
                     changes.get("status"), completed, changes.get("status"), timestamp, entity_id),
                )
            elif command_type in API_COMMANDS:
                if not write_token:
                    return False, "station_write_unavailable"
                if command_type == "station.schedule.generate":
                    week_start = changes.get("weekStart")
                    if not isinstance(week_start, str):
                        return False, "invalid_schedule"
                    result = local_json(f"/ops/schedule/generate/{week_start}", "POST", {}, write_token)
                    verified = local_json(f"/ops/schedule/week/{week_start}")
                    return bool(result is not None and isinstance(verified, dict)), None if isinstance(verified, dict) else "verification_failed"
                write_path, read_path, list_key, id_key = API_COMMANDS[command_type]
                result = local_json(str(write_path), "POST", changes, write_token)
                if result is None:
                    return False, "station_api_error"
                if command_type == "station.availability.submit":
                    week_start = changes.get("weekStart")
                    verified = local_json(f"/ops/availability/week/{week_start}")
                    rows = verified.get("availability") if isinstance(verified, dict) else None
                    ok = isinstance(rows, list) and any(isinstance(row, dict) and str(row.get("staffId")) == entity_id for row in rows)
                    return ok, None if ok else "verification_failed"
                verify_id = str(changes.get(str(id_key)) or entity_id)
                ok = verify_list(str(read_path), str(list_key), str(id_key), verify_id)
                return ok, None if ok else "verification_failed"
            else:
                return False, "unsupported_command"
        return True, None
    except sqlite3.Error:
        return False, "station_database_error"


def run() -> int:
    base_url = required_env("SGL_ADMIN_BASE_URL")
    token = required_env("SGL_STATION_AGENT_TOKEN")
    write_token = os.getenv("STATION_WRITE_TOKEN", "").strip()
    database_path = Path(os.getenv("SGL_STATION_DATABASE", "/opt/sgl-station-os/data/agent_ops.sqlite3"))
    if not database_path.is_file():
        raise RuntimeError("Station database is unavailable")
    with sqlite3.connect(database_path, timeout=10) as db:
        db.execute("PRAGMA foreign_keys=ON")
        projection = snapshot(db)
        result = request_json(base_url, token, "/api/agent/v1/station/snapshot", "POST", projection)
        commands = request_json(base_url, token, "/api/agent/v1/station/commands?limit=25").get("commands", [])
        applied = 0
        failed = 0
        for command in commands:
            success, error_code = apply_command(db, command, write_token)
            ack = {"eventId": command.get("id"), "receipt": command.get("receipt"), "success": success}
            if error_code:
                ack["errorCode"] = error_code
            request_json(base_url, token, "/api/agent/v1/station/commands", "POST", ack)
            applied += int(success)
            failed += int(not success)
        print(json.dumps({
            "event": "station_admin_connector.completed", "snapshotAccepted": bool(result.get("accepted")),
            "customers": len(projection["customers"]), "tasks": len(projection["tasks"]),
            "commandsApplied": applied, "commandsFailed": failed,
        }, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(run())
    except (RuntimeError, urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as error:
        print(json.dumps({"event": "station_admin_connector.failed", "error": type(error).__name__}), file=sys.stderr)
        raise SystemExit(1)
