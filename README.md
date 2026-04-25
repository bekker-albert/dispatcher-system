This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database setup

Production uses the server MySQL database through Next.js API routes. The password must stay only in `.env.local` on the server.

```bash
NEXT_PUBLIC_DATA_PROVIDER=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aam_dispatch
DB_USER=dispatcher_ad
DB_PASSWORD=
```

The app creates required MySQL tables automatically on the first database request if the database user has rights inside its own database.

Supabase remains as a fallback for old local setups. To use it instead of MySQL, remove `NEXT_PUBLIC_DATA_PROVIDER=mysql` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## Desktop shortcut

The app has a web app manifest. In Microsoft Edge or Chrome, open the site and install it as an app from the address bar or browser menu. The installed shortcut opens the same web app.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
