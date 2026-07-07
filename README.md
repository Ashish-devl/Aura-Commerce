# AURA - Premium E-Commerce Clothing Store

**Developed by Ashish**

Aura is a minimalist, modern, and high-performance e-commerce store specializing in premium lifestyle apparel. Built with a decoupled frontend/backend architecture, native security layers, and an integrated local storage engine.

---

## Key Features

- 👤 **Native JWT Authentication**: Custom sign-up and secure credentials login for both Customers and Admins. Passwords are securely salted and hashed on the backend using native PBKDF2 cryptography.
- 🛍️ **Direct Checkout & Buy Now**: Checkout is direct and instantaneous. Customers can check out their entire shopping cart or buy single products immediately using the "Buy Now" popup modal.
- 📍 **Centralized Delivery Address**: Save a default shipping address in customer profiles to automatically pre-populate information during future orders.
- 📦 **Pre-seeded Product Catalog**: Features a premium curated listing of 36 lifestyle clothing products automatically seeded into the database on the first backend run.
- ⭐ **Customer Reviews & Ratings**: Authenticated customers can submit product reviews and star ratings to share feedback.
- ❤️ **Persistent Wishlist**: Track and add items to a user-specific wishlist.
- ⚙️ **Admin Dashboard**: Manage inventory, create new products, edit descriptions/pricing, and view/fulfill order statuses from an admin panel.

---

## Tech Stack

### Frontend
- **Framework**: React (v19) with Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion / Motion

### Backend
- **Framework**: Express (Node.js)
- **Database**: Local JSON-based persistent file database (`backend/data/`)
- **Cryptography**: Native Node.js `crypto` module (no binary dependencies) for password hashing and JWT encoding/decryption.

---

## Project Structure

```
Aura-Commerce/
├── backend/
│   ├── data/            # Local JSON database files (users, products, orders, reviews)
│   ├── db.ts            # Persistent JSON database manager & cryptography routines
│   ├── server.ts        # Express REST API routes & middleware
│   ├── tsconfig.json    # TypeScript configurations for Node.js
│   └── package.json     # Backend dependencies
├── frontend/
│   ├── src/             # Vite + React client source code
│   │   ├── components/  # Page-level views and layouts
│   │   ├── context/     # Auth and Cart state contexts
│   │   ├── lib/         # Rest API helper and client-side utilities
│   │   └── types.ts     # Data structure type interfaces
│   ├── index.html       # Client entrance
│   ├── vite.config.ts   # Vite configuration with target proxy
│   ├── tsconfig.json    # Frontend typescript config
│   └── package.json     # Frontend dependencies
└── package.json         # Root orchestrator script runner
```

---

## How to Run Locally

### 1. Open Terminal in the Project Root
```bash
cd Aura-Commerce
```

### 2. Install Root Orchestrator
```bash
npm install
```

### 3. Install Sub-Project Dependencies
```bash
npm run install:all
```

### 4. Start Both Servers Concurrently
```bash
npm run dev
```

### 5. Access the Web App
Open your browser and navigate to:
**Vite Frontend (Port 5173)**: [http://localhost:5173](http://localhost:5173)

---

## Credentials for Testing

You can register your own account or log in instantly using the pre-seeded accounts:
- **Demo Admin Email**: `admin@aura.demo` (Password: `admin123`)
- **Demo Customer Email**: `customer@aura.demo` (Password: `customer123`)


## Live Link : https://aura-commerce-txyy.onrender.com