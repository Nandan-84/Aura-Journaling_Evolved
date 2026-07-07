<p align="center">
  <img src="assets/banner.png" alt="Aura Banner" width="100%" />
</p>

<h1 align="center">✦ Aura — Journaling Evolved</h1>

<p align="center">
  <em>A mood-adaptive journaling environment with immersive ambience, encrypted entries, and curated music.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Express-4-blue?logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-SQLite-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/GSAP-Animations-88CE02?logo=greensock" alt="GSAP" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## ✨ What is Aura?

**Aura** is a full-stack journaling web app that transforms how you write. Instead of a blank page, Aura creates an **immersive, mood-based environment** — from ambient background videos and curated music to color-adaptive UI — so every journaling session *feels* different.

Your entries are **AES-256 encrypted** at rest, and the app supports full authentication with email verification, password reset, and profile management.

---

## 🎯 Features

| Feature | Description |
|---|---|
| 🎨 **Mood Selection** | Choose from 5 moods — Happy, Calm, Energetic, Melancholic, Neutral |
| 🎬 **Ambient Videos** | Each mood loads a unique looping background video |
| 🎵 **Curated Music** | Mood-matched YouTube playlists with full queue management |
| 🔒 **AES-256 Encryption** | Journal entries encrypted before storing in database |
| 📝 **Rich Text Editor** | Bold, italic, underline formatting with `contentEditable` |
| 📅 **Calendar View** | Visual calendar showing past entries with mood indicators |
| 🔐 **Full Auth System** | Register → Email OTP Verification → Login → JWT Cookies |
| 📧 **Password Reset** | Forgot password → Email link → Reset flow |
| 👤 **Profile Management** | Update name, DOB, gender, change password |
| 🗑️ **Account Deletion** | Permanent delete with password confirmation |
| ✏️ **Same-Day Editing** | Edit today's entry with mood reassignment |
| 🌊 **GSAP Animations** | Smooth page transitions, floating gradients, micro-interactions |

---

## 🏗️ Tech Stack

### Frontend (`/client`)
- **Next.js 16** (App Router, React 19)
- **Tailwind CSS 4**
- **GSAP** + `@gsap/react` for animations
- **Axios** for API calls
- **React YouTube** for music player
- **Lucide React** for icons
- **Outfit** font via `next/font`

### Backend (`/server`)
- **Express.js 4** with TypeScript
- **Prisma ORM** with SQLite
- **JWT** (HttpOnly cookies) for auth
- **bcryptjs** for password hashing
- **Zod** for input validation
- **Nodemailer** for emails (Gmail SMTP)
- **Node.js crypto** for AES-256-CBC encryption

---

## 📁 Project Structure

```
Aura-Journaling_Evolved/
├── client/                    # Next.js frontend
│   ├── public/
│   │   ├── bg.jpg             # Login background
│   │   └── videos/            # Mood ambient videos (mp4)
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Login / Register
│       │   ├── verify-email/         # OTP verification
│       │   ├── forgot-password/      # Password reset request
│       │   ├── reset-password/       # Set new password
│       │   ├── dashboard/            # Mood selection + Calendar
│       │   ├── journal/
│       │   │   ├── [mood]/           # Journaling page (write)
│       │   │   └── view/[id]/        # View past entry
│       │   └── profile/              # Settings (profile + security)
│       └── lib/
│           ├── api.ts                # Axios instance
│           └── mood-data.ts          # Mood configs + playlists
│
├── server/                    # Express backend
│   ├── prisma/
│   │   └── schema.prisma      # Database schema (User + Entry)
│   └── src/
│       ├── index.ts           # Server entry point
│       ├── controllers/
│       │   ├── auth.controller.ts    # Auth + Profile endpoints
│       │   └── entry.controller.ts   # CRUD + Encryption
│       ├── middleware/
│       │   └── auth.middleware.ts     # JWT verification
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   └── entry.routes.ts
│       └── lib/
│           └── prisma.ts      # Prisma client singleton
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Gmail account** with [App Password](https://support.google.com/accounts/answer/185833) for email features (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/Nandan-84/Aura-Journaling_Evolved.git
cd Aura-Journaling_Evolved
```

### 2. Setup Backend
```bash
cd server
npm install

# Create environment file
cp .env.example .env
# Edit .env with your values (JWT_SECRET, EMAIL_USER, EMAIL_PASS)

# Generate Prisma client & run migrations
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```
> Server runs on **http://localhost:5000**

### 3. Setup Frontend
```bash
cd client
npm install

# Start development server
npm run dev
```
> Client runs on **http://localhost:3000**

---

## 🔑 Environment Variables

Create a `.env` file in the `/server` directory:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | SQLite database path | ✅ |
| `JWT_SECRET` | Secret key for JWT signing | ✅ |
| `EMAIL_USER` | Gmail address for sending OTPs | Optional |
| `EMAIL_PASS` | Gmail App Password | Optional |
| `ENCRYPTION_KEY` | 32-char key for AES-256 encryption | ✅ |

> **Note:** If `EMAIL_USER` and `EMAIL_PASS` are not set, OTPs will be logged to the server console instead of being emailed.

---

## 📡 API Endpoints

### Auth Routes (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/register` | Register new user (sends OTP) | ❌ |
| `POST` | `/verify-email` | Verify OTP & activate account | ❌ |
| `POST` | `/login` | Login & set JWT cookie | ❌ |
| `POST` | `/logout` | Clear JWT cookie | ❌ |
| `POST` | `/forgot-password` | Send password reset email | ❌ |
| `POST` | `/reset-password` | Reset password with token | ❌ |
| `GET` | `/me` | Get profile | ✅ |
| `PUT` | `/me` | Update profile | ✅ |
| `POST` | `/change-password` | Change password | ✅ |
| `POST` | `/delete-account` | Delete account permanently | ✅ |

### Entry Routes (`/api/entries`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/` | Create new journal entry | ✅ |
| `GET` | `/` | Get all entries (decrypted) | ✅ |
| `PUT` | `/:id` | Update entry (same-day only) | ✅ |
| `DELETE` | `/:id` | Delete an entry | ✅ |

---

## 🎨 Mood Themes

| Mood | Colors | Ambient Video | Music Style |
|---|---|---|---|
| ☀️ Happy | Amber → Orange | Warm, golden hour | Upbeat, feel-good |
| 🍃 Calm | Emerald → Teal | Nature, flowing water | Lo-fi, ambient |
| ⚡ Energetic | Rose → Red | Dynamic, motion | High energy, pump-up |
| 🌧️ Melancholic | Indigo → Purple | Rain, moody skies | Emotional, reflective |
| ☁️ Neutral | Gray → Slate | Minimal, abstract | Chill, background |

---

## 🔒 Security

- **Passwords** are hashed with **bcryptjs** (10 salt rounds)
- **Journal entries** are encrypted with **AES-256-CBC** before database storage
- **Authentication** uses **HTTP-only JWT cookies** (7-day expiry)
- **Input validation** with **Zod** schemas on all endpoints
- **CORS** restricted to `http://localhost:3000`
- **OTP** for email verification (6-digit, 10-min expiry)
- **Reset tokens** expire after 15 minutes

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with 🖤 by <a href="https://github.com/Nandan-84">Nandan</a></strong>
</p>
