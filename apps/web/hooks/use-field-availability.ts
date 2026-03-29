"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet } from "@/lib/api";
import { useDebouncedValue } from "./use-debounced-value";

type AvailabilityField = "email" | "username";
type AvailabilityStatus = "unchecked" | "checking" | "available" | "taken" | "invalid";

type AvailabilityResponse = {
  email?: { status: AvailabilityStatus };
  username?: { status: AvailabilityStatus };
};

const statusMessages: Record<AvailabilityField, Record<Exclude<AvailabilityStatus, "unchecked">, string>> = {
  email: {
    checking: "Checking availability...",
    available: "Email is available",
    taken: "This email is already in use",
    invalid: "Enter a valid email address"
  },
  username: {
    checking: "Checking availability...",
    available: "Username is available",
    taken: "This username is already taken",
    invalid: "Username must be at least 3 characters"
  }
};

export function useFieldAvailability({
  field,
  value,
  enabled
}: {
  field: AvailabilityField;
  value: string;
  enabled: boolean;
}) {
  const [status, setStatus] = useState<AvailabilityStatus>("unchecked");
  const requestIdRef = useRef(0);
  const trimmedValue = value.trim();
  const debouncedValue = useDebouncedValue(trimmedValue, 450);

  useEffect(() => {
    if (!enabled || !debouncedValue) {
      setStatus("unchecked");
      return;
    }

    const requestId = ++requestIdRef.current;
    setStatus("checking");

    const query = new URLSearchParams({ [field]: debouncedValue });
    void apiGet<AvailabilityResponse>(`/auth/availability?${query.toString()}`).then(
      (response) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setStatus(response[field]?.status ?? "unchecked");
      },
      () => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setStatus("unchecked");
      }
    );
  }, [debouncedValue, enabled, field]);

  const message = useMemo(() => {
    if (status === "unchecked") {
      return "";
    }

    return statusMessages[field][status];
  }, [field, status]);

  return {
    status,
    message,
    isChecking: status === "checking"
  };
}
