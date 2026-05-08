"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

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

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function handleChange(nextRawValue: string) {
    if (timer.current) window.clearTimeout(timer.current);

    timer.current = window.setTimeout(() => {
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
    }, delay);
  }

  return (
    <label className="lp-search-field">
      <Search size={17} />
      <input
        name={name}
        defaultValue={defaultValue}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
      />
    </label>
  );
}
