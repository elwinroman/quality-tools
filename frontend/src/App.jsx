import './App.css'

import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'

import { InfoCards } from '@/components/main/components/InfoCards'
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { ROUTES } from '@/constants'
import Layout from '@/layouts/Layout'
import { AligmentPage, HomePage, LoginPage, SQLDefinitionPage, UsertablePage } from '@/pages'

function Error() {
  return <div>Error 404</div>
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])
  return (
    <>
      {/* Página principal */}
      <Routes>
        <Route
          path={ROUTES.HOME}
          element={
            <ProtectedLayout>
              <Layout>
                <HomePage />
              </Layout>
            </ProtectedLayout>
          }
        />

        {/* Página definiciones SQL */}
        <Route
          path={ROUTES.SQL_DEFINITION}
          element={
            <ProtectedLayout>
              <Layout>
                <InfoCards />
                <SQLDefinitionPage />
              </Layout>
            </ProtectedLayout>
          }
        />

        {/* Página Tabla de usuario */}
        <Route
          path={ROUTES.USERTABLE}
          element={
            <ProtectedLayout>
              <Layout>
                <InfoCards />
                <UsertablePage />
              </Layout>
            </ProtectedLayout>
          }
        />

        {/* Login */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Página de aligment */}
        <Route path={ROUTES.ALIGMENT} element={<AligmentPage />} />

        {/* Error 404 */}
        <Route path="*" element={<Error />} />
      </Routes>
    </>
  )
}

export default App
