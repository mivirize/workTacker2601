import { useState } from 'react'
import type { Project } from '../../../shared/types'
import Modal from '../common/Modal'

export interface ProjectModalProps {
  project?: Project
  onClose: () => void
  onSave: (project: Omit<Project, 'id'> | Project) => void
}

export default function ProjectModal({ project, onClose, onSave }: ProjectModalProps) {
  const [name, setName] = useState(project?.name ?? '')
  const [color, setColor] = useState(project?.color ?? '#6366f1')
  const [description, setDescription] = useState(project?.description ?? '')
  const [isActive, setIsActive] = useState(project?.isActive ?? true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const projectData = {
      name: name.trim(),
      color,
      description: description.trim() || undefined,
      isActive,
    }

    if (project) {
      onSave({ ...projectData, id: project.id })
    } else {
      onSave(projectData)
    }
  }

  const footer = (
    <>
      <button type="button" onClick={onClose} className="btn btn-secondary">
        キャンセル
      </button>
      <button type="submit" form="project-form" className="btn btn-primary">
        保存
      </button>
    </>
  )

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={project ? 'プロジェクトを編集' : '新規プロジェクト'}
      footer={footer}
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">プロジェクト名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="例: Webアプリ開発"
            required
          />
        </div>

        <div>
          <label className="label">色</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="input flex-1"
              placeholder="#6366f1"
            />
          </div>
        </div>

        <div>
          <label className="label">説明（任意）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input"
            rows={3}
            placeholder="プロジェクトの説明..."
          />
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="text-gray-700">アクティブなプロジェクト</span>
        </label>
      </form>
    </Modal>
  )
}
