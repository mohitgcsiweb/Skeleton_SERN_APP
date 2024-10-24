import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import Select from "react-select";

const EditUserModal = ({ show, user, audiences, handleClose, handleSave }) => {
  const [userName, setUserName] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState(null);
  const options = audiences.map((audience) => ({
    value: audience._id,
    label: audience.role,
  }));

  useEffect(() => {
    if (user) {
      setUserName(user.contact.firstName + " " + user.contact.lastName);
      setIsActive(user.isActive);
      setIsMfaEnabled(user.isMfaEnabled);

      // Find and set the correct audience object for the select component
      const audienceOption = options.find(
        (option) => option.value === user.audience.id
      );
      setSelectedAudience(audienceOption);
    }
  }, [user, audiences]);

  const handleAudienceChange = (selectedOption) => {
    setSelectedAudience(selectedOption);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave({
      ...user,
      userName,
      isActive,
      isMfaEnabled,
      audience: selectedAudience.value,
    });
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
              label="Active"
            />
          </Form.Group>
          <Form.Group controlId="isMfaEnabled" className="mt-3">
            <Form.Check
              type="checkbox"
              checked={isMfaEnabled}
              onChange={handleMfaChange}
              label="MFA Enabled"
            />
          </Form.Group>
          <Button className="btn-block custom-btn col-md mt-4" type="submit">
            Save Changes
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditUserModal;
