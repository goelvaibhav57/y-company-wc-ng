# eClaims Processing POC

A role-aware Angular application for demonstrating a vehicle insurance claim from customer submission through survey, adjuster review, and workshop completion. The project is designed as a focused interview POC: feature-based, typed, testable, and ready for a future API without pretending that the current mock services persist data.

## Technology stack

- Angular 16 standalone components and lazy-loaded Angular Router routes
- TypeScript with strict compiler and template checks
- Reactive Forms with shared validators
- Angular Material and SCSS
- RxJS for asynchronous workflows and Angular Signals for UI state
- Karma, Jasmine, and ChromeHeadless for unit tests
- Node.js 16.20.2 and npm 8.19.4 for the current local setup

The project pins Angular framework packages to 16.2.12 because 16.2.16 is not available for those packages; Angular CLI/build tooling is pinned to 16.2.16.

## Architecture

```text
src/app/
  core/
    auth/           # session, role permissions, auth models
    errors/         # safe error mapping and sanitized diagnostics
    guards/         # authentication and permission route guards
    interceptors/   # bearer token and HTTP error handling
  features/
    auth/           # login and access denied
    dashboard/      # role-aware summary backed by shared claim state
    claims/         # list, creation, details, claim workflow service
    survey/         # survey assessment and assignment checks
    review/         # adjuster decisions
    workshop/       # repair processing
  layout/           # responsive shell, header, role-aware sidebar
  shared/
    components/     # page/status/document/state/confirmation UI
    directives/     # permission-based rendering
    services/       # notifications and shared UI services
    validators/     # reusable reactive-form validators
```

Feature pages coordinate presentation and form state. Workflow and mock data operations live in feature services; shared UI and permission behavior are kept reusable. Route guards and permission-aware navigation improve UX, but a real backend must independently authorize every request.

## Features

- Role-aware Dashboard and Claims navigation for Customer, Surveyor, Adjuster, and Workshop users
- Searchable/filterable claims register, claim details, activity, timeline, and supporting documents
- Validated reactive claim creation form
- Survey draft and submission flow
- Adjuster approve, reject, and additional-information decisions with confirmation and remarks
- Workshop assignment, in-progress, and completion workflow
- Shared loading, empty, error, confirmation, document, and notification components
- Standard HTTP error handling, safe user-facing messages, session expiry logout, and access-denied routing
- Responsive layouts, accessible form labels, keyboard-focusable controls, and status text alongside color

## Demo users

Select a role on the login page to fill its email address. No passwords are displayed in the UI or this README.

| Role | Demo email |
| --- | --- |
| Customer | customer@example.com |
| Surveyor | surveyor@example.com |
| Adjuster | adjuster@example.com |
| Workshop | workshop@example.com |

## Application flow

1. Sign in as Customer; view the dashboard and claims list.
2. Create a claim. It appears as Survey Assigned and is visible to the assigned Surveyor.
3. Sign in as Surveyor; open the assigned claim, complete the assessment, and submit it.
4. Sign in as Adjuster; review the assessment and approve the claim.
5. Sign in as Workshop; start repairs, update progress, and mark the repair complete.
6. Confirm the resulting status in claim details or the role dashboard.

The end-to-end workflow is covered by a service integration test in addition to the individual service/component tests.

## Run locally

```sh
npm install
npm start
```

Open `http://localhost:4200/`. Build for production with `npm run build`.

Run the unit suite in a Chrome-enabled environment with:

```sh
npm test -- --watch=false --browsers=ChromeHeadless
```

There is no lint script or ESLint configuration in this repository. Angular's strict TypeScript/template checks run as part of the build. The configured bundle/style budgets currently emit warnings and do not fail the build.

## Key architectural decisions and POC boundaries

- **One claim source:** Dashboard summaries and role queues read from the same in-memory `ClaimService`, so newly created claims and workflow transitions remain consistent during a session.
- **Standalone and feature-based:** Major screens are lazy-loaded; small cross-cutting UI pieces remain under `shared/`.
- **Central authorization UX:** A role-permission map, route guards, assignment guards, and role-aware controls reduce accidental access. Frontend checks are not a security boundary.
- **API-ready seams, mock execution:** Claim, dashboard, survey, review, and workshop services model feature data-access boundaries. The current implementation is in-memory and does not issue business API calls or persist changes across reloads. `apiBaseUrl` is configured in the environment, and the bearer-token/error interceptors are ready for HTTP endpoints.
- **Demo auth only:** The mock session is stored in local storage to support role switching. Do not use this authentication or token storage as a production security design.
- **No artificial persistence:** Document uploads simulate validation/progress and are held in memory; a real integration should replace that storage with an authorized document API.
