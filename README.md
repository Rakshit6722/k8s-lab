# K8s Microservices Demo

A complete Kubernetes microservices architecture with MongoDB integration, API Gateway, and React frontend.

## Architecture Overview

```
┌─────────────────┐
│   React UI      │ (Port 80)
│   (Frontend)    │
└────────┬────────┘
         │
┌────────▼────────────────┐
│   API Gateway           │ (Port 3000)
│ - Request Logging       │
│ - Service Proxying      │
│ - Flow Aggregation      │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │          │
┌───▼──┐   ┌──▼───┐
│User  │   │Project│ (Ports 3001, 3002)
│Service   │Service│
│MongoDB   │MongoDB│
└──────┘   └──────┘
```

## Services

### 1. User Service
**Port:** 3001

**Database:** MongoDB (`usersdb`)

**Endpoints:**
- `GET /health` - Health check
- `GET /info` - Service metadata (name, pod, timestamp)
- `GET /users` - Fetch all users from MongoDB
- `POST /users` - Create new user (requires JSON body)

**Schema:**
```json
{
  "name": "string",
  "email": "string"
}
```

### 2. Project Service
**Port:** 3002

**Database:** MongoDB (`projectsdb`)

**Endpoints:**
- `GET /health` - Health check
- `GET /info` - Service metadata (name, pod, timestamp)
- `GET /projects` - Fetch all projects from MongoDB
- `POST /projects` - Create new project (requires JSON body)

**Schema:**
```json
{
  "name": "string",
  "description": "string",
  "status": "string"
}
```

### 3. API Gateway
**Port:** 3000

**Endpoints:**
- `GET /health` - Health check
- `GET /info` - Gateway metadata (name, pod, timestamp)
- `GET /api/users` - Proxies to User Service
- `POST /api/users` - Proxies to User Service
- `GET /api/projects` - Proxies to Project Service
- `POST /api/projects` - Proxies to Project Service
- `GET /api/flow` - Aggregates /info from both downstream services

**Flow Endpoint Response:**
```json
{
  "gateway": {
    "service": "API Gateway",
    "pod": "gateway-pod-name",
    "timestamp": "ISO timestamp"
  },
  "downstream": [
    {
      "service": "User Service",
      "pod": "user-service-pod",
      "timestamp": "ISO timestamp"
    },
    {
      "service": "Project Service",
      "pod": "project-service-pod",
      "timestamp": "ISO timestamp"
    }
  ]
}
```

### 4. Frontend (React)
**Port:** 80

**Components:**
- **FlowDashboard** - Displays service topology and health
  - Auto-fetches `/api/flow` on mount
  - Shows gateway and downstream service cards
  - Refresh button to update pod information
  - Real-time pod name updates

## Project Structure

```
.
├── services/
│   ├── users/
│   │   ├── index.js          # Express app with MongoDB
│   │   ├── package.json      # Dependencies (express, mongoose)
│   │   └── Dockerfile        # Alpine-based Node image
│   └── projects/
│       ├── index.js          # Express app with MongoDB
│       ├── package.json      # Dependencies (express, mongoose)
│       └── Dockerfile        # Alpine-based Node image
├── gateway/
│   ├── index.js              # API Gateway with proxying
│   ├── package.json          # Dependencies (express, axios)
│   └── Dockerfile            # Alpine-based Node image
├── frontend/
│   └── demo-frontend/
│       ├── src/
│       │   ├── App.jsx        # Main React component
│       │   ├── FlowDashboard.jsx # Service topology view
│       │   ├── App.css        # Styling
│       │   ├── index.css      # Global styles
│       │   └── main.jsx       # Entry point
│       ├── public/            # Static assets
│       ├── package.json       # Dependencies (react, vite)
│       ├── Dockerfile         # Multi-stage: Node build + Nginx serve
│       ├── nginx.conf         # Nginx reverse proxy config
│       ├── vite.config.js     # Vite bundler configuration
│       └── index.html         # HTML template
├── k8s/                       # Kubernetes manifests
│   ├── users/                 # User Service K8s manifests
│   ├── projects/              # Project Service K8s manifests
│   ├── gateway/               # API Gateway K8s manifests
│   └── frontend/              # Frontend K8s manifests
├── mongo/                     # MongoDB configuration (optional)
├── .gitignore                 # Git ignore patterns
└── README.md                  # This file
```

## Setup & Running

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (for containerized deployment)
- MongoDB 5.0+ (local or containerized)
- Kubernetes cluster (for K8s deployment)
- kubectl CLI (for Kubernetes management)

### Local Development

**1. Start MongoDB:**
```bash
# Using Docker
docker run -d --name mongodb -p 27017:27017 mongo:latest

# Or use local MongoDB if installed
mongod
```

**2. Start User Service:**
```bash
cd services/users
npm install
npm start
```

**3. Start Project Service:**
```bash
cd services/projects
npm install
npm start
```

**4. Start API Gateway:**
```bash
cd gateway
npm install
npm start
```

**5. Start Frontend (in separate terminal):**
```bash
cd frontend/demo-frontend
npm install
npm run dev
```

Access frontend at `http://localhost:5173` (Vite dev server)

### Docker Deployment

**Build all services:**
```bash
# User Service
cd services/users && docker build -t user-service:1.0 .

# Project Service
cd services/projects && docker build -t project-service:1.0 .

# API Gateway
cd gateway && docker build -t api-gateway:1.0 .

# Frontend
cd frontend/demo-frontend && docker build -t demo-frontend:1.0 .
```

**Run with Docker Compose:**
```bash
docker-compose up -d
```

Services will be available at:
- Frontend: `http://localhost`
- API Gateway: `http://localhost:3000`
- User Service: `http://localhost:3001`
- Project Service: `http://localhost:3002`
- MongoDB: `localhost:27017`

### Kubernetes Deployment

**Apply all manifests at once:**
```bash
kubectl apply -f k8s/ -R
```

Or apply individually:
```bash
kubectl apply -f k8s/users/
kubectl apply -f k8s/projects/
kubectl apply -f k8s/gateway/
kubectl apply -f k8s/frontend/
```

**Check deployments:**
```bash
kubectl get pods
kubectl get services
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

**Access services via port-forward:**
```bash
# API Gateway
kubectl port-forward service/gateway-service 3000:3000

# Frontend
kubectl port-forward service/frontend-service 8080:80

# User Service
kubectl port-forward service/user-service 3001:3001

# Project Service
kubectl port-forward service/project-service 3002:3002
```

## Environment Variables

| Service | Variable | Default | Purpose |
|---------|----------|---------|---------|
| User Service | MONGO_URI | mongodb://localhost:27017/usersdb | MongoDB connection string |
| Project Service | MONGO_URI | mongodb://localhost:27017/projectsdb | MongoDB connection string |
| All Services | HOSTNAME | (auto) | Pod name in Kubernetes environment |

## Testing

**Health checks:**
```bash
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Project Service
curl http://localhost:3000/health  # API Gateway
```

**Fetch all users:**
```bash
curl http://localhost:3000/api/users
```

**Create a user:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

**Fetch all projects:**
```bash
curl http://localhost:3000/api/projects
```

**Create a project:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Project Alpha","description":"New initiative","status":"Planning"}'
```

**Get aggregated service flow:**
```bash
curl http://localhost:3000/api/flow
```

**Get service info:**
```bash
curl http://localhost:3001/info  # User Service info
curl http://localhost:3002/info  # Project Service info
curl http://localhost:3000/info  # Gateway info
```

## Logging

All services log incoming requests with:
- Timestamp (ISO 8601 format)
- HTTP method (GET, POST, etc)
- Request path
- Pod name (in Kubernetes environment)

Example log output:
```
[2026-01-09T10:30:45.123Z] [gateway-abc123] GET /api/flow
[2026-01-09T10:30:45.456Z] [user-service-xyz789] GET /info
[2026-01-09T10:30:45.789Z] [project-service-def456] GET /info
```

## API Gateway Logging

The API Gateway provides enhanced logging that includes:
- Request timestamp
- Gateway pod identifier
- HTTP method
- Request path
- Service name: "API Gateway"

This allows for complete request tracing across the microservices architecture.

## Frontend Features

**FlowDashboard Component:**
- Automatic data fetching on component mount
- Displays gateway information card
- Shows all downstream services information
- Real-time pod name display from `/api/flow` endpoint
- Refresh button for manual updates
- Loading and error states
- Responsive design with flexbox layout
- No external UI libraries (pure CSS)

## Troubleshooting

### MongoDB Connection Errors
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Verify connection
mongosh mongodb://localhost:27017
```

### Service Won't Start
```bash
# Check logs
docker logs <container-id>
kubectl logs <pod-name>

# Verify port availability
netstat -tulpn | grep :3001
```

### Frontend Can't Reach Gateway
- **Development:** Ensure all services running on localhost
- **Kubernetes:** Verify service DNS (format: `service-name:port`)
- **Docker Compose:** Services communicate via service name
- **Check NetworkPolicy:** If enabled, verify ingress rules

### Pod Not Getting HOSTNAME
- Verify running in Kubernetes environment
- Check pod spec has `spec.containers[].env` with `HOSTNAME` from metadata
- Fallback to "unknown" if not set

## Dependencies

### User & Project Services
- `express` ^5.2.1 - Web framework
- `mongoose` ^8.1.0 - MongoDB ODM

### API Gateway
- `express` ^5.2.1 - Web framework
- `axios` ^1.6.2 - HTTP client for service proxying

### Frontend
- `react` - UI library
- `vite` - Build tool & dev server
- `eslint` - Code linting

## Database

Both services use MongoDB with separate databases:
- User Service: `usersdb` collection: `users`
- Project Service: `projectsdb` collection: `projects`

Mongoose schemas include automatic timestamps (`createdAt`, `updatedAt`).

## Notes

- **No authentication/authorization** - This is a demo project
- **MongoDB persistence** - Uses volumes in both local and K8s deployments
- **In-memory error handling** - Errors logged to stdout, not persistent
- **CORS not configured** - Add if exposing to external origins
- **No request validation** - POST endpoints accept any JSON

## Git Workflow

Ignore large directories:
```bash
# Remove already-tracked node_modules
git rm -r --cached "**/node_modules"

# Ignore build artifacts
git rm -r --cached "**/dist"
git rm -r --cached "**/build"

# Commit changes
git commit -m "Remove build artifacts from tracking"
```

The [`.gitignore`](.gitignore) file prevents these from being added again.

## License

MIT

---

**Created:** January 2026  
**Demo Repository:** Kubernetes & Microservices Learning Lab

## Progress Log

### January 12, 2026 - Ingress Controller Setup

**Configured Kubernetes Ingress:**
- Set up NGINX Ingress Controller for routing external traffic
- Created [`ingress.yaml`](k8s/ingress-controller/ingress.yaml) with path-based routing:
  - `/` routes to `frontend-service:80` - React UI
  - `/api` routes to `gateway-service:3000` - API Gateway
- Used `Prefix` path type for flexible routing
- Configured `ingressClassName: nginx` for proper controller selection

**Port Forwarding:**
- Successfully tested services using `kubectl port-forward`
- Frontend accessible via `kubectl port-forward svc/frontend-service 8080:80`
- Troubleshot port conflicts (8080 already in use)
- Learned process management: `pkill -f "kubectl port-forward"` to clean up port-forward processes

**Next Steps:**
- Deploy Ingress Controller to cluster
- Test external access through Ingress
- Configure domain/host-based routing if needed
