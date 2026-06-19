# Rawbin Smart Composter Dashboard

The central dashboard for monitoring and managing the Rawbin Smart Ecosystem. This premium UI is built with a focus on "Smart Sustainability" – combining clean, organic aesthetics with real-time IoT data visualization.

## Architecture

- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v3)
- **Design System:** Custom "Smart Sustainability" Light Theme
- **Data Visualization:** Recharts (Area charts for TimescaleDB aggregation)
- **Icons:** Lucide React

## Local Setup & Execution

This application is designed to run entirely locally on your machine, communicating securely with the local `rawbin-backend`. No cloud servers or internet deployments are required.

### 1. Prerequisites
- Node.js (v18+)
- The `rawbin-backend` running locally via Docker Desktop.

### 2. Installation
Install the required frontend dependencies:
```bash
npm install
```

### 3. Running the Dashboard
Start the local development server:
```bash
npm run dev
```

Once running, simply open your browser and navigate to:
**http://localhost:5173**

*(Note: The application will automatically route requests to your local backend API running on `http://localhost:8000/api/v1`)*

## Theme Details
The application is built on a strict Light Mode organic theme:
- **Backgrounds:** Soft off-white and pale stone.
- **Accents:** Sage greens and leafy emeralds for healthy states.
- **Alerts:** Warm terracotta for warnings/critical errors.
- **Shapes:** Smooth organic curves with `rounded-2xl` and `rounded-3xl` radii, supported by diffuse low-opacity drop shadows (`shadow-organic`).
