import calendar
from datetime import date, timedelta


class CourseScheduler:
    def __init__(self, year: int, holidays: list[date]):
        self.year = year
        self.holidays = frozenset(holidays)

    def is_business_day(self, value: date) -> bool:
        return value.weekday() < 5 and value not in self.holidays

    def calculate_end_date(self, start_date: date, duration: int) -> date:
        current_date = start_date
        business_days = 0

        while business_days < duration:
            if self.is_business_day(current_date):
                business_days += 1
            if business_days < duration:
                current_date += timedelta(days=1)

        return current_date

    def can_schedule_course(self, start_date: date, duration: int) -> bool:
        if not self.is_business_day(start_date):
            return False

        if duration > 5:
            return True

        end_date = self.calculate_end_date(start_date, duration)
        week_start = start_date - timedelta(days=start_date.weekday())
        week_end = week_start + timedelta(days=4)

        return end_date <= week_end and end_date.month == start_date.month

    def get_available_start_days(self, month: int, duration: int) -> list[date]:
        _, last_day = calendar.monthrange(self.year, month)
        current_date = date(self.year, month, 1)
        end_date = date(self.year, month, last_day)
        available_dates: list[date] = []

        while current_date <= end_date:
            if self.can_schedule_course(current_date, duration):
                available_dates.append(current_date)
            current_date += timedelta(days=1)

        return available_dates

    def format_date_range(self, start_date: date, duration: int) -> str:
        if duration == 1:
            return start_date.strftime("%d.%m.%Y")

        end_date = self.calculate_end_date(start_date, duration)
        if start_date.month == end_date.month and start_date.year == end_date.year:
            return f"{start_date:%d}-{end_date:%d.%m.%Y}"

        return f"{start_date:%d.%m.%Y}-{end_date:%d.%m.%Y}"
