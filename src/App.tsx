import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/layouts/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'
import AssinaturasPage from '@/pages/AssinaturasPage'
import ExtratoPage from '@/pages/ExtratoPage'
import AdiantamentoPage from '@/pages/AdiantamentoPage'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<Layout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/extrato" element={<ExtratoPage />} />
                    <Route path="/assinaturas" element={<AssinaturasPage />} />
                    <Route path="/adiantamento" element={<AdiantamentoPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
