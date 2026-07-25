# EspoCRM-Compatible Roles and Teams Design

## Status

This document is the implementation reference for adding EspoCRM-compatible roles, teams, record ownership, field security, and special permissions to TUVTK Web.

It is a research and architecture document only. It does not enable access-control enforcement and does not add database migrations by itself.

Research snapshot:

- date: `2026-07-25`;
- upstream repository: `espocrm/espocrm`;
- inspected branch: `master`;
- inspected upstream commit: `d776b1f106cef73fbe8f91e87e32844c17d30ebc`;
- target repository: `cristake007/tuvtk-web`;
- target branch: `dev`.

The target is behavioral compatibility with EspoCRM, not a copy of its PHP implementation or database schema. The Django implementation must be original, use this project's architecture, and reproduce the observable permission rules described below.

## Why this must be implemented as a platform capability

Roles and teams cannot be added only to the `utilizatori` page. They affect:

- which modules a user can open;
- which records appear in list endpoints;
- which individual records can be read, edited, or deleted;
- which fields are returned or accepted by the API;
- who a record can be assigned to;
- which teams can be attached to a record;
- exports, mass updates, audit access, streams, collaborators, calendars, and future modules;
- navigation visibility and frontend action availability.

Authorization must therefore be centralized in Django and applied before pagination, serialization, exports, counts, and mutations. React may hide unavailable actions, but React is not a security boundary.

## EspoCRM behavior to reproduce

### Role sources

An internal non-admin user receives roles from three additive sources:

1. the configured baseline role, if one exists;
2. roles assigned directly to the user;
3. roles assigned to every team of which the user is a member.

The sources are merged into one effective ACL table for the user. Team roles are inherited automatically; they are not copied onto the user record.

Role order does not create precedence. The most permissive grant wins for each scope, action, field, and special permission.

### Additive merge semantics

EspoCRM uses permissive merging, not deny-overrides.

For record access actions, the order from most permissive to least permissive is:

```text
all > team > own > no
```

For creation and boolean permissions:

```text
yes > no
```

Each individual role may leave a value unset. An unset value does not participate in the merge. If all roles leave a value unset, the strict default is denial.

Consequences:

- one role granting `all` and another granting `no` resolves to `all`;
- one role granting `team` and another granting `own` resolves to `team`;
- a restrictive role cannot remove access granted by another role;
- restrictions must be achieved by removing the permissive role, changing it, or applying a platform-level mandatory restriction;
- users with no applicable role receive minimal access.

### Administrator behavior

EspoCRM administrators bypass normal role restrictions and receive the highest available access, except for system-disabled scopes and mandatory platform restrictions.

TUVTK mapping:

- Django `is_superuser=True` is the full ACL bypass and access-control administrator;
- Django `is_staff=True` only permits entry to staff administration areas and does not imply unrestricted business-data access;
- a staff user must still be evaluated against roles for normal application scopes;
- only superusers should create or modify roles, teams, memberships, baseline-role configuration, or direct role assignments during the initial implementation phases.

This preserves the existing distinction between staff administration access and full platform control.

### Scope actions

A scope is an access-controlled resource type, such as `companies`, `documents`, `course_plans`, or a future CRM entity.

EspoCRM defines these actions:

```text
create
read
edit
delete
stream
```

`create` is a boolean permission (`yes` or `no`). The other record actions use `all`, `team`, `own`, or `no`.

A scope can also be disabled completely by platform configuration. Disabled scopes stay unavailable even for administrators when the platform marks the scope as unavailable.

### Record-level meanings

#### All

The user can perform the action on every record in the scope, subject to field restrictions and mandatory platform rules.

#### Team

For record visibility, a record qualifies when at least one of these is true:

- the record is related to one of the user's teams;
- the user owns the record;
- the record is shared with the user through collaborators, for actions where collaborator sharing applies.

EspoCRM's list filtering implements this as an `OR`, not only as team intersection. A user with team access therefore continues to see their own record even when the record has no team.

#### Own

Ownership is resolved in this order:

1. if the scope supports multiple assigned users, the current user is one of them;
2. otherwise, if it supports one assigned user, that user is the current user;
3. otherwise, if it supports `created_by`, the creator is the current user;
4. otherwise, no record can satisfy `own`.

For read and stream access, collaborators are also treated as shared access when the scope supports collaborators and the role level is not `no`.

#### No

No record qualifies. List queries must return an empty queryset, and object-level access must fail.

### Collaborators

EspoCRM collaborators provide read and stream access when the user's role level for that scope is not `no`.

Behavior to preserve in a later phase:

- collaborators do not grant edit or delete by themselves;
- the creator is initially added as a collaborator on supported scopes;
- assignees are added as collaborators;
- a previous assignee can remain a collaborator after reassignment;
- adding or removing collaborators requires edit access to the record and sufficient assignment permission;
- collaborator membership is included in list query filters for shared read access.

Collaborators are not required for the first roles-and-teams milestone, but the core access compiler and ownership adapter must leave space for them.

### Baseline role

A single optional baseline role is applied to every internal non-superuser account.

Other direct and team roles only add permissions on top of it. Because merge behavior is permissive, a baseline role should contain the minimum common access, not restrictions intended to override other roles.

Changing the baseline role must invalidate every compiled user ACL immediately.

### Direct roles and team roles

A role can be linked directly to users and to teams.

A user's effective role sources must be visible separately:

- baseline;
- direct;
- inherited from team, including the source team.

The effective-access view must show both source roles and the final merged result. This corresponds to EspoCRM's `Access` action on a user detail page and is essential for diagnosing why a user has a permission.

### Teams

EspoCRM teams are flat groups; they are not nested organizational trees.

A user can belong to multiple teams. A team can have:

- a name;
- a description;
- one or more roles;
- a position list;
- users, where each membership may carry a position;
- optional presentation settings such as a layout set.

The membership position is descriptive and can be used by assignment workflows. It is not an ACL role and must not be confused with role inheritance.

A role attached to a team is inherited by every current team member.

### Default team

A user may have one default team, and that team must also be one of the user's memberships.

EspoCRM uses the default team for at least these behaviors:

- newly created records are related to that team by default;
- team-specific layout configuration can be resolved through the user's default team.

TUVTK must enforce the membership invariant transactionally. When a default-team membership is removed, the API must either require a replacement default team in the same transaction or clear the default team explicitly. It must never leave an invalid reference.

### Assignment permission

Assignment permission is independent from scope `edit` access. Editing a record does not automatically allow unrestricted reassignment.

Levels:

```text
all
team
no
```

Behavior:

- `all`: the user can assign to eligible users and teams without team restriction;
- `team`: a target user must share at least one team with the acting user, and assigned teams must belong to the acting user's team set;
- `no`: the user cannot change assigned users or teams.

Creating records must still be practical when assignment is restricted:

- default assigned user is the creator when the scope uses an assigned user;
- default team is the creator's default team when available;
- server defaults are applied before assignment validation;
- clients cannot bypass assignment permission by sending relationship IDs directly.

EspoCRM also uses assignment permission for some user/team stream and collaborator operations. Those integrations belong to later phases.

### User permission

User permission controls access to other users and supervisory information.

Levels:

```text
all
team
no
```

The current user always remains accessible to themselves.

At `team`, another user is accessible only when the two users share at least one team. This permission must protect:

- user lookup endpoints;
- assignment candidate endpoints;
- another user's effective-access details;
- future user streams and supervisory views.

The current `utilizatori` administration endpoint remains a separate privileged administration function. When roles are enforced, normal business users must not gain administration access merely because their User permission is `all`.

### Other special permissions

EspoCRM defines special permissions independently from scope actions. The compatibility registry should support at least:

```text
assignment
user
user_calendar
portal
group_email_account
export
mass_update
data_privacy
follower_management
message
audit
mention
lock
```

Not every permission must be active in phase one. The registry must support adding them without schema changes.

Recommended first active permissions:

```text
assignment: all | team | no
user: all | team | no
export: yes | no
mass_update: yes | no
audit: yes | no
```

Later modules can activate the remaining permissions when the associated feature exists.

### Field-level security

For each scope and field, a role may define:

```text
read: yes | no
edit: yes | no
```

Unset values do not participate in merging. More permissive values win.

Effective behavior:

- no read access: the field is not exposed by normal API responses and is not rendered in normal frontend views;
- no edit access: input for the field is rejected or removed before persistence;
- field access never grants record access;
- record access is evaluated first, then field access;
- global sensitive-field restrictions can remain mandatory regardless of roles;
- fields used internally for authorization must never become writable merely because a role says `yes`.

For TUVTK APIs, explicit attempts to write a forbidden field should return the standard API error envelope with field-level details. This provides clearer diagnostics than silently discarding user input while preserving the same security result.

### Delete-created exception

EspoCRM can optionally allow users to delete recently created records even when the merged delete level would normally deny the operation. Its default threshold is 24 hours and it applies only under specific creator and assignment conditions.

This is an advanced compatibility feature. It must not be included in the initial enforcement phase. If added later, it must be:

- disabled by default in TUVTK;
- controlled by explicit platform settings;
- tested separately from standard role resolution;
- applied consistently to detail and bulk deletion paths;
- recorded in audit logs.

### Mandatory platform rules

EspoCRM applies strict defaults, disabled scopes, mandatory rules for normal users, and administrator-mandatory rules after role merging.

TUVTK needs the same concept even if the first UI does not expose it.

Examples:

- authentication fields cannot be edited through a generic scope permission;
- security and audit fields remain read-only;
- disabled modules remain disabled;
- superusers can still be prevented from changing internal immutable fields through normal APIs;
- permissions absent from all roles default to denial.

Mandatory rules must be code/configuration-owned, not editable through the normal role editor.

## Django domain model

Create a dedicated backend application:

```text
backend/apps/access_control/
```

Do not place the ACL compiler inside `authentication`, `core`, or `utilizatori`. Authentication establishes identity; access control decides authorization.

### AccessRole

Suggested fields:

```text
id
name
slug
description
is_active
created_at
updated_at
created_by
updated_by
```

Constraints:

- `name` and `slug` unique among active roles;
- inactive roles do not participate in compilation;
- deleting a role with assignments should be a soft deactivation or an explicit protected operation;
- role mutations require superuser permission in the initial version.

### AccessRoleScopePermission

One row per role and scope:

```text
role
scope_code
create_level
read_level
edit_level
delete_level
stream_level
```

Allowed stored values:

```text
create_level: not_set | yes | no
record levels: not_set | all | team | own | no
```

Constraint:

```text
unique(role, scope_code)
```

Using normalized rows instead of a large JSON blob provides database constraints, auditability, focused API updates, and easier migrations while preserving EspoCRM behavior.

### AccessRoleFieldPermission

One row per role, scope, and field:

```text
role
scope_code
field_code
read_level
edit_level
```

Allowed values:

```text
not_set | yes | no
```

Constraint:

```text
unique(role, scope_code, field_code)
```

Only fields registered by the scope definition may be stored.

### AccessRoleSpecialPermission

One row per role and registered special permission:

```text
role
permission_code
level
```

Constraint:

```text
unique(role, permission_code)
```

The permission registry defines the allowed level set and ranking for each permission.

### Team

Suggested fields:

```text
id
name
slug
description
position_list
is_active
created_at
updated_at
created_by
updated_by
```

`position_list` can be a validated JSON array of unique non-empty strings because its behavior matches EspoCRM's ordered list and does not require independent permissions.

Teams remain flat in the compatibility implementation. Do not add parent-team inheritance unless a separate future requirement explicitly changes the model.

### TeamMembership

Through model between Django user and team:

```text
user
team
position
is_active
created_at
created_by
```

Constraint:

```text
unique(user, team)
```

Rules:

- membership position is empty or one of the team's configured positions;
- inactive membership does not grant roles or record access;
- membership mutation invalidates the user's effective ACL;
- users cannot add themselves to teams through their own profile endpoint;
- removing membership must handle the default-team invariant.

### TeamRoleAssignment

Through model:

```text
team
role
created_at
created_by
```

Constraint:

```text
unique(team, role)
```

A change affects every active member of the team.

### UserRoleAssignment

Through model:

```text
user
role
created_at
created_by
```

Constraint:

```text
unique(user, role)
```

This table represents only direct roles. Team-inherited and baseline roles must not be copied into it.

### UserAccessProfile

The project currently uses Django's existing user model. Replacing it with a custom user model at this stage would be invasive and is not required.

Use a one-to-one profile:

```text
user
default_team
access_version
created_at
updated_at
```

Rules:

- default team is nullable;
- default team must be an active team with an active membership for the user;
- `access_version` supports safe cache invalidation if per-user versioning is adopted;
- profile creation is automatic and idempotent.

### AccessControlConfiguration

Singleton configuration:

```text
baseline_role
revision
is_enforcement_enabled
updated_at
updated_by
```

The baseline role is nullable. The revision changes after any mutation that can affect effective access.

### Scope registry

Scope definitions should be code-owned rather than administrator-created database rows.

Suggested location:

```text
backend/apps/access_control/scopes.py
```

Each registered scope declares:

```text
code
label
model or service resource
supported actions
ownership strategy
supports teams
supports collaborators
supports stream
assignable
registered fields
mandatory field restrictions
enforcement state
```

Example conceptual definition:

```text
code: course_plans
supported_actions: create, read, edit, delete
ownership: assigned_user_then_created_by
supports_teams: true
supports_collaborators: false
enforcement: shadow
```

Permissions stored for unknown scope or field codes must fail validation. Removing a registered field or scope requires a deliberate data migration or cleanup command.

## Effective ACL compiler

Create one service responsible for compilation:

```text
backend/apps/access_control/compiler.py
```

Input:

```text
user
```

Output should be an immutable structure containing:

```text
source roles
merged scope permissions
merged field permissions
merged special permissions
user team IDs
default team ID
revision/cache metadata
```

### Compilation algorithm

For a non-superuser:

1. load the active baseline role, if configured;
2. load active direct user roles;
3. load active team memberships;
4. load active roles for those teams;
5. preserve source metadata for diagnostics;
6. merge every scope/action using the registered rank;
7. merge field read/edit values using `yes > no`, ignoring `not_set`;
8. merge special permissions using each permission's registry-defined rank;
9. apply strict-deny defaults to missing values;
10. apply mandatory platform restrictions;
11. return the immutable effective ACL.

For a superuser:

1. produce highest normal access for enabled scopes;
2. keep system-disabled scopes disabled;
3. apply administrator-mandatory field and action restrictions;
4. return source metadata indicating superuser bypass.

### Merge functions

Merge functions must be pure and unit-tested.

Suggested APIs:

```text
merge_record_level(levels) -> all | team | own | no
merge_boolean_level(levels) -> yes | no
merge_special_level(permission_code, levels) -> registered level
merge_field_level(levels) -> yes | no
```

`not_set` is ignored before ranking. An empty list resolves to the registered strict default, normally `no`.

Never implement permission merging with database row order, Python enum order by accident, or the first matching role.

## Central authorization services

Suggested modules:

```text
backend/apps/access_control/compiler.py
backend/apps/access_control/checker.py
backend/apps/access_control/querysets.py
backend/apps/access_control/assignment.py
backend/apps/access_control/fields.py
backend/apps/access_control/cache.py
backend/apps/access_control/registry.py
```

### Scope checker

Must answer:

```text
can_create(user, scope)
can_read(user, scope, object)
can_edit(user, scope, object)
can_delete(user, scope, object)
can_stream(user, scope, object)
```

Object checks must use the same ownership predicates as queryset filtering.

### Queryset filtering

Must answer:

```text
filter_readable(queryset, user, scope)
filter_editable(queryset, user, scope)
filter_deletable(queryset, user, scope)
```

Rules:

- `all`: unchanged queryset;
- `team`: team relation OR own predicate, plus collaborator sharing for supported read/stream operations;
- `own`: own predicate, plus collaborator sharing for supported read/stream operations;
- `no`: `queryset.none()`;
- apply `distinct()` only when required by many-to-many joins;
- apply ACL filtering before search, pagination counts, pagination slices, exports, aggregates, and bulk operations;
- never fetch an unrestricted queryset and filter records in Python.

### Ownership adapter

Not every domain model will have the same field names. Use a registered adapter per scope rather than hard-coding one global model mixin immediately.

The adapter exposes:

```text
own_q(user)
team_q(user)
shared_q(user, action)
is_own(user, object)
is_team(user, object)
is_shared(user, object, action)
apply_create_defaults(user, validated_data)
validate_assignment(user, old_object, new_values)
```

Default ownership behavior should match EspoCRM:

```text
multiple assigned users
else assigned user
else created by
else no ownership
```

A future abstract `AccessControlledModel` can standardize new domain models, but existing models should be integrated with adapters to avoid unsafe broad migrations.

### DRF integration

Provide reusable DRF components:

```text
ScopePermission
AccessControlledQuerysetMixin
AccessControlledSerializerMixin
AssignmentValidationMixin
FieldSecuritySerializerMixin
```

Every enforced endpoint for a scope must use the central components. Do not scatter calls such as `if user.is_staff` or custom team filters across individual views.

The standard API error envelope remains:

```json
{
  "code": "permission_denied",
  "detail": "...",
  "fields": {}
}
```

Forbidden field writes should populate `fields` with the affected names.

## Cache design and invalidation

EspoCRM compiles and caches an ACL table per user. TUVTK should do the same using the existing Django cache/Redis infrastructure and request-local memoization.

Recommended first implementation:

```text
cache key: access-control:user:<user-id>:revision:<global-revision>
```

The global revision is incremented transactionally after:

- role scope, field, or special permission changes;
- role activation/deactivation;
- direct user-role changes;
- team-role changes;
- team membership changes;
- team activation/deactivation;
- baseline-role changes;
- scope registry version changes;
- mandatory rule changes.

Use `transaction.on_commit` so uncommitted or rolled-back changes never invalidate or publish partial access state.

A global revision is intentionally simple and safe. It invalidates more users than necessary but avoids stale permission grants. Targeted user/role/team versioning can be introduced only after profiling demonstrates a need.

Within a request, compile once per user and reuse the immutable object.

Permission revocation must take effect immediately after commit. No API process, Celery worker, or other application instance may continue using a stale grant.

## API design

All routes are under:

```text
/api/v1/access-control/
```

### Scope registry

```text
GET /api/v1/access-control/scopes
```

Returns available scopes, actions, fields, special permissions, labels, level options, and enforcement state. The frontend role editor must render from this contract rather than hard-coded module lists.

### Roles

```text
GET    /api/v1/access-control/roles/
POST   /api/v1/access-control/roles/
GET    /api/v1/access-control/roles/<role-id>
PATCH  /api/v1/access-control/roles/<role-id>
DELETE /api/v1/access-control/roles/<role-id>
PUT    /api/v1/access-control/roles/<role-id>/permissions
```

The role detail response includes scope, field, and special permissions. The permissions update should be transactional and validate every scope, field, action, and level.

Prefer deactivation over destructive deletion when the role has assignment history.

### Teams

```text
GET    /api/v1/access-control/teams/
POST   /api/v1/access-control/teams/
GET    /api/v1/access-control/teams/<team-id>
PATCH  /api/v1/access-control/teams/<team-id>
DELETE /api/v1/access-control/teams/<team-id>
PUT    /api/v1/access-control/teams/<team-id>/roles
GET    /api/v1/access-control/teams/<team-id>/members
PUT    /api/v1/access-control/teams/<team-id>/members
```

Membership updates must be transactional and return the final membership set, including positions and default-team consequences.

### User access assignments

```text
GET /api/v1/access-control/users/<user-id>/assignments
PUT /api/v1/access-control/users/<user-id>/roles
PUT /api/v1/access-control/users/<user-id>/teams
PUT /api/v1/access-control/users/<user-id>/default-team
```

Assignments response distinguishes direct roles from inherited roles.

### Effective access

```text
GET /api/v1/access-control/users/<user-id>/effective-access
```

Response includes:

```text
user summary
superuser bypass flag
baseline role
active direct roles
active team roles grouped by team
merged scope permissions
merged field permissions
merged special permissions
team IDs
default team
compiler revision
```

This endpoint powers the EspoCRM-like `Acces` action on the user page. It must never expose another user's effective access unless the caller has the required administration or User permission.

### Assignment candidates

Future record forms should not load all users and teams and filter in React.

Provide server-filtered candidate endpoints:

```text
GET /api/v1/access-control/assignment/users?scope=<scope>&search=<term>
GET /api/v1/access-control/assignment/teams?scope=<scope>&search=<term>
```

These endpoints apply assignment permission, active status, scope requirements, and team restrictions before returning candidates.

## Frontend design

Keep Roles and Teams inside the `Administrare` area, under the existing `Utilizatori` section. Do not add them as unrelated top-level sidebar modules.

Recommended routes:

```text
/administrare/utilizatori
/administrare/utilizatori/roluri
/administrare/utilizatori/roluri/<role-id>
/administrare/utilizatori/echipe
/administrare/utilizatori/echipe/<team-id>
```

### Utilizatori page

Extend the existing page with:

- direct roles;
- team memberships and membership position;
- default team;
- an `Acces` action that opens the effective-access view;
- source labels showing `Direct`, `Echipă: <name>`, and `Rol de bază`;
- no ability for a normal user or ordinary staff account to escalate its own assignments.

Do not overload the current create/edit dialog with the full role matrix. User identity fields and access assignments should be separate sections or tabs.

### Roles list

Use shadcn components and include:

- live search;
- active/inactive filter;
- assigned users count;
- assigned teams count;
- baseline badge;
- create, duplicate, deactivate, and open actions;
- no permanent delete as the primary action.

### Role editor

Render from the scope registry.

Recommended sections:

1. general role information;
2. scope access matrix;
3. field-level security;
4. special permissions;
5. assigned users and teams;
6. effective impact summary.

The scope matrix columns:

```text
Scope | Create | Read | Edit | Delete | Stream
```

Each value supports `Nesetat`, preserving EspoCRM's additive merge behavior.

Field security should load fields only when a scope is expanded. Large matrices should not render every field for every scope at once.

### Teams list and detail

Include:

- name and description;
- active status;
- member count;
- role count;
- position list;
- members table with position and default-team indicator;
- roles inherited by all members;
- warnings showing how many users will be affected by role changes.

### Effective access viewer

Must display both source and result:

- source roles grouped by baseline, direct, and team;
- merged permission matrix;
- field restrictions;
- special permissions;
- explanation for each final value, showing which source role granted the winning level;
- current cache/compiler revision.

This diagnostic view is not optional. With permissive merging, it is the only reliable way for administrators to understand unexpected access.

## Navigation behavior

Navigation visibility should use effective scope access:

- hide a module when the scope is disabled or all meaningful actions are denied;
- do not rely only on `is_staff` for business modules;
- keep `Administrare` staff-only;
- access-control administration pages remain superuser-only in the first release;
- backend endpoints remain authoritative even when navigation is hidden.

The core bootstrap can eventually include a compact effective-access map for frontend feature gating. It must not include the entire field-level matrix unless needed, to keep startup payloads small.

## Enforcement rollout

Access control is too central for a single all-or-nothing commit. Use explicit phases.

### Phase 0 — Foundation and frozen contracts

Deliver:

- this document;
- scope and special-permission registries;
- enums and pure merge functions;
- architecture tests for ranking and strict defaults;
- no database enforcement.

Exit criteria:

- all current and planned first-wave scopes are named;
- ownership strategy for each pilot scope is documented;
- no duplicate permission vocabulary exists in feature apps.

### Phase 1 — Teams, roles, and assignments

Deliver:

- Django models and migrations;
- role/team/user assignment APIs;
- default-team invariant;
- administration list/detail pages;
- OpenAPI-generated frontend types;
- audit timestamps and actor fields;
- superuser-only mutation permissions.

No business endpoint is restricted by the new roles yet.

Exit criteria:

- role inheritance can be configured;
- team membership and positions work;
- users cannot self-escalate;
- all assignment mutations invalidate access cache state.

### Phase 2 — Effective ACL compiler

Deliver:

- baseline, direct, and team role collection;
- permissive merge engine;
- mandatory restrictions;
- Redis and request-local caching;
- effective-access endpoint and viewer;
- source-role explanations.

Still no production business scope enforcement.

Exit criteria:

- compiled results match the complete merge test matrix;
- changes revoke or grant access immediately after commit;
- effective-access output explains every winning value.

### Phase 3 — Shadow enforcement on one pilot scope

Choose one non-critical domain with clear ownership fields.

Deliver:

- ownership adapter;
- queryset filtering;
- object permission checks;
- create defaults;
- assignment validation;
- shadow mode that calculates decisions and logs differences without denying current requests.

Exit criteria:

- list, detail, export, count, update, and delete decisions are consistent;
- query plans use expected indexes;
- no hidden endpoint bypasses the adapter.

### Phase 4 — Enforce pilot scope

Enable real enforcement for the pilot scope only.

Deliver:

- feature flag/state changed from `shadow` to `enforced`;
- frontend actions driven by effective permissions;
- integration tests using real browser sessions and CSRF;
- audit records for denied sensitive operations where appropriate.

Exit criteria:

- no unrestricted fallback endpoint remains;
- pagination totals do not reveal inaccessible records;
- bulk operations use the same ACL queryset.

### Phase 5 — Field security and special permissions

Deliver:

- serializer output filtering;
- forbidden input validation;
- export permission;
- mass-update permission;
- assignment and User permission candidate endpoints;
- frontend field/action gating.

Exit criteria:

- field restrictions apply to detail, list, export, and generated documents where relevant;
- clients cannot write restricted fields by direct API calls;
- assignment permission is enforced server-side.

### Phase 6 — Roll out to remaining modules

Integrate one scope at a time:

```text
companies
documents
course planner resources
public-holiday administration
future CRM and operational modules
```

Administrative configuration resources may retain explicit staff/superuser policies where Espo-style record ownership is not appropriate.

Each scope moves through `disabled`, `shadow`, and `enforced` states independently.

### Phase 7 — Advanced compatibility

Optional later work:

- collaborators;
- stream permissions;
- recently-created delete exception;
- user calendars;
- follower, mention, message, audit, and lock permissions;
- layout sets through default team;
- external identity-provider team mapping;
- portal/API-user role variants if those user types are introduced.

Do not implement these as placeholders in earlier phases.

## Security invariants

The implementation is incomplete unless all of these are true:

- no user can assign a role or team to themselves through a normal profile endpoint;
- no staff user can grant themselves superuser access;
- `is_staff` does not bypass business-data ACL;
- role and team mutations are CSRF-protected;
- inactive roles, teams, memberships, and users do not grant access;
- inaccessible records are removed at queryset level before pagination and counts;
- detail endpoints do not reveal record existence through different error behavior when avoidable;
- export and bulk endpoints use the same filtered queryset as list endpoints;
- background tasks receive an explicit actor or system authorization context;
- Celery tasks do not silently run with unrestricted user authority;
- direct object IDs cannot bypass assignment candidate restrictions;
- forbidden fields cannot be written by manually crafted requests;
- default team always belongs to the user;
- cache invalidation occurs after commit and across application processes;
- every enforced scope has matching queryset and object-level predicates;
- permission checks are covered by tests using standard users, staff users, and superusers.

## Test matrix

### Role collection

- baseline role only;
- direct role only;
- one team role;
- multiple team roles from multiple memberships;
- baseline plus direct plus team roles;
- inactive role ignored;
- inactive team membership ignored;
- duplicate source role does not change the result;
- superuser bypass.

### Merge behavior

- `all` wins over `team`, `own`, and `no`;
- `team` wins over `own` and `no`;
- `own` wins over `no`;
- `yes` wins over `no`;
- `not_set` is ignored;
- all unset values resolve to strict denial;
- field `yes` wins over field `no`;
- special permissions use their registered ranking;
- mandatory rules override the merged result.

### Team and default team

- multiple team memberships;
- membership position validation;
- team roles inherited immediately;
- removing a team role revokes access immediately;
- default team must be an active membership;
- removing default membership requires clear or replacement;
- user cannot manage own membership;
- team deletion/deactivation does not leave invalid default references.

### Own access

- multiple assigned users contains actor;
- single assigned user equals actor;
- created-by fallback equals actor;
- another user's record denied;
- scope with no ownership field produces an empty queryset for `own`;
- object check and queryset result agree.

### Team access

- record and user share one team;
- record and user share multiple teams;
- no common team denied;
- own record without a team remains accessible;
- collaborators included for read/stream when supported;
- collaborator alone does not permit edit/delete;
- object check and queryset result agree.

### Assignment permission

- `all` can assign to eligible user and team;
- `team` can assign to a user sharing a team;
- `team` cannot assign to an unrelated user;
- `team` can attach actor's team;
- `team` cannot attach an unrelated team;
- `no` cannot reassign;
- creation defaults to self/default team without bypassing validation;
- direct relationship IDs cannot bypass rules.

### User permission

- current user always accessible to themselves;
- `all` permits eligible other users;
- `team` permits users sharing any active team;
- `team` denies unrelated users;
- `no` denies other users;
- effective-access endpoint obeys supervisory restrictions.

### Field security

- unreadable field absent from list and detail payloads;
- unreadable field absent from export;
- uneditable field write rejected;
- mandatory protected field remains protected for permissive roles;
- field grant does not bypass record denial.

### Endpoint consistency

For every enforced scope, test:

```text
list
detail
create
update
delete
search
count
export
bulk update
bulk delete
related-record endpoint
background task
```

A permission model that protects only standard CRUD views is not complete.

### Cache invalidation

- direct role assignment added and removed;
- team membership added and removed;
- team role added and removed;
- role permission changed;
- role/team activated or deactivated;
- baseline role changed;
- transaction rollback does not publish an invalid revision;
- separate process observes the new revision;
- revocation is not delayed by stale request-local data in a new request.

## Performance and indexes

Add indexes for:

```text
team_membership(user_id, team_id, is_active)
team_membership(team_id, is_active)
user_role_assignment(user_id, role_id)
team_role_assignment(team_id, role_id)
role_scope_permission(role_id, scope_code)
role_field_permission(role_id, scope_code, field_code)
role_special_permission(role_id, permission_code)
```

Every access-controlled record model that supports team access needs an indexed relationship table. Assigned-user and created-by foreign keys must be indexed.

Use `Exists` subqueries or carefully constructed joins for team and collaborator predicates. Confirm query plans with realistic data volumes before enabling enforcement on large tables.

Avoid:

- loading all team IDs or record IDs into Python for filtering;
- per-record ACL checks in list serializers;
- N+1 source-role resolution;
- compiling the effective ACL repeatedly in one request;
- returning the full field matrix in core bootstrap;
- globally invalidating Redis keys by scanning the keyspace.

## Audit requirements

Access-control configuration changes should be auditable from the first database phase.

Record:

- actor;
- timestamp;
- target role, team, user, or configuration;
- operation;
- before and after values for permission and assignment changes;
- request correlation identifier when available.

Do not log passwords, session IDs, CSRF tokens, or unrelated personal data.

Denied-operation audit logging should be selective to avoid noise. Always log attempted privilege escalation, role/team self-assignment, and prohibited superuser changes.

## Decisions intentionally deferred

The following are not needed to begin implementation and should not be guessed into phase one:

- nested teams;
- organization/tenant boundaries;
- portal users and portal roles;
- API users with independent credentials;
- project-specific roles separate from global roles;
- temporary delegated access;
- approval workflows for role changes;
- layout sets;
- collaborator notifications;
- recently-created deletion exception;
- row-level security inside PostgreSQL.

Their absence must not block the core EspoCRM-compatible behavior.

## Clean-room and licensing note

EspoCRM's repository is licensed under AGPL-3.0. This design records publicly observable behavior and architectural findings. TUVTK implementation code must be written independently in Python and TypeScript and must not copy or translate EspoCRM PHP source.

Behavioral compatibility does not require matching EspoCRM's internal class names, storage format, or code structure. If source code is ever copied or adapted, the project's licensing obligations must be reviewed separately before distribution or deployment.

This is an engineering note, not legal advice.

## Official research sources

Documentation:

- <https://docs.espocrm.com/administration/roles-management/>
- <https://docs.espocrm.com/administration/users-management/>
- <https://docs.espocrm.com/administration/collaborators/>
- <https://docs.espocrm.com/administration/layout-manager/>
- <https://docs.espocrm.com/development/acl/>
- <https://docs.espocrm.com/development/metadata/app-acl/>

Pinned upstream source snapshot:

- Role metadata: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Resources/metadata/entityDefs/Role.json>
- Team metadata: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Resources/metadata/entityDefs/Team.json>
- User metadata: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Resources/metadata/entityDefs/User.json>
- Role source collection: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Core/Acl/Table/DefaultRoleListProvider.php>
- ACL compilation and merging: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Core/Acl/Table/DefaultTable.php>
- Role data wrapper: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Core/Acl/Table/RoleEntityWrapper.php>
- Central ACL manager: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Core/AclManager.php>
- Default record access checks: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Core/Acl/DefaultAccessChecker.php>
- Own/team/shared ownership checks: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Core/Acl/DefaultOwnershipChecker.php>
- Own queryset filter: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Core/Select/AccessControl/Filters/OnlyOwn.php>
- Team queryset filter: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Core/Select/AccessControl/Filters/OnlyTeam.php>
- Access-control filter factory: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/application/Espo/Core/Select/AccessControl/FilterFactory.php>
- ACL integration tests: <https://github.com/espocrm/espocrm/blob/d776b1f106cef73fbe8f91e87e32844c17d30ebc/tests/integration/Espo/User/AclTest.php>

## Implementation entry point

When implementation begins, start with Phase 0 and Phase 1 only. Do not begin by adding permission checks to existing feature endpoints.

The first implementation pull should contain:

```text
backend/apps/access_control/ registry and enums
pure merge functions and tests
models and migrations for roles, teams, memberships, and assignments
superuser-protected DRF CRUD contracts
frontend administration routes for Roluri and Echipe
OpenAPI-generated frontend types
cache revision invalidation hooks
```

Enforcement belongs in a later, separately testable phase after the effective ACL compiler and ownership adapters exist.
