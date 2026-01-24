import { queryAll, queryOne, run, runInsert } from '../schema'
import { getActivitiesForDate, getActivitiesForRange } from './activity-repository'
import { getAllCategories } from './category-repository'
import type { Goal, GoalProgress, GoalType } from '../../../shared/types'
import { format, startOfWeek, endOfWeek } from 'date-fns'

interface GoalRow {
  id: number
  type: string
  target_minutes: number
  category_id: number | null
  is_enabled: number
}

function rowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    type: row.type as GoalType,
    targetMinutes: row.target_minutes,
    categoryId: row.category_id,
    isEnabled: row.is_enabled === 1,
  }
}

export function getAllGoals(): Goal[] {
  const rows = queryAll<GoalRow>('SELECT * FROM goals ORDER BY type, id')
  return rows.map(rowToGoal)
}

export function getGoalById(id: number): Goal | null {
  const row = queryOne<GoalRow>('SELECT * FROM goals WHERE id = ?', [id])
  return row ? rowToGoal(row) : null
}

export function createGoal(goal: Omit<Goal, 'id'>): Goal {
  const id = runInsert(
    `INSERT INTO goals (type, target_minutes, category_id, is_enabled) VALUES (?, ?, ?, ?)`,
    [goal.type, goal.targetMinutes, goal.categoryId, goal.isEnabled ? 1 : 0]
  )

  return {
    id,
    ...goal,
  }
}

export function updateGoal(goal: Goal): Goal {
  run(
    `UPDATE goals SET type = ?, target_minutes = ?, category_id = ?, is_enabled = ?, updated_at = strftime('%s', 'now') WHERE id = ?`,
    [goal.type, goal.targetMinutes, goal.categoryId, goal.isEnabled ? 1 : 0, goal.id]
  )

  return goal
}

export function deleteGoal(goalId: number): void {
  run('DELETE FROM goals WHERE id = ?', [goalId])
}

export function getGoalProgress(): GoalProgress[] {
  const goals = getAllGoals().filter(g => g.isEnabled)
  const categories = getAllCategories()
  const categoryMap = new Map(categories.map(c => [c.id, c.name]))

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  const todayActivities = getActivitiesForDate(today)
  const weekActivities = getActivitiesForRange(
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd')
  )

  return goals.map(goal => {
    let currentMinutes = 0

    if (goal.type === 'daily') {
      // Daily goal: sum all non-idle activity duration for today
      currentMinutes = todayActivities
        .filter(a => !a.isIdle)
        .reduce((sum, a) => sum + Math.floor(a.durationSeconds / 60), 0)
    } else if (goal.type === 'weekly') {
      // Weekly goal: sum all non-idle activity duration for this week
      currentMinutes = weekActivities
        .filter(a => !a.isIdle)
        .reduce((sum, a) => sum + Math.floor(a.durationSeconds / 60), 0)
    } else if (goal.type === 'category' && goal.categoryId) {
      // Category goal: sum duration for specific category today
      currentMinutes = todayActivities
        .filter(a => a.categoryId === goal.categoryId && !a.isIdle)
        .reduce((sum, a) => sum + Math.floor(a.durationSeconds / 60), 0)
    }

    const percentage = goal.targetMinutes > 0
      ? Math.min(100, (currentMinutes / goal.targetMinutes) * 100)
      : 0

    return {
      goal,
      currentMinutes,
      percentage,
      categoryName: goal.categoryId ? categoryMap.get(goal.categoryId) : undefined,
    }
  })
}
