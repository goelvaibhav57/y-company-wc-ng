import { Routes } from '@angular/router';
import { AppShellComponent } from './layout/shell/app-shell.component';
import { authChildGuard, authGuard, guestGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { Permission } from './core/auth/auth.models';
import { surveyAssignmentGuard } from './features/survey/guards/survey-assignment.guard';
import { workshopAssignmentGuard } from './features/workshop/guards/workshop-assignment.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () => import('./features/auth/pages/login/login.component')
			.then((module) => module.LoginComponent),
		canActivate: [guestGuard],
		title: 'Sign in | eClaims'
	},
	{
		path: 'access-denied',
		loadComponent: () => import('./features/auth/pages/access-denied/access-denied.component')
			.then((module) => module.AccessDeniedComponent),
		title: 'Access Denied | eClaims'
	},
	{
		path: '',
		component: AppShellComponent,
		canActivate: [authGuard],
		canActivateChild: [authChildGuard],
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'dashboard'
			},
			{
				path: 'dashboard',
				loadComponent: () => import('./features/dashboard/dashboard.component')
					.then((module) => module.DashboardComponent),
				title: 'Dashboard | eClaims'
			},
			{
				path: 'claims/create',
				loadComponent: () => import('./features/claims/pages/create-claim.component')
					.then((module) => module.CreateClaimComponent),
				canActivate: [permissionGuard],
				data: {
					title: 'Create Claim',
					subtitle: 'Start a new claim submission',
					permission: Permission.ClaimCreate
				},
				title: 'Create Claim | eClaims'
			},
			{
				path: 'claims/:id/survey',
				loadComponent: () => import('./features/survey/pages/survey-assessment.component')
					.then((module) => module.SurveyAssessmentComponent),
				canActivate: [permissionGuard, surveyAssignmentGuard],
				data: {
					title: 'Survey Assessment',
					subtitle: 'Inspect and assess the claim',
					permission: Permission.ClaimSurvey
				},
				title: 'Survey Assessment | eClaims'
			},
			{
				path: 'claims/:id/review',
				loadComponent: () => import('./features/review/pages/review.component')
					.then((module) => module.ReviewComponent),
				canActivate: [permissionGuard],
				data: {
					title: 'Adjuster Review',
					subtitle: 'Review the claim assessment',
					permission: Permission.ClaimReview
				},
				title: 'Adjuster Review | eClaims'
			},
			{
				path: 'claims/:id/workshop',
				loadComponent: () => import('./features/workshop/pages/workshop.component')
					.then((module) => module.WorkshopComponent),
				canActivate: [permissionGuard, workshopAssignmentGuard],
				data: {
					title: 'Workshop Processing',
					subtitle: 'Update repair progress',
					permission: Permission.ClaimWorkshopUpdate
				},
				title: 'Workshop Processing | eClaims'
			},
			{
				path: 'claims/:id',
				loadComponent: () => import('./features/claims/pages/claim-details.component')
					.then((module) => module.ClaimDetailsComponent),
				canActivate: [permissionGuard],
				data: { title: 'Claim Details', subtitle: 'View claim information and activity', permission: Permission.ClaimRead },
				title: 'Claim Details | eClaims'
			},
			{
				path: 'claims',
				loadComponent: () => import('./features/claims/pages/claims-list.component')
					.then((module) => module.ClaimsListComponent),
				canActivate: [permissionGuard],
				data: { title: 'Claims', subtitle: 'Browse and manage claims', permission: Permission.ClaimRead },
				title: 'Claims | eClaims'
			},
		]
	},
	{
		path: '**',
		redirectTo: ''
	}
];
