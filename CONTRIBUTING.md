# Contributing to CodeSense AI

Thank you for your interest in contributing to CodeSense AI! This project is an AI-powered code review platform built with HTML/CSS/Vanilla JavaScript, Node.js/Express, MongoDB, and Gemini AI.

## Getting Started

1. Fork the repository and clone your fork.
2. Create a new branch for your feature or fix.
3. Install dependencies: `cd backend && npm install`
4. Set up environment variables: copy `backend/.env.example` to `backend/.env` and fill in values.
5. Start MongoDB on `127.0.0.1:27017`.
6. Start the backend: `npm start`
7. Run tests: `npm test`
8. Run lint: `npm run lint`

## Development Workflow

- All backend code is CommonJS (Node.js).
- Frontend is Vanilla JavaScript with HTML/CSS.
- Monaco Editor is loaded from CDN.
- AI provider (Gemini) is called only from the backend.
- All review data is owner-scoped in MongoDB.

## Pull Request Process

1. Ensure all tests pass (`npm test`).
2. Ensure lint passes (`npm run lint`).
3. Update documentation if your change affects user-facing behavior.
4. Submit a pull request with a clear description of changes.

## Code Style

- Follow the ESLint configuration in `eslint.config.js`.
- Use 2-space indentation, single quotes, and semicolons.
- No empty catch blocks or no-op callbacks.
- All secrets must remain server-side; never commit `.env`.

## Security

If you discover a security vulnerability, please see `SECURITY.md` for reporting instructions.

## License

This project is licensed under the MIT License.
