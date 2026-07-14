import './App.css'

import { Route, Routes } from 'react-router-dom'

import { Toaster } from '@/components/ui'
import { AppRoutes } from '@/constants'
import { LayoutLanding, ProtectedLayout } from '@/layouts'
import { AligmentPage, Error404, HomePage, LoginPage, SQLDefinitionPage, UsertablePage } from '@/pages'

import { SearchProvider } from './pages/Aligment/contexts/searchContext'
import { LoginProvider } from './pages/Login/contexts/login.context'

function App() {
  return (
    <div className="App">
      <Toaster />
      <SearchProvider>
        {/* Página principal */}
        <Routes>
          <Route
            path={AppRoutes.Home}
            element={
              <ProtectedLayout>
                <LayoutLanding>
                  <HomePage />
                </LayoutLanding>
              </ProtectedLayout>
            }
          />

          {/* Página definiciones SQL */}
          <Route
            path={AppRoutes.SQL_DEFINITION_DETAIL}
            element={
              <ProtectedLayout>
                <SQLDefinitionPage />
              </ProtectedLayout>
            }
          />
          <Route
            path={AppRoutes.SQL_DEFINITION}
            element={
              <ProtectedLayout>
                <SQLDefinitionPage />
              </ProtectedLayout>
            }
          />

          {/* Login */}
          <Route
            path={AppRoutes.Login}
            element={
              <LoginProvider>
                <LoginPage />
              </LoginProvider>
            }
          />

          {/* Página Usertable */}
          <Route
            path={AppRoutes.USERTABLE_DETAIL}
            element={
              <ProtectedLayout>
                <UsertablePage />
              </ProtectedLayout>
            }
          />
          <Route
            path={AppRoutes.USERTABLE}
            element={
              <ProtectedLayout>
                <UsertablePage />
              </ProtectedLayout>
            }
          />

          {/* Página de aligment */}
          <Route path={AppRoutes.Aligment} element={<AligmentPage />} />

          {/* Error 404 */}
          <Route path="*" element={<Error404 />} />
        </Routes>
      </SearchProvider>
    </div>
  )
}

export default App
