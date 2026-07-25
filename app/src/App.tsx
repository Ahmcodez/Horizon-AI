import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import CalculatorPage from './pages/CalculatorPage'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<CalculatorPage />} />
      </Routes>
    </BrowserRouter>
  )
}
