import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/layouts/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

// Placeholder pages
const Dashboard = () => <div className="text-2xl font-bold">Dashboard (Em construção)</div>
const Extrato = () => <div className="text-2xl font-bold">Extrato (Em construção)</div>
const Adiantamento = () => <div className="text-2xl font-bold">Adiantamento (Em construção)</div>

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route element={<Layout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/extrato" element={<Extrato />} />
                    <Route path="/adiantamento" element={<Adiantamento />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App
