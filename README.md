Mombasa Tickets 🎟️

A web-based event ticketing and discovery platform for events in Mombasa and beyond.
 Tech Stack

- Backend:Node.js, Express, PostgreSQL, Prisma ORM
- Auth: JWT, bcryptjs
- Payments: M-Pesa Daraja API (STK Push)
- Frontend: React (coming soon)

## Features

- User registration & login
- Browse and discover events
- Organizers can create and manage events
- Admin approval workflow for events
- M-Pesa payments with STK Push
- QR code tickets

## Getting Started

```bash
cd backend
npm install
cp .env.example .env   # fill in your credentials
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

Server runs on `http://localhost:5000`

## API Endpoints

| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/events` | Public |
| GET | `/api/events/:id` | Public |
| POST | `/api/events` | Organizer |
| PATCH | `/api/events/:id/status` | Admin |
| POST | `/api/mpesa/pay` | Authenticated |
| POST | `/api/mpesa/callback` | Safaricom |

## Contributors

- [azharhacks](https://github.com/azharhacks)
- [Alvin-Kyalo](https://github.com/Alvin-Kyalo)

