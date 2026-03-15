/**
 * Template List Component
 *
 * List of form templates with filtering and search.
 */

import React, { useState, useMemo } from 'react'
import type { FormTemplate } from '../../types/form-templates'
import { getAllTemplates, getAllCategories } from '../../lib/form-templates'
import { TemplateItem } from './TemplateItem'

interface TemplateListProps {
  readonly selectedTemplateId?: string | null
  readonly onSelectTemplate?: (template: FormTemplate) => void
  readonly onApplyTemplate?: (template: FormTemplate) => void
  readonly onEditTemplate?: (template: FormTemplate) => void
  readonly onDeleteTemplate?: (template: FormTemplate) => void
  readonly isReadOnly?: boolean
  readonly className?: string
}

export function TemplateList({
  selectedTemplateId,
  onSelectTemplate,
  onApplyTemplate,
  onEditTemplate,
  onDeleteTemplate,
  isReadOnly = false,
  className = '',
}: TemplateListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const templates = getAllTemplates()
  const categories = ['all', ...getAllCategories()]

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' || template.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [templates, searchQuery, selectedCategory])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Search and Filter */}
      <div className="p-3 border-b border-gray-200 space-y-2">
        <input
          type="text"
          placeholder="テンプレートを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'すべて' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">テンプレートが見つかりません</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              isSelected={selectedTemplateId === template.id}
              onSelect={() => onSelectTemplate?.(template)}
              onApply={() => onApplyTemplate?.(template)}
              onEdit={() => onEditTemplate?.(template)}
              onDelete={() => onDeleteTemplate?.(template)}
              isReadOnly={isReadOnly}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
        {filteredTemplates.length} 件のテンプレート
      </div>
    </div>
  )
}
