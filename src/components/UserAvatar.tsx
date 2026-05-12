import type { CSSProperties } from "react";

export function UserAvatar({
  name,
  imageUrl,
  className = "lp-avatar",
}: {
  name?: string | null;
  imageUrl?: string | null;
  className?: string;
}) {
  const initials = name?.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
  const avatarStyle = imageUrl
    ? ({ "--avatar-image": `url(${JSON.stringify(imageUrl)})` } as CSSProperties & Record<"--avatar-image", string>)
    : undefined;

  return (
    <span
      aria-label={imageUrl ? (name ? `${name} avatar` : "User avatar") : undefined}
      className={`${className}${imageUrl ? " has-image" : ""}`}
      role={imageUrl ? "img" : undefined}
      style={avatarStyle}
    >
      {imageUrl ? null : initials}
    </span>
  );
}
