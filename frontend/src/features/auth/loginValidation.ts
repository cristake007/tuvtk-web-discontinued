export type LoginCredentials = {
  username: string;
  password: string;
};

export type LoginField = keyof LoginCredentials;
export type LoginFieldErrors = Partial<Record<LoginField, string>>;

export function validateLoginCredentials(
  credentials: LoginCredentials,
): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  if (!credentials.username.trim()) {
    errors.username = "Introdu numele de utilizator.";
  }

  if (!credentials.password) {
    errors.password = "Introdu parola.";
  }

  return errors;
}
