# Step 1 — Basic Server + Schema

This is just the foundation. No API routes for characters yet, no seeding — that's step 2+.

## What's here
- `server.js` — Express server, connects to MongoDB, one test route (`GET /`)
- `models/Character.js` — Mongoose schema for a character (name, series, gender, images, video, bio, popularity, sources)
- `.env.example` — copy this to `.env` and fill in your Mongo connection string

## How to run
1. Install MongoDB locally (or use MongoDB Atlas free tier for a cloud DB)
2. `cp .env.example .env` and edit `MONGO_URI` if needed
3. `npm install`
4. `npm run dev` (or `npm start`)
5. Open `http://localhost:5000` — you should see "Anime Character API is running."

That's it for step 1. Next step will add actual GET routes for characters and a seeding script.
