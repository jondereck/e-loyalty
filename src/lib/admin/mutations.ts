export type AdminMutationResult<T = unknown> = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  data?: T;
};

export function adminMutationError<T = unknown>(error: unknown, fallback = "Action failed. Please try again."): AdminMutationResult<T> {
  if (
    error &&
    typeof error === "object" &&
    "flatten" in error &&
    typeof error.flatten === "function"
  ) {
    const flattened = error.flatten() as { fieldErrors?: Record<string, string[] | undefined> };
    return { errors: flattened.fieldErrors, message: "Please check the form." };
  }

  if (error instanceof Error) return { message: error.message };
  return { message: fallback };
}
