import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Dramas from './pages/Dramas'
import Episodes from './pages/Episodes'
import Users from './pages/Users'
import Banners from './pages/Banners'
import Feedback from './pages/Feedback'
import RechargePlans from './pages/RechargePlans'
import RechargeRecords from './pages/RechargeRecords'
import RedeemBatches from './pages/RedeemBatches'
import RedeemCodes from './pages/RedeemCodes'
import RedeemLogs from './pages/RedeemLogs'
import TaskConfigs from './pages/TaskConfigs'
import CheckinConfigs from './pages/CheckinConfigs'
import MoneyLogs from './pages/MoneyLogs'
import WatchHistory from './pages/WatchHistory'
import Subscriptions from './pages/Subscriptions'
import SubscriptionPlans from './pages/SubscriptionPlans'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('admin_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dramas" element={<Dramas />} />
          <Route path="episodes" element={<Episodes />} />
          <Route path="users" element={<Users />} />
          <Route path="banners" element={<Banners />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="recharge-plans" element={<RechargePlans />} />
          <Route path="recharge-records" element={<RechargeRecords />} />
          <Route path="redeem-batches" element={<RedeemBatches />} />
          <Route path="redeem-codes" element={<RedeemCodes />} />
          <Route path="redeem-logs" element={<RedeemLogs />} />
          <Route path="task-configs" element={<TaskConfigs />} />
          <Route path="checkin-configs" element={<CheckinConfigs />} />
          <Route path="money-logs" element={<MoneyLogs />} />
          <Route path="watch-history" element={<WatchHistory />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="subscription-plans" element={<SubscriptionPlans />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
