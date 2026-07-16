# Contributing

## Development

```bash
npm install
npm run dev
```

Keep domain calculations pure and outside UI components. New material values should include source IDs, units, status, confidence, assumptions, and a formula version. Prefer seeded, deterministic fixtures for demo behavior.

Before submitting a change, run:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Do not commit secrets, `.env` files, generated `.next` output, uploaded evidence, or credentials. Changes that affect engineering interpretation should explain their assumptions and add an edge-case test.
