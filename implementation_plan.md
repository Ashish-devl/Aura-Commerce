# Implementation Plan - Add Product Subcategories

Add a `subCategory` field to products. This includes updating the PostgreSQL database schema, backend API routes, admin product creation form, and the frontend search/filter behavior on the home page.

## Proposed Changes

### Database Layer

#### [MODIFY] [backend/db.ts](file:///c:/Test/antigravity/Aura-Commerce/backend/db.ts)
- Modify `initDB` to alter the `products` table, adding a `sub_category VARCHAR(100) DEFAULT ''` column if it does not already exist.
- Update `mapProductFromDB` to map the `sub_category` DB column to the `subCategory` Javascript object property.
- Update `dbProducts.create` and `dbProducts.update` to save and update the `sub_category` column in PostgreSQL.

---

### Backend API

#### [MODIFY] [backend/types.ts](file:///c:/Test/antigravity/Aura-Commerce/backend/types.ts)
- Add `subCategory: string` to the `Product` interface.

#### [MODIFY] [backend/server.ts](file:///c:/Test/antigravity/Aura-Commerce/backend/server.ts)
- Update the `POST /api/products` endpoint to destructure `subCategory` from `req.body` and pass it to the DB insertion.

---

### Frontend Layer

#### [MODIFY] [frontend/src/types.ts](file:///c:/Test/antigravity/Aura-Commerce/frontend/src/types.ts)
- Add `subCategory?: string` to the `Product` interface.

#### [MODIFY] [frontend/src/components/AdminDashboard.tsx](file:///c:/Test/antigravity/Aura-Commerce/frontend/src/components/AdminDashboard.tsx)
- Define a lookup map of subcategories for each category:
  - **Men**: Shirts, Pants, Accessories
  - **Women**: Shirts, Pants, Accessories
  - **Kids**: Shirts, Pants, Accessories
  - **Accessories**: Bags, Caps, Socks, Others
  - **Footwear**: Sneakers, Formal, Casual, Others
- Add a new form state `subCategory` (defaulting to the first subcategory of the active category).
- Add a Subcategory dropdown to the product creation form. This dropdown dynamically renders options based on the selected Category.
- Update the inventory table to show the subcategory of each product.

#### [MODIFY] [frontend/src/components/Home.tsx](file:///c:/Test/antigravity/Aura-Commerce/frontend/src/components/Home.tsx)
- Update the product filtering logic so that the `subCategory` URL filter is correctly applied even when `searchTerm` is empty.
- Match on `product.subCategory` directly first, and keep the dynamic name-checking logic as a fallback for legacy/seeded products.

---

## Verification Plan

### Manual Verification
1. Start frontend and backend development servers (if not already running).
2. Log in as an admin (`admin@aura.demo` / `admin123`).
3. Navigate to the Admin Dashboard and verify the **Add New Product** form.
4. Try to add a new product under category "Men" and subcategory "Shirts".
5. Verify the product appears in the Inventory table showing its category and subcategory.
6. Navigate to the homepage, click on "Men" -> "Shirts & Tops" in the navigation bar, and verify that the newly added shirt is displayed correctly.
