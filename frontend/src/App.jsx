import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Tasks from './pages/Tasks';
import CreateTask from './pages/CreateTask';
import EditTask from './pages/EditTask';
import Home from './pages/Home';
import TaskDetail from './pages/TaskDetail';
import Profile from "./pages/Profile";
import EditProfile from './pages/EditProfile';
import RequestPasswordReset from './pages/RequestPasswordReset';
import ResetPasswordConfirm from './pages/ResetPasswordConfirm';
import ProtectedRoute from './components/ProtectedRoute';
import useAutoRefreshToken from './hooks/useAutoRefreshToken';

function App() {
  useAutoRefreshToken();
  
  return (
    <div className="container">
      <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
  
            {/* Защищенные маршруты */}
            <Route 
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/create"
              element={
                <ProtectedRoute>
                  <CreateTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:id/edit"
              element={
                <ProtectedRoute>
                  <EditTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:id/"
              element={
                <ProtectedRoute>
                  <TaskDetail />
                </ProtectedRoute>
              }
            />
            <Route path="/forgot-password" element={<RequestPasswordReset />} />
            <Route path="/reset-password-confirm/:uidb64/:token/" element={<ResetPasswordConfirm />} />
          </Routes>
      </Router>
    </div>
  );
}

export default App;
