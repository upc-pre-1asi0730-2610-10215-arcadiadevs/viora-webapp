# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.7.0] - 2026-07-03

### Changed

- DDD architecture audit and refactoring across all bounded contexts
- agronomic presentation views no longer import infrastructure directly (assemblers, API gateways)
- agronomic store extended with 11 new methods for data loading
- expense-api refactored to extend BaseApi with BaseEndpoint
- profile store gains loadFarmTotals with documented Context Map dependency on agronomic
- shared kernel decoupled from iam via interceptor registry pattern
- iam store uses shared IamApi singleton instance
- iam domain gains SignInCommand and SignUpCommand command objects
- iam store methods return {success, error} results instead of handling navigation
- navigation (router.push) moved from stores to presentation layer

### Added

- shared/infrastructure/interceptor-registry.js for cross-context interceptor registration
- iam/infrastructure/iam-api-instance.js for IamApi singleton
- iam/domain/model/sign-in.command.js and sign-up.command.js command objects

### Fixed

- expense-api missing auth interceptor (was using native fetch without Bearer token)
- iam store duplicated IamApi instances across iam.store.js and security.store.js

## [2.6.0] - 2026-07-03

### Added

- shared dashboard header component
- router imports and route definitions for all bounded contexts

### Changed

- align agronomic analysis entity with platform backend contract
- update agronomic assembler and api for real backend endpoints
- refine dashboard toolbar controls

## [2.5.0] - 2026-07-03

### Added

- community risk model and assembler for surveillance
- pest sighting reports and symptom dictionary integration
- alerts and community risk map presentation components
- surveillance routes and views

### Changed

- align surveillance domain model with platform backend contract
- update surveillance api and assembler for real backend endpoints
- extend surveillance store with community risk and pest report actions

## [2.4.0] - 2026-07-03

### Added

- profile bounded context with settings and user profile management

## [2.3.0] - 2026-07-03

### Added

- intervention bounded context with expert assistance and case management

## [2.2.0] - 2026-07-03

### Added

- iam bounded context with authentication and session management

## [2.1.0] - 2026-07-03

### Added

- billing bounded context with subscription and payment management

## [2.0.0] - 2026-07-03

### Added

- support bounded context with faq and legal documents
