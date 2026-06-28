# Mini-Projet Microservices — Plateforme TODO Collaborative

## Contexte

Construire une plateforme de gestion de tâches collaboratives en architecture microservices.
Projet universitaire Master IGOV — UM5 Rabat. Deadline : 15 Juillet 2026.

---

## Stack Technique

- **Node.js + Express** : auth-service, todo-service, comment-service, statistics-service
- **Python + FastAPI** : user-service, category-service
- **React + Vite + Tailwind CSS** : frontend
- **MongoDB** : bases de données pour tous les services Node.js
- **PostgreSQL** : bases de données pour tous les services Python
- **NGINX** : API Gateway 
- **Docker + Docker Compose** : conteneurisation de tous les services

---

## Règles Obligatoires

- Chaque service a son propre `Dockerfile`
- Aucune valeur sensible hardcodée — tout dans des variables d'environnement via `.env`
- Les mots de passe sont hashés avec bcrypt (rounds = 12)
- Chaque service expose `GET /health` → `{ "status": "ok", "service": "<nom>" }`
- Toutes les réponses API suivent ce format :
  - Succès : `{ "success": true, "data": {}, "message": "..." }`
  - Erreur : `{ "success": false, "error": "...", "code": 400 }`
- **Toute communication inter-services passe par NGINX** — les services appellent `http://nginx/api/...`, jamais directement entre eux
- CORS géré uniquement dans NGINX, pas dans les services individuels
- Toujours me soliciter a chaque prise de decision d'architecture ou chaque autre decision importante au deroulement du projet 
- a chaque realisation ou chaque etape , reli les instruction et update le fichier instruction.md par les taches deja faites et les taches restantes 

---

## Architecture des Ports

| Service | Technologie | Port interne | Base de données |
|---------|-------------|--------------|-----------------|
| auth-service | Node.js | 3001 | MongoDB — auth_db |
| user-service | Python | 8001 | PostgreSQL — user_db |
| todo-service | Node.js | 3002 | MongoDB — todo_db |
| category-service | Python | 8002 | PostgreSQL — category_db |
| comment-service | Node.js | 3003 | MongoDB — comment_db |
| statistics-service | Node.js | 3004 | MongoDB — stats_db |
| notification-service | Node.js | 3005 | MongoDB — notification_db |
| frontend | React (build) | 80 | — |
| nginx | — | 80 (exposé) | — |

---

## Corrections appliquées (bugs résolus)

> Bugs trouvés et corrigés lors de la phase de test (Task 11) :

1. **`docker-compose.yml` — attribut `version` obsolète** : supprimé (warning Docker Compose).
2. **`docker-compose.yml` — `DATABASE_URL` pour les services Python** : corrigé `postgresql://` → `postgresql+asyncpg://` (requis par SQLAlchemy asyncio + asyncpg).
3. **`nginx/nginx.conf` — trailing slash dans les `location` blocks** : `location /api/todos/` causait un redirect 301 vers `/api/todos/`, l'Authorization header était perdu sur le redirect → 401. Corrigé en supprimant les trailing slashes : `location /api/todos`, `location /api/users`, etc.
4. **`todo-service` et `comment-service` — middleware auth** : lisaient `response.data.valid` et `response.data.userId` au lieu de `response.data.data.valid` et `response.data.data.userId` (la réponse `/api/auth/verify` encapsule les données dans un champ `data`). Corrigé dans `src/middleware/auth.js` des deux services.

> Bugs trouvés et corrigés lors de la phase d'utilisation (post Task 11) :

5. **`nginx/nginx.conf` — FastAPI 307 redirect sur `/api/categories/` et `/api/users/`** : Le navigateur envoyait les requêtes avec trailing slash (`/api/categories/`). FastAPI retournait un **307 Temporary Redirect** vers `/api/categories`. Lors du suivi du redirect, le header `Authorization: Bearer ...` était perdu → category-service retournait 401 → `Promise.all` échouait → "Impossible de charger les données." affiché sur Dashboard et Todos. Corrigé en ajoutant `rewrite ^(/api/categories)/$ $1 break;` et `rewrite ^(/api/users)/$ $1 break;` dans les location blocks NGINX correspondants, pour normaliser le trailing slash avant de proxifier vers FastAPI.
6. **`frontend/src/pages/Dashboard.jsx` — noms de champs stats incorrects** : Le Dashboard lisait `stats?.total`, `stats?.byStatus?.done`, `stats?.overdue` mais le statistics-service retourne `totalTasks`, `byStatus.completed`, `overdueTasks`. Les compteurs affichaient toujours 0. Corrigé.
7. **`frontend/src/pages/Todos.jsx` — valeurs de statut incorrectes dans les filtres** : Les filtres utilisaient `'todo'` et `'done'` mais le modèle MongoDB utilise `'pending'` et `'completed'`. Les filtres ne retournaient aucun résultat. Corrigé.
8. **`frontend/vite.config.js` — proxy dev pointe vers `http://nginx`** : En mode développement (`npm run dev`), le proxy `/api` pointait vers `http://nginx` (hostname Docker interne, non résolvable sur la machine hôte) → toutes les requêtes API échouaient avec une erreur réseau. Corrigé en `http://localhost`.

---

## Statut des tâches

### ✅ TASK 1 — Infrastructure de base

- ✅ Fichier `.env` à la racine avec : `JWT_SECRET`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`
- ✅ `docker-compose.yml` avec les 11 services (9 app + mongodb + postgres)
- ✅ Dossier `postgres-init/` avec `init.sql` : `CREATE DATABASE user_db` + `CREATE DATABASE category_db`
- ✅ Réseau Docker `microservices-network` (bridge)
- ✅ Seul NGINX expose le port 80 à l'extérieur
- ✅ Volumes persistants : `mongo_data`, `postgres_data`
- ✅ `NGINX_URL=http://nginx` déclaré dans chaque service

---

### ✅ TASK 2 — NGINX API Gateway

- ✅ `nginx/nginx.conf` créé
- ✅ Gzip activé (`gzip on`, types json/text, min 1000 bytes)
- ✅ Headers CORS sur toutes les routes `/api/*` (Allow-Origin, Methods, Headers)
- ✅ Requêtes OPTIONS gérées avec `return 204`
- ✅ Routes configurées (sans trailing slash pour éviter les redirects 301) :
  - `/api/auth` → `http://auth-service:3001`
  - `/api/users` → `http://user-service:8001`
  - `/api/todos` → `http://todo-service:3002`
  - `/api/categories` → `http://category-service:8002`
  - `/api/comments` → `http://comment-service:3003`
  - `/api/stats` → `http://statistics-service:3004`
  - `/api/notifications` → `http://notification-service:3005`
  - `/` → `http://frontend:80`
- ✅ `nginx/Dockerfile` (FROM nginx:alpine, COPY nginx.conf)

---

### ✅ TASK 3 — Auth-Service

- ✅ `auth-service/` Node.js + Express + Mongoose, port 3001, MongoDB `auth_db`
- ✅ Modèle `User` : name, email, password (bcrypt rounds=12), refreshToken, createdAt
- ✅ `POST /api/auth/register` — validation, hash, création, appel interne `/api/users/internal`, JWT 15min + refreshToken 7j
- ✅ `POST /api/auth/login` — vérification bcrypt, génération tokens, stockage refreshToken
- ✅ `POST /api/auth/logout` — mise à null du refreshToken
- ✅ `POST /api/auth/refresh` — vérification refreshToken, nouveau JWT
- ✅ `GET /api/auth/verify` — décodage JWT, retourne `{ valid, userId, email }`
- ✅ `GET /api/auth/health`

---

### ✅ TASK 4 — User-Service

- ✅ `user-service/` Python + FastAPI + SQLAlchemy async + asyncpg, port 8001, PostgreSQL `user_db`
- ✅ Table `users` : id (VARCHAR/même ID MongoDB), email, name, avatar_url, bio, created_at, updated_at
- ✅ Création automatique des tables au démarrage (`lifespan`)
- ✅ `POST /api/users/internal` — création profil par auth-service (sans JWT)
- ✅ `GET /api/users/{user_id}` — profil (JWT requis)
- ✅ `PUT /api/users/{user_id}` — modification name/avatar_url/bio (JWT + ownership)
- ✅ `DELETE /api/users/{user_id}` — suppression (JWT + ownership)
- ✅ `GET /api/users/health`
- ✅ Middleware auth via `GET http://nginx/api/auth/verify`

---

### ✅ TASK 5 — TODO-Service

- ✅ `todo-service/` Node.js + Express + Mongoose, port 3002, MongoDB `todo_db`
- ✅ Modèle `Todo` : userId, title, description, priority (low/medium/high/urgent), status (pending/in_progress/completed/cancelled), dueDate, categoryId, createdAt, updatedAt
- ✅ Middleware auth : extrait JWT, appelle `/api/auth/verify`, injecte `req.user = { userId, email }`
- ✅ `GET /api/todos` — liste tâches de l'utilisateur (filtres status/priority/categoryId)
- ✅ `POST /api/todos` — création
- ✅ `GET /api/todos/:id` — détail (ownership check)
- ✅ `PUT /api/todos/:id` — modification (ownership check)
- ✅ `DELETE /api/todos/:id` — suppression (ownership check)
- ✅ `GET /api/todos/overdue` — tâches en retard (sans JWT, appel interne)
- ✅ `GET /api/todos/health`

---

### ✅ TASK 6 — Category-Service

- ✅ `category-service/` Python + FastAPI + SQLAlchemy async + asyncpg, port 8002, PostgreSQL `category_db`
- ✅ Table `categories` : id (UUID), name, color (hex, défaut #3B82F6), icon, user_id (NULL = globale), created_at
- ✅ Seed au démarrage des 5 catégories globales : Travail 💼, Personnel 🏠, Urgent 🚨, Shopping 🛒, Santé 💊
- ✅ `GET /api/categories` — globales + personnalisées (JWT)
- ✅ `POST /api/categories` — création personnalisée (JWT)
- ✅ `PUT /api/categories/{id}` — modification (JWT + ownership, pas les globales)
- ✅ `DELETE /api/categories/{id}` — suppression (JWT + ownership, pas les globales)
- ✅ `GET /api/categories/health`

---

### ✅ TASK 7 — Comment-Service

- ✅ `comment-service/` Node.js + Express + Mongoose, port 3003, MongoDB `comment_db`
- ✅ Modèle `Comment` : todoId, userId, authorName, content (max 1000), createdAt, updatedAt
- ✅ `GET /api/comments/todo/:todoId` — commentaires d'une tâche (JWT)
- ✅ `POST /api/comments` — ajout commentaire (JWT), authorName depuis email
- ✅ `PUT /api/comments/:id` — modification content (JWT + ownership)
- ✅ `DELETE /api/comments/:id` — suppression (JWT + ownership)
- ✅ `GET /api/comments/health`

---

### ✅ TASK 8 — Statistics-Service

- ✅ `statistics-service/` Node.js + Express + Mongoose, port 3004, MongoDB `stats_db`
- ✅ Modèle `StatsCache` : userId, data, generatedAt (TTL 300s)
- ✅ `GET /api/stats/user/:userId` (JWT + ownership) :
  1. Vérification cache MongoDB (TTL 5min)
  2. Appel interne `GET /api/todos` via NGINX
  3. Calcul : totalTasks, completionRate, byStatus, byPriority, byCategory, weeklyEvolution (7j), overdueTasks
  4. Upsert cache + retour
- ✅ `GET /api/stats/health`

---

### ✅ TASK 9 — Notification-Service (BONUS)

- ✅ `notification-service/` Node.js + Express + Mongoose + node-cron, port 3005, MongoDB `notification_db`
- ✅ Modèle `Notification` : userId, todoId, todoTitle, type (overdue/due_soon), isRead, createdAt
- ✅ Cron job toutes les heures : appel `/api/todos/overdue`, création notifications sans doublons
- ✅ `GET /api/notifications/:userId` — non lues en premier (JWT + ownership)
- ✅ `PUT /api/notifications/:id/read` — marquer comme lue (JWT)
- ✅ `DELETE /api/notifications/clear/:userId` — supprimer les lues (JWT)
- ✅ `GET /api/notifications/health`

---

### ✅ TASK 10 — Frontend React

- ✅ `frontend/` React 18 + Vite + Tailwind CSS + recharts, build multi-stage Docker
- ✅ Instance axios centralisée (`/api` baseURL, intercepteur Bearer token, auto-logout 401)
- ✅ AuthContext (login/logout, persistance localStorage, isAuthenticated)
- ✅ ProtectedRoute (redirect `/login` si non authentifié)
- ✅ Pages : `/login`, `/register`, `/` (Dashboard), `/todos`, `/todos/:id`, `/stats`, `/profile`, `/notifications`
- ✅ Composants : `Navbar`, `TaskCard`, `CategoryBadge`, `PriorityBadge`, `StatCard`
- ✅ Dashboard : 4 StatCards + 5 tâches récentes
- ✅ Stats : 4 graphiques recharts (pie statut, bar priorité, line hebdo, pie catégorie)

---

### ✅ TASK 11 — Vérification finale

- ✅ `docker-compose up --build` : tous les 11 containers démarrent sans crash
- ✅ Tous les `/health` répondent `{ "status": "ok" }`
- ✅ `POST /api/auth/register` → JWT + refreshToken retournés, profil créé dans PostgreSQL
- ✅ `POST /api/auth/login` → JWT valide retourné
- ✅ `GET /api/auth/verify` → `{ valid: true, userId, email }`
- ✅ `GET /api/users/{id}` → profil PostgreSQL retourné
- ✅ `GET /api/categories` → 5 catégories globales retournées
- ✅ `GET /api/todos` → liste des tâches retournée
- ✅ `GET /api/stats/user/{id}` → statistiques calculées et mises en cache
- ✅ `GET /` → application React servie par NGINX

---

## Tâches restantes

Aucune tâche obligatoire restante. Le projet est fonctionnel et déployable.

**Améliorations possibles (hors scope initial) :**
- Tests end-to-end automatisés (Jest, Playwright)
- CI/CD pipeline (GitHub Actions)
- Rate limiting dans NGINX
- Refresh token automatique côté frontend (intercepteur axios)
- Pagination sur les listes de tâches et commentaires
