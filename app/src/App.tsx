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
import BillingPage from './pages/BillingPage'
import ScenariosPage from './pages/ScenariosPage'
import AlertsPage from './pages/AlertsPage'
import AdvisorDashboardPage from './pages/AdvisorDashboardPage'
import RootRedirect from './components/RootRedirect'
import { usePlan } from './lib/billing'

function GlobalAssistant() {
  const { user } = useAuth()
  const { plan } = usePlan(user?.uid)
  if (!user || (plan !== 'plan' && plan !== 'advisor')) return null
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
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scenarios"
              element={
                <ProtectedRoute>
                  <ScenariosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AlertsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/advisor"
              element={
                <ProtectedRoute>
                  <AdvisorDashboardPage />
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
