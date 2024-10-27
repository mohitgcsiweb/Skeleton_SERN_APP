import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const EditAudienceModal = ({ show, audience, handleClose, handleSave }) => {
  const [role, setRole] = useState("");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (audience) {
      setRole(audience.role);
      setIsActive(audience.active);
    }
  }, [audience]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave({ ...audience, role, isActive });
  };

  const handleActiveChange = () => {
    setIsActive(!isActive);
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Audience</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group>
            <Form.Label htmlFor="role">Audience</Form.Label>
            <Form.Control
              type="text"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              autoComplete="on"
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
          <Button className="btn-block custom-btn col-md mt-4" type="submit">
            {" "}
            Save Changes{" "}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default EditAudienceModal;
