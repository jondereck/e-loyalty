"use client";

import { useState, type TextareaHTMLAttributes } from "react";

type AdminNoteTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  help?: string;
  maxLength?: number;
};

export function AdminNoteTextarea({
  label,
  help,
  maxLength = 500,
  defaultValue,
  onChange,
  ...props
}: AdminNoteTextareaProps) {
  const initialValue = typeof defaultValue === "string" ? defaultValue : "";
  const [count, setCount] = useState(initialValue.length);

  return (
    <label className="lp-note-field">
      <span className="lp-sr-only">{label}</span>
      {help ? <small>{help}</small> : null}
      <textarea
        {...props}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={(event) => {
          setCount(event.currentTarget.value.length);
          onChange?.(event);
        }}
      />
      <em>{count} / {maxLength}</em>
    </label>
  );
}
