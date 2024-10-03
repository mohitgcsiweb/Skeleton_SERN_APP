import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import SetPassword from './components/auth/SetPassword';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Home from './components/Home';
import ManageUsers from './components/admin/ManageUsers';
import ManageAudiences from './components/admin/ManageAudiences';
import ManageTiles from './components/admin/ManageTiles';
import Navbar from './components/Navbar';
import Logout from './components/auth/Logout';
import APP1 from './components/APP1';
import APP2 from './components/APP2';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';
import SiteHeader from './components/SiteHeader';
const SITE_TYPE = import.meta.env.SITE_ENV;

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      { isAuthenticated ? <Navbar/> : '' }
      <Container fluid>
      { "production" !== SITE_TYPE ? <SiteHeader/> : "" }
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Home /> : <Login />} />
          <Route path="*" element={<div><h1>404 - Page Not Found</h1>
            <p>The page you are looking for does not exist.</p></div>}/>
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/forgot-password" element={isAuthenticated ? <Home />: <ForgotPassword />} />
          <Route path="/reset-password" element={isAuthenticated ? <Home />: <ResetPassword />} />
          <Route path="/" element={isAuthenticated ? <Home />: <Login />} />
          <Route path="/manage-users" element={isAuthenticated ? <ManageUsers />: <Login />} />
          <Route path="/manage-audiences" element={isAuthenticated ? <ManageAudiences />: <Login />} />
          <Route path="/manage-tiles" element={isAuthenticated ? <ManageTiles />: <Login />} />
          <Route path="/logout" element={isAuthenticated ? <Logout />: <Login />} />
          <Route path="/app1" element={isAuthenticated ? <APP1 />: <Login />} />
          <Route path="/app2" element={isAuthenticated ? <APP2 />: <Login />} />
        </Routes>
      </Container>
      <ToastContainer position="top-center" pauseOnFocusLoss={false}/>
    </Router>  
  )
}

export default App
