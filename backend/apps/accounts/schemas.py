from ninja import Schema


class AccountUserSchema(Schema):
    id: int
    username: str
    display_name: str
    email: str
    is_staff: bool


class AuthenticationSessionSchema(Schema):
    authenticated: bool
    user: AccountUserSchema | None


class LoginRequestSchema(Schema):
    username: str
    password: str


class AuthenticationErrorSchema(Schema):
    detail: str
