# Lumora Candles

A full-stack online store for premium scented candles: React storefront, Express API, PostgreSQL, Prisma, Razorpay payments (test mode first), cash on delivery, and an admin dashboard.

## Features
- **Store:** home, shop with search, filters, sorting and pagination, product pages with reviews and structured data, wishlist, cart (guest and logged-in), coupons, multi-step checkout, order tracking, cancellations and refund requests.
- **Payments:** Razorpay Checkout (UPI, cards, net banking, wallets) and cash on delivery. Card details never touch this server. Totals are always calculated on the server from database prices, and payments are verified by signature, by re-checking the amount with Razorpay, and by webhook.
- **Accounts:** register, login, password reset, JWT authentication, roles (CUSTOMER, ADMIN).
- **Admin:** dashboard with charts, products with image upload, categories, orders and status updates, customers, coupons, inventory, analytics, settings.
- **Security:** helmet, CORS, rate limiting, input validation, bcrypt hashing, role checks on every admin route, no secrets in the frontend.

## Tech stack
React 18, Vite, React Router, Tailwind CSS, Axios, React Hook Form, Recharts, Lucide icons · Node.js, Express, express-validator, JWT, bcryptjs · PostgreSQL, Prisma · Docker, Docker Compose · Razorpay.

## Folder structure
```
lumora-candles/
├── client/          React app (src/pages, components, context, admin, services, utils)
├── server/          Express API (src/controllers, routes, services, middleware, validators, config)
│   ├── prisma/      schema.prisma, migrations, seed.js
│   └── scripts/     smoke-test.js
├── docker-compose.yml
├── .env.example
└── README.md
```

## Prerequisites
Node.js 20 or newer, PostgreSQL 14 or newer (or Docker Desktop), and a free Razorpay account for test keys.

## Setup without Docker (Windows, macOS, Linux)
1. **Environment file.** Copy `.env.example` to `server/.env` and fill it in (see the table below).
2. **Create the database.** In pgAdmin or psql: `CREATE DATABASE lumora_candles;`
3. **API:**
   ```
   cd server
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   npm run dev
   ```
   The API runs on http://localhost:5000 (check http://localhost:5000/api/health).
4. **Website** (second terminal):
   ```
   cd client
   npm install
   npm run dev
   ```
   Open http://localhost:5173.

### Environment variables (`server/.env`)
| Variable | Meaning |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. URL-encode special characters in the password (`@` becomes `%40`). |
| `JWT_SECRET` | Long random string (32+ characters). Never share it. |
| `PORT`, `CLIENT_URL` | API port (5000) and the exact website address allowed by CORS (`http://localhost:5173`, no trailing slash). |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay keys. Test keys start with `rzp_test_`. The secret stays on the server only. |
| `RAZORPAY_WEBHOOK_SECRET` | Secret you set when creating the webhook (optional in development). |
| `GST_RATE`, `SHIPPING_FEE`, `FREE_SHIPPING_THRESHOLD` | Pricing rules (18, 99, 999). |
| `COD_ENABLED`, `COD_MAX_ORDER_VALUE` | Cash on delivery switch and limit. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created by the seed. |

The website needs `VITE_API_URL` only if the API is not at `http://localhost:5000/api` (put it in `client/.env`).

## Docker
1. Copy `.env.example` to **`.env` in the project root** and set `POSTGRES_PASSWORD` to letters and numbers only.
2. Stop any local API or website first (ports 5000 and 5173).
3. Build and start everything:
   ```
   docker compose up --build
   ```
4. Seed the database once (new terminal):
   ```
   docker compose exec server npx prisma db seed
   ```
5. Open http://localhost:5173. PostgreSQL is reachable on your machine at port **5433**.

Data lives in the `pgdata` volume and uploaded images in the `uploads` volume. `docker compose down` keeps them; add `-v` to delete them.

## Razorpay test setup
1. Sign up at razorpay.com and switch the dashboard to **Test Mode**.
2. Account & Settings, then API Keys, then generate a test key. Put the Key Id and Key Secret in `.env`, and restart the API. The log should say `Razorpay mode: TEST (sandbox)`.
3. Place an order with **Pay online**. In test mode, Razorpay's documented test card is `4111 1111 1111 1111` (any future expiry and any CVV) and the test UPI ID is `success@razorpay`. Check Razorpay's current test-payment page, as these can change. No real money moves.
4. **Webhook (optional locally).** Razorpay needs a public URL, so use a tunnel such as ngrok. In the dashboard add a webhook to `https://YOUR-URL/api/payments/webhook` for `payment.captured` and `payment.failed`, and put the same secret in `RAZORPAY_WEBHOOK_SECRET`. Payments are also confirmed by the browser, so the store works without it.

## Admin login
Open `/login` and use `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env` (seeded). Then use the person icon, then **Admin dashboard** (`/admin`). **Change the password before going live.**

## API overview
All responses look like `{ "success": true, "message": "...", "data": {} }` (errors: `{ "success": false, "message": "..." }`). Send `Authorization: Bearer <token>` for protected routes.

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `login`, `logout`, `forgot-password`, `reset-password` · `GET /api/auth/me` · `PUT /api/auth/me` |
| Products | `GET /api/products` (`search, category, minPrice, maxPrice, fragrance, waxType, minRating, inStock, onSale, featured, bestseller, newArrival, sort, page, limit`) · `GET /api/products/:idOrSlug` · admin: `POST`, `PUT /:id`, `DELETE /:id`, `POST /:id/images` |
| Categories | `GET /api/categories` · admin: `POST`, `PUT /:id`, `DELETE /:id` |
| Cart | `GET/POST/DELETE /api/cart` · `PUT/DELETE /api/cart/:itemId` · `POST /api/cart/merge` · `POST/DELETE /api/cart/coupon` |
| Coupons | `POST /api/coupons/validate` |
| Wishlist | `GET/POST /api/wishlist` · `DELETE /api/wishlist/:productId` |
| Orders | `POST/GET /api/orders` · `GET /api/orders/:id` · `GET /api/orders/:id/tracking` · `PUT /api/orders/:id/cancel` · `POST /api/orders/:id/refund-request` |
| Payments | `GET /api/payments/config` · `POST /api/payments/create-order`, `verify`, `failed`, `webhook` |
| Reviews | `GET/POST /api/products/:id/reviews` · admin: `GET /api/admin/reviews`, `PUT .../:id/approve`, `DELETE .../:id` |
| Public | `POST /api/newsletter`, `POST /api/contact` |
| Admin | `GET /api/admin/dashboard`, `sales`, `orders`, `orders/:id`, `customers`, `coupons`, `inventory`, `settings` · `PUT /api/admin/orders/:id`, `customers/:id/status`, `inventory/:id`, `settings` · `POST/PUT/DELETE /api/admin/coupons` |

## Testing
With the API running and the database seeded:
```
cd server
npm run test:smoke
```
It registers a throwaway customer, checks search, the cart maths, a coupon, a cash-on-delivery order, stock deduction and restoring, and that guests and customers cannot reach admin routes. Then walk through this manual checklist:

- [ ] Home, shop filters, product page and search work on a phone-sized window.
- [ ] Guest cart survives a refresh and merges into the account after login.
- [ ] COD order appears in My orders and in Admin, then Orders.
- [ ] Online payment with the test card marks the order paid. A failed payment can be retried.
- [ ] Admin moves an order to Delivered, and the dashboard charts update.
- [ ] A customer opening `/admin` sees "Admins only".
- [ ] Cancelling an order returns its stock.

## Production deployment guidance
- **HTTPS and domain.** Serve the site and API over HTTPS (for example behind Caddy, nginx or a managed platform). Set `NODE_ENV=production`, `CLIENT_URL` to your real site address, and rebuild the client with `VITE_API_URL=https://api.yourdomain.com/api`.
- **Secrets.** Use a new `JWT_SECRET` (32+ random characters), a strong database password and a new admin password. Keep `.env` out of Git.
- **Razorpay live mode.** Complete Razorpay's KYC, generate **live** keys (`rzp_live_`), set a webhook secret and register the webhook URL. Test a small real payment first.
- **Email.** Password reset links are only printed in development. Add an email provider (SMTP or a transactional service) in `auth.controller.js` before launch, and for order confirmations.
- **Refunds.** Marking an order refunded only updates the record. Issue the money back in the Razorpay dashboard (or add the Razorpay refunds API).
- **Images.** Uploads are stored on disk (`uploads` volume). Back them up, or move them to object storage for several servers.
- **Database.** Run `npx prisma migrate deploy` on each release, schedule backups (`pg_dump`), and use a managed PostgreSQL if possible.
- **Legal and content.** Replace the sample policy text, testimonials and `client/public/sitemap.xml` domain. Have the policies reviewed for your business. Check GST invoicing requirements with your accountant.
- **Monitoring.** Watch the API logs, and the `/api/health` endpoint with an uptime monitor.

## Security notes
- Passwords are hashed with bcrypt. JWTs are checked on every protected route, and `authorizeRole("ADMIN")` guards every `/api/admin` route.
- Prices, discounts, GST and shipping are recalculated from the database on the server. The browser never sets an amount.
- Payments are verified with HMAC signatures, the amount is cross-checked with Razorpay, and webhooks are verified. Card numbers and CVV are never stored.
- Login and password reset responses do not reveal whether an email exists. Auth routes are rate limited.
- Prisma parameterises queries (no SQL injection), and React escapes output (no XSS from product text).
- The dependency audit shows warnings in development tools. Review `npm audit` before launch and update packages.

## Troubleshooting
- **"Cannot reach the store"**: the API is not running, or `CLIENT_URL` does not match the website address exactly.
- **`EADDRINUSE` on port 5000**: an old server is running. `netstat -ano | findstr :5000`, then `taskkill /PID <pid> /F`.
- **Prisma "Authentication failed"**: wrong database password or port, or a stale `DATABASE_URL` Windows environment variable overriding `.env`.
- **"Failed to resolve import"** in the website: a file is in the wrong folder, or run `npm install` in `client`.
- **Razorpay "keys not set"**: the keys are not in the `.env` the API reads (`server/.env`). Restart after editing.
