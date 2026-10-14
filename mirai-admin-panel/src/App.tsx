import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import Plans from './pages/Plans';
import CMSManagement from './pages/CMSManagement';
import FAQManagement from "./pages/FAQManagement";
import FeedbackManagement from "./pages/FeedbackManagement";
import SupportManagement from "./pages/SupportManagement";
import LeadsManagement from "./pages/LeadsManagement";
import BannerManagement from "./pages/BannerManagement"
import OrdersManagement from "./pages/OrdersManagement";
import Settings from "./pages/Settings";

function App() {
  return (
    <Router>
      
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/policies" element={<CMSManagement />} />
              <Route path="/settings" element={<Settings />} />
               <Route path="/faq" element={<FAQManagement />} />
               <Route path="/feedback" element={<FeedbackManagement />} />
               <Route path="/support" element={<SupportManagement />} />
               <Route path="/leads" element={<LeadsManagement />} />
               <Route path="/banners" element={<BannerManagement />} />
               <Route path="/orders" element={<OrdersManagement />} />
            </Route>
          </Route>
        </Routes>
      
    </Router>
  );
}

export default App;
