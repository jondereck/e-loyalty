"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type DebouncedSearchFieldProps = {
  defaultValue?: string;
  name?: string;
  placeholder: string;
  ariaLabel?: string;
  delay?: number;
};

export function DebouncedSearchField({
  defaultValue = "",
  name = "q",
  placeholder,
  ariaLabel = placeholder,
  delay = 400,
}: DebouncedSearchFieldProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timer = useRef<number | null>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function commitSearch(nextRawValue: string) {
    const nextValue = nextRawValue.trim();
    const currentValue = searchParams.get(name) ?? "";
    if (nextValue === currentValue) return;

    const params = new URLSearchParams(searchParams.toString());
    if (nextValue) {
      params.set(name, nextValue);
    } else {
      params.delete(name);
    }
    params.delete("page");

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  function handleChange(nextValue: string) {
    setValue(nextValue);
    if (timer.current) window.clearTimeout(timer.current);

    timer.current = window.setTimeout(() => {
      commitSearch(nextValue);
    }, delay);
  }

  return (
    <label className="lp-search-field">
      <Search size={17} />
      <input
        name={name}
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          if (timer.current) window.clearTimeout(timer.current);
          commitSearch(event.currentTarget.value);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
      />
    </label>
  );
}
