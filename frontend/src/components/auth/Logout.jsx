import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate('/login');
    toast.success('Logout Successful');
  },[]);

  return (
    <div className="d-flex justify-content-center mt-5 p-5">
      <h4>Logging out...</h4>
    </div>
  );
};

export default Logout;