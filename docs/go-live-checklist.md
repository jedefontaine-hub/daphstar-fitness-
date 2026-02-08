# Go-Live Checklist

Pre-launch tasks for deploying Daphstar Fitness to production.

---

## CI/CD & Testing

Automated testing is configured and runs on every code change:

- [x] Vitest test framework configured
- [x] Unit tests for store functions (classes, bookings, auth, birthdays)
- [x] GitHub Actions workflow (`.github/workflows/ci.yml`)
- [ ] Connect GitHub repo to trigger CI on push/PR
- [ ] Ensure all tests pass before merging to main

**Test commands:**
```bash
npm test          # Run all tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run with coverage report
```

---

## Environment Variables

Set these in your hosting platform (Vercel, Netlify, etc.):

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | API key from [Resend](https://resend.com) for sending emails |
| `EMAIL_FROM` | Yes | Sender email address (e.g., `Daphstar Fitness <noreply@yourdomain.com>`) |
| `APP_URL` | Yes | Production URL (e.g., `https://daphstarfitness.com`) |
| `CRON_SECRET` | Yes | Secret key for authenticating cron job requests |
| `ADMIN_PASSWORD` | Recommended | Change from default admin password |

---

## Database Setup

Currently using in-memory store. For production:

- [ ] Set up a persistent database (PostgreSQL, MySQL, or MongoDB)
- [ ] Migrate data models from `lib/store.ts` to database schema
- [ ] Update all store functions to use database queries
- [ ] Set up database backups

---

## Email Configuration

- [ ] Sign up for [Resend](https://resend.com) account
- [ ] Verify your sending domain
- [ ] Add `RESEND_API_KEY` to environment variables
- [ ] Test email delivery (booking confirmation, cancellation, birthday)

---

## Cron Jobs / Scheduled Tasks

### Birthday Emails (Daily)
Set up a daily cron job at midnight to send birthday emails:

**Endpoint:** `POST /api/cron/birthdays`  
**Headers:** `Authorization: Bearer YOUR_CRON_SECRET`

**Vercel Cron Example** (add to `vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/birthdays",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Alternative:** Use GitHub Actions, AWS CloudWatch, or any cron service.

---

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong `CRON_SECRET` value
- [ ] Enable HTTPS (automatic on most platforms)
- [ ] Review cookie security settings in auth routes
- [ ] Set up rate limiting for API endpoints (optional)

---

## Pre-Launch Testing

- [ ] Test user registration and login
- [ ] Test class booking flow
- [ ] Test booking cancellation
- [ ] Test profile editing
- [ ] Test admin login and class management
- [ ] Test recurring class creation
- [ ] Test calendar location filter
- [ ] Test email delivery (all templates)
- [ ] Test on mobile devices

---

## DNS & Domain

- [ ] Purchase/configure domain name
- [ ] Set up DNS records pointing to hosting platform
- [ ] Configure SSL certificate (usually automatic)
- [ ] Set up email DNS records (SPF, DKIM) for deliverability

---

## Monitoring & Analytics

- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Set up analytics (e.g., Google Analytics, Plausible)
- [ ] Configure uptime monitoring (e.g., UptimeRobot)

---

## Content & Data

- [ ] Add real class schedule data
- [ ] Configure correct retirement village locations
- [ ] Update any placeholder text
- [ ] Add terms of service / privacy policy pages (if needed)

---

## Post-Launch

- [ ] Monitor error logs for first 48 hours
- [ ] Check email delivery rates
- [ ] Gather user feedback
- [ ] Create backup/restore procedures

---

## Notes

_Add any additional notes here during the go-live process._

