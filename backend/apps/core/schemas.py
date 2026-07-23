from ninja import Schema


class ShellConfigurationSchema(Schema):
    site_name: str
    organization_name: str
    sidebar_title: str


class ShellUserSchema(Schema):
    id: int
    username: str
    display_name: str
    email: str
    is_staff: bool


class AuthenticationSessionSchema(Schema):
    authenticated: bool
    user: ShellUserSchema | None


class NavigationItemSchema(Schema):
    key: str
    label: str
    path: str
    icon: str
    position: int
    parent_key: str | None


class CoreBootstrapSchema(Schema):
    configuration: ShellConfigurationSchema
    user: ShellUserSchema
    navigation: list[NavigationItemSchema]


class LoginRequestSchema(Schema):
    username: str
    password: str


class ErrorSchema(Schema):
    detail: str
