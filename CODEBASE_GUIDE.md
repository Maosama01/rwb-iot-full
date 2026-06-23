# Rawbin Ecosystem Codebase Guide

This document serves as an exhaustive, file-by-file breakdown of the entire Rawbin project. It details exactly what every file and folder does across both the Backend and Frontend architectures.

---

## 1. The Backend Repository (`/backend`)

The backend is built using **FastAPI** (Python 3.11) and follows a modular, domain-driven structure.

### Root Configuration Files
* **`.env.example`**: A template file for environment variables. It defines the required secrets, database URLs, and API keys without containing real passwords.
* **`.gitignore`**: Tells Git which files to ignore (like `__pycache__` and the real `.env` file) to prevent sensitive or unnecessary files from being uploaded.
* **`Dockerfile`**: Instructions for building the backend's Docker image, ensuring it runs identically on any system.
* **`docker-compose.yml`**: The master orchestrator. It spins up the API, PostgreSQL, Redis, Mosquitto, Celery Workers, and the Frontend, networking them together.
* **`alembic.ini`**: Configuration for Alembic (database migrations), dictating how it connects to PostgreSQL to apply schema changes.
* **`pytest.ini`**: Configuration for automated testing, defining how Pytest discovers and runs tests.
* **`requirements.txt`**: The complete list of Python third-party dependencies (FastAPI, SQLAlchemy, Pydantic, etc.).

### Database Migrations (`alembic/`)
* **`alembic/env.py`**: The script that runs Alembic migrations, connecting SQLAlchemy models to the database engine.
* **`alembic/script.py.mako`**: The template used to generate new migration scripts.
* **`alembic/versions/*.py`**: Chronological scripts representing historical changes to the database schema.

### Core Application (`app/`)
* **`app/main.py`**: The entrypoint of the server. Initializes FastAPI, sets up CORS, and mounts the API routers.

#### API Endpoints (`app/api/`)
* **`app/api/deps.py`**: Dependency injections (e.g., `get_current_user`, `get_db`).
* **`app/api/v1/ai.py`**: Handles prompts for the AI Chat widget, injecting live telemetry context.
* **`app/api/v1/alerts.py`**: Manages unread system alerts.
* **`app/api/v1/analytics.py`**: Computes predictive health scores and comparative cycle data.
* **`app/api/v1/auth.py`**: SMS OTP login, registration, and JWT token issuance.
* **`app/api/v1/cycles.py`**: Management of distinct compost batches.
* **`app/api/v1/devices.py`**: Device pairing, configuration, and sharing.
* **`app/api/v1/ota.py`**: Over-The-Air firmware update checks for physical devices.
* **`app/api/v1/plants.py`**: The Garden feature; tracking plants and compost applications.
* **`app/api/v1/status.py`**: Server health-check endpoints.
* **`app/api/v1/telemetry.py`**: Live and historical time-series data endpoints.
* **`app/api/v1/users.py`**: Fetching and managing the logged-in user profile.
* **`app/api/v1/waste.py`**: Logging organic waste additions.

#### Core Configuration (`app/core/`)
* **`app/core/config.py`**: Parses the `.env` file into a typed Python configuration object.
* **`app/core/firebase.py`**: Sets up Firebase Cloud Messaging for push notifications.
* **`app/core/logging.py` & `log_config.json`**: Terminal logging configuration.
* **`app/core/mqtt.py`**: Connection settings for the Mosquitto broker.
* **`app/core/security.py`**: Cryptography, JWT generation, and password hashing.

#### Database Models (`app/db/`)
* **`app/db/base.py`**: Foundational class for SQLAlchemy models.
* **`app/db/session.py`**: PostgreSQL connection pooling.
* **`app/db/models/*.py`**: SQLAlchemy tables (e.g., `user.py`, `device.py`, `telemetry.py`, `plant.py`). Every class equals a physical table in PostgreSQL.

#### Data Schemas (`app/schemas/`)
* **`app/schemas/*.py`**: Pydantic models. These strictly validate the shape of JSON requests/responses before they hit the database logic.

#### Business Logic (`app/services/`)
* **`app/services/auth_service.py`**: Password validation and token verification.
* **`app/services/demo_simulator.py`**: Logic for populating fake data for "Demo Devices".
* **`app/services/device_access.py`**: Security rules confirming user permissions for devices.
* **`app/services/otp.py`**: Generates 6-digit OTP codes.
* **`app/services/sms.py`**: SMS gateway integrations (e.g., Twilio).

#### Background Workers (`app/workers/`)
* **`app/workers/celery_app.py`**: Initializes the Redis-backed Celery task queue.
* **`app/workers/mqtt_listener.py`**: A continuous background loop that listens to MQTT topics and writes live sensor data into TimescaleDB.
* **`app/workers/tasks/telemetry.py`**: Scans the database periodically to trigger alerts for high temperatures/anomalies.

### Standalone Scripts
* **`simulator.py`**: Mimics a physical IoT composter, blasting fake thermodynamic data to MQTT for local UI testing.
* **`seed.py`**: Populates an empty database with fake users and devices for rapid development.

---

## 2. The Frontend Repository (`/frontend`)

The frontend is a Progressive Web App (PWA) built using **React, Vite, and TailwindCSS**.

### Root Configuration Files
* **`package.json` & `package-lock.json`**: Lists all JavaScript dependencies (`react`, `tailwindcss`, etc.) and locks exact versions to ensure reproducible builds.
* **`vite.config.ts`**: The Vite bundler configuration, including the PWA setup (allowing offline mobile installation).
* **`tailwind.config.js`**: The master design file dictating the "Mill" aesthetic colors, fonts, and box shadows.
* **`postcss.config.js`**: Bridges Tailwind with standard CSS generation.
* **`tsconfig.json` & `tsconfig.node.json`**: TypeScript configuration, enforcing strict typing to prevent runtime crashes.
* **`eslint.config.js`**: Enforces code style and catches common JavaScript errors.
* **`nginx.conf`**: Configures the production Nginx server to properly route Single Page Application URLs.
* **`Dockerfile`**: Instructions to compile the React app and serve it via Nginx in production.

### Static Assets (`public/` & `dev-dist/`)
* **`public/`**: Unprocessed files like `favicon.svg` and `firebase-messaging-sw.js` (for push notifications).
* **`dev-dist/`**: Auto-generated by Vite PWA plugin during local development to serve service workers.

### The Core Application (`src/`)

#### App Entry Points
* **`src/main.tsx`**: Mounts the React application into the browser DOM.
* **`src/App.tsx`**: The main layout and router. Sets up Context providers and handles mobile rendering for the AI Chat Widget.
* **`src/index.css`**: Global stylesheet containing custom Tailwind utilities (`.organic-card`, `.input-field`).

#### Application Logic (`src/api/` & `src/context/`)
* **`src/api/client.ts`**: The monolithic `ApiClient` class that handles all REST requests to the FastAPI backend, including JWT token refreshing.
* **`src/context/AuthContext.tsx`**: Global login state management.
* **`src/context/DeviceContext.tsx`**: Tracks the currently active composter device.
* **`src/context/ToastContext.tsx`**: Manages sliding notification popups at the bottom of the screen.

#### Reusable UI Parts (`src/components/`)
* **`Sidebar.tsx`**: Main navigation component (left side on desktop, bottom bar on mobile).
* **`AIChatWidget.tsx`**: The Ask Rawbin AI assistant interface.
* **`PredictiveInsightsCard.tsx`**: The 0-100 Health Score dial component.
* **`TelemetryChart.tsx`**: Interactive Recharts-based line graph for temperature/moisture.
* **`ThresholdSettingsModal.tsx` & `PairingModal.tsx`**: Popup dialogs for configuration.
* **`ProtectedRoute.tsx`**: Router middleware that bounces unauthenticated users back to `/login`.

#### The Pages (`src/pages/`)
* **`LandingPage.tsx`**: Promotional homepage.
* **`LoginPage.tsx`**: SMS OTP entry screen.
* **`DashboardPage.tsx`**: Main real-time telemetry and active cycle hub.
* **`CompostPage.tsx`**: Deep-dive historical data charting.
* **`AlertsPage.tsx`**: Feed of system anomaly notifications.
* **`WasteLogPage.tsx`**: Form to manually track food scrap inputs.
* **`AnalyticsPage.tsx`**: Environmental impact statistics.
* **`GardenPage.tsx`**: Digital plant management and compost application logging.
* **`LibraryPage.tsx`**: Educational reference for green/brown ratios.
* **`DeviceSetupPage.tsx`**: Interface for claiming a new bin.
* **`DeviceSettingsPage.tsx`**: Interface for renaming the bin and configuring safety thresholds.

#### Utilities
* **`src/utils/foodData.ts`**: Static arrays mapping food categories to dropdown menus.
