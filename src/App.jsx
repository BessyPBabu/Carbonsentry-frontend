import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import DashboardLayout from "./components/Layout/DashboardLayout";

import ForceChangePassword from "./pages/Auth/ForceChangePassword";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import VerifyEmail from "./pages/Auth/VerifyEmail";
import VerifyEmailSent from "./pages/Auth/VerifyEmailSent";

import AdminDashboard from "./pages/Admin/Dashboard";
import UserManagement from "./pages/Admin/UserManagement";
import AddUser from "./pages/Admin/AddUser";
import EditUser from "./pages/Admin/EditUser";
import Settings from "./pages/Admin/Settings";

import OfficerDashboard from "./pages/Officer/Dashboard";
import VendorsList from "./pages/Officer/Vendors/VendorsList";
import AddVendor from "./pages/Officer/Vendors/AddVendor";
import BulkUpload from "./pages/Officer/Vendors/BulkUpload";
import VendorDetails from "./pages/Officer/Vendors/VendorDetails";
import DocumentsList from "./pages/Officer/Documents/DocumentsList";
import ManualUpload from "./pages/Officer/Documents/ManualUpload";

import VendorUpload from "./pages/Public/VendorUpload";

import ViewerDashboard from "./pages/Viewer/Dashboard";

import ComingSoon from "./components/Common/ComingSoon";

function App() {
  return (
    <>
      <ToastContainer position="top-right" />

      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/force-change-password" element={<ForceChangePassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
            <Route path="/upload/:token" element={<VendorUpload />} />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="vendors" element={<VendorsList />} />

              <Route path="risk-analysis" element={<ComingSoon title="Risk Analysis" />} />
              <Route path="reports" element={<ComingSoon title="Reports" />} />
              <Route path="audit-logs" element={<ComingSoon title="Audit Logs" />} />
              
              <Route path="user-management" element={<UserManagement />} />
              <Route path="user-management/add" element={<AddUser />} />
              <Route path="user-management/edit/:id" element={<EditUser />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route
              path="/officer"
              element={
                <ProtectedRoute allowedRoles={["officer"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<OfficerDashboard />} />
              <Route path="vendors">
              <Route index element={<VendorsList />} />
              <Route path="add" element={<AddVendor />} />
              <Route path="bulk-upload" element={<BulkUpload />} />
              <Route path=":id" element={<VendorDetails />} />
            </Route>

            <Route path="documents">
              <Route index element={<DocumentsList />} />
              <Route path="manual-upload" element={<ManualUpload />} />
            </Route>
              <Route path="ai-review-queue" element={<ComingSoon title="AI Review Queue" />} />
              <Route path="risk-analysis" element={<ComingSoon title="Risk Analysis" />} />
              <Route path="reports" element={<ComingSoon title="Reports" />} />
              <Route path="audit-logs" element={<ComingSoon title="Audit Logs" />} />
            </Route>

            <Route
              path="/viewer"
              element={
                <ProtectedRoute allowedRoles={["viewer"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<ViewerDashboard />} />
              <Route path="vendors" element={<VendorsList />} />
              <Route path="risk-analysis" element={<ComingSoon title="Risk Analysis" />} />
              <Route path="reports" element={<ComingSoon title="Reports" />} />
            </Route>


            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;