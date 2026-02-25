/**
 * 태그 배지 컴포넌트
 */

import './TagBadge.css';

interface TagBadgeProps {
  tag: string;
}

export function TagBadge({ tag }: TagBadgeProps) {
  return <span className="tag-badge">#{tag}</span>;
}
