import { cloneElement, forwardRef, MouseEventHandler, ReactElement } from 'react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
  type?: string
  startIcon?: ReactElement<{ className?: string }>
  endIcon?: ReactElement<{ className?: string }>
  handleClick?: MouseEventHandler<HTMLButtonElement>
  isFocus?: boolean
  title?: string
}

const InputWithIcon = forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, type = 'text', startIcon, endIcon, handleClick, isFocus, title, disabled, ...props }, ref) => {
    const StartIcon = startIcon
    const EndIcon = endIcon

    return (
      <div className="border-gentle-pink-500/40 bg-gentle-pink-500/8 focus-within:border-gentle-pink-500 focus-within:bg-gentle-pink-500/15 dark:bg-gentle-pink-900/30 relative flex h-9 w-full items-center gap-2 rounded-sm border px-3 py-2 transition-colors">
        {StartIcon && <>{cloneElement(StartIcon, { className: cn(' h-[18px] w-[18px]', StartIcon.props.className ?? '') })}</>}
        <input
          type={type}
          className={cn(
            `placeholder:text-muted flex w-full text-sm focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-5`,
            endIcon ? 'pr-11' : '',
            className,
          )}
          ref={ref}
          disabled={disabled}
          {...props}
        />
        {EndIcon && (
          <button
            type="button"
            className={cn(
              disabled ? 'pointer-events-none opacity-50' : '',
              'absolute top-1/2 right-2 -translate-y-1/2 transform cursor-pointer rounded-full p-1 transition-opacity duration-150 hover:opacity-100',
              isFocus ? 'opacity-100' : 'opacity-50',
            )}
            onClick={handleClick}
          >
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  {cloneElement(EndIcon, { className: cn('h-[18px] w-[18px]', EndIcon.props.className ?? '') })}
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{title}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </button>
        )}
      </div>
    )
  },
)

InputWithIcon.displayName = 'InputWithIcon'

export { InputWithIcon }
