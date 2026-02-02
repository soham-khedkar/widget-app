# TruLuv - Shared Notes & Goals App for Couples

A real-time mobile app where two people (partners) can share notes, to-do lists, and personal goals — live synced between devices.

## 🎯 Concept

TruLuv is a lightweight emotional and organizational space for couples to:
- Leave quick "thinking of you" notes
- Share daily task lists or trip planning goals
- Send little reminders or updates throughout the day

## 🛠️ Tech Stack

- **Frontend**: React Native with Expo (file-based routing)
- **UI Library**: Gluestack UI + NativeWind (Tailwind CSS)
- **Backend**: Supabase
  - Authentication
  - PostgreSQL Database
  - Realtime subscriptions
  - Storage (for future features)
- **Language**: TypeScript

## 📦 Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your phone (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd truluv
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Then add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
   
   Get these from your Supabase project: **Project Settings → API**

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your device**
   - Scan the QR code with Expo Go (Android) or Camera app (iOS)
   - Or press `a` for Android emulator, `i` for iOS simulator

## 📁 Project Structure

```
truluv/
├── app/                    # Expo Router screens (file-based routing)
├── components/             # Reusable UI components
│   └── ui/                # Gluestack UI components
├── constants/              # App constants, colors, config
├── contexts/               # React Context providers (Auth, etc.)
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions, Supabase client
├── types/                  # TypeScript type definitions
└── assets/                 # Images, fonts, etc.
```

## 🎯 MVP Features (Current Focus)

- ✅ User Authentication (email/password + Google OAuth)
- ✅ Partner linking system
- ✅ Shared To-Dos (CRUD + real-time sync)
- ✅ Sneak Peek photo sharing with real-time updates
- 🔄 Shared Notes (CRUD + real-time sync)
- ✅ Dashboard/Home screen
- ✅ Settings/Profile

## 🚀 Future Features

- Image uploads to notes
- Spotify song dedication
- Canvas/drawing feature
- Push notifications
- Offline support
- User presence indicators
- Multi-user groups (beyond couples)

## 📝 Development

- Run linter: `npm run lint`
- Type check: `npx tsc --noEmit`
- Reset project: `npm run reset-project`

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

MIT
