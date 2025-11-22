# FreeSquash League - MVP

A full-stack web application for managing a squash league with ranked groups, advanced ranking algorithms, match recording, and global classification.

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **React Query** (@tanstack/react-query) for server state management
- **React Router** for navigation
- **TanStack Table** for advanced data tables
- **Axios** for API requests

### Backend
- **Node.js** with TypeScript
- **Fastify** web framework
- **Prisma ORM** for database access
- **PostgreSQL** database
- **JWT** authentication
- **bcrypt** for password hashing
- **Zod** for validation

## 📋 Features

### ✅ Implemented (MVP)

#### Authentication
- [x] Email/password registration
- [x] JWT-based authentication
- [x] Protected routes
- [x] Role-based access (Player/Admin)

#### Player Features
- [x] **Dashboard**: Personal stats, current ranking, recent matches, streak indicator
- [x] **Group View**: Rankings, progress indicators (days remaining, completion %), contact tools (call, WhatsApp, copy phone)
- [x] **Match Recording**: Score input with validation (0-3), injury/cancellation handling
- [x] **Match History**: Complete match record with results
- [x] **Global Classification**: Advanced filtering (season, group, date range), sortable table with TanStack Table

#### Ranking System
- [x] **4-Tier Tie-Breaking Algorithm**:
  1. Matches won (primary)
  2. Head-to-head (2 players tied)
  3. Mini-league for 3+ players (internal wins → internal averás)
  4. Global averás → Alphabetical fallback
- [x] Automatic ranking updates after match recording
- [x] Injury/cancelled matches excluded from rankings

#### Admin Features
- [x] Admin dashboard
- [x] Season management (CRUD)
- [x] Group management (CRUD)
- [x] Player management (view)

### 🔮 Future Enhancements (Post-MVP)
- [ ] Promotion/Relegation system
- [ ] Player availability indicators
- [ ] Suggested matches algorithm
- [ ] Admin: Assign/remove players from groups UI
- [ ] Admin: Edit player details
- [ ] Email notifications
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git

### 1. Clone the Repository

```bash
cd c:\xampp\htdocs\personal\FreeLiga
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

### 3. Database Setup

#### Option A: Local PostgreSQL

1. Create a PostgreSQL database:
```sql
CREATE DATABASE freesquash;
```

2. Set up environment variables:

**packages/database/.env**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/freesquash"
```

**apps/api/.env**
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/freesquash"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
FRONTEND_URL="http://localhost:5173"
```

#### Option B: Supabase (Recommended for Production)

1. Create a project at [supabase.com](https://supabase.com)
2. Get your database connection string from Project Settings > Database
3. Update `.env` files with your Supabase URL

### 4. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
cd packages/database
npx prisma migrate dev --name init
```

### 5. Create Admin User (Optional)

Open Prisma Studio:
```bash
npm run db:studio
```

1. Create a User with `role = ADMIN`
2. Set password hash (you can generate one by registering normally first, then changing the role)

### 6. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or separately:
npm run dev:api  # Backend on http://localhost:3001
npm run dev:web  # Frontend on http://localhost:5173
```

### 7. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/health
- Prisma Studio: `npm run db:studio`

## 📁 Project Structure

```
freesquash-league/
├── apps/
│   ├── api/                    # Fastify backend
│   │   ├── src/
│   │   │   ├── routes/         # API routes
│   │   │   ├── services/       # Business logic
│   │   │   └── server.ts       # App entry point
│   │   └── package.json
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── components/     # Reusable components
│       │   ├── contexts/       # React contexts
│       │   ├── lib/            # Utilities
│       │   ├── pages/          # Route pages
│       │   └── main.tsx        # App entry point
│       └── package.json
├── packages/
│   └── database/               # Prisma schema & client
│       ├── prisma/
│       │   └── schema.prisma
│       └── src/
│           └── index.ts
└── package.json                # Root workspace config
```

## 🎯 Key API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Players
- `GET /api/players` - List all players
- `GET /api/players/:id` - Get player details
- `GET /api/players/:id/stats` - Get player statistics

### Groups
- `GET /api/groups` - List groups
- `GET /api/groups/:id` - Get group with rankings
- `POST /api/groups` - Create group (admin)
- `POST /api/groups/:id/players` - Assign player (admin)

### Matches
- `GET /api/matches` - List matches (filterable)
- `POST /api/matches` - Record match
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match (admin)

### Seasons
- `GET /api/seasons` - List seasons
- `POST /api/seasons` - Create season (admin)

### Classification
- `GET /api/classification` - Global rankings (with filters)

## 🧪 Testing the Ranking Algorithm

1. Create a season
2. Create a group and assign players
3. Record matches to test tie scenarios:
   - **2-player tie**: Record matches so two players have same wins
   - **3+ player tie**: Create circular wins (A beats B, B beats C, C beats A)
   - **Injury match**: Set `matchStatus = INJURY` - should not affect rankings
4. View group rankings to verify tie-breaking logic

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd apps/web
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Railway/Render)
```bash
cd apps/api
npm run build
# Deploy with start command: node dist/server.js
```

### Database (Supabase)
- Use Supabase connection string in production
- Run migrations: `npx prisma migrate deploy`

## 🐛 Troubleshooting

### Database connection issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env files
- Ensure database exists

### Port conflicts
- Change PORT in apps/api/.env
- Update proxy in apps/web/vite.config.ts

### Module not found errors
- Run `npm install --workspaces`
- Run `npm run db:generate`

## 📝 License

MIT

## 👥 Contributing

This is an MVP. Future contributions should follow the feature roadmap in the implementation plan.

---

Built with ❤️ for the FreeSquash League
