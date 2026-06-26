# Contributing to NexHire

Thank you for taking the time to contribute!

---

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/sakib-atreus/nexhire.git
   cd nexhire
   ```
3. Set up the project following the [Quick Start](README.md#quick-start) guide
4. Create a new branch for your change:
   ```bash
   git checkout -b feat/your-feature-name
   ```

---

## Branch Naming

| Prefix | Use for |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code refactoring |
| `docs/` | Documentation only |
| `chore/` | Build, tooling, dependencies |

---

## Making Changes

- Keep changes focused — one feature or fix per PR
- Follow existing code style (Java: standard Spring conventions, TypeScript: ESLint rules)
- Write or update tests when changing backend logic
- Run checks before pushing:

```bash
# Backend tests
cd apps/api && ./mvnw test

# Frontend type check
cd apps/web && npm run type-check

# Lint
npm run lint
```

---

## Submitting a Pull Request

1. Push your branch to your fork
2. Open a PR against the `main` branch of this repo
3. Fill in the PR description — what changed and why
4. Wait for review — feedback will be given within a few days

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/Sakib-Atreus/nexhire/issues) with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Environment (OS, Java version, Node version)

---

## Code of Conduct

Be respectful and constructive. Harassment or offensive behaviour will not be tolerated.
