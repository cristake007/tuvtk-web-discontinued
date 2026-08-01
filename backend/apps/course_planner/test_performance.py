from datetime import date
from unittest.mock import patch

from django.test import SimpleTestCase

from .files import CourseInput
from .services import generate_schedule


class CoursePlannerPerformanceTests(SimpleTestCase):
    @patch(
        "apps.course_planner.services.CourseScheduler.get_available_start_days",
        return_value=[date(2027, 1, 11), date(2027, 1, 18)],
    )
    def test_courses_with_same_month_and_duration_reuse_available_dates(
        self,
        get_available_start_days,
    ):
        courses = [
            CourseInput(
                title="Curs A",
                permalink="/a",
                duration_label="2 zile",
                investment="",
                duration=2,
                original_order=0,
            ),
            CourseInput(
                title="Curs B",
                permalink="/b",
                duration_label="2 zile",
                investment="",
                duration=2,
                original_order=1,
            ),
        ]

        schedule = generate_schedule(
            courses,
            year=2027,
            months=[1],
            holidays=[],
            randomness=5,
        )

        self.assertEqual(len(schedule), 2)
        get_available_start_days.assert_called_once_with(1, 2)
