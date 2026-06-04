# Luma Event Registration & Management System

A production-grade, SaaS-style Event Registration & Management System inspired by Luma. Built using Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS v4, and MongoDB.

---

## 🚀 Live Demo & Key Objectives
This application provides two distinct portals:
1. **Hosts**: Create events (with customized capacities and deadlines), close RSVPs, track attendee analytics in real-time, search/filter registrations, and download attendee sheets via secure CSV exports.
2. **Attendees**: Browse public meetups, register for tickets instantly (automatically creating an account if guest), and manage active RSVP tickets with cancellation releases from a personalized dashboard.

---

## ✨ Features Implemented

### 1. Unified Authentication (NextAuth.js)
* Custom credentials provider that handles both **Hosts** and **Attendees** from separate databases.
* Passwords are never stored in plain text and are hashed using `bcrypt` (12 rounds).
* Custom NextAuth callbacks extend the session payloads to securely include user `id` and `role` client-side.

### 2. Event Management (Host Panel)
* **Creation**: Host forms with title, description, date, time, location, capacity, and deadlines.
* **Slug Generation**: Formats titles into URL-friendly strings (e.g. `Meetup 2026` -> `meetup-2026`) and auto-appends counters (e.g. `meetup-2026-1`) to resolve database collisions.
* **Date Constraints**: Enforces that event date/time and registration deadlines must be set in the future, and the deadline must occur on or before the event date.
* **Close Event**: Hosts can manually close registrations to block future RSVPs.
* **Delete Event**: Cascade deletes the event and all associated registrations with a security confirmation modal.

### 3. Dynamic Registration (RSVP System)
* **Zero-friction RSVP**: If a user is not logged in, they can input their Name, Email, and Password. The system validates inputs using Zod, creates their Attendee account, logs them in, and RSVPs them in a single step.
* **Double RSVP Prevention**: Compound database indexes and backend logic prevent a user from registering twice for the same event.
* **Capacity Limits**: Atomically checks capacity before creating tickets. Displays "Registration Closed" and disables forms once full.
* **Deadline Guards**: Automatically blocks API-level and client-side registrations once the deadline passes.
* **Attendee Dashboard**: Lists all active tickets, registration dates, and location details. Includes a custom modal dialog for RSVP cancellation to release slot capacity.

### 4. Search, Filter & CSV Export
* **TanStack Table**: Powering the Host's attendee directory with client-side sorting and pagination.
* **Search & Filters**: Search attendees by Name/Email, and filter by Event title or Registration Date.
* **CSV Export**:
  * **Table-Wide**: Exports the currently filtered table client-side.
  * **Event-Specific**: Protected server-side endpoint `GET /api/events/[id]/export` that verifies Host ownership before generating and streaming the CSV file. Passwords/hashes are strictly excluded.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16.2 (App Router)
* **Frontend**: React 19, Tailwind CSS v4, Lucide Icons, TanStack Table v8
* **Database & ORM**: MongoDB Atlas, Mongoose
* **Authentication**: NextAuth.js, bcrypt
* **Validation**: Zod, React Hook Form, `@hookform/resolvers`
* **Development**: TypeScript (Strict Mode), ESLint

---

## 📦 Local Setup & Installation

### 1. Prerequisites
* [Node.js](https://nodejs.org) (v18.17+ or v20+)
* [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or Atlas account URI)

### 2. Clone the Repository
```bash
git clone https://github.com/affanraza84/Event-Registration-and-Management-System.git
cd Event-Registration-and-Management-System
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env.local` file in the root folder:
```env
# MongoDB Connection URI
MONGODB_URI=mongodb://127.0.0.1:27017/event-registry

# NextAuth Configuration
NEXTAUTH_SECRET=35c8b74c2e6f49e491c1075d9e5f58c42661849a60e659b8d2b9921da8a61ff0
NEXTAUTH_URL=http://localhost:3000
```

### 5. Run the Application
```bash
# Start Next.js development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🔌 API Documentation

### 1. POST `/api/events`
* **Description**: Create a new event.
* **Authorization**: Host Session Required.
* **Payload**:
  ```json
  {
    "title": "Byamn Dev Meetup 2026",
    "description": "Gathering of developers in SF.",
    "date": "2026-08-15",
    "time": "18:00",
    "location": "San Francisco, CA",
    "capacity": 100,
    "registrationDeadline": "2026-08-14"
  }
  ```
* **Response (201)**:
  ```json
  {
    "success": true,
    "event": {
      "id": "603d...",
      "slug": "byamn-dev-meetup-2026",
      "title": "Byamn Dev Meetup 2026"
    }
  }
  ```

### 2. GET `/api/events/[slug]`
* **Description**: Publicly fetch metadata for a single event.
* **Authorization**: None (Public).
* **Response (200)**:
  ```json
  {
    "success": true,
    "event": {
      "_id": "603d...",
      "title": "Byamn Dev Meetup 2026",
      "slug": "byamn-dev-meetup-2026",
      "capacity": 100,
      "attendeeCount": 5
    }
  }
  ```

### 3. POST `/api/events/[id]/register`
* **Description**: Register an attendee for an event.
* **Authorization**: None (creates user if new, authenticates password if existing).
* **Payload**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
* **Response (211)**:
  ```json
  {
    "success": true,
    "registration": {
      "id": "604e...",
      "eventId": "603d...",
      "attendeeId": "604a..."
    }
  }
  ```

### 4. DELETE `/api/registration/[id]`
* **Description**: Cancel registration and release slot.
* **Authorization**: Session Required (Must be the attendee owner or event host).
* **Response (200)**:
  ```json
  {
    "success": true
  }
  ```

### 5. GET `/api/events/[id]/export`
* **Description**: Exports all registration attendees as a CSV spreadsheet file.
* **Authorization**: Host Session Required (Must own the event).
* **Response (200)**: Streams `text/csv` formatted data containing Name, Email, and Registration Date columns.

---

## 🌐 Deployment Guide

### MongoDB Atlas Configuration
1. Sign up/log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free cluster and database named `event-registry`.
3. Under **Database Access**, create a user with read/write privileges.
4. Under **Network Access**, whitelist `0.0.0.0/0` (allow connections from anywhere) to let Vercel connect.
5. Retrieve your cluster connection string (e.g., `mongodb+srv://<user>:<password>@cluster0.mongodb.net/event-registry?retryWrites=true&w=majority`).

### Vercel Deployment
1. Log in to [Vercel](https://vercel.com) and link your GitHub repository.
2. Under **Environment Variables**, add:
   * `MONGODB_URI` (your Atlas cluster string)
   * `NEXTAUTH_SECRET` (generate a secure 32-character string)
   * `NEXTAUTH_URL` (your deployed Vercel domain URL, e.g. `https://my-luma-app.vercel.app`)
3. Click **Deploy**. Vercel will build the Turbopack production bundle and serve it globally.
