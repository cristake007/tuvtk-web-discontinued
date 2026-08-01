export const userInterfaceQueryKeys = {
  all: ["administration", "user-interface"] as const,
  navigation: () => [...userInterfaceQueryKeys.all, "navigation"] as const,
  settings: () => [...userInterfaceQueryKeys.all, "settings"] as const,
};
