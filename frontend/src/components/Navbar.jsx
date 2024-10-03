import React, {useState, useEffect} from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaHouse, FaCircleUser  } from "react-icons/fa6";
const apiUrl = import.meta.env.VITE_API_URL;

const TopNavbar = () => {
  const { isAuthenticated } = useAuth();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const userData = localStorage.getItem('userData');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if(userData) {
          const userId = JSON.parse(userData)._id;
          const response = await axios.get(`${apiUrl}/auth/verify-session/${userId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setUserName(response.data.userData.userName);
          setUserRole(response.data.userData.audience.role);
          setIsAdmin(response.data.userData.audience.isAdmin);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate('/logout');
        } else {
          toast.error(error.response.data.message || 'Fetching logged in user failed');
        }
      }
    };

    fetchUser();
  },[userData]);

  return (
    <>
      {isAuthenticated ? (
        <Navbar collapseOnSelect expand="lg" className="bg-body-tertiary m-0 p-0" bg="light" data-bs-theme="light">
          <Container>
            <Navbar.Brand href="/">
              <img alt="" src="../../images/gcs.png" className="align-center" style={{width: '6rem'}}/>{' '}
              <b>GCS APP</b>
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav" className="justify-content-end">
              <Nav className="mr-auto">
                <Nav.Link as={Link} to="/" className="topnav-right"><FaHouse size={25}/></Nav.Link>
                <NavDropdown title={<FaCircleUser size={25} />} id="collapsible-nav-dropdown" align='end' className='topnav-right'>
                  <NavDropdown.Item>
                    <Navbar.Text>Logged in as: {userName}<br/> Audience: {userRole}</Navbar.Text>
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  { isAdmin ? <NavDropdown.Item as={Link} to="/manage-users">Manage Users</NavDropdown.Item> : '' } 
                  { isAdmin ? <NavDropdown.Item as={Link} to="/manage-audiences">Manage Audiences</NavDropdown.Item> : '' } 
                  { isAdmin ? <NavDropdown.Item as={Link} to="/manage-tiles">Manage Tiles</NavDropdown.Item> : '' } 
                  <NavDropdown.Item as={Link} to="/logout">Logout</NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar> 
      ) : (
        <>
        </>
      )}
    </>
  );
};

export default TopNavbar;
