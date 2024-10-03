import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Form, Stack, Card, Container, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Eye, EyeSlashFill } from "react-bootstrap-icons";
const apiUrl = import.meta.env.VITE_API_URL;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordType, setPasswordType] = useState('password');
  const [showPass, setShowPass] = useState(false);
  const [token, setToken] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState(''); 
  const navigate = useNavigate();
  const { login } = useAuth();

  function successfulLogin(response) {
    login(response.data.token);
    localStorage.setItem('userData', JSON.stringify(response.data.userData));
    navigate('/');
    const userName = response.data.userData.userName;
    toast.success(<div>{response.data.message}<br />Welcome, {userName}</div>);
  }

  const clickHandler = () => {
    if (passwordType === 'password') {
      setPasswordType('text');
    } else {
      setPasswordType('password');
    }
    setShowPass((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/auth/login`, { email, password, token });
      if (response.data.isMfaEnabled) {
        setMfaSecret(response.data.mfaSecret);
        setSecret(response.data.secret);
        setQrCodeUrl(response.data.qrCodeUrl);
        setMfaEnabled(true);
      } else {
        successfulLogin(response);
      }
    } catch (error) {
      toast.error(error.response.data.message || 'Login Failed');
    }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/auth/verify-mfa`, { email, secret, token });
      successfulLogin(response);
    } catch (error) {
      toast.error(error.response.data.message || 'MFA verification failed');
    }
  };

  return (
    <Container className="d-grid justify-content-center">
      <img alt="" src="../../images/gcs.png" className="mx-auto d-block w-50" />
      {!mfaEnabled ? (
        <Card style={{ width: '32rem' }} >
          <Card.Header>Login</Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label htmlFor='email'>Email</Form.Label>
                <Form.Control type="email" id="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete='on' required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label htmlFor='password'>Password</Form.Label>
                <InputGroup className="mb-3">
                  <Form.Control type={passwordType} id="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="on" required />
                  <InputGroup.Text onClick={clickHandler}>{showPass ? <Eye /> : <EyeSlashFill />}</InputGroup.Text>
                </InputGroup>
              </Form.Group>
              <Stack direction="horizontal" gap={3} className="mb-3 d-grid">
                <Button type="submit" className="col-md btn-block custom-btn">Login</Button>
                <Button as={Link} to="/forgot-password" className="col-md btn-block custom-btn">Forgot Password</Button>
              </Stack>
            </Form>
          </Card.Body>
        </Card>
      ) : (mfaSecret !== "" ? (
        <Card className="text-center" style={{ width: '24rem' }}>
          <Card.Header>Login</Card.Header>
          <Card.Body>
            <Form onSubmit={handleMfaVerify}>
              <Form.Group className="mb-3" controlId="token">
                <Form.Label>MFA Token</Form.Label>
                <Form.Control type="text" value={token} onChange={(e) => setToken(e.target.value)} required />
              </Form.Group>
              <Stack direction="horizontal" gap={3} className='d-grid'>
                <Button type="submit" className="col-md btn-block custom-btn">Verify MFA</Button>
                <Button as={Link} to="/" className="col-md btn-block custom-btn">Cancel</Button>
              </Stack>
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <Card className="text-center" style={{ width: '24rem' }}>
          <Card.Header>Login</Card.Header>
          <Card.Body>
            <Stack className="col-md">
              <p><b>Scan QR code below:</b></p>
              {qrCodeUrl && <img src={qrCodeUrl} alt="MFA QR Code" />}
            </Stack>
            <Stack className="col-md">
              {secret && <p><b>Your MFA Setup Key:</b> {secret}</p>}
            </Stack>
            <Form onSubmit={handleMfaVerify}>
              <Form.Group controlId="token">
                <Form.Label>Enter MFA Token Generated</Form.Label>
                <Form.Control type="text" placeholder="MFA Token" value={token} onChange={(e) => setToken(e.target.value)} required />
              </Form.Group>
              <Stack direction="horizontal" gap={3} className='d-grid mt-3'>
                <Button type="submit" className="col-md btn-block custom-btn">Verify MFA</Button>
                <Button as={Link} to="/" className="col-md btn-block custom-btn">Cancel</Button>
              </Stack>
            </Form>
          </Card.Body>
        </Card>
      )
      )}
    </Container>
  );
};

export default Login;
