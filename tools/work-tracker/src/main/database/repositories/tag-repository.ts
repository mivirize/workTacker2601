import { queryAll, queryOne, run, runInsert } from '../schema'
import type { Tag } from '../../../shared/types'

interface TagRow {
  id: number
  name: string
  color: string
}

interface ActivityTagRow {
  activity_id: number
  tag_id: number
}

function rowToTag(row: TagRow): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  }
}

// ============================================
// Tag CRUD
// ============================================

export function getAllTags(): Tag[] {
  const rows = queryAll<TagRow>('SELECT * FROM tags ORDER BY name ASC')
  return rows.map(rowToTag)
}

export function getTagById(id: number): Tag | null {
  const row = queryOne<TagRow>('SELECT * FROM tags WHERE id = ?', [id])
  return row ? rowToTag(row) : null
}

export function createTag(tag: Omit<Tag, 'id'>): Tag {
  const id = runInsert(
    'INSERT INTO tags (name, color) VALUES (?, ?)',
    [tag.name, tag.color]
  )

  return {
    id,
    ...tag,
  }
}

export function updateTag(tag: Tag): Tag {
  run(
    `UPDATE tags
     SET name = ?, color = ?, updated_at = strftime('%s', 'now')
     WHERE id = ?`,
    [tag.name, tag.color, tag.id]
  )

  return tag
}

export function deleteTag(tagId: number): void {
  // activity_tags will be automatically deleted by CASCADE
  run('DELETE FROM tags WHERE id = ?', [tagId])
}

// ============================================
// Activity-Tag Relations
// ============================================

export function getTagsForActivity(activityId: number): Tag[] {
  const rows = queryAll<TagRow>(
    `SELECT t.* FROM tags t
     INNER JOIN activity_tags at ON t.id = at.tag_id
     WHERE at.activity_id = ?
     ORDER BY t.name ASC`,
    [activityId]
  )
  return rows.map(rowToTag)
}

export function getTagsForActivities(activityIds: number[]): Map<number, Tag[]> {
  if (activityIds.length === 0) {
    return new Map()
  }

  const placeholders = activityIds.map(() => '?').join(',')
  const rows = queryAll<ActivityTagRow & TagRow>(
    `SELECT at.activity_id, t.* FROM tags t
     INNER JOIN activity_tags at ON t.id = at.tag_id
     WHERE at.activity_id IN (${placeholders})
     ORDER BY t.name ASC`,
    activityIds
  )

  const result = new Map<number, Tag[]>()

  // Initialize empty arrays for all activity IDs
  for (const id of activityIds) {
    result.set(id, [])
  }

  // Populate tags for each activity
  for (const row of rows) {
    const tags = result.get(row.activity_id) ?? []
    tags.push(rowToTag(row))
    result.set(row.activity_id, tags)
  }

  return result
}

export function setActivityTags(activityId: number, tagIds: number[]): void {
  // Remove existing tags for this activity
  run('DELETE FROM activity_tags WHERE activity_id = ?', [activityId])

  // Insert new tags
  for (const tagId of tagIds) {
    run(
      'INSERT INTO activity_tags (activity_id, tag_id) VALUES (?, ?)',
      [activityId, tagId]
    )
  }
}

export function getTagIdsForActivity(activityId: number): number[] {
  const rows = queryAll<{ tag_id: number }>(
    'SELECT tag_id FROM activity_tags WHERE activity_id = ?',
    [activityId]
  )
  return rows.map(row => row.tag_id)
}

export function getActivityIdsByTagIds(tagIds: number[]): number[] {
  if (tagIds.length === 0) {
    return []
  }

  const placeholders = tagIds.map(() => '?').join(',')
  const rows = queryAll<{ activity_id: number }>(
    `SELECT DISTINCT activity_id FROM activity_tags
     WHERE tag_id IN (${placeholders})`,
    tagIds
  )
  return rows.map(row => row.activity_id)
}

// ============================================
// Category-Tag Relations
// ============================================

interface CategoryTagRow {
  category_id: number
  tag_id: number
}

export function getTagsForCategory(categoryId: number): Tag[] {
  const rows = queryAll<TagRow>(
    `SELECT t.* FROM tags t
     INNER JOIN category_tags ct ON t.id = ct.tag_id
     WHERE ct.category_id = ?
     ORDER BY t.name ASC`,
    [categoryId]
  )
  return rows.map(rowToTag)
}

export function getTagIdsForCategory(categoryId: number): number[] {
  const rows = queryAll<{ tag_id: number }>(
    'SELECT tag_id FROM category_tags WHERE category_id = ?',
    [categoryId]
  )
  return rows.map(row => row.tag_id)
}

export function getTagsForCategories(categoryIds: number[]): Map<number, Tag[]> {
  if (categoryIds.length === 0) {
    return new Map()
  }

  const placeholders = categoryIds.map(() => '?').join(',')
  const rows = queryAll<CategoryTagRow & TagRow>(
    `SELECT ct.category_id, t.* FROM tags t
     INNER JOIN category_tags ct ON t.id = ct.tag_id
     WHERE ct.category_id IN (${placeholders})
     ORDER BY t.name ASC`,
    categoryIds
  )

  const result = new Map<number, Tag[]>()

  // Initialize empty arrays for all category IDs
  for (const id of categoryIds) {
    result.set(id, [])
  }

  // Populate tags for each category
  for (const row of rows) {
    const tags = result.get(row.category_id) ?? []
    tags.push(rowToTag(row))
    result.set(row.category_id, tags)
  }

  return result
}

export function setCategoryTags(categoryId: number, tagIds: number[]): void {
  // Remove existing tags for this category
  run('DELETE FROM category_tags WHERE category_id = ?', [categoryId])

  // Insert new tags
  for (const tagId of tagIds) {
    run(
      'INSERT INTO category_tags (category_id, tag_id) VALUES (?, ?)',
      [categoryId, tagId]
    )
  }
}

export function getTagIdsByCategories(categoryIds: number[]): Map<number, number[]> {
  if (categoryIds.length === 0) {
    return new Map()
  }

  const placeholders = categoryIds.map(() => '?').join(',')
  const rows = queryAll<CategoryTagRow>(
    `SELECT category_id, tag_id FROM category_tags
     WHERE category_id IN (${placeholders})`,
    categoryIds
  )

  const result = new Map<number, number[]>()

  // Initialize empty arrays for all category IDs
  for (const id of categoryIds) {
    result.set(id, [])
  }

  // Populate tag IDs for each category
  for (const row of rows) {
    const tagIds = result.get(row.category_id) ?? []
    tagIds.push(row.tag_id)
    result.set(row.category_id, tagIds)
  }

  return result
}
