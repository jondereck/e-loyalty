"use client";

import { useRef } from "react";

type HiddenInput = {
  name: string;
  value: string;
};

export function PageSizeSelect({
  action,
  value,
  options,
  hidden,
  label = "Rows per page",
}: {
  action: string;
  value: number;
  options: number[];
  hidden: HiddenInput[];
  label?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="lp-page-size-form">
      {hidden.map((item) => (
        <input key={item.name} type="hidden" name={item.name} value={item.value} />
      ))}
      <select
        name="pageSize"
        defaultValue={String(value)}
        aria-label={label}
        onChange={() => formRef.current?.requestSubmit()}
      >
        {options.map((option) => (
          <option key={option} value={option}>{option} per page</option>
        ))}
      </select>
    </form>
  );
}
