import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import Select from "react-select";

const EditUserModal = ({ show, user, audiences, handleClose, handleSave }) => {
  const [userName, setUserName] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [audience, setAudience] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  let options = [];
  audiences.map((audience) =>
    options.push({ value: audience._id, label: audience.role })
  );

  useEffect(() => {
    if (user) {
      setUserName(user.userName);
      setIsActive(user.isActive);
      setIsMfaEnabled(user.isMfaEnabled);
      setAudience(user.audience._id);
      audiences.map((audience) => {
        if (user.audience._id === audience._id) {
          setSelectedAudience({ value: audience._id, label: audience.role });
        }
      });
    }
  }, [user]);

  const handleAudienceChange = (e) => {
    setAudience(e.value);
    setSelectedAudience({ value: e.value, label: e.label });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave({ ...user, userName, isActive, isMfaEnabled, audience });
  };

  const handleActiveChange = () => {
    setIsActive(!isActive);
  };

  const handleMfaChange = () => {
    setIsMfaEnabled(!isMfaEnabled);
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label htmlFor="userName">Username</Form.Label>
            <Form.Control
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoComplete="on"
              required
            />
          </Form.Group>
          <Form.Group className="mt-3">
            <Form.Label htmlFor="audience">Audience</Form.Label>
            <Select
              id="audience"
              value={selectedAudience}
              defaultValue={selectedAudience}
              onChange={handleAudienceChange}
              options={options}
              placeholder="Select audience..."
              autoFocus
              isSearchable
              required
            />
          </Form.Group>
          <Form.Group controlId="isActive" className="mt-3">
            <Form.Check
              type="checkbox"
              checked={isActive}
              onChange={handleActiveChange}
              autoComplete="on"
              label="Active"
            />
          </Form.Group>
          <Form.Group controlId="isMfaEnabled" className="mt-3">
            <Form.Check
              type="checkbox"
              checked={isMfaEnabled}
              onChange={handleMfaChange}
              autoComplete="on"
              label="MFA Enabled"
            />
          </Form.Group>
          <Button className="btn-block custom-btn col-md mt-4" type="submit">
            {" "}
            Save Changes{" "}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditUserModal;
