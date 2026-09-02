import { type InputHTMLAttributes } from 'react'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

export default function Checkbox(props: CheckboxProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white text-xs text-white transition-colors peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500 peer-focus-visible:ring-offset-2 peer-disabled:opacity-50">
        ✓
      </span>
    </label>
  )
}
