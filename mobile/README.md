<div align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</div>

# 📱 Rawbin Mobile App

This directory contains the cross-platform React Native (Expo) application for the Rawbin Smart Composter. It serves as the primary user interface for interacting with the composter, visualizing telemetry data, and managing your account.

---

## 🎨 Premium UI & Design
The app is built with **NativeWind** (Tailwind CSS for React Native) to achieve a modern, glassmorphic aesthetic with custom organic styling tailored to the "Rawbin" brand.
- Smooth gradients and rounded cards (`rounded-3xl`).
- Dynamic charting using `react-native-chart-kit` with perfectly scaled, clean axes.
- Dynamic icons representing the current stage of your compost cycle.

## ✨ Key Features

- **Seamless Authentication**: Features both email/password login and a highly polished **SMS OTP (One-Time Password)** login flow.
- **Smart Dashboard & Virtual Bin Avatar 🌱**: Instantly view the status of your composter, active phase, and total compost produced. The "Digital Twin" Tamagotchi-style avatar reacts in real-time to MQTT telemetry (temperature & humidity) to show you how healthy your compost is.
- **AI Compost Checker 📸**: Snap a photo of any waste item in the *Can It Compost?* tab. Gemini AI will instantly analyze the image and tell you if it's compostable, recyclable, or trash!
- **Neighborhood Exchange 🤝**: A community marketplace tab where users can list their finished "Black Gold" or raw food scraps to trade with local neighbors, complete with distance tracking.
- **SaveMyFood Recipes 🍳**: Generate AI-powered zero-waste recipes to use up leftovers before they go bad.
- **Interactive Cycle Simulator**: A built-in tool lets you preview how the composter UI transforms over a 30-day process.
- **Location & Settings**: Easily configure your timezone, household settings, and profile details via a clean settings interface.

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Expo development server:
   ```bash
   npx expo start
   ```
3. Press `i` to open in an iOS simulator, `a` for Android, or scan the QR code with the **Expo Go** app on your physical device.

*(Note: The app expects the FastAPI backend to be running on your local machine to fetch live data. Ensure your phone and development machine are on the same Wi-Fi network for local testing).*
