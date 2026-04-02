"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormFieldShell } from "@/components/forms/form-field-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useFieldAvailability } from "@/hooks/use-field-availability";
import { apiGet, apiWrite } from "@/lib/api";
import { applyApiFormErrors } from "@/lib/form-errors";

type ProfileSettingsValues = {
  displayName: string;
  username: string;
  avatarUrl: string;
  bio: string;
  locale: "vi" | "en";
};

type ProfileResponse = {
  user: {
    displayName: string;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    locale: "VI" | "EN";
  };
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

const validateAvatarUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  try {
    new URL(trimmed);
    return true;
  } catch {
    return "Enter a valid URL";
  }
};

const validateBio = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  if (trimmed.length > 240) {
    return "Bio must be 240 characters or less";
  }

  return true;
};

const toFormLocale = (locale: "VI" | "EN") => (locale === "EN" ? "en" : "vi");

export default function ProfileSettingsPage() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formError, setFormError] = useState("");
  const [profileSnapshot, setProfileSnapshot] = useState<ProfileSettingsValues>({
    displayName: "",
    username: "",
    avatarUrl: "",
    bio: "",
    locale: "vi"
  });
  const form = useForm<ProfileSettingsValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      displayName: "",
      username: "",
      avatarUrl: "",
      bio: "",
      locale: "vi"
    }
  });

  const displayNameValue = useWatch({ control: form.control, name: "displayName" }) ?? "";
  const usernameValue = useWatch({ control: form.control, name: "username" }) ?? "";
  const avatarUrlValue = useWatch({ control: form.control, name: "avatarUrl" }) ?? "";
  const bioValue = useWatch({ control: form.control, name: "bio" }) ?? "";

  const debouncedDisplayName = useDebouncedValue(displayNameValue, 250);
  const debouncedUsername = useDebouncedValue(usernameValue, 250);
  const debouncedAvatarUrl = useDebouncedValue(avatarUrlValue, 250);
  const debouncedBio = useDebouncedValue(bioValue, 250);

  const normalizedCurrentUsername = profileSnapshot.username.trim();
  const normalizedUsername = usernameValue.trim();
  const usernameUnchanged = normalizedUsername === normalizedCurrentUsername;
  const displayNameInteracted =
    Boolean(form.formState.touchedFields.displayName) ||
    Boolean(form.formState.dirtyFields.displayName);
  const usernameInteracted =
    Boolean(form.formState.touchedFields.username) ||
    Boolean(form.formState.dirtyFields.username);
  const avatarUrlInteracted =
    Boolean(form.formState.touchedFields.avatarUrl) ||
    Boolean(form.formState.dirtyFields.avatarUrl);
  const bioInteracted =
    Boolean(form.formState.touchedFields.bio) || Boolean(form.formState.dirtyFields.bio);
  const usernameAvailabilityEnabled =
    !loadingProfile &&
    Boolean(profileSnapshot.username) &&
    usernameInteracted &&
    !usernameUnchanged &&
    (!form.formState.errors.username ||
      form.formState.errors.username.type === "availability");

  const usernameAvailability = useFieldAvailability({
    field: "username",
    value: usernameValue,
    enabled: usernameAvailabilityEnabled
  });

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      setFormError("");

      try {
        const data = await apiGet<ProfileResponse>("/auth/me", true);
        if (!active) {
          return;
        }

        const nextValues = {
          displayName: data.user.displayName,
          username: data.user.username,
          avatarUrl: data.user.avatarUrl ?? "",
          bio: data.user.bio ?? "",
          locale: toFormLocale(data.user.locale)
        } satisfies ProfileSettingsValues;

        setProfileSnapshot(nextValues);
        form.reset(nextValues);
      } catch {
        if (active) {
          setFormError("Unable to load your profile right now.");
        }
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [form]);

  useEffect(() => {
    if (displayNameInteracted) {
      void form.trigger("displayName");
    }
  }, [debouncedDisplayName, displayNameInteracted, form]);

  useEffect(() => {
    if (usernameInteracted) {
      void form.trigger("username");
    }
  }, [debouncedUsername, form, usernameInteracted]);

  useEffect(() => {
    if (avatarUrlInteracted) {
      void form.trigger("avatarUrl");
    }
  }, [avatarUrlInteracted, debouncedAvatarUrl, form]);

  useEffect(() => {
    if (bioInteracted) {
      void form.trigger("bio");
    }
  }, [bioInteracted, debouncedBio, form]);

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

  const saveDisabled = useMemo(() => {
    return (
      loadingProfile ||
      form.formState.isSubmitting ||
      usernameAvailability.isChecking ||
      usernameAvailability.status === "taken"
    );
  }, [
    form.formState.isSubmitting,
    loadingProfile,
    usernameAvailability.isChecking,
    usernameAvailability.status
  ]);

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError("");

    if (usernameAvailability.isChecking) {
      return;
    }

    if (usernameAvailability.status === "taken") {
      form.setError("username", {
        type: "availability",
        message: "This username is already taken"
      });
      return;
    }

    const trimmedDisplayName = values.displayName.trim();
    const trimmedUsername = values.username.trim();
    const trimmedAvatarUrl = values.avatarUrl.trim();
    const trimmedBio = values.bio.trim();

    const payload: {
      displayName: string;
      username: string;
      locale: "vi" | "en";
      avatarUrl?: string | null;
      bio?: string | null;
    } = {
      displayName: trimmedDisplayName,
      username: trimmedUsername,
      locale: values.locale
    };

    if (trimmedAvatarUrl) {
      payload.avatarUrl = trimmedAvatarUrl;
    } else if (profileSnapshot.avatarUrl) {
      payload.avatarUrl = null;
    }

    if (trimmedBio) {
      payload.bio = trimmedBio;
    } else if (profileSnapshot.bio) {
      payload.bio = null;
    }

    try {
      await apiWrite("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      window.location.href = "/settings/profile";
    } catch (error) {
      const { formError: nextFormError } = applyApiFormErrors<ProfileSettingsValues>(
        error,
        form.setError
      );
      setFormError(nextFormError || "Unable to save your profile right now.");
    }
  });

  return (
    <main className="page-main">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Settings
        </p>
        <h1 className="text-4xl tracking-tight">Edit your profile</h1>
      </div>
      {loadingProfile ? (
        <p className="text-sm text-[var(--muted)]">Loading your profile...</p>
      ) : (
        <form onSubmit={onSubmit} className="panel grid max-w-3xl gap-4 p-6">
          <FormFieldShell
            label="Display name"
            htmlFor="settings-display-name"
            error={form.formState.errors.displayName?.message}
            helperText="This is the name shown on your public profile."
          >
            <Input
              id="settings-display-name"
              aria-invalid={Boolean(form.formState.errors.displayName)}
              placeholder="Display name"
              {...form.register("displayName", {
                validate: validateDisplayName
              })}
            />
          </FormFieldShell>

          <FormFieldShell
            label="Username"
            htmlFor="settings-username"
            error={form.formState.errors.username?.message}
            helperText="Use at least 3 characters. This stays unique across Cookpedia."
            status={
              !form.formState.errors.username && usernameAvailability.status === "checking"
                ? "checking"
                : !form.formState.errors.username &&
                    usernameAvailability.status === "available"
                  ? "valid"
                  : "neutral"
            }
            statusText={
              !form.formState.errors.username ? usernameAvailability.message : undefined
            }
          >
            <Input
              id="settings-username"
              aria-invalid={Boolean(form.formState.errors.username)}
              placeholder="Username"
              {...form.register("username", {
                validate: validateUsername
              })}
            />
          </FormFieldShell>

          <FormFieldShell
            label="Avatar URL"
            htmlFor="settings-avatar-url"
            error={form.formState.errors.avatarUrl?.message}
            helperText="Optional. Paste a full image URL."
          >
            <Input
              id="settings-avatar-url"
              aria-invalid={Boolean(form.formState.errors.avatarUrl)}
              placeholder="Avatar URL"
              {...form.register("avatarUrl", {
                validate: validateAvatarUrl
              })}
            />
          </FormFieldShell>

          <FormFieldShell
            label="Locale"
            htmlFor="settings-locale"
            helperText="Choose the default language for your workspace."
          >
            <select
              id="settings-locale"
              {...form.register("locale")}
              className="min-h-12 rounded-2xl border border-[var(--line)] bg-transparent px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[rgba(81,96,68,0.18)]"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </FormFieldShell>

          <FormFieldShell
            label="Bio"
            htmlFor="settings-bio"
            error={form.formState.errors.bio?.message}
            helperText="Optional. Keep it under 240 characters."
          >
            <Textarea
              id="settings-bio"
              aria-invalid={Boolean(form.formState.errors.bio)}
              placeholder="Bio"
              {...form.register("bio", {
                validate: validateBio
              })}
            />
          </FormFieldShell>

          {formError ? (
            <p className="text-sm text-[rgba(148,52,45,0.95)]">{formError}</p>
          ) : null}

          <Button type="submit" disabled={saveDisabled}>
            Save changes
          </Button>
        </form>
      )}
    </main>
  );
}
