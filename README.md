This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Deployment (Cloud Run skeleton)

This repo is intended to deploy as two Cloud Run services from the same codebase:

- **`prism-app`**: the Next.js web application
- **`prism-worker`**: a placeholder worker service (real queues/jobs are added in Epic 3)

### Build images

From repo root:

```bash
docker build -f docker/Dockerfile.app -t prism-app:local .
docker build -f docker/Dockerfile.worker -t prism-worker:local .
```

### Deploy (example)

You’ll typically use Artifact Registry + Cloud Run. Example commands (adapt to your project/region):

```bash
# App service
gcloud run deploy prism-app \
  --source . \
  --region REGION \
  --set-env-vars "NODE_ENV=production" \
  --allow-unauthenticated=false

# Worker service (placeholder)
gcloud run deploy prism-worker \
  --source . \
  --region REGION \
  --set-env-vars "NODE_ENV=production" \
  --no-allow-unauthenticated
```

### Configuration / secrets

- Do **not** commit secrets. Use Cloud Run env vars and/or Secret Manager.
- Local development uses `.env.local` (gitignored). See `.env.example` for placeholder keys.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Testing

### Unit tests

```bash
npm test
```

### E2E tests (Playwright, headless)

```bash
npm run test:e2e
```
