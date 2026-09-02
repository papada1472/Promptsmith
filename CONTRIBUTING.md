# Contributing to Refinzi 2.0 ⚡

Thank you for your interest in contributing to Refinzi! We are building an open-source, local-first ambient AI prompt execution layer for Windows.

## 🛠️ Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/papada1472/refinzi.git
   cd refinzi
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the app in development mode**:
   ```bash
   npm run dev
   ```

4. **Run test suite**:
   ```bash
   npm test
   ```

## 🏗️ Pull Request Guidelines

1. **Branch Naming**:
   - `feat/feature-name`
   - `fix/bug-description`
   - `docs/update-guide`
2. **Code Standards**:
   - Write clean, modular ES Modules.
   - Maintain client-side security (all API keys must be encrypted locally using DPAPI / AES-256).
   - Ensure all Vitest unit tests pass (`npm test`).
3. **Commit Messages**: Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add mistral model switcher support`).

## 💬 Community & Discussions

Feel free to open an Issue or start a GitHub Discussion for new feature proposals, AI model requests, or UI improvements!
