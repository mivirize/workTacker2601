export interface ColorPreset {
  name: string
  value: string
  primary: string
  secondary: string
  accent: string
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Blue',
    value: 'blue',
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#F59E0B',
  },
  {
    name: 'Green',
    value: 'green',
    primary: '#10B981',
    secondary: '#047857',
    accent: '#F59E0B',
  },
  {
    name: 'Purple',
    value: 'purple',
    primary: '#8B5CF6',
    secondary: '#6D28D9',
    accent: '#F59E0B',
  },
  {
    name: 'Orange',
    value: 'orange',
    primary: '#F97316',
    secondary: '#EA580C',
    accent: '#3B82F6',
  },
  {
    name: 'Red',
    value: 'red',
    primary: '#EF4444',
    secondary: '#DC2626',
    accent: '#3B82F6',
  },
  {
    name: 'Teal',
    value: 'teal',
    primary: '#14B8A6',
    secondary: '#0D9488',
    accent: '#F59E0B',
  },
  {
    name: 'Pink',
    value: 'pink',
    primary: '#EC4899',
    secondary: '#DB2777',
    accent: '#8B5CF6',
  },
  {
    name: 'Indigo',
    value: 'indigo',
    primary: '#6366F1',
    secondary: '#4F46E5',
    accent: '#F59E0B',
  },
]

export function getPresetByValue(value: string): ColorPreset | undefined {
  return COLOR_PRESETS.find((preset) => preset.value === value)
}

export function getPresetColors(presetValue: string): { primary: string; secondary: string; accent: string } | null {
  const preset = getPresetByValue(presetValue)
  if (!preset) return null
  return {
    primary: preset.primary,
    secondary: preset.secondary,
    accent: preset.accent,
  }
}
