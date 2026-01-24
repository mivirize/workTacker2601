import { useState, useRef, useEffect } from 'react'
import type { Tag } from '../../../shared/types'
import TagBadge from './TagBadge'

interface TagSelectorProps {
  tags: Tag[]
  selectedTagIds: number[]
  onChange: (tagIds: number[]) => void
  placeholder?: string
}

export default function TagSelector({
  tags,
  selectedTagIds,
  onChange,
  placeholder = 'タグを選択...',
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id))
  const filteredTags = tags.filter(
    (tag) =>
      !selectedTagIds.includes(tag.id) &&
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (tagId: number) => {
    onChange([...selectedTagIds, tagId])
    setSearchQuery('')
    inputRef.current?.focus()
  }

  const handleRemove = (tagId: number) => {
    onChange(selectedTagIds.filter((id) => id !== tagId))
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`input min-h-[42px] flex flex-wrap gap-1 items-center cursor-text ${
          isOpen ? 'ring-2 ring-primary-500' : ''
        }`}
        onClick={() => {
          setIsOpen(true)
          inputRef.current?.focus()
        }}
      >
        {selectedTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            size="sm"
            onRemove={() => handleRemove(tag.id)}
          />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] outline-none bg-transparent text-sm"
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredTags.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              {searchQuery ? '該当するタグがありません' : '選択可能なタグがありません'}
            </div>
          ) : (
            filteredTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleSelect(tag.id)}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-50 text-left"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm">{tag.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
