"use client";

import { Button } from "./button";

type TabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  items: Array<{
    value: T;
    label: string;
  }>;
};

export function Tabs<T extends string>({ value, onChange, items }: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => (
        <Button
          key={item.value}
          variant={value === item.value ? "default" : "secondary"}
          size="sm"
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
