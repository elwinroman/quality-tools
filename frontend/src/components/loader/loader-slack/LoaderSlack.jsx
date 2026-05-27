import './loader-slack.css'

export function LoaderSlack({ className, ...props }) {
  return (
    <div className={` ${className} relative`} {...props}>
      <span className="loader-slack border"></span>
    </div>
  )
}
