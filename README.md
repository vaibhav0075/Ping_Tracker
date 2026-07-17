# Ping Tracker

A production-ready ICMP ping monitoring dashboard with real-time updates, email alerts, and detailed device analytics.

## Tech Stack

- **Next.js 16** (App Router) – Full-stack framework
- **TypeScript** – Type safety
- **Tailwind CSS** – Modern styling
- **MongoDB + Mongoose** – Database and ORM
- **SSE (Server-Sent Events)** – Real-time updates
- **Nodemailer** – Email notifications
- **ping** – ICMP ping library
- **Zod** – Validation
- **React Hook Form** – Form handling
- **Lucide Icons** – Beautiful icons
- **Recharts** – Charts and graphs
- **Sonner** – Toast notifications

## Features

### Core Functionality
- Real-time ICMP ping monitoring (1-second intervals by default)
- Email alerts when devices go offline or come back online
- Dashboard with live stats and device table
- Device CRUD management (add, edit, delete)
- Ping history with charts
- Uptime percentage calculation
- Average, minimum, and maximum latency tracking
- Total downtime calculation
- CSV export of device data
- Search, filter, sort, and pagination
- Dark/Light mode toggle
- Live connection indicator
- Connection quality badge

### Architecture
- Clean, modular codebase
- Background worker for pinging (runs separately from API routes)
- Server-Sent Events for real-time updates
- MongoDB with Mongoose ODM
- Proper error handling and logging
- Environment variable validation with Zod

## Installation

### Prerequisites

- **Node.js 20+**
- **MongoDB** (local or cloud instance like MongoDB Atlas)
- **SMTP server** (for email notifications, optional)

### Steps

1. **Clone or navigate to the project directory**

   ```powershell
   cd "Ping Tracker"
   ```

2. **Install dependencies**

   ```powershell
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` (using PowerShell):

   ```powershell
   Copy-Item .env.example -Destination .env
   ```

   Then edit `.env` and fill in your configuration:

   ```env
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/ping-tracker

   # SMTP Email Configuration (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=Ping Tracker <your-email@gmail.com>

   # Worker Configuration
   PING_INTERVAL_MS=1000
   MAX_CONCURRENT_PINGS=20
   PING_HISTORY_RETENTION_DAYS=30

   # Optional: Worker health port
   WORKER_HEALTH_PORT=3001
   ```

4. **Start the development server**

   This starts both the Next.js server and the ping worker concurrently:

   ```powershell
   npm run dev
   ```

   Or you can start them separately (in separate PowerShell terminals):

   ```powershell
   # Start Next.js only
   npm run dev:web
   ```

   ```powershell
   # Start ping worker only (in a separate terminal)
   npm run dev:worker
   ```

5. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## Production Deployment

### Build

```bash
npm run build
```

### Start in Production

```bash
npm start
```

This runs both the web server and the ping worker. Again, you can run them separately with `npm run start:web` and `npm run start:worker`.

## Project Structure

```
.
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   ├── devices/          # Device management page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard
├── components/           # React components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configuration
│   ├── db.ts             # MongoDB connection
│   ├── env.ts            # Environment variables
│   ├── event-bus.ts      # Event bus for SSE
│   └── validations/      # Zod schemas
├── models/               # Mongoose models
├── services/             # Business logic
├── types/                # TypeScript types
├── utils/                # Helper functions
├── workers/              # Background workers
├── .env.example          # Example environment variables
├── next.config.ts        # Next.js config
├── tailwind.config.ts    # Tailwind config
└── tsconfig.json         # TypeScript config
```

## API Routes

| Route                       | Method | Description                              |
|-----------------------------|--------|------------------------------------------|
| `/api/devices`              | GET    | Get all devices (paginated)              |
| `/api/devices`              | POST   | Create a new device                      |
| `/api/devices/[id]`         | GET    | Get a single device                      |
| `/api/devices/[id]`         | PUT    | Update a device                          |
| `/api/devices/[id]`         | DELETE | Delete a device                          |
| `/api/history/[deviceId]`   | GET    | Get ping history for a device            |
| `/api/history/[deviceId]/export` | GET | Export ping history to CSV               |
| `/api/dashboard`            | GET    | Get dashboard stats                      |
| `/api/sse`                  | GET    | Server-Sent Events for real-time updates |

## License

MIT
