# Contributing to ChronoVault 🌌

First off, thank you for considering contributing to ChronoVault! It's people like you who make the open-source community such a powerful engine for innovation.

## 📝 Code of Conduct
By participating in this project, you agree to abide by the terms of our code of conduct (be excellent to each other).

## 🚀 How Can I Contribute?

### Reporting Bugs
*   Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/yourusername/chronovault/issues).
*   If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements
*   Check if there's already an issue for your suggestion.
*   Open a new issue and describe the enhancement in detail.

### Pull Requests
1.  Fork the repo and create your branch from `main`.
2.  If you've added code that should be tested, add tests.
3.  If you've changed APIs, update the documentation.
4.  Ensure the build passes (`npm run build` and `npm run tauri build`).
5.  Make sure your code follows the coding style (see below).

## 🛠️ Coding Standards

### Frontend (React/TS)
*   Use **Functional Components** and **Hooks**.
*   **Tailwind CSS**: Use the predefined design system tokens (e.g., `text-cv-accent`, `glass`).
*   **Documentation**: Document complex logic in English.
*   **Formatting**: We recommend using Prettier.

### Backend (Rust/Tauri)
*   Follow the **Clippy** recommendations.
*   Use `async/await` for long-running IO tasks.
*   Keep the UI thread (Tauri main thread) clear of heavy computation.

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
*   `feat: ...` for new features.
*   `fix: ...` for bug fixes.
*   `docs: ...` for documentation changes.
*   `refactor: ...` for code changes that neither fix a bug nor add a feature.

## 💎 Design Philosophy
ChronoVault is built with a **Brutalist / Cyberpunk** aesthetic. 
*   Sharp edges are preferred over rounded corners.
*   Glassmorphism and Glow effects are central to the identity.
*   The UX should feel "fast" and "hacker-ready".

---

Thank you for helping us build the future of file management! 🦾✨
