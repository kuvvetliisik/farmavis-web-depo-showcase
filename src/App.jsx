import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CreateOrder from './pages/CreateOrder'
import Reports from './pages/Reports'

// Admin Pages
import AdminUsers from './pages/admin/AdminUsers'
import AdminProducts from './pages/admin/AdminProducts'
import AdminPharmacies from './pages/admin/AdminPharmacies'

import './index.css'

// Protected Route Wrapper for Admin Only pages
const AdminRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  if (!user || user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders/new" element={<CreateOrder />} />
          <Route path="reports" element={<Reports />} />

          {/* Admin Routed */}
          <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="admin/pharmacies" element={<AdminRoute><AdminPharmacies /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
