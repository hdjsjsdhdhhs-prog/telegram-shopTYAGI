# tg-mini-shop

Production-ready **Telegram Mini App storefront** with admin panel.

- Next.js 14 (App Router) + React 18
- TailwindCSS dark theme (Telegram-style)
- Prisma ORM + PostgreSQL
- Telegram WebApp SDK + initData HMAC validation
- Telegram Bot API integration (admin notification + user confirmation)
- Mobile-first, deployable on Vercel

## Features

### Mini App (storefront)
- `/` — категории (grid cards) + новинки (2-column grid)
- `/category/[id]` — товары категории
- `/product/[id]` — карточка: фото, название, цена, описание, кнопка «В корзину», избранное
- `/cart` — список товаров, +/- количество, итоговая цена, «Продолжить»
- `/checkout` — способ оплаты (radio), способ доставки (radio), адрес, комментарий, итог
- `/profile` — история заказов и избранное
- Bottom navigation: Каталог / Корзина / Профиль (badge на корзине)

### Admin (`/admin`)
- Простой вход по паролю (`ADMIN_PASSWORD`), защита через HTTP-only signed cookie + middleware
- Категории: создать / редактировать / удалить, загрузка изображения
- Товары: создать / редактировать / удалить, загрузка изображения, цена, валюта, наличие, категория
- Заказы: список, фильтр по статусу, смена статуса (PENDING → COMPLETED / CANCELLED) с уведомлением пользователю в Telegram

### Order flow
При оформлении заказа:
1. `POST /api/order` валидирует `initData` (HMAC SHA-256 от `WebAppData`-секрета на основе `TELEGRAM_BOT_TOKEN`).
2. Сохраняется `Order` + `OrderItem` со снимком цен.
3. Админу (`ADMIN_CHAT_ID`) уходит сообщение: username, telegram id, состав, сумма, адрес, дата.
4. Пользователю в чат с ботом приходит «✅ Ваш заказ успешно оформлен!».

## Tech stack

| Layer | Choice |
| ----- | ------ |
| Framework | Next.js 14 App Router |
| UI | TailwindCSS + custom dark theme |
| DB | PostgreSQL via Prisma 6 |
| Auth (admin) | jose-signed JWT cookie |
| Validation | Zod |
| Telegram | `window.Telegram.WebApp` + Bot API (`sendMessage`) |

## Project structure

```
tg-mini-shop/
├── prisma/
│   ├── schema.prisma           # User, Category, Product, Order, OrderItem, Favorite
│   └── seed.ts                 # demo categories + products
├── public/uploads/             # admin-uploaded product images (dev)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # root layout, dark theme, Telegram script
│   │   ├── page.tsx            # storefront home
│   │   ├── category/[id]/      # category listing
│   │   ├── product/[id]/       # product details + add-to-cart
│   │   ├── cart/               # cart with quantity controls
│   │   ├── checkout/           # payment + delivery + address + comment
│   │   ├── orders/success/     # confirmation screen
│   │   ├── profile/            # order history + favorites
│   │   ├── admin/              # admin UI (sidebar, dashboard, CRUD)
│   │   │   ├── login/
│   │   │   ├── categories/
│   │   │   ├── products/
│   │   │   └── orders/
│   │   └── api/
│   │       ├── products/, products/[id]/
│   │       ├── categories/
│   │       ├── cart/           # rehydrate prices for client cart
│   │       ├── order/          # place order + Telegram notifications
│   │       ├── orders/         # current user's order history
│   │       ├── favorites/, favorites/[id]/
│   │       └── admin/
│   │           ├── login/, logout/
│   │           ├── categories/, categories/[id]/
│   │           ├── products/, products/[id]/
│   │           ├── orders/, orders/[id]/
│   │           └── upload/     # multipart image upload
│   ├── components/             # ProductCard, CategoryGrid, BottomNav, etc.
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── telegram.ts         # validateInitData, sendTelegramMessage
│   │   ├── telegramAuth.ts     # resolve current user from header
│   │   ├── auth.ts             # admin JWT cookie
│   │   └── format.ts           # price + slug helpers
│   ├── middleware.ts           # protects /admin/* (except /admin/login)
│   └── types/telegram.d.ts     # Telegram WebApp typings
└── .env.example
```

## Prisma schema (high level)

```prisma
User       (telegramId @unique, username, firstName, ...)
Category   (slug @unique, imageUrl, sortOrder)
Product    (price/costPrice/oldPrice/salePrice [int, minor units], saleBadge, isSale, currency, imageUrl, categoryId, inStock)
Order      (userId, status, paymentMethod, deliveryMethod, address, comment, total, revenue, cost, profit, completedAt)
OrderItem  (orderId, productId, productName [snapshot], unitPrice/unitSalePrice/unitCostPrice [snapshot], quantity)
Favorite   (userId, productId @@unique)
```

Prices are stored as **integers in minor units** (kopecks/cents) to avoid float
issues. The UI converts to/from major units in the editor and `formatPrice()`.

## Local development

### 1. Install
```bash
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — your local Postgres (or any compatible Postgres URL).
- `TELEGRAM_BOT_TOKEN` — token from [@BotFather](https://t.me/BotFather).
- `ADMIN_CHAT_ID` — your Telegram numeric id (talk to [@userinfobot](https://t.me/userinfobot) to get it).
- `ADMIN_PASSWORD` — set anything for local dev.
- `ADMIN_SESSION_SECRET` — long random string.
- `SKIP_TELEGRAM_VALIDATION=1` — for browsing the storefront in a regular browser
  without a real Telegram client. **Set to `0` (or remove) in production.**

### 2. Database
```bash
npx prisma migrate dev --name init
npm run db:seed   # optional: load demo categories + products
```

### 3. Run
```bash
npm run dev          # http://localhost:3000
```

Admin panel: `http://localhost:3000/admin/login` (use `ADMIN_PASSWORD`).

### Useful scripts
| Script | Description |
| ------ | ----------- |
| `npm run dev` | Next.js dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Run dev migrations |
| `npm run db:deploy` | Apply migrations in prod |
| `npm run db:seed` | Seed demo data |

## Telegram bot setup

1. Open [@BotFather](https://t.me/BotFather), `/newbot`, copy the token into `TELEGRAM_BOT_TOKEN`.
2. `/setdomain` (or `/setmenubutton`) and point your bot at the deployed URL,
   e.g. `https://tg-mini-shop.vercel.app/`.
3. `/newapp` to register a Mini App (Web App) with the same URL.
4. Get your numeric chat id via [@userinfobot](https://t.me/userinfobot) and put
   it in `ADMIN_CHAT_ID`. To send notifications to a group, add the bot as
   admin and use the negative group id.
5. Send `/start` to your bot from the admin account at least once so the bot
   has permission to message you (this is required by the Bot API).

The Mini App opens via the bot's menu button; on first open
`window.Telegram.WebApp.initData` is sent to the backend in the
`x-telegram-init-data` header for HMAC validation.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the project on Vercel.
3. Set environment variables in **Project → Settings → Environment Variables**:
   - `DATABASE_URL` — managed Postgres (Vercel Postgres / Neon / Supabase).
   - `TELEGRAM_BOT_TOKEN`
   - `ADMIN_CHAT_ID`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
   - `SKIP_TELEGRAM_VALIDATION` — leave **unset** in production.
4. First deploy: open the Vercel build logs and run
   `npx prisma migrate deploy` once (or set up a Vercel build hook). The
   `postinstall` script already runs `prisma generate`.
5. Update the Mini App URL in BotFather to the Vercel URL.

### Image uploads on Vercel
The bundled `/api/admin/upload` writes to `/public/uploads`, which is fine
locally but **read-only** on Vercel's serverless runtime. For production swap
the implementation in `src/app/api/admin/upload/route.ts` for one of:
- [Vercel Blob](https://vercel.com/docs/vercel-blob)
- AWS S3 / Cloudflare R2 with a presigned PUT
- Any object storage that returns a public URL

The admin UI only consumes `{ url: string }` from the upload endpoint, and the
URL field is also editable directly — admins can paste any image URL. So you
can ship without a storage backend if you only need URL-based images.

## Security

- **`initData` validation** — `src/lib/telegram.ts#validateInitData` implements
  the canonical HMAC-SHA256 check using the bot token, with constant-time
  comparison and a 24-hour `auth_date` window.
- **Admin protection** — `src/middleware.ts` runs on every `/admin/*` request
  (except `/admin/login`) and verifies a `jose`-signed JWT cookie. Admin API
  routes additionally re-check the cookie before mutating data.
- **Input validation** — all mutating endpoints validate input with Zod.
- **Price integrity** — order totals are calculated server-side from current
  product prices; the client cannot tamper with prices.
- **Cookies** — `httpOnly`, `sameSite=lax`, `secure` in production.

## License

MIT — use freely in commercial projects.
