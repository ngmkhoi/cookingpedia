import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { isApiError } from "./api";

const toFieldPath = (path: Array<string | number>) => {
  const segments = path[0] === "body" ? path.slice(1) : path;
  return segments.map(String).join(".");
};

const defaultFormMessage = "Something went wrong. Please try again.";

export function applyApiFormErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
) {
  if (!isApiError(error)) {
    return { formError: defaultFormMessage };
  }

  let hasFieldErrors = false;
  const appliedFields = new Set<string>();

  if (error.fieldErrors) {
    for (const [field, message] of Object.entries(error.fieldErrors)) {
      appliedFields.add(field);
      hasFieldErrors = true;
      setError(field as FieldPath<T>, {
        type: "server",
        message
      });
    }
  }

  for (const issue of error.issueDetails ?? []) {
    const field = toFieldPath(issue.path);
    if (!field || appliedFields.has(field)) {
      continue;
    }

    appliedFields.add(field);
    hasFieldErrors = true;
    setError(field as FieldPath<T>, {
      type: "server",
      message: issue.message
    });
  }

  if (error.message === "INVALID_CREDENTIALS") {
    return { formError: "Email or password is incorrect" };
  }

  if (error.message === "RECIPE_NOT_READY") {
    return {
      formError:
        "Add a cover image, at least one ingredient, and at least one step before submitting for review."
    };
  }

  if (error.message === "UNAUTHENTICATED") {
    return { formError: "You need to sign in again to continue." };
  }

  if (hasFieldErrors) {
    return { formError: "" };
  }

  if (error.issues?.formErrors.length) {
    return { formError: error.issues.formErrors[0] };
  }

  return { formError: defaultFormMessage };
}
