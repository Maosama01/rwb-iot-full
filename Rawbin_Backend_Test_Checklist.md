# Rawbin Backend — Manual Test Checklist

A phase-by-phase checklist for testing the backend with **no hardware**. Since there's no STM32/BLE/phone yet, *you* become the device by publishing MQTT messages to Mosquitto. Work top to bottom — each phase depends on the previous one.

> **Golden rule:** keep `docker compose logs -f` running in a side terminal the entire time. You confirm the pipeline worked by *watching* the worker/Celery logs, not by guessing.

---

## ⚠️ FIRST — get these facts from Claude Code before you start

The simulator and publish commands are useless if they don't match the real code. Ask Claude Code and fill in:

- [ ] **MQTT topic structure** the worker subscribes to → `__________________________`
  (e.g. `rawbin/{device_id}/readings`)
- [ ] **Exact JSON payload shape** the worker expects → record a sample:
  ```json

  ```
- [ ] **OTP delivery in dev** — does it send a real SMS via Twilio, or log the code to console? → `__________`
- [ ] **Provisioning path** — which endpoint/command creates a device, and what does it return? → `__________`
- [ ] **Alert thresholds** — what temp/moisture/airflow values trigger an alert? → `__________`

---

## Pre-flight — tools & scratchpad

**Install / confirm available:**
- [ ] `mosquitto-clients` (gives you `mosquitto_pub`) — or MQTT Explorer (GUI)
- [ ] `psql` or DBeaver (to inspect the database)
- [ ] Swagger UI loads at `http://localhost:8000/docs`
- [ ] (optional) Postman/Insomnia for repeatable REST calls

**Scratchpad — record as you go (you'll reuse these constantly):**
```
API base URL:        http://localhost:8000
Device ID:           ____________________
User A access token: ____________________
User A refresh tok:  ____________________
User B access token: ____________________
Active cycle ID:     ____________________
```

---

## Phase 0 — Stack smoke test
*Confirm nothing is silently dead before testing features. (You flagged this as undone.)*

- [ ] `docker compose ps` — every container UP: **API**, **MQTT worker** (now separate!), **Mosquitto**, **Redis**, **Celery worker**, **TimescaleDB**
- [ ] `/docs` loads and lists endpoints
- [ ] Run the pytest suite **against the live Docker stack** (not just locally) — note pass/fail: `__________`
- [ ] All services tailing logs in a side terminal

**Pass = all containers healthy, docs load, tests green against live stack.**

---

## Phase 1 — Authentication

### Email / password (full lifecycle, not just login)
- [ ] `POST /auth/register` — create User A
- [ ] `POST /auth/login` — receive **access + refresh** tokens → save to scratchpad
- [ ] Call any protected endpoint with the access token → succeeds
- [ ] Call the same endpoint with **no token** → rejected (401)
- [ ] `POST /auth/refresh` with refresh token → new access token issued
- [ ] `POST /auth/logout` → then reuse the old refresh token → rejected

### OTP / SMS login (Twilio)
- [ ] Request OTP for User A's phone
- [ ] Retrieve the code (from SMS, or from console logs if dev mode)
- [ ] Submit the code → tokens issued
- [ ] Confirm `users.phone` is actually stored in the DB
- [ ] (negative) Submit a wrong/expired OTP → rejected

---

## Phase 2 — Device provisioning & pairing
*A device must exist before it can be paired or send data.*

- [ ] Provision/create a device → **record the `device_id`** in scratchpad
- [ ] Pair/claim the device as User A → creates a `user_devices` row
- [ ] `GET /devices` as User A → the device appears
- [ ] Inspect `user_devices` table in psql → row exists, links User A ↔ device
- [ ] (note) Provisioning is currently open to any member — confirm this behavior so the gap is documented

**Pass = device exists, User A owns it via `user_devices`, no `owner_id` column involved.**

---

## Phase 3 — Data ingestion via MQTT  ⭐ core test
*You ARE the hardware here. Remember: HTTP telemetry endpoints were removed — MQTT is the ONLY way in.*

### Single hand-published message
- [ ] Publish ONE reading (adjust topic/payload to match Phase-0 facts):
  ```bash
  mosquitto_pub -h localhost -t "rawbin/<device_id>/readings" \
    -m '{"timestamp":"2026-06-18T10:30:00Z","temperature":54.2,"moisture":61.8,"airflow":3.4}'
  ```
- [ ] **Watch the MQTT worker log** consume the message
- [ ] Query `sensor_readings` in psql → the row landed

**This single round-trip — publish → worker logs → row appears — proves your whole pipeline.**

### Negative / edge tests
- [ ] Publish the **same `device_id` + `timestamp` twice** → only ONE row exists (validates `UNIQUE(device_id, timestamp)` dedup)
- [ ] Publish under an **unprovisioned `device_id`** → observe how the worker handles unknown devices (reject? orphan? log it)
- [ ] Publish **malformed JSON** → worker doesn't crash; logs/drops it gracefully

### Simulator loop
- [ ] Run a script publishing realistic readings every ~10 min (your cadence) for the device
- [ ] Confirm rows accumulate steadily; logs stay clean

---

## Phase 4 — Retrieval
*Read it back the way the app will.*

- [ ] `GET /devices/{id}/readings` → returns what you ingested
- [ ] Range filter (`?start=` / `?end=`) → returns only the window
- [ ] (deeper) Inspect the TimescaleDB hypertable → confirm **7-day chunks** forming
- [ ] Request readings for a device User A does NOT own → rejected

---

## Phase 5 — Compost cycles & waste logs

### Cycles (lean lifecycle, one active per device)
- [ ] Create an active cycle for the device → record `cycle_id`
- [ ] `GET` cycles → the active cycle shows
- [ ] **(key negative)** Try to create a SECOND active cycle for the same device → **rejected** by the one-active-cycle constraint
- [ ] Complete the cycle → status transitions to completed
- [ ] Start a fresh cycle after completion → now allowed

### Waste logs (typed + weight + nullable cycle link)
- [ ] Log waste **with** a `compost_cycle_id` → linked to the batch
- [ ] Log waste **with no active cycle** (nullable FK path) → accepted with null cycle link
- [ ] (negative) Submit an invalid `waste_type` → rejected
- [ ] (negative) Submit without `weight_kg` if it's required → behaves as designed

---

## Phase 6 — Alerts & notifications
*This is where Celery earns its keep. Use the simulator's threshold-breach flag.*

- [ ] Publish a reading that **breaches a threshold** (e.g. temp spike)
- [ ] Watch the **Celery worker** pick up the threshold check
- [ ] An `alert` row is created with correct type/severity
- [ ] Notification fan-out fires (observe in logs)
- [ ] Resolve-alert endpoint → alert marked resolved
- [ ] Publish a normal reading → no alert created (no false positives)

*(Full "notify all members" check happens in Phase 7 once a device is shared.)*

---

## Phase 7 — Sharing / multi-user (equal access, no roles)

- [ ] Register User B
- [ ] Share the device with User B via `user_devices`
- [ ] Log in as User B → sees the device and its data
- [ ] Trigger a threshold breach → **both User A and User B** get notified
- [ ] (note) Sharing is currently open to any member — confirm and document this as a security gap to close before launch

---

## Phase 8 — Resilience & edge cases
*Tests the exact properties you chose MQTT for.*

- [ ] Kill the **MQTT worker** container; publish several readings while it's down
- [ ] Restart the worker → buffered messages survive and get processed (broker durability / QoS)
- [ ] **Store-and-forward:** publish readings with **past timestamps** → they slot in correctly, not rejected as stale
- [ ] Kill **Celery/Redis**; breach a threshold; restart → does the alert eventually fire or is it lost? (document the answer)
- [ ] Restart the whole stack → no data loss, services reconnect cleanly

---

## Known gaps to document (not bugs to fix now)

Track these so they're consciously deferred, not forgotten:
- [ ] No `DELETE /devices/{id}` endpoint yet
- [ ] Provision + share are open to any member (no permission checks)
- [ ] Mosquitto has no auth — must be secured before any public exposure
- [ ] Tests not yet validated against the full live Docker stack (close this in Phase 0)

---

## Sign-off

- [ ] All 8 phases passed (or failures logged with notes)
- [ ] Device simulator working and reusable for future development
- [ ] Known-gaps list reviewed with teammate
- [ ] Decision: what to build/fix next → `________________________________`
