 ██████  ██████  ██████  ██ ████████
██    ██ ██   ██ ██   ██ ██    ██
██    ██ ██████  ██████  ██    ██
██    ██ ██   ██ ██   ██ ██    ██
 ██████  ██   ██ ██████  ██    ██

**Tagline:** "Where tasks don't pile up — they orbit."

## What Is Orbit?
Orbit is a team task manager that makes organizing work feel fast, visual, and entirely stress-free. Instead of staring at endless, boring lists, your projects become vibrant "planets" and your tasks become items that orbit them. It solves the problem of teams feeling overwhelmed by complex tools, offering a lightning-fast way to see exactly who is doing what. Whether you're planning a marketing launch or a software update, Orbit keeps everyone perfectly in sync without the clutter.

## Live Demo
🌐 **Live App:**     https://orbit-frontend.up.railway.app
🔌 **API Base URL:** https://orbit-backend.up.railway.app

| Role   | Email             | Password |
|--------|-------------------|----------|
| Admin  | admin@orbit.app   | demo1234 |
| Member | member@orbit.app  | demo1234 |

## Key Features

🚀 **For Everyone**
* Interactive kanban boards with drag-and-drop
* Real-time task status updates
* Mobile-friendly, beautiful dark-mode interface
* See exactly what you need to do today

🛡️ **Admin Powers**
* Create and manage new "Planets" (projects)
* Invite new team members via email
* Assign roles (Admin vs Member)
* See team-wide progress at a glance

⚡ **Speed Features**
* **Quick Launch Bar**: Press `/` anywhere to add a task in under 3 seconds
* **Land It**: One-click button to instantly mark a task complete from the dashboard
* No modal fatigue — sliding side panels keep you in the flow

📊 **Dashboard & Insights**
* Live circular progress rings showing project health
* Instant alerts for overdue "Lost in Space" tasks
* Workload overview to see who is overloaded

## UML Diagrams

### a) Use Case Diagram
This diagram shows the different actions that Admins, Members, and Guests can take within the app. Think of it as a menu of features available depending on who you are logged in as.

```mermaid
usecaseDiagram
actor Guest
actor Member
actor Admin

Guest --> (Sign Up / Login)
Member --> (View Dashboard)
Member --> (View Planets)
Member --> (Create Orbiters)
Member --> (Move Orbiters)
Member --> (Quick Launch Task)
Admin --> (Create Planets)
Admin --> (Invite Members)
Admin --> (Change Member Roles)
Admin --> (View Dashboard)
Admin --> (Create Orbiters)
```
> ⚠️ Note: Mermaid's native usecase syntax is experimental, so here is a structural equivalent using flowchart:

```mermaid
flowchart LR
    Guest([Guest]) --> Login([Sign Up / Login])
    
    Member([Member]) --> Dashboard([View Dashboard])
    Member --> Planets([View Planets])
    Member --> Tasks([Create & Move Orbiters])
    Member --> QuickLaunch([Use Quick Launch '/'])
    
    Admin([Admin]) --> CreatePlanet([Create Planets])
    Admin --> Invite([Invite Members & Set Roles])
    Admin --> Dashboard
    Admin --> Planets
    Admin --> Tasks
```

### b) Entity Relationship Diagram (ERD)
This illustrates how our database tables connect to one another. For example, it shows that a Project can have many Tasks, and many Users can be members of a Project.

```mermaid
erDiagram
    USER ||--o{ PROJECT_MEMBER : has
    USER ||--o{ TASK : assigned_to
    PROJECT ||--o{ PROJECT_MEMBER : contains
    PROJECT ||--o{ TASK : owns
    
    USER {
        string id PK
        string name
        string email
        string password
        string role "ADMIN or MEMBER"
    }
    
    PROJECT {
        string id PK
        string name
        string description
        string color
        string ownerId FK
    }
    
    PROJECT_MEMBER {
        string id PK
        string userId FK
        string projectId FK
        string role
    }
    
    TASK {
        string id PK
        string title
        string description
        string status "TODO, IN_PROGRESS, DONE"
        string priority
        dateTime dueDate
        string projectId FK
        string assigneeId FK
    }
```

### c) System Architecture Diagram
This shows the big picture of how the different pieces of technology talk to each other. It traces the path from the user clicking a button in their browser all the way to the database saving the information in the cloud.

```mermaid
flowchart TD
    Browser[Browser / Client] -->|HTTP Requests| React[React Frontend Vite + Tailwind]
    React -->|REST API via Axios| Express[Express.js API Backend]
    Express -->|Prisma ORM Queries| Postgres[(PostgreSQL Database)]
    
    subgraph Railway Cloud
        React
        Express
        Postgres
    end
```

### d) API Flow Diagram
This is a step-by-step timeline of what happens behind the scenes when a user logs in and asks to see their tasks. It shows how the system securely checks who they are before handing over the data.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthMiddleware
    participant TaskController
    participant Database

    User->>Frontend: Enter credentials
    Frontend->>AuthMiddleware: POST /api/auth/login
    AuthMiddleware->>Database: Verify User & Password
    Database-->>AuthMiddleware: User Valid
    AuthMiddleware-->>Frontend: Return JWT Token

    User->>Frontend: View Tasks
    Frontend->>AuthMiddleware: GET /api/tasks (with JWT)
    AuthMiddleware->>AuthMiddleware: Verify JWT
    AuthMiddleware->>TaskController: Next()
    TaskController->>Database: Query Tasks for User
    Database-->>TaskController: Return Task Data
    TaskController-->>Frontend: JSON Response
    Frontend-->>User: Render Task List
```

### e) Task Lifecycle Diagram
This outlines the journey of a single task from creation to completion. It highlights the exact statuses a task can have, such as "Floating" or "Landed".

```mermaid
stateDiagram-v2
    [*] --> Floating: Task Created
    Floating --> InMotion: User starts working
    InMotion --> Review: Ready for check
    Review --> Landed: Approved
    InMotion --> Landed: Direct complete (Land It)
    Floating --> Landed: Direct complete (Land It)
    
    Floating --> LostInSpace: Deadline passes
    InMotion --> LostInSpace: Deadline passes
    
    LostInSpace --> Landed: Completed late
    Landed --> [*]
```

### f) Role-Based Access Control Diagram
This flowchart acts like a security checkpoint map. It shows how the system decides whether to let a user access an admin page or blocks them if they are just a regular member.

```mermaid
flowchart TD
    Request[User requests endpoint] --> AuthCheck{Has valid JWT?}
    AuthCheck -- No --> Block1[401 Unauthorized]
    AuthCheck -- Yes --> RoleCheck{Requires Admin?}
    
    RoleCheck -- No --> Allow[200 OK / Execute Controller]
    RoleCheck -- Yes --> IsAdmin{User role == ADMIN?}
    
    IsAdmin -- No --> Block2[403 Forbidden]
    IsAdmin -- Yes --> Allow
```

## Project Folder Structure
```text
/orbit
├── /backend              ← Express.js REST API server
│   ├── /src
│   │   ├── /routes       ← URL endpoints (e.g. /api/tasks)
│   │   ├── /controllers  ← Business logic for each route
│   │   ├── /middleware   ← Auth checking, role checking
│   │   └── /prisma       ← Database connection and queries
│   └── seed.js           ← Fills DB with demo data
├── /frontend             ← React web app (what users see)
│   └── /src
│       ├── /pages        ← Full page views (Dashboard, Login, etc.)
│       ├── /components   ← Reusable UI pieces (buttons, cards)
│       ├── /lib          ← Utility functions and Axios setup
│       └── /store        ← App-wide state using Zustand
└── railway.toml          ← Deployment configuration
```

## Complete API Documentation

### Auth
| Method | Endpoint | Auth Required | Role | Description | Request Body |
|--------|----------|---------------|------|-------------|--------------|
| POST | `/api/auth/register` | No | Any | Register a new user | `{ name, email, password }` |
| POST | `/api/auth/login` | No | Any | Login and get JWT | `{ email, password }` |

### Projects
| Method | Endpoint | Auth Required | Role | Description | Request Body |
|--------|----------|---------------|------|-------------|--------------|
| GET | `/api/projects` | Yes | Any | Get all user's projects | None |
| POST | `/api/projects` | Yes | Admin | Create new project | `{ name, description, color }` |
| GET | `/api/projects/:id` | Yes | Any | Get specific project details | None |

### Tasks
| Method | Endpoint | Auth Required | Role | Description | Request Body |
|--------|----------|---------------|------|-------------|--------------|
| GET | `/api/tasks` | Yes | Any | Get assigned tasks | None |
| POST | `/api/tasks` | Yes | Any | Create a new task | `{ title, projectId, priority... }` |
| PATCH | `/api/tasks/:id/status` | Yes | Any | Update task status | `{ status }` |

### Example Requests

**POST /api/auth/login**
```json
// Request
{
  "email": "admin@orbit.app",
  "password": "password123"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": { "id": "1", "name": "Admin", "role": "ADMIN" }
}
```

**POST /api/tasks**
```json
// Request
{
  "title": "Design new logo",
  "projectId": "proj_123",
  "priority": "HIGH"
}

// Response
{
  "message": "Task created successfully",
  "task": { "id": "task_456", "title": "Design new logo", "status": "TODO" }
}
```

**PATCH /api/tasks/:id/status**
```json
// Request
{
  "status": "DONE"
}

// Response
{
  "message": "Task updated",
  "task": { "id": "task_456", "status": "DONE" }
}
```

## Database Schema
"Think of this like the blueprint for our database — like designing the columns of a spreadsheet before filling it with data."

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(MEMBER)
  tasks     Task[]
  projects  ProjectMember[]
}

model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  color       String   @default("#3b82f6")
  ownerId     String
  tasks       Task[]
  members     ProjectMember[]
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  status      Status   @default(TODO)
  priority    Priority @default(MEDIUM)
  dueDate     DateTime?
  projectId   String
  assigneeId  String?
}

enum Role { ADMIN MEMBER }
enum Status { TODO IN_PROGRESS IN_REVIEW DONE }
enum Priority { LOW MEDIUM HIGH CRITICAL }
```

## Local Development Setup
1. **Clone the code to your computer.** This downloads the project folder.
2. **Copy environment variables.** This creates configuration files that hold your secret keys.
3. **Install backend tools and database.** This downloads the required software for the server to run and prepares your database.
4. **Fill the database.** This adds dummy data so you have something to look at immediately.
5. **Install frontend tools and start the app.** This prepares the website side and opens it in your browser.

```bash
git clone <repo> && cd orbit && cp backend/.env.example backend/.env && cp frontend/.env.example frontend/.env && cd backend && npm install && npx prisma migrate dev && node seed.js && cd ../frontend && npm install && npm run dev
```

## Environment Variables

### Backend (`/backend/.env`)
| Variable Name | Example Value | What It Does |
|---------------|---------------|--------------|
| `PORT` | `3000` | The port number the server runs on |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/orbit` | The connection string to access your database |
| `JWT_SECRET` | `supersecretkey` | A secret password used to create secure login tokens |

### Frontend (`/frontend/.env`)
| Variable Name | Example Value | What It Does |
|---------------|---------------|--------------|
| `VITE_API_URL` | `http://localhost:3000/api` | The web address where the frontend talks to the backend |

## Railway Deployment Guide
1. Create a Railway account and click "New Project".
2. Select "Deploy from GitHub repo" and choose your Orbit repository.
3. Add a PostgreSQL database plugin to your Railway project.
4. Set up your Environment Variables in Railway to match your `.env` files.
5. Railway will automatically detect the `railway.toml` file and build both the frontend and backend.

![Step 1 - Create Railway project](./docs/screenshots/railway-1.png)

- [x] Link GitHub Repo
- [x] Provision PostgreSQL
- [x] Set Environment Variables
- [x] Trigger Build

## How The App Works — User Journey
Meet Priya, a project manager who just discovered Orbit. She signs up as an Admin and is immediately greeted by a beautiful, deep-space themed dashboard. Wanting to organize her team's upcoming work, she creates a new planet called "Website Redesign". The planet appears as a vibrant card with a circular progress ring.

Priya invites a teammate, Alex, to the platform using his email. She then creates three tasks — or "Orbiters" — and assigns them to Alex. Later that day, Priya realizes she forgot to add a task. Instead of clicking through menus, she simply presses `/` on her keyboard. A sleek Quick Launch bar appears, and she types her task, instantly sending it into orbit. 

When Alex finishes a task, he doesn't even need to open it; he just clicks the "Land It" button directly from his dashboard. Instantly, Priya's dashboard updates, and the progress ring for "Website Redesign" fills up just a little bit more.

## Screenshots Section
* ![Login page](./docs/screenshots/login.png)
* ![Dashboard](./docs/screenshots/dashboard.png)
* ![Project (Kanban) view](./docs/screenshots/kanban.png)
* ![Quick Launch bar](./docs/screenshots/quick-launch.png)
* ![Task detail](./docs/screenshots/task-detail.png)
* ![Mobile view](./docs/screenshots/mobile.png)

## Contributing Guide
1. Fork the repository on GitHub.
2. Clone your fork locally.
3. Create a new branch using our naming conventions:
   * `feature/your-feature-name`
   * `fix/your-bug-fix`
   * `chore/minor-updates`
4. Make your changes and commit them with clear messages.
5. Push to your branch and open a Pull Request.

> 💡 Tip: Make sure to run the local dev server and test your changes before submitting!

## License & Author
This project is licensed under the MIT License.

**Credits**
* **Author:** [Your Name]
* **GitHub:** [Link to GitHub]
* **LinkedIn:** [Link to LinkedIn]
