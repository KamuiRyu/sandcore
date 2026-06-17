import React, { useState } from 'react'
import { LucideIcon, AlertCircle, Eye, EyeOff } from 'lucide-react'

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon
  error?: string
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ icon: Icon, error, type = 'text', className = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)

    const isPassword = type === 'password'
    const actualType = isPassword ? (showPassword ? 'text' : 'password') : type

    const hasError = !!error

    return (
      <div className="w-full relative flex flex-col">
        <div className="relative w-full">
          {/* Left Icon */}
          {Icon && (
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-500">
              <Icon size={15} />
            </span>
          )}

          {/* Input Element */}
          <input
            ref={ref}
            type={actualType}
            className={`w-full bg-[#11151A] text-slate-200 placeholder-slate-500 text-sm rounded-lg border transition-all py-2.5 focus:ring-0 focus:outline-none 
              ${Icon ? 'pl-10' : 'pl-3.5'} 
              ${isPassword ? 'pr-14' : hasError ? 'pr-9' : 'pr-3.5'} 
              ${hasError 
                ? 'border-red-500/50 focus:border-red-500' 
                : 'border-[#1A222C] focus:border-teal-500'
              } 
              ${className}
            `}
            {...props}
          />

          {/* Right Controls Container */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
            {/* Password Toggle Button */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-0.5"
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}

            {/* Error Icon & Tooltip */}
            {hasError && (
              <div 
                className="relative flex items-center justify-center cursor-pointer p-0.5 select-none"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowTooltip(!showTooltip)
                }}
              >
                <AlertCircle size={15} className="text-red-500 hover:text-red-400 transition-colors" />

                {/* Floating Tooltip Popup */}
                {showTooltip && (
                  <div 
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 w-max max-w-[200px] bg-[#1C0F13] border border-[#3D1A22] text-red-400 text-[11px] font-medium py-1.5 px-2.5 rounded-lg shadow-xl z-50 transition-all duration-150 animate-in fade-in slide-in-from-left-1
                      after:content-[''] after:absolute after:right-full after:top-1/2 after:-translate-y-1/2 after:border-[5px] after:border-transparent after:border-r-[#1C0F13]
                      before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-[6px] before:border-transparent before:border-r-[#3D1A22] before:-z-10
                    "
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="block text-center leading-normal whitespace-pre-wrap">{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

InputField.displayName = 'InputField'
