interface AvatarProps {
  initials: string;
  color: string;
  size?: number;
  className?: string;
}

export function Avatar({ initials, color, size = 30, className = "" }: AvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center font-extrabold text-white ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size / 3.2),
        background: color,
        fontSize: size * 0.34,
      }}
    >
      {initials}
    </span>
  );
}
