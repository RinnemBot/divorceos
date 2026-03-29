# Project Operations – Ralph Mode

## Commands
- `npm run dev` – Vite dev server
- `npm run build` – TypeScript build + bundle (must stay green)
- `npm run test` – (add tests as we extend calculator)
- `npm run lint` – ESLint (fix before committing)

## Validation Gates
1. `npm run lint`
2. `npm run test`
3. `npm run build`

All three must pass before an iteration is marked complete.

## Notes
- Update `IMPLEMENTATION_PLAN.md` at the end of each iteration (move task, jot blockers).
- Specs live in `specs/` (gross-mode + spousal support requirements).
- Calculator code is under `src/components/ChildSupportEstimator.tsx`; new UI pieces can live in `src/components` as needed.
- Use existing utility functions in `src/lib` before adding new ones.
