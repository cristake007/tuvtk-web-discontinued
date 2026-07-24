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

export type CoursePlanFileType = "excel" | "word" | "xml";

export type CoursePlanFile = {
  available: boolean;
  filename: string | null;
};

export type CoursePlanGeneration = {
  id: string;
  source_filename: string;
  year: number;
  months: number[];
  randomness: number;
  course_count: number;
  created_at: string;
  created_by: string | null;
  files: Record<CoursePlanFileType, CoursePlanFile>;
};

export type CoursePlanHistoryResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: CoursePlanGeneration[];
};

export type GenerateScheduleResponse = {
  schedule: ScheduledCourse[];
  course_count: number;
  generation: CoursePlanGeneration;
};

export type CoursePlannerInput = CoursePlannerSettings & {
  inputFile: File;
};
