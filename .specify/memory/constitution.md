<!--
================================================================================
SYNC IMPACT REPORT
================================================================================
Version change: 0.0.0 → 1.0.0 (MAJOR - Initial constitution adoption)

Modified principles: N/A (initial version)

Added sections:
  - Core Principles (5 principles)
  - Technology Standards
  - Development Workflow
  - Governance

Removed sections: N/A (initial version)

Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ Compatible (Constitution Check section exists)
  - .specify/templates/spec-template.md: ✅ Compatible (Requirements/User Stories aligned)
  - .specify/templates/tasks-template.md: ✅ Compatible (Phase structure aligns)

Follow-up TODOs: None
================================================================================
-->

# PMBOK Project Management App Constitution

## Core Principles

### I. PMBOK Domain Alignment

All features and data structures MUST align with PMBOK (Project Management Body of Knowledge)
terminology and workflows. The application manages project documents following established
project management practices.

**Non-negotiables:**
- Entity naming MUST match PMBOK terminology (Issues, Risks, Changes, Escalations, Faults)
- Status workflows MUST reflect standard project management lifecycles
- Risk scoring MUST use probability × impact matrix methodology
- Audit trails (logs) MUST be maintained for all document state changes
- Approval workflows (e.g., risk closure) MUST enforce multi-step authorization

**Rationale:** This application serves project managers who expect industry-standard terminology
and processes. Deviation creates confusion and reduces adoption.

### II. API-First Architecture

Backend functionality MUST be exposed through RESTful APIs before any frontend implementation.

**Non-negotiables:**
- All business logic resides in backend controllers
- Frontend is a consumer of the API, not a co-implementer of logic
- API responses MUST follow consistent structure: `{ success, message?, data?, count?, error? }`
- All CRUD operations MUST be available via API endpoints
- API versioning SHOULD be implemented when breaking changes occur

**Rationale:** Separating API from UI enables multiple clients (web, mobile, integrations),
independent testing, and clear ownership boundaries.

### III. Data Integrity First

All state transitions and data modifications MUST maintain referential integrity and
create audit records.

**Non-negotiables:**
- Database transactions MUST wrap multi-table operations
- Foreign key constraints MUST be enforced at the database level
- Status changes MUST create log entries automatically
- Deletions MUST cascade appropriately (defined in schema)
- Input validation MUST occur at API boundary (using Joi or equivalent)

**Rationale:** Project management data is organizational record-keeping. Data loss or
inconsistency damages trust and compliance.

### IV. Security Defaults

Security measures MUST be applied by default, not as an afterthought.

**Non-negotiables:**
- Helmet middleware MUST be enabled for all HTTP security headers
- CORS MUST be explicitly configured (no wildcards in production)
- Rate limiting MUST protect all API endpoints
- Environment variables MUST store all secrets (never hardcoded)
- SQL queries MUST use parameterized statements (Sequelize or prepared statements)

**Rationale:** Project management data contains sensitive organizational information.
Security breaches damage stakeholder trust.

### V. Simplicity Over Abstraction

Prefer straightforward implementations over architectural patterns that add complexity
without clear benefit.

**Non-negotiables:**
- No premature abstraction - patterns (Repository, Service layers) only when justified
- Direct database queries are acceptable for read-heavy operations
- Avoid meta-programming or dynamic code generation
- Third-party dependencies require justification
- Configuration over code where behavior varies by environment

**Rationale:** This is a focused domain application. Over-engineering increases
maintenance burden without proportional benefit.

## Technology Standards

**Backend Stack:**
- Runtime: Node.js >= 16.0.0
- Framework: Express.js
- ORM: Sequelize (with raw SQL permitted for complex queries)
- Database: MariaDB/MySQL with utf8mb4 encoding
- Validation: Joi

**Frontend Stack:**
- Framework: React 19+
- Routing: React Router
- Styling: Tailwind CSS
- HTTP Client: Fetch API (via centralized api.js service)
- Icons: Lucide React

**Testing:**
- Backend: Integration tests via test-*.js workflow scripts
- Frontend: React Testing Library (configured, minimal coverage currently)

**Development:**
- Backend hot-reload: Nodemon
- Environment: dotenv for configuration
- Port conventions: Backend 3001, Frontend 3000

## Development Workflow

**Feature Implementation:**
1. Define database schema changes first (if any)
2. Implement backend API endpoint with validation
3. Add audit logging for state changes
4. Create/update frontend API service function
5. Implement frontend component
6. Test via workflow scripts and manual verification

**Code Organization:**
- Backend: `backend/src/{controllers,routes,models,config}/`
- Frontend: `frontend/src/{pages,components,services,context,utils}/`
- Database: Schema in `pmbok_db-schema.sql` at repository root

**Naming Conventions:**
- Controllers: `{entity}Controller.js` with exported functions
- Routes: `{entity}.js` defining Express routes
- Pages: `{Entity}.js` (PascalCase) as React components
- API functions: `get{Entity}`, `create{Entity}`, `update{Entity}`, `delete{Entity}`

## Governance

**Constitution Authority:**
- This constitution supersedes conflicting practices in the codebase
- All pull requests SHOULD verify compliance with these principles
- Violations require documented justification in PR description

**Amendment Process:**
1. Propose amendment with rationale
2. Document impact on existing code
3. Update constitution version following semantic versioning:
   - MAJOR: Principle removal or fundamental redefinition
   - MINOR: New principle or significant expansion
   - PATCH: Clarification or wording refinement
4. Update dependent templates if affected

**Compliance Review:**
- New features MUST align with PMBOK domain terminology
- API changes MUST maintain response structure consistency
- Security middleware MUST NOT be disabled without explicit justification

**Version**: 1.0.0 | **Ratified**: 2026-01-16 | **Last Amended**: 2026-01-16
