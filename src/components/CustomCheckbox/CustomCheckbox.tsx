import type { ChangeEvent } from 'react'
import './CustomCheckbox.css'

interface CustomCheckboxProps {
  checked: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  title?: string
}

function CustomCheckbox({ checked, onChange, title }: CustomCheckboxProps) {
  return (
    <label className="custom-checkbox" title={title}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <div className="custom-checkbox-box">
        {checked && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path
              d="M1 3L3 5L7 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </label>
  )
}

export { CustomCheckbox }
export default CustomCheckbox
