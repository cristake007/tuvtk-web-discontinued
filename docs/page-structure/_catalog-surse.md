# Catalogul surselor componentelor

Catalogul este cheia de rezolvare pentru numele din arborii tuturor rutelor. Un arbore arată relația părinte–copil; acest catalog evită repetarea aceleiași căi de zeci de ori și oferă sursa exactă pentru fiecare componentă React internă întâlnită.

## Rutare, gardieni și runtime

| Componentă | Fișier sursă |
|---|---|
| `AppRoutes`, toate wrapper-ele lazy (`CoursePlannerRoute`, `AdministrationRoute` etc.) | `frontend/src/app/router.tsx` |
| `AuthenticationGate`, `DeferredView` | `frontend/src/app/AuthenticationGate.tsx` |
| `AuthenticatedBootstrapProvider` | `frontend/src/app/AuthenticatedBootstrapContext.tsx` |
| `ApplicationAccessRoute` | `frontend/src/app/ApplicationAccessRoute.tsx` |
| `StaffRoute`, `AccessDenied` | `frontend/src/app/StaffRoute.tsx` |
| `AdministrationLayout` | `frontend/src/app/AdministrationLayout.tsx` |
| `RouteErrorBoundary` | `frontend/src/app/RouteErrorBoundary.tsx` |
| `ApiAuthorizationHandler` | `frontend/src/app/ApiAuthorizationHandler.tsx` |
| `LoadingOverlayProvider` | `frontend/src/app/LoadingOverlayContext.tsx` |
| `GlobalLoadingOverlay` | `frontend/src/app/GlobalLoadingOverlay.tsx` |

`StrictMode` și `Suspense` provin din pachetul `react`; `QueryClientProvider`, `useQuery`, `useMutation` și `useQueryClient` din `@tanstack/react-query`; `RouterProvider`, `Outlet`, `Navigate`, `Link`, `NavLink` și hook-urile de router din `react-router-dom`.

## Shell și navigație

| Componentă | Fișier sursă |
|---|---|
| `AppShell` | `frontend/src/layout/AppShell.tsx` |
| `AppHeader`, `HeaderBrand` | `frontend/src/layout/app-shell/AppHeader.tsx` |
| `AppSidebar`, `NavigationEntry`, `BrandSidebarRail` | `frontend/src/layout/app-shell/AppSidebar.tsx` |
| `MeniuFlyoutNavigatie` | `frontend/src/layout/app-shell/NavigationFlyoutMenu.tsx` |
| `HeaderSearch` | `frontend/src/layout/app-shell/HeaderSearch.tsx` |
| `NotificationMenu` | `frontend/src/layout/app-shell/NotificationMenu.tsx` |
| `UserMenu`, `UserAvatar` | `frontend/src/layout/app-shell/UserMenu.tsx` |
| `AdminRail`, `AdminRailGroup` | `frontend/src/features/administration/AdminRail.tsx` |
| `AdminPageHeader` | `frontend/src/features/administration/AdminPageHeader.tsx` |
| `AdministrationHeader` | `frontend/src/features/administration/AdministrationHeader.tsx` |
| `AdministrationUserInterfaceHeader` | `frontend/src/features/branding/AdministrationUserInterfaceHeader.tsx` |
| `UtilizatoriHeader` | `frontend/src/features/utilizatori/UtilizatoriHeader.tsx` |
| `UtilizatorFormHeader` | `frontend/src/features/utilizatori/UtilizatorFormHeader.tsx` |
| `GrupuriAplicatiiHeader` | `frontend/src/features/utilizatori/GrupuriAplicatiiHeader.tsx` |
| `IntegrationsHeader` | `frontend/src/features/integrations/IntegrationsHeader.tsx` |
| `PublicHolidaysIntegrationHeader` | `frontend/src/features/integrations/public-holidays/PublicHolidaysIntegrationHeader.tsx` |

## Pagini terminale

| Componentă | Fișier sursă |
|---|---|
| `TablouDeBordPage` | `frontend/src/pages/TablouDeBordPage.tsx` |
| `WorkspaceCardPage` | `frontend/src/pages/WorkspaceCardPage.tsx` |
| `ModulePlaceholderPage` | `frontend/src/pages/ModulePlaceholderPage.tsx` |
| `DocumentePage` | `frontend/src/pages/DocumentePage.tsx` |
| `CoursePlannerPage` | `frontend/src/pages/CoursePlannerPage.tsx` |
| `CoursePlannerGeneratorPage` | `frontend/src/pages/CoursePlannerGeneratorPage.tsx` |
| `CoursePlannerHistoryPage` | `frontend/src/pages/CoursePlannerHistoryPage.tsx` |
| `CoursePlannerXmlPage` | `frontend/src/pages/CoursePlannerXmlPage.tsx` |
| `CoursePlannerWordMatcherPage` | `frontend/src/pages/CoursePlannerWordMatcherPage.tsx` |
| `UpdateWordPressPage` | `frontend/src/pages/UpdateWordPressPage.tsx` |
| `AdministrationPage`, `AdministrationEntryRow` | `frontend/src/pages/AdministrationPage.tsx` |
| `AdministrationUserInterfacePage` | `frontend/src/pages/AdministrationUserInterfacePage.tsx` |
| `UtilizatoriPage` | `frontend/src/pages/UtilizatoriPage.tsx` |
| `UtilizatorFormPage` | `frontend/src/pages/UtilizatorFormPage.tsx` |
| `GrupuriAplicatiiPage` | `frontend/src/pages/GrupuriAplicatiiPage.tsx` |
| `IntegrationsPage` | `frontend/src/pages/IntegrationsPage.tsx` |
| `PublicHolidaysIntegrationPage` | `frontend/src/pages/PublicHolidaysIntegrationPage.tsx` |
| `LoginPage`, `RotatingQuote` | `frontend/src/pages/LoginPage.tsx` |

## Componente comune paginilor

| Componentă | Fișier sursă |
|---|---|
| `ApplicationState` | `frontend/src/components/ApplicationState.tsx` |
| `QueryApplicationState` | `frontend/src/components/QueryApplicationState.tsx` |
| `AntetAplicatie` | `frontend/src/components/AntetAplicatie.tsx` |
| `FileUploadField` | `frontend/src/components/FileUploadField.tsx` |
| `LoginForm` | `frontend/src/features/auth/LoginForm.tsx` |
| `PublicBrandMark` | `frontend/src/features/branding/PublicBrandMark.tsx` |
| `TablouDeBordPanou` | `frontend/src/features/tablou-de-bord/TablouDeBordPanou.tsx` |
| `DocumentePanou` | `frontend/src/features/documente/DocumentePanou.tsx` |

## Planificator și WordPress

| Componentă | Fișier sursă |
|---|---|
| `CoursePlannerPanel` | `frontend/src/features/course-planner/CoursePlannerPanel.tsx` |
| `PlannerHeader` | `frontend/src/features/course-planner/components/PlannerHeader.tsx` |
| `PlannerConfigurationCard` | `frontend/src/features/course-planner/components/PlannerConfigurationCard.tsx` |
| `PlannerSummaryCard`, `SummaryRow`, `ArtifactStatus` | `frontend/src/features/course-planner/components/PlannerSummaryCard.tsx` |
| `CourseScheduleTable` | `frontend/src/features/course-planner/components/CourseScheduleTable.tsx` |
| `CoursePlanHistoryTable`, `FileDownloadButton` | `frontend/src/features/course-planner/CoursePlanHistoryTable.tsx` |
| `XmlFormatterPanel` | `frontend/src/features/course-planner/XmlFormatterPanel.tsx` |
| `WordMatcherPanel` | `frontend/src/features/course-planner/WordMatcherPanel.tsx` |
| `UpdateWordPressPanel` | `frontend/src/features/update-wordpress/UpdateWordPressPanel.tsx` |

## Branding și interfață utilizator

| Componentă | Fișier sursă |
|---|---|
| `UserInterfaceSettingsTabs` | `frontend/src/features/branding/UserInterfaceSettingsTabs.tsx` |
| `LiveShellPreview`, `RandNavigatiePrevizualizare` | `frontend/src/features/branding/components/LiveShellPreview.tsx` |
| `GeneralSettingsCard` | `frontend/src/features/branding/components/GeneralSettingsCard.tsx` |
| `BrandingPanel` | `frontend/src/features/branding/components/BrandingPanel.tsx` |
| `BrandColorsSection`, `CampCuloare` | `frontend/src/features/branding/components/BrandColorsSection.tsx` |
| `CompanyLogoSettings` | `frontend/src/features/branding/CompanyLogoSettings.tsx` |
| `MenuSettingsCard` | `frontend/src/features/branding/components/MenuSettingsCard.tsx` |
| `ListaMeniuSortabila`, `ElementMeniuSortabil` | `frontend/src/features/branding/SortableMenuList.tsx` |
| `SeparatorTitleDialog` | `frontend/src/features/branding/SeparatorTitleDialog.tsx` |
| `UnsavedBadge` | `frontend/src/features/branding/components/UnsavedBadge.tsx` |

Componentele fără DOM din acest feature sunt hook-urile `useUserInterfaceSettings` (`frontend/src/features/branding/useUserInterfaceSettings.ts`) și `useCompanyLogoSettings` (`frontend/src/features/branding/useCompanyLogoSettings.ts`). Ele apar în secțiunile de date/stări, nu ca noduri DOM.

## Utilizatori și grupuri

| Componentă | Fișier sursă |
|---|---|
| `UtilizatoriPanel`, `AccountTypeBadge` | `frontend/src/features/utilizatori/UtilizatoriPanel.tsx` |
| `UtilizatorForm` | `frontend/src/features/utilizatori/UtilizatorDialog.tsx` |
| `GrupuriAplicatiiPanel`, `GrupDialog` | `frontend/src/features/utilizatori/GrupuriAplicatiiPanel.tsx` |

## Zile libere

| Componentă | Fișier sursă |
|---|---|
| `PublicHolidaysIntegrationPanel` | `frontend/src/features/integrations/public-holidays/PublicHolidaysIntegrationPanel.tsx` |
| `NagerDateSettingsCard` | `frontend/src/features/integrations/public-holidays/components/NagerDateSettingsCard.tsx` |
| `InternalHolidayForm` | `frontend/src/features/integrations/public-holidays/components/InternalHolidayForm.tsx` |
| `PublicHolidayTable` | `frontend/src/features/integrations/public-holidays/components/PublicHolidayTable.tsx` |
| `usePublicHolidaysIntegration` (fără DOM) | `frontend/src/features/integrations/public-holidays/usePublicHolidaysIntegration.ts` |

## Primitive UI și tagul DOM principal

Toate sunt fișiere generate/localizate sub `frontend/src/components/ui/`.

| Componentă | Fișier | DOM principal estimat |
|---|---|---|
| `Alert`, `AlertTitle`, `AlertDescription` | `alert.tsx` | `div` |
| familia `AlertDialog*` | `alert-dialog.tsx` | root fără tag + portal; overlay/content `div`, content cu `role=alertdialog` |
| `Avatar*` | `avatar.tsx` | primitive Base UI + `span` pentru badge |
| `Badge` | `badge.tsx` | `span` implicit |
| familia `Breadcrumb*` | `breadcrumb.tsx` | `nav > ol > li`, link `a`, page `span` |
| `Button` | `button.tsx` | `button` sau elementul furnizat prin `render` |
| `Card`, `CardHeader`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter` | `card.tsx` | `div` |
| `CardTitle` | `card.tsx` | `h3` |
| `Checkbox` | `checkbox.tsx` | control Base UI, în browser `button[role=checkbox]` |
| familia `Collapsible*` | `collapsible.tsx` | root/content Base UI, trigger `button` implicit |
| familia `Dialog*` | `dialog.tsx` | root fără tag + portal; content `div[role=dialog]` |
| familia `DropdownMenu*` | `dropdown-menu.tsx` | root fără tag, trigger înlocuit de `render`, content portalizat |
| `Field`, `FieldGroup`, `FieldContent`, `FieldError` | `field.tsx` | `div` |
| `FieldLabel`, `Label` | `field.tsx`, `label.tsx` | `label` |
| `FieldDescription` | `field.tsx` | `p` |
| `PageTitle`, `SectionTitle` | `heading.tsx` | `h1`, respectiv `h2` |
| `Input`, `InputGroupInput` | `input.tsx`, `input-group.tsx` | `input` |
| `InputGroup`, `InputGroupAddon` | `input-group.tsx` | `div` |
| `NativeSelect`, `NativeSelectOption` | `native-select.tsx` | `div > select > option` |
| familia `Pagination*` | `pagination.tsx` | `nav > ul > li > a` |
| familia `Select*` | `select.tsx` | trigger Base UI + content portalizat; items sunt option-like DOM |
| `Separator` | `separator.tsx` | primitive Base UI cu `role=separator` |
| `SidebarProvider` | `sidebar.tsx` | `div[data-slot=sidebar-wrapper]` |
| `Sidebar` și containerele sale | `sidebar.tsx` | desktop `div`; mobil dialog portal; menu `ul/li` |
| `SidebarInset` | `sidebar.tsx` | `main` |
| `Slider` | `slider.tsx` | root/track/thumb Base UI, control cu rol slider |
| `Spinner` | `spinner.tsx` | `svg` |
| `Switch` | `switch.tsx` | control Base UI, în browser `button[role=switch]` |
| familia `Table*` | `table.tsx` | `div > table > thead/tbody/tfoot > tr > th/td`, caption `caption` |
| familia `Tabs*` | `tabs.tsx` | primitive Base UI: root/list/panel containere, trigger `button[role=tab]` |
| `Textarea` | `textarea.tsx` | `textarea` |
| familia `Tooltip*` | `tooltip.tsx` | provider/root fără DOM util; content portalizat |
| `Toaster` | `sonner.tsx` | container Sonner portalizat cu toast-uri condiționate |

Iconurile `ArrowRight`, `CalendarDays`, `Search` etc. provin din `lucide-react` și produc `svg`. Primitivele drag-and-drop (`DndContext`, `SortableContext`, `useSortable`) provin din `@dnd-kit/core` și `@dnd-kit/sortable`; context providers nu introduc în mod necesar taguri DOM proprii.
