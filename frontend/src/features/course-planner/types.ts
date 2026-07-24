export type CoursePlannerSettings = {
  year: number;
  months: number[];
  randomness: number;
  holidays: string[];
};

export type ScheduledCourse = {
  title: string;
  permalink: string;
  duration_label: string;
  investment: string;
  date_range: string;
  month: number;
  original_order: number;
};

export type GenerateScheduleResponse = {
  schedule: ScheduledCourse[];
  course_count: number;
};

export type CoursePlannerInput = CoursePlannerSettings & {
  inputFile: File;
};
