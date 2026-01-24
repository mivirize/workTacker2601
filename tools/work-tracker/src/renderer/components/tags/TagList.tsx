import type { Tag } from '../../../shared/types'
import TagBadge from './TagBadge'

interface TagListProps {
  tags: Tag[]
  maxDisplay?: number
  size?: 'sm' | 'md'
  onTagClick?: (tag: Tag) => void
}

export default function TagList({
  tags,
  maxDisplay = 3,
  size = 'sm',
  onTagClick,
}: TagListProps) {
  if (tags.length === 0) {
    return null
  }

  const displayTags = tags.slice(0, maxDisplay)
  const remainingCount = tags.length - maxDisplay

  return (
    <div className="flex flex-wrap items-center gap-1">
      {displayTags.map((tag) => (
        <span
          key={tag.id}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
          className={onTagClick ? 'cursor-pointer' : undefined}
        >
          <TagBadge tag={tag} size={size} />
        </span>
      ))}
      {remainingCount > 0 && (
        <span
          className={`text-gray-500 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
          title={tags.slice(maxDisplay).map(t => t.name).join(', ')}
        >
          +{remainingCount}
        </span>
      )}
    </div>
  )
}
