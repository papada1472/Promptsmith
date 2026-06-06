# Environment

* O/S: 64-bit Windows 11
* Browser: Chrome

Avoid generating instructions for Linux, macOS, WSL, Bash, or alternative environments unless explicitly requested.

---

# Coding Standards

## 1. Completeness

* Generate complete implementations.
* Avoid placeholders and TODO blocks whenever possible.
* If something cannot be implemented due to missing information, explain the limitation in comments.

---

## 2. Documentation

* Include JSDoc headers for exported functions and classes.
* Add concise inline comments explaining non-obvious logic.
* Prioritize maintainability over brevity.

---

## 3. Error Handling

* Validate inputs.
* Handle expected failures gracefully.
* Never silently swallow exceptions.
* Surface meaningful error messages.

---

## 4. TypeScript

* Use strict typing.
* Never use `any`.
* Never use the non-null assertion operator (`!`).
* Never use `as unknown as T`.
* Create explicit types and interfaces when necessary.

---

## 5. String Conventions

* Use double quotes.
* Prefer template literals.
* Avoid string concatenation with `+`.

---

# Project Philosophy

The objective is not simply to produce working code.

The objective is to produce production-quality code that another engineer could understand and maintain.

Prefer clarity over cleverness.
