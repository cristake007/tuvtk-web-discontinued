from ninja import Schema

from apps.accounts.schemas import AccountUserSchema


class ShellConfigurationSchema(Schema):
    site_name: str
    organization_name: str
    sidebar_title: str


class NavigationItemSchema(Schema):
    key: str
    label: str
    path: str
    icon: str
    position: int
    parent_key: str | None


class CoreBootstrapSchema(Schema):
    configuration: ShellConfigurationSchema
    user: AccountUserSchema
    navigation: list[NavigationItemSchema]
