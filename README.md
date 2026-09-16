# Sun Proactive ☀️

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Fastify](https://img.shields.io/badge/fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Sun Proactive** is an AI-powered platform for social volunteering. It connects project curators with qualified volunteers using AI-based matching and verification.

---

## Key AI Features

- **AI Matching (Vector Search)**: Uses vector embeddings (`text-embedding-3-small`) with cosine similarity to match task descriptions with volunteer skills.
- **Explainable AI**: The matching algorithm generates a short natural-language explanation for why a given candidate was recommended.
- **AI Consultant (RAG)**: A task-page chatbot that answers strictly based on the task description, avoiding hallucinations and reducing curator workload.
- **Vision AI**: Automated photo-report verification using **Google Gemini 1.5 Flash**, checking that submitted photos match the assigned task and flagging prompt-injection attempts.
- **Autonomous AI Manager**: A background cron process that scans for approaching task deadlines and sends targeted push notifications to matching volunteers.

## Tech Stack

The project is split into independent frontend and backend services for performance and security isolation.

**Backend**
- Fastify (TypeScript) + Node.js
- PostgreSQL + Drizzle ORM
- Security: bcrypt (12 rounds) password hashing, stateless JWT, Role-Based Access Control, `@fastify/helmet`, `@fastify/rate-limit`

**Frontend**
- Next.js 15 (App Router)
- Tailwind CSS v4 with custom glassmorphism styling
- Centralized API client with automatic JWT handling

---

## Role Architecture

1. **Volunteer (12+)** — sets skills on registration, views open tasks, gets RAG-based AI assistance on task pages, submits AI-verified photo reports.
2. **Curator** — creates tasks through an AI-guided dialogue, reviews AI-ranked volunteer applications with explanations, approves participants. Requires admin approval to activate.
3. **Administrator** — manages users, approves/rejects curator applications, moderates the platform.

---

## Security

- All passwords hashed with bcrypt; no plaintext storage.
- Stateless JWT sessions instead of heavy server-side session state.
- `authGuard` / `adminGuard` middleware enforce access control on every route.
- HTTP headers secured via Helmet.
- Rate limiting: 100 requests/minute per IP to mitigate brute-force and DDoS.
- Background AI cron jobs authenticate via a secret header, preventing external triggering.
- Legacy monolithic Next.js API routes fully removed — frontend and backend are completely decoupled.

---

## My Role
Sole developer — designed and built the entire system end-to-end, solo. Architected the AI matching pipeline from scratch (embedding generation, cosine similarity ranking, explainable-AI output), implemented the RAG-based chatbot, integrated Vision AI for automated photo verification, built the full Fastify backend with the JWT/RBAC security layer, and developed the Next.js frontend. No team — full-stack and AI implementation were entirely my own work.
