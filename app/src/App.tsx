import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import CalculatorPage from './pages/CalculatorPage'
import OnboardingPage from './pages/OnboardingPage'
import { hasCompletedOnboarding } from './lib/profileStore'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={hasCompletedOnboarding() ? <CalculatorPage /> : <Navigate to="/onboarding" replace />}
        />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Routes>
    </BrowserRouter>
  )
}
