import { queryAll, queryOne, run, getLastInsertRowId } from '../schema'
import type { Project } from '../../../shared/types'

interface ProjectRow {
  id: number
  name: string
  color: string
  description: string | null
  is_active: number
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    description: row.description ?? undefined,
    isActive: row.is_active === 1,
  }
}

export function getAllProjects(): Project[] {
  const rows = queryAll<ProjectRow>('SELECT * FROM projects ORDER BY name ASC')
  return rows.map(rowToProject)
}

export function getActiveProjects(): Project[] {
  const rows = queryAll<ProjectRow>(
    'SELECT * FROM projects WHERE is_active = 1 ORDER BY name ASC'
  )
  return rows.map(rowToProject)
}

export function getProjectById(id: number): Project | null {
  const row = queryOne<ProjectRow>('SELECT * FROM projects WHERE id = ?', [id])
  if (!row) return null
  return rowToProject(row)
}

export function createProject(project: Omit<Project, 'id'>): Project {
  run(
    `INSERT INTO projects (name, color, description, is_active) VALUES (?, ?, ?, ?)`,
    [
      project.name,
      project.color,
      project.description ?? null,
      project.isActive ? 1 : 0,
    ]
  )

  const id = getLastInsertRowId()

  return {
    id,
    ...project,
  }
}

export function updateProject(project: Project): Project {
  run(
    `UPDATE projects
     SET name = ?, color = ?, description = ?, is_active = ?, updated_at = strftime('%s', 'now')
     WHERE id = ?`,
    [
      project.name,
      project.color,
      project.description ?? null,
      project.isActive ? 1 : 0,
      project.id,
    ]
  )

  return project
}

export function deleteProject(projectId: number): void {
  // First, unset project_id for all activities with this project
  run('UPDATE activities SET project_id = NULL WHERE project_id = ?', [projectId])

  // Then delete the project
  run('DELETE FROM projects WHERE id = ?', [projectId])
}
