"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormFieldShell } from "@/components/forms/form-field-shell";
import { applyApiFormErrors } from "@/lib/form-errors";
import { apiGet, apiWrite } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useFieldAvailability } from "@/hooks/use-field-availability";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type AuthFormValues = {
  email: string;
  password: string;
  displayName: string;
  username: string;
};

const validateEmail = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Email is required";
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return "Enter a valid email address";
  }

  return true;
};

const validatePassword = (value: string) => {
  if (!value) {
    return "Password is required";
  }

  if (value.length < 8) {
    return "Password must be at least 8 characters";
  }

  return true;
};

const validateDisplayName = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Display name is required";
  }

  if (trimmed.length < 2) {
    return "Display name must be at least 2 characters";
  }

  return true;
};

const validateUsername = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Username is required";
  }

  if (trimmed.length < 3) {
    return "Username must be at least 3 characters";
  }

  return true;
};

export function AuthForm({
  mode,
  onSuccess
}: {
  mode: "login" | "register";
  onSuccess?: (user: { role: "USER" | "ADMIN" }) => void;
}) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [formError, setFormError] = useState("");
  const form = useForm<AuthFormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      displayName: "",
      username: "",
      email: "",
      password: ""
    }
  });
  const emailValue = useWatch({ control: form.control, name: "email" }) ?? "";
  const usernameValue = useWatch({ control: form.control, name: "username" }) ?? "";
  const displayNameValue = useWatch({ control: form.control, name: "displayName" }) ?? "";
  const passwordValue = useWatch({ control: form.control, name: "password" }) ?? "";
  const debouncedDisplayName = useDebouncedValue(displayNameValue, 250);
  const debouncedUsername = useDebouncedValue(usernameValue, 250);
  const debouncedEmail = useDebouncedValue(emailValue, 250);
  const debouncedPassword = useDebouncedValue(passwordValue, 250);
  const emailAvailability = useFieldAvailability({
    field: "email",
    value: emailValue,
    enabled:
      currentMode === "register" &&
      Boolean(form.formState.touchedFields.email) &&
      !form.formState.errors.email
  });
  const usernameAvailability = useFieldAvailability({
    field: "username",
    value: usernameValue,
    enabled:
      currentMode === "register" &&
      Boolean(form.formState.touchedFields.username) &&
      !form.formState.errors.username
  });

  useEffect(() => {
    setFormError("");
    form.clearErrors();
  }, [currentMode, form]);

  useEffect(() => {
    if (currentMode === "register" && form.formState.touchedFields.displayName) {
      void form.trigger("displayName");
    }
  }, [currentMode, debouncedDisplayName, form]);

  useEffect(() => {
    if (currentMode === "register" && form.formState.touchedFields.username) {
      void form.trigger("username");
    }
  }, [currentMode, debouncedUsername, form]);

  useEffect(() => {
    if (form.formState.touchedFields.email) {
      void form.trigger("email");
    }
  }, [debouncedEmail, form]);

  useEffect(() => {
    if (form.formState.touchedFields.password) {
      void form.trigger("password");
    }
  }, [debouncedPassword, form]);

  useEffect(() => {
    const currentError = form.getFieldState("email").error;

    if (emailAvailability.status === "taken") {
      form.setError("email", {
        type: "availability",
        message: "This email is already in use"
      });
      return;
    }

    if (currentError?.type === "availability") {
      form.clearErrors("email");
    }
  }, [emailAvailability.status, form]);

  useEffect(() => {
    const currentError = form.getFieldState("username").error;

    if (usernameAvailability.status === "taken") {
      form.setError("username", {
        type: "availability",
        message: "This username is already taken"
      });
      return;
    }

    if (currentError?.type === "availability") {
      form.clearErrors("username");
    }
  }, [form, usernameAvailability.status]);

  const registerDisabled = useMemo(() => {
    if (currentMode !== "register") {
      return false;
    }

    return (
      emailAvailability.isChecking ||
      usernameAvailability.isChecking ||
      emailAvailability.status === "taken" ||
      usernameAvailability.status === "taken"
    );
  }, [
    currentMode,
    emailAvailability.isChecking,
    emailAvailability.status,
    usernameAvailability.isChecking,
    usernameAvailability.status
  ]);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError("");

    if (currentMode === "register") {
      if (emailAvailability.isChecking || usernameAvailability.isChecking) {
        return;
      }

      if (emailAvailability.status === "taken") {
        form.setError("email", {
          type: "availability",
          message: "This email is already in use"
        });
        return;
      }

      if (usernameAvailability.status === "taken") {
        form.setError("username", {
          type: "availability",
          message: "This username is already taken"
        });
        return;
      }
    }

    try {
      await apiWrite(`/auth/${currentMode}`, {
        method: "POST",
        body: JSON.stringify({
          ...values,
          displayName: values.displayName.trim(),
          username: values.username.trim(),
          email: values.email.trim()
        })
      });
      const me = await apiGet<{ user: { role: "USER" | "ADMIN" } }>(
        "/auth/me",
        true
      );
      if (onSuccess) {
        onSuccess(me.user);
        return;
      }
      window.location.href =
        me.user.role === "ADMIN" ? "/admin/recipes/pending" : "/profile";
    } catch (error) {
      const { formError: nextFormError } = applyApiFormErrors<AuthFormValues>(
        error,
        form.setError
      );
      setFormError(nextFormError || "Unable to authenticate right now.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="panel mx-auto grid max-w-xl gap-5 p-6">
      {currentMode === "register" ? (
        <FormFieldShell
          label="Display name"
          htmlFor="auth-display-name"
          error={form.formState.errors.displayName?.message}
          helperText="This is the name shown on your public profile."
        >
          <Input
            id="auth-display-name"
            aria-invalid={Boolean(form.formState.errors.displayName)}
            placeholder="Display name"
            {...form.register("displayName", {
              validate: validateDisplayName
            })}
          />
        </FormFieldShell>
      ) : null}
      {currentMode === "register" ? (
        <FormFieldShell
          label="Username"
          htmlFor="auth-username"
          error={form.formState.errors.username?.message}
          helperText="Use at least 3 characters. This will be unique."
          status={
            !form.formState.errors.username && usernameAvailability.status === "checking"
              ? "checking"
              : !form.formState.errors.username && usernameAvailability.status === "available"
                ? "valid"
                : "neutral"
          }
          statusText={
            !form.formState.errors.username ? usernameAvailability.message : undefined
          }
        >
          <Input
            id="auth-username"
            aria-invalid={Boolean(form.formState.errors.username)}
            placeholder="Username"
            {...form.register("username", {
              validate: (value) =>
                currentMode === "register" ? validateUsername(value) : true
            })}
          />
        </FormFieldShell>
      ) : null}
      <FormFieldShell
        label="Email"
        htmlFor="auth-email"
        error={form.formState.errors.email?.message}
        helperText="Use a valid email address you can access."
        status={
          currentMode === "register" &&
          !form.formState.errors.email &&
          emailAvailability.status === "checking"
            ? "checking"
            : currentMode === "register" &&
                !form.formState.errors.email &&
                emailAvailability.status === "available"
              ? "valid"
              : "neutral"
        }
        statusText={
          currentMode === "register" && !form.formState.errors.email
            ? emailAvailability.message
            : undefined
        }
      >
        <Input
          id="auth-email"
          aria-invalid={Boolean(form.formState.errors.email)}
          placeholder="Email"
          {...form.register("email", {
            validate: validateEmail
          })}
        />
      </FormFieldShell>
      <FormFieldShell
        label="Password"
        htmlFor="auth-password"
        error={form.formState.errors.password?.message}
        helperText="Use at least 8 characters."
      >
        <Input
          id="auth-password"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register("password", {
            validate: validatePassword
          })}
          type="password"
          placeholder="Password"
        />
      </FormFieldShell>
      {formError ? <p className="text-sm text-[rgba(148,52,45,0.95)]">{formError}</p> : null}
      <Button type="submit" disabled={form.formState.isSubmitting || registerDisabled}>
        {currentMode === "login" ? "Sign in" : "Create account"}
      </Button>
      <button
        type="button"
        className="text-left text-sm text-[var(--muted)] underline-offset-4 hover:underline"
        onClick={() =>
          setCurrentMode((value) => (value === "login" ? "register" : "login"))
        }
      >
        {currentMode === "login"
          ? "Need an account? Register"
          : "Already have an account? Login"}
      </button>
    </form>
  );
}
