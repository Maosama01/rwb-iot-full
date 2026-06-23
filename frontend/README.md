<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</div>

# 🎨 Rawbin Dashboard Frontend

The central Progressive Web App (PWA) dashboard for monitoring and managing the Rawbin Smart Ecosystem. This premium UI is built with a focus on "Smart Sustainability"—combining a clean, organic glassmorphic aesthetic with real-time IoT data visualization.

---

## 🏗 Architecture & Stack

- **Framework:** React + Vite (Configured as an installable PWA for mobile).
- **Language:** Strict TypeScript for zero-runtime-error safety.
- **Styling:** Tailwind CSS (v3) using custom global utility classes (`.organic-card`, `.input-field`).
- **State Management:** React Context API (`AuthContext`, `DeviceContext`, `ToastContext`).
- **Data Visualization:** Recharts (Interactive area charts processing TimescaleDB aggregation).
- **Icons:** Lucide React.

## 🌿 The "Mill" Aesthetic Theme
The application strictly enforces a globally customized Light Mode to ensure a premium hardware-app feel:
- **Backgrounds:** Soft off-white and pale cream (`bg-cream-50`).
- **Accents:** Sage greens and leafy emeralds for healthy states (`text-leaf-600`).
- **Alerts:** Warm terracotta for warnings or critical threshold breaches.
- **Shapes:** Smooth organic curves (`rounded-3xl`) supported by diffuse, low-opacity drop shadows (`shadow-organic-md`).

## 📱 Core Features

1. **Real-time Telemetry Dashboard:** View live temperature, moisture, and methane levels streaming from your bin.
2. **Predictive Analytics & AI:** Ask the floating "Rawbin AI" assistant questions about your specific compost's health.
3. **Garden Lifecycle Management:** Add digital plants and track exactly which batch of compost was applied to them.
4. **Waste Logging:** Input your food scraps and track your total diversion from local landfills.

---

## 🚀 Local Setup & Execution

This application is designed to run locally, communicating directly with the Dockerized `rawbin-backend`.

### 1. Prerequisites
- Node.js (v18+)
- The `rawbin-backend` stack running locally via Docker Compose.

### 2. Installation
Install the required frontend dependencies:
```bash
npm install
```

### 3. Running the Dashboard
Start the local development server on port 3000:
```bash
npm run dev
```

### 4. Network Routing
The frontend `vite.config.ts` is configured to listen on all local network interfaces (`host: true`). 
- **Desktop Testing:** Navigate to `http://localhost:3000`.
- **Mobile Phone Testing:** Connect your phone to the same Wi-Fi network and navigate to `http://<YOUR_COMPUTER_IP>:3000`.

*(The application `client.ts` automatically routes all HTTP API requests dynamically to your computer's backend over the local network).*
