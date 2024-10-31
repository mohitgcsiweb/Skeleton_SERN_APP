import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import {
  Button,
  Form,
  Card,
  Row,
  Col,
  Container,
  Table,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import EditAudienceModal from "./EditAudienceModal";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-bs5";
import "datatables.net-select-bs5";
import "datatables.net-responsive-bs5";
import "datatables.net-buttons-bs5";
import "datatables.net-buttons/js/buttons.html5";
import JSZip from "jszip";
import pdfMake from "pdfmake/build/pdfmake";
const apiUrl = import.meta.env.VITE_API_URL;

window.JSZip = JSZip;
pdfMake.fonts = {
  Roboto: {
    normal:
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf",
    bold: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf",
    italics:
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf",
    bolditalics:
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf",
  },
};
DataTable.use(DT);

const ManageAudiences = () => {
  const [audiences, setAudiences] = useState([]);
  const [newRole, setNewRole] = useState({ role: "" });
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [tableInstance, setTableInstance] = useState(null);

  useEffect(() => {
    const fetchAudiences = async () => {
      try {
        const response = await axios.get(`${apiUrl}/admin/audiences`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAudiences(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate("/logout");
        } else {
          toast.error(
            error.response.data.message || "Fetching audiences list failed"
          );
        }
      }
    };

    fetchAudiences();
  }, []);

  useEffect(() => {
    // console.log("Audience passed to the table", audiences);
    const loadDataTable = async () => {
      const DataTable = (await import("datatables.net-bs5")).default;
      if (audiences.length > 0) {
        let table = new DataTable(tableRef.current, {
          data: audiences,
          columns: [
            {
              data: null,
              render: DataTable.render.select(),
            },
            {
              data: "role",
              render: (data, type, row) => {
                return data || "";
              },
            },
            {
              data: "isAdmin",
              render: (data, type, row) => {
                return data ? "Yes" : "No";
              },
            },
            {
              data: "active",
              render: (data, type, row) => {
                return data ? "Yes" : "No";
              },
            },
          ],
          columnDefs: [
            {
              orderable: false,
              render: DataTable.render.select(),
              targets: 0,
            },
          ],
          retrieve: true,
          select: {
            style: "os",
            selector: "td:first-child",
            headerCheckbox: false,
          },
          responsive: true,
          paging: true,
          order: [[1, "asc"]],
          layout: {
            top2Start: "buttons",
            topStart: "info",
            topEnd: {
              search: {
                placeholder: "Search",
              },
            },
            bottomStart: "pageLength",
            bottomEnd: "paging",
          },
          buttons: [
            {
              extend: "selected",
              text: "Edit",
              action: function (e, dt, node, config) {
                let data = dt.rows({ selected: true }).data()[0];
                if (data.role === "Admin") {
                  toast.error("Cannot be edited");
                } else {
                  handleEditClick(data);
                }
              },
            },
            "spacer",
            {
              extend: "excelHtml5",
              exportOptions: {
                columns: ":not(.notexport)",
              },
              init: function (api, node, config) {
                node.removeClass("btn-secondary");
                node.addClass("btn-primary");
              },
            },
            "spacer",
            {
              extend: "pdfHtml5",
              exportOptions: {
                columns: ":not(.notexport)",
              },
              init: function (api, node, config) {
                node.removeClass("btn-secondary");
                node.addClass("btn-info");
              },
            },
          ],
          initComplete: function () {
            const api = this.api();
            api.columns().every(function () {
              let column = this;
              let title = column.footer().textContent;
              if (title !== "") {
                const input = document.createElement("input");
                input.placeholder = title;
                input.className = "form-control";
                column.footer().replaceChildren(input);
                input.addEventListener("keyup", () => {
                  if (column.search() !== this.value) {
                    column.search(input.value).draw();
                  }
                });
              }
            });
          },
        });
        setTableInstance(table);
      }
    };
    loadDataTable();
  }, [audiences]);

  const handleCreateRoles = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${apiUrl}/admin/audiences`,
        { newRole },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setNewRole({ role: "" });
      toast.success(response.data.message);
      const audiences = await axios.get(`${apiUrl}/admin/audiences`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAudiences(audiences.data);
    } catch (error) {
      setNewRole({ role: "" });
      if (error.response.status === 401) {
        navigate("/logout");
      } else if (
        error.response.data.message.includes(
          "E11000 duplicate key error collection"
        )
      ) {
        toast.error("Audience with same role already exists");
      } else {
        toast.error(error.response.data.message || "Create audiences failed");
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
      const response = await axios.put(
        `${apiUrl}/admin/audiences/${updatedAudience._id}`,
        { updatedAudience },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      handleClose();
      const audiences = await axios.get(`${apiUrl}/admin/audiences`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAudiences(audiences.data);
      toast.success(response.data.message);
      if (tableInstance) {
        tableInstance.clear(); // Clear the table
        tableInstance.rows.add(audiences.data).draw(); // Add new rows and redraw the table
      }
    } catch (error) {
      handleClose();
      if (error.response && error.response.status === 401) {
        navigate("/logout");
      } else {
        const audiences = await axios.get(`${apiUrl}/admin/audiences`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setAudiences(audiences.data);
        toast.error(error.response.data.message || "Update audience failed");
        if (tableInstance) {
          tableInstance.clear(); // Clear the table
          tableInstance.rows.add(audiences.data).draw(); // Add new rows and redraw the table
        }
      }
    }
  };

  return (
    <Container>
      <Card className="mt-3">
        <Card.Header>Manage Audiences</Card.Header>
        <Card.Body>
          <Form onSubmit={handleCreateRoles}>
            <Row md={12}>
              <Col md={4}>
                <Form.Label htmlFor="audience">
                  Audience <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  id="audience"
                  placeholder="audience"
                  autoFocus
                  value={newRole.role}
                  onChange={(e) =>
                    setNewRole({ ...newRole, role: e.target.value })
                  }
                  required
                />
              </Col>
            </Row>
            <Row className="mt-3" md={12}>
              <Col md={12}>
                <Button type="submit" className="custom-btn">
                  Create Audience
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      <Card className="mt-3">
        <Card.Header>Audiences List</Card.Header>
        <Card.Body>
          <table
            ref={tableRef}
            className="display table table-sm table-bordered"
            style={{ width: "100%" }}
          >
            <thead>
              <tr>
                <th className="notexport"></th>
                <th>Audience</th>
                <th>Admin</th>
                <th>Active</th>
              </tr>
            </thead>
            <tfoot>
              <tr>
                <th></th>
                <th>Audience</th>
                <th>Admin</th>
                <th>Active</th>
              </tr>
            </tfoot>
            <tbody></tbody>
          </table>
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
