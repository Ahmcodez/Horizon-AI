import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/authContext'
import { AssistantProvider } from './lib/assistantContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import AssistantWidget from './components/AssistantWidget'
import CalculatorPage from './pages/CalculatorPage'
import OnboardingPage from './pages/OnboardingPage'
import LoginPage from './pages/LoginPage'
import DocumentsPage from './pages/DocumentsPage'
import RootRedirect from './components/RootRedirect'

function GlobalAssistant() {
  const { user } = useAuth()
  if (!user) return null
  return <AssistantWidget />
}

export default function App() {
  return (
    <AuthProvider>
      <AssistantProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <RootRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calculator"
              element={
                <ProtectedRoute>
                  <CalculatorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
          <GlobalAssistant />
        </BrowserRouter>
      </AssistantProvider>
    </AuthProvider>
  )
}
