export const userInterfaceQueryKeys = {
  all: ["administration", "user-interface"] as const,
  settings: () => [...userInterfaceQueryKeys.all, "settings"] as const,
};
