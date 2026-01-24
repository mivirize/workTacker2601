import { queryAll, queryOne, run, getLastInsertRowId } from '../schema'
import type { Category, CategoryRule } from '../../../shared/types'
import { getTagIdsByCategories, getTagIdsForCategory, setCategoryTags } from './tag-repository'

interface CategoryRow {
  id: number
  name: string
  color: string
  rules: string
  is_default: number
}

function rowToCategory(row: CategoryRow, tagIds: number[] = []): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    rules: JSON.parse(row.rules) as CategoryRule[],
    isDefault: row.is_default === 1,
    tagIds,
  }
}

export function getAllCategories(): Category[] {
  const rows = queryAll<CategoryRow>('SELECT * FROM categories ORDER BY name ASC')
  const categoryIds = rows.map(r => r.id)
  const tagIdsMap = getTagIdsByCategories(categoryIds)

  return rows.map(row => rowToCategory(row, tagIdsMap.get(row.id) ?? []))
}

export function getCategoryById(id: number): Category | null {
  const row = queryOne<CategoryRow>(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  )
  if (!row) return null

  const tagIds = getTagIdsForCategory(id)
  return rowToCategory(row, tagIds)
}

export function createCategory(category: Omit<Category, 'id'>): Category {
  run(
    `INSERT INTO categories (name, color, rules, is_default) VALUES (?, ?, ?, ?)`,
    [
      category.name,
      category.color,
      JSON.stringify(category.rules),
      category.isDefault ? 1 : 0,
    ]
  )

  const id = getLastInsertRowId()

  // Save category tags if provided
  if (category.tagIds && category.tagIds.length > 0) {
    setCategoryTags(id, category.tagIds)
  }

  return {
    id,
    ...category,
    tagIds: category.tagIds ?? [],
  }
}

export function updateCategory(category: Category): Category {
  run(
    `UPDATE categories
     SET name = ?, color = ?, rules = ?, is_default = ?, updated_at = strftime('%s', 'now')
     WHERE id = ?`,
    [
      category.name,
      category.color,
      JSON.stringify(category.rules),
      category.isDefault ? 1 : 0,
      category.id,
    ]
  )

  // Update category tags
  setCategoryTags(category.id, category.tagIds ?? [])

  return {
    ...category,
    tagIds: category.tagIds ?? [],
  }
}

export function deleteCategory(categoryId: number): void {
  // First, unset category_id for all activities with this category
  run('UPDATE activities SET category_id = NULL WHERE category_id = ?', [
    categoryId,
  ])

  // Then delete the category
  run('DELETE FROM categories WHERE id = ?', [categoryId])
}

export interface CategoryMatchResult {
  categoryId: number | null
  categoryTagIds: number[]  // Category-level default tags
  ruleTagIds: number[]      // Rule-specific tags (if matched)
}

export function findMatchingCategory(
  appName: string,
  windowTitle: string,
  url?: string
): number | null {
  const result = findMatchingCategoryWithTags(appName, windowTitle, url)
  return result.categoryId
}

export function findMatchingCategoryWithTags(
  appName: string,
  windowTitle: string,
  url?: string
): CategoryMatchResult {
  const categories = getAllCategories()

  for (const category of categories) {
    // Check ALL rules in this category and collect tags from matching ones
    let hasMatch = false
    const allMatchedRuleTagIds: number[] = []

    for (const rule of category.rules) {
      const valueToCheck =
        rule.type === 'app'
          ? appName
          : rule.type === 'title'
            ? windowTitle
            : url ?? ''

      if (!valueToCheck) continue

      let matched = false
      if (rule.isRegex) {
        try {
          const regex = new RegExp(rule.pattern, 'i')
          matched = regex.test(valueToCheck)
        } catch {
          // Invalid regex, skip
        }
      } else {
        matched = valueToCheck.toLowerCase().includes(rule.pattern.toLowerCase())
      }

      if (matched) {
        hasMatch = true
        // Collect tags from this matching rule
        if (rule.tagIds && rule.tagIds.length > 0) {
          allMatchedRuleTagIds.push(...rule.tagIds)
        }
      }
    }

    // If any rule matched in this category, return with all collected rule tags
    if (hasMatch) {
      return {
        categoryId: category.id,
        categoryTagIds: category.tagIds ?? [],
        ruleTagIds: [...new Set(allMatchedRuleTagIds)], // Deduplicate
      }
    }
  }

  // Return "その他" category if no match found
  const otherCategory = categories.find((c) => c.name === 'その他')
  return {
    categoryId: otherCategory?.id ?? null,
    categoryTagIds: otherCategory?.tagIds ?? [],
    ruleTagIds: [],
  }
}
