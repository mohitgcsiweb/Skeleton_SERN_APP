import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Button, Form, Card, Row, Col, Container, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import EditAudienceModal from './EditAudienceModal';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
const apiUrl = import.meta.env.VITE_API_URL;

const ManageAudiences = () => {
  const [audiences, setAudiences] = useState([]);
  const [newRole, setNewRole] = useState({ role: '' });
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAudiences = async () => {
      try {
        const response = await axios.get(`${apiUrl}/admin/audiences`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAudiences(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate('/logout');
        } else {
          toast.error(error.response.data.message || 'Fetching audiences list failed');
        }
      }
    };

    fetchAudiences();
  }, []);

  const handleCreateRoles = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/admin/audiences`, { newRole }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewRole({ role: '' });
      toast.success(response.data.message);
      const audiences = await axios.get(`${apiUrl}/admin/audiences`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAudiences(audiences.data);
    } catch (error) {
      setNewRole({ role: '' });
      if (error.response.status === 401) {
        navigate('/logout');
      } else if (error.response.data.message.includes("E11000 duplicate key error collection")) {
        toast.error('Audience with same role already exists');
      } else {
        toast.error(error.response.data.message || 'Create audiences failed');
      }
    }
  };

  const handleEditClick = (audience) => {
    setSelectedAudience(audience);
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  const handleUpdateAudience = async (updatedAudience) => {
    try {
      const response = await axios.put(`${apiUrl}/admin/audiences/${updatedAudience._id}`, { updatedAudience }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      handleClose();
      const audiences = await axios.get(`${apiUrl}/admin/audiences`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAudiences(audiences.data);
      toast.success(response.data.message);
    } catch (error) {
      handleClose();
      if (error.response && error.response.status === 401) {
        navigate('/logout');
      } else {
        const audiences = await axios.get(`${apiUrl}/admin/audiences`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAudiences(audiences.data);
        toast.error(error.response.data.message || 'Update audience failed');
      }
    }
  };

  const colDefs = useMemo(() => {
    return [
      { field: "role", headerName: "Audience" },
      { field: "isAdmin", cellRenderer: 'agCheckboxCellRenderer', filter: false },
      { field: "isActive", cellRenderer: 'agCheckboxCellRenderer', filter: false },
      { field: "actions", cellRenderer: props => {
          return !props.data.isAdmin ? <Button className="custom-btn mb-3" onClick={() => handleEditClick(props.data)}>Edit</Button> : <></> 
        }, filter: false
      }
    ];
  });

  const defaultColDef = useMemo(() => {
    return {
      filter: 'agTextColumnFilter',
      floatingFilter: true
    };
  }, []);

  return (
    <Container>
      <Card className="mt-3">
        <Card.Header>Manage Audiences</Card.Header>
        <Card.Body>
          <Form onSubmit={handleCreateRoles}>
            <Row md={12}>
              <Col md={4}>
                <Form.Label htmlFor='audience'>Audience <span className='text-danger'>*</span></Form.Label>
                <Form.Control type="text" id="audience" placeholder="audience" autoFocus value={newRole.role} onChange={e => setNewRole({ ...newRole, role: e.target.value })} required />
              </Col>
            </Row>
            <Row className="mt-3" md={12}>
              <Col md={12}>
                <Button type="submit" className="custom-btn">Create Audience</Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      <Card className="mt-3">
        <Card.Header>Audiences List</Card.Header>
        <Card.Body>
        <div className="ag-theme-quartz" style={{ height: 500 }} >
            <AgGridReact
              rowData={audiences}
              columnDefs={colDefs}
              defaultColDef={defaultColDef}
              paginationAutoPageSize={true}
              pagination={true} />
          </div>
        </Card.Body>
      </Card>
      {selectedAudience && (
          <EditAudienceModal
            show={showModal}
            audience={selectedAudience}
            handleClose={handleClose}
            handleSave={handleUpdateAudience}
          />
        )}
    </Container>
  );
};

export default ManageAudiences;