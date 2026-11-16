# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in CodeSense AI, please report it
responsibly by contacting the project maintainer. Do not publicly disclose
the vulnerability until it has been addressed.

## Security Measures

- Passwords are hashed with bcrypt (work factor 12) server-side only
- Session cookies use HttpOnly, SameSite, and Secure (in production) flags
- CSRF double-submit tokens protect state-changing requests
- CORS is restricted to the configured frontend origin
- Rate limiting protects authentication and review endpoints
- All database queries are owner-scoped to prevent IDOR
- AI provider keys are never exposed to the frontend
- Submitted source code is treated as untrusted data in AI prompts
- No arbitrary code execution of submitted source
- Structured logging with secret redaction

## Scope

This security policy covers the CodeSense AI application code and its
dependencies. It does not cover third-party services such as MongoDB Atlas
or the Gemini AI provider, which have their own security models.
