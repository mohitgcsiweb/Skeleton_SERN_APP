import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Form, Stack, Card, Container } from 'react-bootstrap';
import { toast } from 'react-toastify';
const apiUrl = import.meta.env.VITE_API_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/auth/forgot-password`, { email });
      navigate('/login');
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response.data.message || 'Failed to send password reset email');
    }
  };

  return (
    <Container className="d-grid justify-content-center">
      <img alt="" src="../../images/gcs.png" className="mx-auto d-block w-50"/>
      <Card style={{ width: '32rem' }}>
        <Card.Header>Forgot Password</Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label htmlFor='email'>Email</Form.Label>
              <Form.Control type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete='on' required />
            </Form.Group>
            <Stack direction="horizontal" gap={3} className='d-grid'>
              <Button type="submit" className="col-md btn-block custom-btn">Reset Password</Button>
              <Button as={Link} to="/" className="col-md btn-block custom-btn">Back to Login</Button>
            </Stack>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ForgotPassword;
