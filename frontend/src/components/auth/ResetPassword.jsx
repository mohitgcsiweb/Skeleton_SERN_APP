import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Form, Stack, Card, InputGroup, Container } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Eye, EyeSlashFill } from "react-bootstrap-icons";
import PasswordChecklist from "react-password-checklist";
const apiUrl = import.meta.env.VITE_API_URL;

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [passwordType, setPasswordType] = useState('password');
  const [showPass, setShowPass] = useState(false);
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const token = query.get('token');
  const navigate = useNavigate();

  const clickHandler = () => {
    if(passwordType === 'password') {
      setPasswordType('text');
    } else {
      setPasswordType('password');
    }
    setShowPass((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/auth/reset-password`, { token, newPassword });
      navigate('/login');
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response.data.message || 'Failed to reset password');
    }
  };

  return (
    <Container className="d-grid justify-content-center">
      <img alt="" src="../../images/gcs.png" className="mx-auto d-block w-50"/>
      <Card style={{ width: '32rem' }}>
        <Card.Header>Reset Password</Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label htmlFor='password'>New Password</Form.Label>
              <InputGroup className="mb-3">
                <Form.Control type={passwordType} id="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="on" required />
                <InputGroup.Text onClick={clickHandler}>{showPass ? <Eye /> : <EyeSlashFill />}</InputGroup.Text>
              </InputGroup>
            </Form.Group>
            <PasswordChecklist rules={["capital", "lowercase", "number", "minLength"]} minLength={8} value={newPassword} style={{ textAlign: 'left'}} 
              messages={{
                minLength: "Password length should be atleast 8",
                number: "Password should contain number",
                capital: "Password should contain uppercase letters",
                lowercase: "Password should contain lowercase letters"
              }} />
            <Stack gap={3} className="col-md d-grid mt-3">
              <Button type="submit" className="custom-btn btn-block">Reset Password</Button>
            </Stack>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResetPassword;
