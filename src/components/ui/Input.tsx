import * as React from 'react'
import { cn } from '../../lib/utils'

type InputProps = React.ComponentProps<'input'>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      className={cn('ui-input', className)}
      ref={ref}
      type={type}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
