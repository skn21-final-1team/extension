/**
 * 태그 배지 컴포넌트 — Tailwind 스타일
 */

interface TagBadgeProps {
  tag: string;
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
      style={{
        background: 'var(--tag-bg)',
        color: 'var(--tag-text)',
        fontSize: '10px',
      }}
    >
      #{tag}
    </span>
  );
}
