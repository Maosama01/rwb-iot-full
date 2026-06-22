# Rawbin Smart Composter Ecosystem

Welcome to **Rawbin**, a BLE-enabled smart home composter ecosystem. This repository contains the complete software stack needed to run the Rawbin backend services, telemetry ingestion, predictive analytics, and the web dashboard locally on your machine.

---

## 🏗 Architecture Overview

The system runs entirely locally using Docker Compose, orchestrating the following services:

- **Frontend (`frontend`)**: React + Vite SPA, served on port `3000`.
- **API (`api`)**: FastAPI backend for device pairing, auth, and historical data, served on port `8000`.
- **Database (`db`)**: PostgreSQL 16 + TimescaleDB for time-series sensor readings.
- **Cache & Broker (`redis`)**: Redis 7 for Celery message brokering and caching.
- **MQTT Broker (`mosquitto`)**: Eclipse Mosquitto for handling real-time telemetry from the IoT composter.
- **Telemetry Ingestion (`mqtt_worker`)**: A standalone Python subscriber that writes incoming MQTT sensor data into TimescaleDB.
- **Job Queue (`worker`)**: Celery workers handling asynchronous alerts and push notifications.
- **Hardware Simulator (`simulator`)**: A Python script simulating a physical composter generating real-time temperature, moisture, and methane data.

```text
[Hardware/Simulator] --(MQTT)--> Mosquitto Broker <--(MQTT Subscriber)-- MQTT Worker
                                       |                                    |
                                       |                                    v
[Frontend Dashboard] <--(REST)--> FastAPI Backend <--(Reads/Writes)--> TimescaleDB (PostgreSQL)
                                       |
                                       v
                                  Celery Worker <--(Task Queue)--> Redis
```

---

## 🚀 Quickstart Guide

Running Rawbin locally is designed to be as seamless as possible. Everything is containerized via Docker.

### 1. Prerequisites

Make sure you have the following installed on your machine:
- **Docker Engine** (or Docker Desktop)
- **Docker Compose** (included with Docker Desktop)

### 2. Setup Environment Variables

The backend requires some basic environment configuration. We've provided an example file to start with.

```bash
# Navigate to the backend directory
cd backend

# Copy the example environment file
cp .env.example .env
```
*(The defaults in `.env.example` are pre-configured to work locally out of the box).*

### 3. Build & Start the Stack

From inside the `backend` folder, run Docker Compose to build the images and start all services in detached mode:

```bash
docker compose up -d --build
```
*Note: The initial build might take a few minutes as it downloads the Node, Python, Postgres, and Redis images.*

### 4. Run Database Migrations

Once the stack is running, you must initialize the database schema. Run the Alembic migration command against the running API container:

```bash
docker compose exec api alembic upgrade head
```

---

## 🎮 Using the Ecosystem

With the stack running, everything is immediately accessible from your browser:

### 🖥 The Web Dashboard
- **URL**: [http://localhost:3000](http://localhost:3000)
- The frontend is pre-configured to communicate with the local API at `localhost:8000`.
- The **Hardware Simulator** is automatically publishing fake composter data. Once you log in and "pair" a device, you will instantly see live metrics!

### ⚙️ API Documentation
- **URL**: [http://localhost:8000/docs](http://localhost:8000/docs)
- Interactive Swagger UI for testing the FastAPI backend endpoints directly.

### 🌸 Celery Monitoring (Flower)
- **URL**: [http://localhost:5555](http://localhost:5555)
- **Login**: `admin` / `admin` (or as configured in your `.env`)
- Monitor background tasks, alerts, and job queues in real-time.

---

## 🛠 Development Notes

- **Hot Reloading**: Both the FastAPI `api` and the React `frontend` have their source directories mounted into the Docker containers. Changes made to Python files in `backend/app/` or React files in `frontend/src/` will automatically hot-reload the respective servers.
- **Authentication**: Rawbin supports SMS OTP login. Locally, SMS sending defaults to a "stub" mode (`SMS_PROVIDER=stub`). You can read the OTP codes directly from the `api` Docker logs to log in:
  ```bash
  docker compose logs -f api
  ```

---

## 🛑 Stopping the Stack

To cleanly stop the ecosystem and release ports:

```bash
cd backend
docker compose down
```

To stop the ecosystem *and* wipe all local database/redis data (useful for a complete reset):

```bash
docker compose down -v
```
