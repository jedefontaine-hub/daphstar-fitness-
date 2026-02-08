# Daphstar Fitness Booking MVP

Mobile-first web app for class schedule, booking, cancellation, and admin management.

## Setup
```bash
npm install
```

## Database Setup
The app uses SQLite with Prisma. Initialize the database:
```bash
npx prisma migrate dev      # Create database tables
npm run db:seed             # Populate with sample data
```

## Run
```bash
npm run dev
```

## Build
```bash
npm run build
npm run start
```

## Database Commands
```bash
npm run db:migrate   # Run pending migrations
npm run db:seed      # Seed sample data
npm run db:reset     # Reset database (delete all data and re-seed)
```

## Project Notes
- Public schedule and booking pages live in `app/`.
- Admin pages live in `app/admin/`.
- Shared API helpers live in `lib/`.
- Database access via `lib/db-store.ts`.
- Product docs live in `docs/`.
