# FinanceFunnel

A modern, responsive personal finance management application built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Dashboard** — Overview of your finances with charts (donut, bar, line), stats cards, and recent transactions
- **Transactions** — Create, edit, delete income and expenses with filters, search, and sorting
- **Categories** — Default categories included; create custom ones with icons and colors
- **Budgets** — Set monthly spending limits per category with progress bars and warnings at 80%
- **Authentication** — Register, login, password recovery via Supabase Auth
- **Dark/Light mode** — Theme toggle with system preference support
- **Responsive** — Sidebar on desktop, bottom navigation on mobile

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui | UI components |
| Supabase | Auth + PostgreSQL |
| Recharts | Charts |
| Motion (Framer Motion) | Animations |
| React Hook Form + Zod | Forms + validation |
| Lucide React | Icons |
| date-fns | Date utilities |
| Sonner | Toast notifications |

## Prerequisites

- Node.js 18+
- npm
- A Supabase project (free tier works)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd FinanceFunnel
npm install
```

### 2. Supabase configuration

Create a project at [supabase.com](https://supabase.com).

Go to **Project Settings > API** and copy:
- `Project URL`
- `anon public key`

### 3. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Database setup

1. Go to your Supabase **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL

This creates all tables, indexes, triggers, and Row Level Security policies.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Register and explore

1. Click **Sign up** and create an account
2. Default categories are created automatically
3. Start adding transactions and setting budgets

## Project structure

```
src/
├── app/
│   ├── (auth)/             # Login, register, forgot password
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/        # Authenticated pages
│   │   ├── page.tsx        # Dashboard homepage
│   │   ├── transactions/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── budgets/page.tsx
│   │   └── settings/page.tsx
│   ├── auth/callback/route.ts  # Auth callback handler
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── auth/               # Auth forms
│   ├── dashboard/          # Dashboard widgets
│   ├── transactions/       # Transaction CRUD components
│   ├── categories/         # Category CRUD components
│   ├── budgets/            # Budget CRUD components
│   └── layout/             # Sidebar, header, mobile nav
├── hooks/                  # Custom React hooks
├── lib/
│   ├── supabase/           # Server + browser Supabase clients
│   ├── constants.ts        # Default categories, currencies, etc.
│   ├── utils.ts            # cn(), formatCurrency(), etc.
│   └── validations.ts      # Zod schemas
├── providers/
│   ├── auth-provider.tsx   # Auth context
│   └── theme-provider.tsx  # Theme context
├── types/
│   └── index.ts            # TypeScript interfaces
└── middleware.ts            # Route protection
```

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## RLS Policies

All tables have Row Level Security enabled. Each user can only access their own data. Default categories are readable by all users but only editable by the system.

## License

MIT
