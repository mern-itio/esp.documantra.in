# Draft and Sign — All in One Document Management Platform

A comprehensive electronic signature platform that allows users to create, edit, sign, and manage documents with legal compliance across 40+ countries.

**Live URL:** http://165.22.215.73:8081/

---

## ✨ Features

- **Electronic Signatures** — Legally binding signatures with compliance across 40+ countries
- **PDF Tools** — 30+ free PDF manipulation tools (convert, edit, merge, compress, secure)
- **Legal Templates** — 45+ professionally drafted legal document templates
- **AI-Powered Features** — Smart document generation and editing assistance
- **Global Compliance** — Meets legal requirements for e-signatures worldwide
- **API Integration** — Developer-friendly REST APIs for automation
- **Mobile Responsive** — Works seamlessly across all devices
- **Real-time Collaboration** — Multi-user document editing and review

---

## 🛠️ Technology Stack

### Frontend
- **React 18** — Modern React with hooks and functional components
- **TypeScript** — Type-safe JavaScript development
- **Tailwind CSS** — Utility-first CSS framework
- **Vite** — Fast build tool and development server
- **Lucide React** — Beautiful and consistent icon library

### Backend (Microservices)
- **Node.js (v16+)** — Runtime for all services
- **Express.js** — REST API for each service
- **MongoDB** — Primary datastore
- **JWT** — Authentication across services
- **Docker + Docker Compose** — Containerization & orchestration
- **Nginx (Gateway)** — Reverse proxy & routing to services

### Dev Tooling
- **ESLint** — Code quality
- **Postman/Insomnia** — API testing (optional)
- **Git** — Version control

---

## 📦 Project Layout (Microservices)

```
Root/
├── Frontend/                        # Frontend app (React + TS)
├── src/                             # Old frontend structure (legacy or shared code)
│   ├── components/
│   │   ├── LandingPage/             # Landing page components
│   │   ├── AuthService/             # Authentication components
│   │   ├── DocumentService/         # Document management
│   │   ├── ESignService/            # E-signature functionality
│   │   ├── PDFService/              # PDF tools and services
│   │   └── TemplateService/         # Legal templates
│   ├── pages/                       # Route pages
│   ├── layouts/                     # Layout components
│   └── assets/                      # Static assets
├── public/                          # Public assets
├── package.json                     # Frontend dependencies and scripts
├── tailwind.config.js               # Tailwind configuration
├── Backend/                         # Backend root (optional for orchestration)
├── package.json                     # Root package.json (workspace/monorepo)
├── .env                             # Root-level env consumed by docker-compose
├── docker-compose.yml               # Orchestrates all services + gateway + db
├── services/                        # All backend microservices
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── routes/
│   │       ├── controllers/
│   │       ├── models/
│   │       └── middlewares/
│   ├── document-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/ ...
│   ├── esign-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/ ...
│   ├── pdf-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/ ...
│   └── template-service/
│       ├── Dockerfile
│       ├── package.json
│       └── src/ ...
```

> **Note:** Each microservice has its own `Dockerfile`, `package.json`, and `src/` implementation. The root `docker-compose.yml` orchestrates all services, MongoDB, and the gateway.

---

## 🔧 Environment Variables

Create a root `.env` (used by `docker-compose.yml`) and per-service `.env` files if needed.

**Root .env:**
```env
JWT_SECRET=change_me
CORS_ORIGIN=*
PORT_GATEWAY=8081
PORT_FRONTEND=5173
PORT_AUTH=2101
PORT_DOCUMENT=2102
PORT_ESIGN=2103
PORT_PDF=2104
PORT_TEMPLATE=2105
MONGO_URI=mongodb://mongo:27017/draftsign
```

**Frontend (`Frontend/.env`):**
```env
VITE_APP_NAME=Draft and Sign
VITE_API_URL=http://localhost:8081
```

**Service example (`services/auth-service/.env`):**
```env
PORT=2101
MONGO_URI=mongodb://mongo:27017/draftsign
JWT_SECRET=${JWT_SECRET}
CORS_ORIGIN=${CORS_ORIGIN}
SERVICE_NAME=auth-service
```

---

## 🐳 Docker — Build & Run (All Services)

**Build everything:**
```bash
docker compose build --no-cache
```

**Start everything:**
```bash
docker compose up -d
```

**Stop & clean:**
```bash
docker compose down
```

---

## ▶️ Running Individually (Dev Mode)

**Frontend:**
```bash
cd Frontend
npm install
npm run dev # opens http://localhost:5173
```

**Auth Service:**
```bash
cd services/auth-service
npm install
npm run dev # runs on port from .env (e.g., 2101)
```

Repeat for `document-service`, `esign-service`, `pdf-service`, `template-service`.

---

## 🌍 API Gateway

All traffic goes through **gateway** (Nginx or Express).

**Frontend config:**
```env
VITE_API_URL=http://localhost:8081
```

---

## 📱 Responsive Frontend

- Desktop (1024px+)
- Tablet (768px–1023px)
- Mobile (320px–767px)

---

## ⚙️ Scripts

### Frontend
- `npm run dev` — Start dev server
- `npm run build` — Build production bundle
- `npm run preview` — Preview production build

### Backend (per service)
- `npm run dev` — Run dev mode
- `npm run start` — Run production

### Docker
- `docker compose build --no-cache` — Build all services
- `docker compose up -d` — Start everything
- `docker compose down` — Stop & clean

---

## 🚀 Deployment

- Use **DigitalOcean**, AWS, or similar cloud
- Expose only the **gateway**
- Use persistent DB (Managed MongoDB or mounted volume)

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

**Made with ❤️ by the Draft and Sign Team**

