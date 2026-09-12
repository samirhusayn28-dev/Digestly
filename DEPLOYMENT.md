# Digestly — Pakistan's Stories, Distilled
### Deployment & Production Guide

This guide details how to deploy the **Vercel Serverless Backend** and build the **React Native (Expo) Mobile App**.

---

## 1. Architecture & Security Guarantee

```
┌──────────────────────────────────────────────────────────┐
│                   VERCEL BACKEND                         │
│  • Scrapes Dawn, Express Tribune, and Geo News           │
│  • Groq API summarizes each article into 3 lines         │
│  • Reads strictly: process.env.NEWS_API_KEY              │
│  • Writes processed articles to Firestore                │
└────────────────────────────┬─────────────────────────────┘
                             │ Writes to 'articles'
                             ▼
                 ┌───────────────────────┐
                 │  FIREBASE FIRESTORE   │
                 │  (Project: digestly)  │
                 └───────────────────────┘
                             ▲
                             │ Read-only consumer
┌────────────────────────────┴─────────────────────────────┐
│                 EXPO REACT NATIVE APP                    │
│  • Zero Groq API code or keys on client device           │
│  • Google Sign-In & persistent user authentication       │
│  • Reads already-summarized articles from Firestore      │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Deploying Backend to Vercel

The `backend/` directory is structured as a standalone Vercel Serverless service.

### Step 1: Push to GitHub
Create a GitHub repository for the project and push:
```bash
git init
git add .
git commit -m "feat: complete Digestly mobile app and backend scraper"
git remote add origin git@github.com:your-username/digestly-news.git
git push -u origin main
```

### Step 2: Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your repository.
3. Set **Root Directory** to `backend`.
4. Configure **Environment Variables** in the Vercel dashboard:
   - `NEWS_API_KEY`: Your Groq API key (Required)
   - `FIREBASE_PROJECT_ID`: `digestly-cbe3c`
   - `FIREBASE_API_KEY`: `AIzaSyBHiD_YHTJielK4F6Btq5NZ6Oi87EwOaQo`
   - `FIREBASE_CLIENT_EMAIL`: *(Optional service account email if using Admin SDK)*
   - `FIREBASE_PRIVATE_KEY`: *(Optional service account private key if using Admin SDK)*
   - `CRON_SECRET`: *(Optional string to protect cron endpoints)*
5. Click **Deploy**.

### Step 3: Automated Cron & Verification
- `vercel.json` automatically registers the cron job at schedule `0 1 * * *` (Daily morning at 01:00 UTC / 06:00 AM PKT, optimized for Vercel Hobby plan) targeting `/api/cron/scrape`.
- Test manual execution at anytime:
  `https://your-deployment.vercel.app/api/scrape`
- Verify service status:
  `https://your-deployment.vercel.app/api/health`

---

## 3. Running & Building the Mobile App

The `mobile/` directory contains the complete React Native Expo app.

### Running Locally with Expo
```bash
cd mobile
npm start
```
- Press `i` to open in iOS Simulator (macOS with Xcode).
- Press `a` to open in Android Emulator.
- Press `w` to open in Web browser.
- Scan the QR code with the Expo Go app on your physical iPhone or Android.

### Building Standalone App Store / Play Store Binaries (EAS Build)
The project is pre-configured with:
- iOS Bundle Identifier: `com.digestly.app` with `GoogleService-Info.plist`
- Android Package: `com.digestly.app` with `google-services.json`

```bash
cd mobile

# 1. Install EAS CLI if not already installed
npm install -g eas-cli

# 2. Log in to Expo
eas login

# 3. Configure EAS project
eas build:configure

# 4. Build for Android (generates production APK / AAB)
eas build --platform android --profile production

# 5. Build for iOS (generates production IPA for App Store / TestFlight)
eas build --platform ios --profile production
```

---

## 4. Key Design System Tokens

| Token | Light Mode | Dark Mode | Semantic Usage |
|---|---|---|---|
| **Background** | `#F8FAFC` | `#0B0F17` | Editorial canvas |
| **Surface** | `#FFFFFF` | `#131B29` | Cards, sheets, dialogs |
| **Primary Accent** | `#0D9488` | `#14B8A6` | Emerald / Teal editorial identity |
| **Politics** | `#2563EB` | `#60A5FA` | Government, policy, diplomacy |
| **Business** | `#059669` | `#34D399` | Economy, PSX, currency |
| **Tech** | `#7C3AED` | `#A78BFA` | Startups, telecom, AI |
| **Sports** | `#EA580C` | `#FB923C` | Cricket, tournaments |
| **World** | `#0D9488` | `#2DD4BF` | International geopolitics |
| **Breaking** | `#DC2626` | `#F87171` | Crimson flash alerts |

---

## 5. Maker Attribution

As required:
- **Splash Screen:** Subtle *"Made by Studio Xenos"* caption centered at the bottom.
- **Settings Screen:** *"Digestly v1.0.0 — Made by Studio Xenos"* subtle credit below account settings.
