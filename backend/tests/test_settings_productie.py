from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from config.settings import validate_production_secret_key


class ProductionSettingsTests(SimpleTestCase):
    def test_placeholder_secret_is_rejected_when_debug_is_disabled(self):
        with self.assertRaises(ImproperlyConfigured):
            validate_production_secret_key(
                "change-this-secret-key",
                debug=False,
            )

    def test_valid_secret_is_accepted_when_debug_is_disabled(self):
        validate_production_secret_key(
            "a-valid-production-secret",
            debug=False,
        )
