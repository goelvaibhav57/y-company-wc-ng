# eClaims POC

## Purpose

A minimal enterprise-style Angular foundation for an electronic claims processing application. This project currently contains only the application shell and a dashboard placeholder; business functionality will be added incrementally.

## Technology stack

- Angular framework 16.2.12 and Angular CLI 16.2.16
- TypeScript with strict compiler and template checks
- Standalone components and Angular Router
- Reactive Forms, HttpClient, RxJS, and Angular Signals for future feature work
- Angular Material with SCSS
- Node.js 16.20.2 and npm 8.19.4 (current local environment)

The Angular framework registry does not publish version 16.2.16. The project pins the latest available Angular 16.2 framework patch (16.2.12), while keeping the requested CLI/build tooling at 16.2.16.

## Folder structure

```text
src/
	app/
		core/       # auth, guards, interceptors, services, models
		shared/     # reusable components, directives, pipes, validators
		features/   # dashboard, claims, survey, review, workshop
		layout/     # header, sidebar, shell
		app.routes.ts
		app.config.ts
	environments/ # API configuration
```

## Run the application

Install dependencies with `npm install`, then start the development server with `npm start`. Open `http://localhost:4200/` in a browser. Run `npm run build` to create a production build and `npm test` to execute unit tests.

The API base URL is configured as `/api` in both environment files.

## Planned features

- Authentication and role/permission-based routing
- Role-aware dashboard and claims list/details
- Reactive claim creation form and document handling
- Surveyor assessment and adjuster review workflows
- Workshop repair processing
- Reusable loading, empty, error, and status UI
