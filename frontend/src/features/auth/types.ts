export type ShellUser = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  is_staff: boolean;
};

export type AuthenticationSession = {
  authenticated: boolean;
  user: ShellUser | null;
};

export type LoginCredentials = {
  username: string;
  password: string;
};
