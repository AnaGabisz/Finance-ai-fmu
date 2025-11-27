import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/layouts/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import AssinaturasPage from '@/pages/AssinaturasPage'

// Placeholder pages
const Extrato = () => <div className="text-2xl font-bold">Extrato (Em construção)</div>

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<Layout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/extrato" element={<Extrato />} />
                    <Route path="/assinaturas" element={<AssinaturasPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
