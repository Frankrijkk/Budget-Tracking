import { Delete } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back']

export function Keypad({ value, onChange }: Props) {
  function press(key: string) {
    if (key === 'back') {
      onChange(value.slice(0, -1))
      return
    }
    if (key === '.' && value.includes('.')) return
    if (value.includes('.') && value.split('.')[1]?.length >= 2) return
    if (value === '0' && key !== '.') {
      onChange(key)
      return
    }
    onChange(value + key)
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => press(key)}
          className="flex h-14 items-center justify-center rounded-xl bg-surface text-xl font-medium text-text active:bg-surface-raised"
        >
          {key === 'back' ? <Delete size={20} /> : key}
        </button>
      ))}
    </div>
  )
}
