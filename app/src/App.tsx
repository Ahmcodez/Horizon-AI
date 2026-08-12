import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/authContext'
import { AssistantProvider } from './lib/assistantContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AssistantWidget from './components/AssistantWidget'
import CalculatorPage from './pages/CalculatorPage'
import OnboardingPage from './pages/OnboardingPage'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import PrivacyPage from './pages/PrivacyPage'
import DocumentsPage from './pages/DocumentsPage'
import BillingPage from './pages/BillingPage'
import ScenariosPage from './pages/ScenariosPage'
import AlertsPage from './pages/AlertsPage'
import AdvisorDashboardPage from './pages/AdvisorDashboardPage'
import StateComparisonPage from './pages/StateComparisonPage'
import TaxMedicarePage from './pages/TaxMedicarePage'
import EmbedPage from './pages/EmbedPage'
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
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route
              path="/app"
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
            <Route
              path="/states"
              element={
                <ProtectedRoute>
                  <StateComparisonPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tax-medicare"
              element={
                <ProtectedRoute>
                  <TaxMedicarePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/embed"
              element={
                <ProtectedRoute>
                  <EmbedPage />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Footer />
          <GlobalAssistant />
        </BrowserRouter>
      </AssistantProvider>
    </AuthProvider>
  )
}
