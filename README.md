# Digestly — Pakistan's Stories, Distilled

A modern, editorial-grade news aggregation platform designed for Pakistan. Built with **React Native (Expo)** on mobile and a serverless **Vercel** backend orchestrating **Groq AI** summarization and **Firebase** persistence.

---

## App Name & Identity

- **Name:** Digestly (aligned with Firebase project `digestly-cbe3c`)
- **Tagline:** Pakistan's Stories, Distilled
- **Maker Credit:** Subtle attribution to *Studio Xenos* on Splash and Settings

---

## Architecture

1. **`backend/` (Vercel Serverless & Cron)**:
   - Scrapes premier Pakistani publications (**Dawn**, **The Express Tribune**, **Geo News**) every 30 minutes.
   - Invokes Groq AI (`process.env.NEWS_API_KEY`) to produce structured 3-line summaries, category detection, and multi-source event clusters.
   - Pushes processed articles to Firebase Firestore.
   - **Crucial:** Secret Groq keys never touch the client device.

2. **`mobile/` (React Native / Expo)**:
   - Modern editorial design system with **Sora** (headings) & **Inter** (body) typography.
   - Bottom tabs: **Feed (Home)**, **Discover**, **Bookmarks**, **Settings**.
   - Stack flow: **Splash**, **Onboarding Carousel**, **Login**, **Interest Selection**, **Article Detail View** (with in-app browser & multi-source comparison).
   - Reads strictly from Firestore via standard Firebase client SDK.

---

## Build Progress

- [x] **Stage 1:** Project scaffold, design tokens, typography, vector icons, navigation structure & TypeScript verification.
- [x] **Stage 2:** Firebase Auth + Google Sign-In flow (with GoogleService-Info.plist and google-services.json).
- [x] **Stage 3:** Firestore data layer & feed UI/UX polish (shimmer skeletons, radar pull-to-refresh).
- [x] **Stage 4:** Scraping backend + Groq AI summarization on Vercel (30m cron, multi-source clustering).
- [x] **Stage 5:** Dual-layer Bookmarks sync, Discover category search & Grid/List view, push notifications.
- [x] **Stage 6:** Micro-interactions (spring feedback, scroll progress, font-size switcher, breaking ticker, tablet layout).
