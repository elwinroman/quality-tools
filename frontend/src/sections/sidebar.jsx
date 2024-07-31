import { Article as ArticleIcon } from '@/icons/article'
import { CodeCircle2 as CodeCircleIcon } from '@/icons/code-circle-2'
import { LayoutDashboard as LayoutDashboardIcon } from '@/icons/layout-dashboard'
import { NavLink } from 'react-router-dom'
import { Squares as SquaresIcon } from '@/icons/squares'

export function Sidebar() {
  const navLinks = [
    {
      to: '/',
      icon: <LayoutDashboardIcon width={20} height={20} />,
      text: 'Home',
    },
    {
      to: '/definition',
      icon: <CodeCircleIcon width={20} height={20} />,
      text: 'Obtener definición',
    },
    {
      to: '/description',
      icon: <ArticleIcon width={20} height={20} />,
      text: 'Obtener descripción',
    },
    {
      to: '/diff-editor',
      icon: <SquaresIcon width={20} height={20} />,
      text: 'Diff editor',
    },
  ]

  return (
    <aside className="h-screen w-[300px] shrink-0 overflow-y-auto bg-ow">
      <div className="flex h-full flex-col">
        <div className="sticky top-0 flex h-[var(--navbar-height)] shrink-0 items-center justify-center gap-2 backdrop-blur-sm">
          <div>
            <i>Logo</i>
          </div>
          <h2 className="text-xl font-bold text-slate-700">Quality Tools</h2>
        </div>
        <nav className="mx-auto grow bg-ow py-4">
          <ul className="flex flex-col gap-3">
            {/* Menu item */}
            {navLinks.map(({ to, icon, text }) => (
              <li key={text}>
                <NavLink to={to}>
                  {({ isActive }) => (
                    <div
                      className={`flex w-[250px] items-center gap-2 rounded-md px-4 py-3 ${isActive ? 'bg-white shadow-[0_20px_27px_0_rgba(0,0,0,.05)]' : undefined}`}
                    >
                      <i
                        className={`rounded-md p-1.5 text-slate-600 shadow dark:border dark:border-slate-600 dark:bg-transparent dark:text-white dark:shadow-none ${isActive ? 'bg-rose-500 text-white shadow-none' : 'bg-white'}`}
                      >
                        {icon}
                      </i>
                      <span className="text-[0.94rem] text-slate-600 dark:text-slate-300">
                        {text}
                      </span>
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}