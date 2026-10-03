# Angular eClaims POC – Development Instructions

## 1. Project Objective

Create a modern Angular frontend POC for an Electronic Claims Processing (eClaims) application.

The application should demonstrate:
- Modern Angular development practices
- Component-based architecture
- Reusable components
- Reactive forms
- REST API integration
- Authentication and authorization
- Role-based navigation and functionality
- Claim lifecycle/workflow
- Client-side validation
- Error handling
- Loading states
- Responsive UI
- Clean separation of concerns
- Maintainable and scalable frontend architecture

This is an interview POC, therefore prioritize clean architecture, readability, reusability, and demonstrable engineering practices over implementing every possible business feature.

---

# 2. Technology Stack

Use:

- Angular
- TypeScript
- Angular Router
- Reactive Forms
- HttpClient
- HTTP Interceptors
- Route Guards
- RxJS
- Angular Signals where appropriate
- Angular Material for UI components
- SCSS for styling

Use standalone Angular components.

Do NOT use NgModules unless there is a specific technical reason.

Use strict TypeScript configuration.

Avoid unnecessary third-party dependencies.

---

# 3. Application Domain

The application represents an insurance/eClaims processing system.

The primary business process is:

Customer
   ↓
Create Claim
   ↓
Surveyor Assessment
   ↓
Adjustor Review
   ↓
Workshop Processing
   ↓
Approval / Rejection
   ↓
Claim Closure

The POC should implement a simplified version of this workflow.

---

# 4. User Roles

Support the following roles:

CUSTOMER
SURVEYOR
ADJUSTER
WORKSHOP

Each role should have different application capabilities.

## CUSTOMER

Can:
- Login
- View dashboard
- View own claims
- Create a claim
- View claim details
- Upload/view claim documents
- View claim status
- View claim history

Cannot:
- Approve claims
- Perform surveyor assessment
- Perform adjustor review

## SURVEYOR

Can:
- Login
- View assigned claims
- View claim details
- Perform survey/inspection
- Add assessment details
- Upload inspection documents
- Submit claim for adjustor review

## ADJUSTER

Can:
- Login
- View claims awaiting review
- Review claim
- Review surveyor assessment
- Approve claim
- Reject claim
- Request additional information
- Add remarks

## WORKSHOP

Can:
- Login
- View claims assigned to workshop
- View approved repair information
- Update repair status
- Add repair/estimate information
- Mark repair as completed

---

# 5. Main Screens

Implement the following screens.

## 5.1 Login

Route:

/login

Fields:

- Username
- Password

Provide sample login credentials for each role.

Example:

customer@example.com
surveyor@example.com
adjuster@example.com
workshop@example.com

The password can be a common POC password.

On successful login:
- Store authentication state
- Store user role
- Redirect to dashboard

Do not store real credentials.

---

# 5.2 Dashboard

Route:

/dashboard

Create a role-aware dashboard.

Display summary cards such as:

- Total Claims
- Pending Claims
- Claims In Progress
- Approved Claims
- Rejected Claims

Display a recent claims table.

Dashboard content should change depending on the logged-in role.

For example:

Customer:
- My Claims
- Pending Claims
- Approved Claims

Surveyor:
- Assigned Claims
- Pending Inspections
- Completed Inspections

Adjuster:
- Claims Awaiting Review
- Approved
- Rejected
- Additional Information Required

Workshop:
- Assigned Repairs
- Repairs In Progress
- Completed Repairs

---

# 5.3 Claims List

Route:

/claims

Create a reusable claims table.

Columns:

- Claim Number
- Policy Number
- Customer
- Vehicle
- Claim Type
- Claim Amount
- Status
- Created Date
- Assigned To
- Actions

Support:

- Search
- Status filter
- Date filter
- Pagination
- Sorting

Use Angular Material table/paginator/sort where appropriate.

Do not tightly couple the table to the claims feature.

Create reusable UI components where appropriate.

---

# 5.4 Claim Details

Route:

/claims/:id

Display:

## Claim Summary

- Claim Number
- Policy Number
- Customer
- Vehicle
- Incident Date
- Claim Type
- Claim Amount
- Current Status

## Claim Timeline

Display major workflow events:

Claim Created
Survey Assigned
Survey Completed
Adjuster Review
Approval/Rejection
Workshop Assignment
Repair Completed
Claim Closed

Use a reusable timeline component.

## Documents

Display uploaded documents.

Example document types:

- Policy Document
- Vehicle Registration
- Driving License
- Accident Photos
- Survey Report
- Repair Estimate

## Activity / Comments

Display claim-related activities and comments.

## Actions

Actions should depend on the logged-in role and claim status.

---

# 5.5 Create Claim

Route:

/claims/create

Create a multi-section reactive form.

Sections:

### Customer Information

- Customer Name
- Contact Number
- Email

### Policy Information

- Policy Number
- Policy Type
- Policy Start Date
- Policy End Date

### Vehicle Information

- Registration Number
- Make
- Model
- Year

### Incident Information

- Incident Date
- Incident Location
- Incident Type
- Description

### Claim Information

- Estimated Claim Amount
- Supporting Documents

Implement:

- Required validation
- Email validation
- Date validation
- Numeric validation
- Maximum length validation
- Error messages
- Submit
- Cancel

After successful creation, navigate to claim details.

---

# 5.6 Survey Assessment

Route:

/claims/:id/survey

Visible to SURVEYOR.

Fields:

- Inspection Date
- Damage Description
- Damage Severity
- Estimated Repair Cost
- Recommended Action
- Surveyor Remarks

Actions:

- Save Draft
- Submit Assessment

After submission:

Claim status changes to:

SURVEY_COMPLETED

---

# 5.7 Adjuster Review

Route:

/claims/:id/review

Visible to ADJUSTER.

Display:

- Claim details
- Policy information
- Survey assessment
- Documents
- Claim history

Provide actions:

- Approve
- Reject
- Request Additional Information

Approval/rejection should require confirmation.

Reject and request-information actions should require remarks.

Statuses:

APPROVED
REJECTED
ADDITIONAL_INFORMATION_REQUIRED

---

# 5.8 Workshop Processing

Route:

/claims/:id/workshop

Visible to WORKSHOP.

Display:

- Claim details
- Approved amount
- Vehicle information
- Repair estimate

Allow workshop user to update:

- Repair Start Date
- Estimated Completion Date
- Actual Completion Date
- Repair Status
- Workshop Remarks

Repair statuses:

ASSIGNED
IN_PROGRESS
COMPLETED

---

# 6. Application Layout

Create:

## App Shell

Components:

- Header
- Sidebar
- Main Content
- Breadcrumbs
- User Profile
- Logout

Sidebar menu must be role-aware.

Example:

Customer:

Dashboard
My Claims
Create Claim

Surveyor:

Dashboard
Assigned Claims

Adjuster:

Dashboard
Claims for Review

Workshop:

Dashboard
Assigned Repairs

Do not hardcode role checks inside every component.

Create a centralized authorization mechanism.

---

# 7. Authentication Architecture

Implement a simple POC authentication architecture.

Create:

AuthService

Responsibilities:

- login()
- logout()
- isAuthenticated()
- getCurrentUser()
- getCurrentRole()
- hasRole()

Create an HTTP authentication interceptor.

The interceptor should attach:

Authorization: Bearer <token>

to API requests.

Exclude the login endpoint.

For the POC, the backend may return a mock JWT/token.

Do not implement authentication logic directly inside components.

---

# 8. Authorization

Implement:

- AuthGuard
- RoleGuard

Example:

/dashboard
/claims

requires authentication.

Example:

/claims/:id/survey

requires:

SURVEYOR

Example:

/claims/:id/review

requires:

ADJUSTER

Example:

/claims/:id/workshop

requires:

WORKSHOP

If the user does not have permission:

Return/display HTTP-style 403 behavior.

Provide an Access Denied page.

---

# 9. Permission-Based UI

Do not rely only on route guards.

UI actions should also be permission-aware.

Define permissions such as:

CLAIM_READ
CLAIM_CREATE
CLAIM_UPDATE
CLAIM_SURVEY
CLAIM_REVIEW
CLAIM_APPROVE
CLAIM_REJECT
CLAIM_WORKSHOP_UPDATE

Map roles to permissions centrally.

Example:

CUSTOMER:
CLAIM_READ
CLAIM_CREATE

SURVEYOR:
CLAIM_READ
CLAIM_SURVEY

ADJUSTER:
CLAIM_READ
CLAIM_REVIEW
CLAIM_APPROVE
CLAIM_REJECT

WORKSHOP:
CLAIM_READ
CLAIM_WORKSHOP_UPDATE

Create a reusable authorization directive or equivalent mechanism for conditional UI rendering.

Example:

Show Approve button only when:

user has CLAIM_APPROVE permission

and

claim status is eligible for approval.

---

# 10. REST API Architecture

Create a dedicated API layer.

Do not call HttpClient directly from components.

Use services such as:

AuthApiService
ClaimApiService
DashboardApiService
SurveyApiService
DocumentApiService
WorkshopApiService

Example APIs:

POST /api/auth/login

GET /api/claims

GET /api/claims/{id}

POST /api/claims

PUT /api/claims/{id}

POST /api/claims/{id}/survey

POST /api/claims/{id}/approve

POST /api/claims/{id}/reject

POST /api/claims/{id}/request-information

POST /api/claims/{id}/workshop

GET /api/claims/{id}/history

GET /api/claims/{id}/documents

For the POC, if no backend exists, create a mock API/data layer that can later be replaced with REST endpoints without changing components.

---

# 11. Models / Interfaces

Create strongly typed TypeScript interfaces.

Examples:

User
Role
Permission
Claim
Policy
Vehicle
SurveyAssessment
Document
ClaimActivity
WorkshopRepair
DashboardSummary
ApiResponse
ApiError

Do not use 'any' unless absolutely unavoidable.

---

# 12. Claim Status

Create a centralized ClaimStatus enum/type.

Example:

DRAFT
SUBMITTED
SURVEY_ASSIGNED
SURVEY_IN_PROGRESS
SURVEY_COMPLETED
UNDER_REVIEW
ADDITIONAL_INFORMATION_REQUIRED
APPROVED
REJECTED
WORKSHOP_ASSIGNED
REPAIR_IN_PROGRESS
REPAIR_COMPLETED
CLOSED

Do not use raw status strings throughout components.

---

# 13. Error Handling

Create a global HTTP error interceptor.

Handle:

400
401
403
404
409
500

Display user-friendly messages.

Examples:

401:
"Your session has expired. Please login again."

403:
"You do not have permission to perform this action."

404:
"The requested claim could not be found."

500:
"Something went wrong. Please try again."

Do not expose technical stack traces to the user.

---

# 14. Loading and Empty States

Every API-driven screen should support:

- Loading state
- Success state
- Empty state
- Error state

Create reusable components where appropriate.

Examples:

LoadingSpinner
EmptyState
ErrorMessage
ConfirmationDialog

---

# 15. Reusable Components

Create reusable components for:

- PageHeader
- StatusBadge
- ClaimTable
- SearchFilter
- Timeline
- DocumentList
- LoadingIndicator
- EmptyState
- ErrorState
- ConfirmationDialog
- UserAvatar/ProfileMenu

Avoid duplicating UI logic.

---

# 16. Form Architecture

Use Reactive Forms.

Do not use template-driven forms.

Create separate form components where appropriate.

Centralize reusable validators.

Example:

DateRangeValidator
RequiredFileValidator
ClaimAmountValidator

Forms must display clear validation messages.

---

# 17. State Management

Do not introduce NgRx unless the POC actually requires it.

Prefer:

- Angular Signals
- RxJS
- Feature-level services

Use signals for local UI/application state where appropriate.

Keep state ownership clear.

Avoid unnecessary global state.

---

# 18. Folder Structure

Use feature-based architecture.

Recommended structure:

src/app/

  core/
    auth/
    guards/
    interceptors/
    services/
    models/

  shared/
    components/
    directives/
    pipes/
    validators/

  features/

    dashboard/
      pages/
      components/
      services/

    claims/
      pages/
      components/
      services/
      models/

    survey/
      pages/
      components/
      services/

    review/
      pages/
      components/
      services/

    workshop/
      pages/
      components/
      services/

  layout/
    header/
    sidebar/
    shell/

  app.routes.ts

Do not create a large generic "components" folder containing all application components.

Organize code by feature.

---

# 19. Routing

Use lazy-loaded routes for major features.

Example:

/login

/dashboard

/claims

/claims/create

/claims/:id

/claims/:id/survey

/claims/:id/review

/claims/:id/workshop

/access-denied

Use route guards.

---

# 20. UI/UX

Use Angular Material.

The application should look like a professional enterprise application.

Requirements:

- Responsive layout
- Consistent spacing
- Clear typography
- Professional tables
- Status badges
- Cards for dashboard metrics
- Confirmation dialogs for destructive actions
- Accessible form labels
- Keyboard-friendly controls
- Meaningful empty states

Avoid excessive animations.

---

# 21. Mock Data

Create realistic mock data for:

- Users
- Claims
- Policies
- Vehicles
- Survey assessments
- Documents
- Claim history
- Dashboard statistics

Create at least:

10 claims

covering different statuses.

Create users for all four roles.

The mock data should allow demonstration of the complete claim lifecycle.

---

# 22. Demo Scenario

The application must support this interview demonstration:

1. Login as CUSTOMER
2. Create a new claim
3. View the newly created claim
4. Logout
5. Login as SURVEYOR
6. Open assigned claim
7. Complete survey assessment
8. Submit assessment
9. Logout
10. Login as ADJUSTER
11. Review claim
12. Approve claim
13. Logout
14. Login as WORKSHOP
15. Open approved claim
16. Update repair status
17. Mark repair as completed

The UI should clearly demonstrate how the claim progresses through the workflow.

---

# 23. Code Quality Rules

Follow these rules:

- Use strict TypeScript.
- Avoid any.
- Prefer interfaces/types over loosely typed objects.
- Use standalone components.
- Use OnPush/change detection strategy where appropriate.
- Prefer Angular Signals for simple reactive state.
- Use RxJS for asynchronous streams.
- Keep components focused on presentation and orchestration.
- Keep API calls in services.
- Keep business logic out of templates.
- Avoid deeply nested subscriptions.
- Prefer async pipe/signals.
- Avoid duplicated logic.
- Use meaningful names.
- Keep methods small.
- Use constants/enums for repeated values.
- Do not hardcode API URLs inside services.
- Use environment configuration.
- Do not put business rules directly in HTML templates.
- Add comments only where they explain non-obvious decisions.

---

# 24. Security Guidelines

Never:

- Store passwords.
- Hardcode secrets.
- Put JWT secrets in Angular.
- Trust role information supplied directly by the UI.
- Implement authorization only in the frontend.

The frontend authorization is for UX and route protection.

The backend must independently enforce authorization.

For the POC, clearly separate authentication, authorization, and UI permissions.

---

# 25. Testing

Create unit tests for important:

- Services
- Guards
- Interceptors
- Permission logic
- Form validators
- Critical components

At minimum test:

AuthService
AuthGuard
RoleGuard
ClaimService
PermissionService

Test:

- Successful login
- Failed login
- Unauthorized navigation
- Authorized navigation
- Permission checks
- Claim creation validation
- Claim approval
- Claim rejection

---

# 26. Accessibility

Follow basic accessibility practices:

- Semantic HTML
- Labels for form fields
- Keyboard navigation
- Accessible buttons
- Accessible dialogs
- Meaningful ARIA labels where necessary
- Do not communicate status using color alone

---

# 27. Environment Configuration

Create environment configuration for:

API base URL

Example:

apiBaseUrl: '/api'

Do not hardcode URLs throughout the application.

---

# 28. Development Approach

Build incrementally.

Do NOT generate the entire application blindly in one step.

Implement in this order:

1. Project setup
2. Application shell
3. Authentication
4. Routing and guards
5. Role/permission framework
6. Dashboard
7. Claims list
8. Claim details
9. Create claim
10. Survey workflow
11. Adjuster workflow
12. Workshop workflow
13. Error handling
14. Loading/empty states
15. Unit tests
16. Final cleanup

After each major feature:

- Compile the application
- Fix TypeScript errors
- Fix template errors
- Check routing
- Check responsive behavior
- Add/update tests

Do not proceed while introducing known compilation errors.

---

# 29. Copilot Agent Behavior

When implementing this project:

1. First inspect the existing project structure.
2. Do not overwrite existing code unnecessarily.
3. Reuse existing components/services where appropriate.
4. Before creating a new component, check whether an existing reusable component can be extended.
5. Keep changes focused on the requested feature.
6. Explain important architectural decisions.
7. After implementation, identify files changed.
8. Run/build/test the application where tooling allows.
9. Fix errors introduced by the changes.
10. Do not introduce dependencies without justification.

When requirements are ambiguous, choose the simplest enterprise-friendly implementation and document the assumption.

---

# 30. Definition of Done

A feature is complete only when:

- UI is implemented
- Routing is implemented
- Authorization is implemented where required
- API/service layer exists
- Loading state exists
- Empty state exists where applicable
- Error handling exists
- Validation exists for forms
- Responsive layout works
- Unit tests exist for important logic
- TypeScript compilation succeeds
- No unnecessary duplication exists

The final application should be suitable for demonstrating Angular architecture and enterprise frontend development practices during a technical interview.