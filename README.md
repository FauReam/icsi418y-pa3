# ICSI 418Y – Programming Assignment 3: Projects and Project Memberships

A full-stack web application with a React frontend, an Express/Node.js backend, and MongoDB storage. Extends the PA2 Login/Signup app with projects and many-to-many project memberships.

## Project Structure

```
icsi418y-pa3/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── components/
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── CreateProject.jsx
│       │   ├── ProjectList.jsx
│       │   └── ProjectMembers.jsx
│       ├── App.jsx
│       └── main.jsx
│
└── server/                 # Express backend
    ├── server.js
    └── .env                # MongoDB connection string (NOT committed)
```

## Setup

1. **Create the environment file**

   Inside `server/`, create a file named `.env` (use `.env.example` as a template):

   ```
   MONGO_URI=your_mongodb_connection_string
   ```

   For a locally installed MongoDB, use `mongodb://localhost:27017` and make sure `mongod` is running.

2. **Install dependencies**

   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

## Run

Two terminals are required (plus a running MongoDB).

**Terminal 1 – Backend (port 9000):**

```bash
cd server
node server.js
```

You should see `Connected to MongoDB` and `Server running on port 9000`.

**Terminal 2 – Frontend (port 5173):**

```bash
cd client
npm run dev
```

Open http://localhost:5173 in your browser.

## API

| Method | Endpoint                              | Body                                                        | Responses |
|--------|---------------------------------------|-------------------------------------------------------------|-----------|
| POST   | `/signup`                             | `{ f_name, l_name, username, password }`                    | 201 created · 400 missing fields · 409 duplicate username · 500 server error |
| POST   | `/login`                              | `{ username, password }`                                    | 200 success · 400 missing fields · 401 unknown username / wrong password · 500 server error |
| GET    | `/users`                              | –                                                           | 200 `{ users }` (passwords excluded) · 500 server error |
| POST   | `/projects`                           | `{ name, description, status, project_lead_id }`            | 201 created (lead also added as member) · 400 missing fields / invalid status / invalid id · 404 lead not found · 500 server error |
| GET    | `/projects`                           | –                                                           | 200 `{ projects }` · 500 server error |
| GET    | `/projects/:projectId/members`        | –                                                           | 200 `{ project, members }` · 400 invalid project id · 404 project not found · 500 server error |
| POST   | `/projects/:projectId/members`        | `{ user_id }`                                               | 201 added · 400 missing/invalid id · 404 project or user not found · 409 already a member · 500 server error |
| DELETE | `/projects/:projectId/members/:userId`| –                                                           | 200 removed · 400 invalid id / cannot remove the project lead · 404 project or membership not found · 500 server error |

## Data Model

All data lives in the `pa2` database (the PA2 database is reused so existing users carry over). Three collections:

**users** (from PA2) — `username` has a unique index:

```json
{ "_id": "...", "f_name": "...", "l_name": "...", "username": "...", "password": "..." }
```

**projects** — `status` is one of `Planning`, `Active`, `Completed`; `project_lead_id` is an ObjectId referencing a user:

```json
{ "_id": "...", "name": "...", "description": "...", "status": "Planning", "project_lead_id": "ObjectId(...)" }
```

**projectMemberships** — one document per user per project (many-to-many); `project_id` and `user_id` are ObjectId references and a unique `{ project_id, user_id }` index prevents duplicate memberships:

```json
{ "_id": "...", "project_id": "ObjectId(...)", "user_id": "ObjectId(...)" }
```
