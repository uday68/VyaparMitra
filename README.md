# VyaparMitra (व्यापार मित्र)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Frontend-Vite%20%2B%20React-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Bhashini AI](https://img.shields.io/badge/AI-Bhashini%20Multilingual-FF9933)](https://bhashini.gov.in/)
[![Architecture](https://img.shields.io/badge/Architecture-Event--Driven%20WebSocket-00C7B7)]()
[![Last Updated](https://img.shields.io/badge/Last%20Updated-November%202026-brightgreen.svg)]()
[![Latest Commit](https://img.shields.io/github/last-commit/uday68/VyaparMitra?color=brightgreen&label=Last%20Commit)](https://github.com/uday68/VyaparMitra/commits/main)
[![Status](https://img.shields.io/badge/Status-Active%20Development-success.svg)]()

> **Real-time multilingual linguistic bridge, voice negotiation engine, and cross-language QR-commerce platform for local trade and vernacular commerce.**

---

## 🌟 Architectural Overview

VyaparMitra bridges language barriers between local merchants, vendors, and consumers across diverse Indian linguistic regions. By integrating **Bhashini ULCA Speech-to-Speech / Text-to-Text translation pipelines**, real-time **WebSocket-driven automated price discovery**, and **cross-language dynamic QR payments**, merchants can converse and negotiate in their native tongue while buyers interact seamlessly in theirs.

```
                    ┌───────────────────────────────┐
                    │     Client Web Interface      │
                    │   (Vite + React + Tailwind)   │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │      WebSocket / REST API     │
                    │      (Node.js + Express)      │
                    └───────┬───────────────┬───────┘
                            │               │
        ┌───────────────────▼──┐         ┌──▼───────────────────┐
        │  Bhashini AI Bridge  │         │  Dual-Database Core  │
        │  - ASR (Voice-to-Tx) │         │  - MongoDB (Catalog) │
        │  - NMT (Translation) │         │  - Postgres (Ledger) │
        │  - TTS (Speech-Synth)│         │  - Redis (Pub/Sub)   │
        └──────────────────────┘         └──────────────────────┘
```

---

## 🚀 Key Capabilities

- **Cross-Language Voice & Text Negotiation:** Real-time conversational translation with low-latency streaming audio pipelines.
- **Dynamic Cross-Language QR Commerce:** Generates contextual payment and order manifests decoded dynamically in the customer's preferred vernacular language.
- **Resilient Fallback Translation Engine:** Automatic failover between Bhashini enterprise models and lightweight local dictionary/heuristic fallbacks for high availability.
- **Dual-Data Persistence:**
  - **PostgreSQL:** ACID-compliant transaction ledger, trade verification, and dispute audit trails.
  - **MongoDB:** Flexible document store for localized product catalogs, multi-tenant merchant profiles, and vernacular taxonomies.
  - **Redis:** Sub-millisecond pub/sub message dispatching and session caching.

---

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Web Speech API.
- **Backend:** Node.js, Express, WebSocket (`ws`), TypeScript.
- **Data & Caching:** PostgreSQL, MongoDB, Redis.
- **AI / Speech Engine:** Bhashini ULCA API, Google Gemini AI Assistance.

---

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+ & npm
- Redis Server (local or managed)
- PostgreSQL & MongoDB instances

### 2. Installation
```bash
git clone https://github.com/uday68/VyaparMitra.git
cd VyaparMitra
npm install
```

### 3. Environment Configuration
Copy `.env.development.example` to `.env.development`:
```bash
cp .env.development.example .env.development
```

Configure the following variables:
```ini
PORT=4000
MONGODB_URI="mongodb://localhost:27017/vyaparmitra"
POSTGRES_URI="postgresql://user:password@localhost:5432/vyaparmitra"
REDIS_URL="redis://localhost:6379"
BHASHINI_API_KEY="your_bhashini_api_key_here"
```

### 4. Running the Platform
```bash
# Start backend and frontend concurrently
npm run dev
```

---

## 🔄 Recent Updates & Maintenance

- **November 2026:**
  - Standardized Docker Compose build orchestration contexts and multi-stage container configurations.
  - Sanitized log file tracking and ignore patterns in .gitignore.
  - Streamlined unified root dependency installation and documentation.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
