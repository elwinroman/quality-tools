import './loader-dot.css'

export function LoaderDot({ className }, { props }) {
  return (
    <div className={`opacity-80 ${className}`} {...props}>
      <span className="loader-dot"></span>
    </div>
  )
}
