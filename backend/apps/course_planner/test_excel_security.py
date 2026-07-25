import io

from django.test import SimpleTestCase
from openpyxl import load_workbook

from .files import create_excel_export


class ExcelExportSecurityTests(SimpleTestCase):
    def test_formula_like_values_are_neutralized(self):
        excel_data = create_excel_export(
            [
                {
                    "title": "=1+1",
                    "permalink": "+SUM(A1:A2)",
                    "duration_label": "-2+3",
                    "investment": "@SUM(1,1)",
                    "date_range": "  =HYPERLINK(\"https://example.com\")",
                    "month": 1,
                    "original_order": 0,
                }
            ],
            ["=TODAY()"],
        )

        workbook = load_workbook(io.BytesIO(excel_data), read_only=True)
        schedule = workbook["Schedule"]
        self.assertEqual(schedule["A2"].value, "'=1+1")
        self.assertEqual(schedule["B2"].value, "'+SUM(A1:A2)")
        self.assertEqual(schedule["C2"].value, "'-2+3")
        self.assertEqual(schedule["D2"].value, "'@SUM(1,1)")
        self.assertEqual(
            schedule["E2"].value,
            "'  =HYPERLINK(\"https://example.com\")",
        )
        self.assertEqual(workbook["Holidays"]["A2"].value, "'=TODAY()")
        workbook.close()
