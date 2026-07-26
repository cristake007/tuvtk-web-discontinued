class RegistryRouter:
    registry_app_labels = frozenset({"firme_onrc"})

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.registry_app_labels:
            return "registry"
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label in self.registry_app_labels:
            return "registry"
        return None

    def allow_relation(self, obj1, obj2, **hints):
        first_is_registry = obj1._meta.app_label in self.registry_app_labels
        second_is_registry = obj2._meta.app_label in self.registry_app_labels
        if first_is_registry or second_is_registry:
            return first_is_registry and second_is_registry
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label in self.registry_app_labels:
            return db == "registry"
        if db == "registry":
            return False
        return None
