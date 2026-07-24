from ninja import Schema

from apps.accounts.schemas import AccountUserSchema


class ShellConfigurationSchema(Schema):
    site_name: str
    organization_name: str
    sidebar_title: str
    logo_url: str | None


class NavigationItemSchema(Schema):
    key: str
    label: str
    path: str
    icon: str
    position: int
    parent_key: str | None
    application_key: str


class CoreBootstrapSchema(Schema):
    configuration: ShellConfigurationSchema
    user: AccountUserSchema
    navigation: list[NavigationItemSchema]
