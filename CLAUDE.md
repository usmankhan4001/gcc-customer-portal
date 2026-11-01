# Claude Guidelines for GCCStartup

This repository follows the standardized agent guidelines outlined in [**`AGENTS.md`**](./AGENTS.md).

### Quick Cheatsheet
* **Port**: Runs on port `3005` (`npm run dev` or `npm start`).
* **Design System**: Navy `#0A142F`, Orange `#F26522` (gccstartup-cms design system). Live style guide at `/dev/style-guide`.
* **Testing & Build**: Always run `npm run build` and `npm run test:routes` to verify route health and TypeScript compilation.
* **Database**: Drizzle ORM schema is at `src/lib/db/schema.ts`. Generate migrations using `npm run db:generate`.
* **Docs Center**: Complete master plan, PRDs, functional specs, and architecture documents live under `docs/`.
