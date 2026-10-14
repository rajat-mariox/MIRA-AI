# MIRA-AI

MIRAI — Vedic astrology app: mobile app, backend API, admin panel and website.

| Folder | What | Run |
|---|---|---|
| `mirai-backend/` | Node.js + Express + TypeScript + MongoDB API (Divine API astrology, OpenAI chat, wallet, plans, notifications, leads) | `npm install && npm run dev` (copy `.env.example` to `.env` first) |
| `mirai-app/` | React Native CLI app (Android / iOS) | `npm install`, `npx react-native start`, then `android/gradlew app:installDebug` |
| `mirai-admin-panel/` | React + Vite admin panel | `npm install && npm run dev` |
| `mirai-react/` | React + Vite marketing website (contact form → leads) | `npm install && npm run dev` |

Secrets live only in `mirai-backend/.env` and `mirai-backend/secrets/` (both git-ignored); see `mirai-backend/.env.example` and `mirai-backend/README.md`.
