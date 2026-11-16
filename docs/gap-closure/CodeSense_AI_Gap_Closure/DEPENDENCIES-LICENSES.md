# Dependencies, Licences and Supply-Chain Controls — CodeSense AI

## 1. Dependency policy

Use maintained dependencies with a clear purpose. Avoid adding packages for trivial functionality. Pin dependency ranges deliberately and commit lockfiles. Review transitive dependencies for vulnerabilities, maintenance status and licence compatibility.

## 2. Expected categories to verify

Potential categories include Express, MongoDB/Mongoose, request validation, password hashing, session management, rate limiting, security headers, Monaco Editor, test runner, browser automation and AI provider SDK. This is a category list, not an assertion that any package is installed.

## 3. Required inventory

For every direct dependency record:
- package name and exact resolved version;
- purpose and owning module;
- licence;
- maintenance/security status;
- whether it is runtime or development-only;
- replacement/removal plan if abandoned.

## 4. Supply-chain checks

- lockfile integrity;
- vulnerability audit;
- licence scan;
- secret scan;
- dependency update review;
- SBOM generation for release if supported by the build environment;
- no runtime package download based on user input.

## 5. Monaco and external assets

Pin a tested Monaco version and define a reliable loading strategy. If a CDN is used, define version pinning, integrity policy where supported, CSP and offline/failure behavior. Do not imply the editor is available when the asset fails to load.

## 6. Release gate

No known critical dependency vulnerability may be ignored without documented mitigation/risk acceptance. Do not claim licence compliance without a generated inventory and review.
