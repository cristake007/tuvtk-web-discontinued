export type GroupFormValues = {
  name: string;
  application_ids: number[];
  user_ids: number[];
};

export function updateGroupName(values: GroupFormValues, name: string): GroupFormValues {
  return { ...values, name };
}

export function updateGroupSelection(
  values: GroupFormValues,
  field: "application_ids" | "user_ids",
  id: number,
  checked: boolean,
): GroupFormValues {
  const ids = values[field];
  return {
    ...values,
    [field]: checked ? [...ids, id] : ids.filter((currentId) => currentId !== id),
  };
}
