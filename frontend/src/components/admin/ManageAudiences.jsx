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
import "datatables.net-select-dt";
import "datatables.net-responsive-dt";
import "datatables.net-buttons-dt";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
const apiUrl = import.meta.env.VITE_API_URL;

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
    console.log("Audience passed to the table", audiences);
    const loadDataTable = async () => {
      const DataTable = (await import("datatables.net")).default;
      if (audiences.length > 0) {
        let table = new DataTable(tableRef.current, {
          data: audiences,
          columns: [
            {
              data: null,
              render: DT.render.select(),
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
          retrieve: true,
          select: {
            style: "os",
            selector: "td:first-child",
          },
          responsive: true,
          paging: true,
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

  // const colDefs = useMemo(() => {
  //   return [
  //     { field: "role", headerName: "Role" },
  //     {
  //       field: "isAdmin",
  //       headerName: "Is Admin",
  //       cellRenderer: (params) => (params.data.role === "Admin" ? "Yes" : "No"),
  //       filter: false,
  //     },
  //     {
  //       field: "active",
  //       headerName: "Active Status",
  //       cellRenderer: (params) => (params.value ? "Yes" : "No"),
  //       filter: false,
  //     },
  //     {
  //       field: "actions",
  //       cellRenderer: (props) => {
  //         return !props.data.isAdmin ? (
  //           <Button
  //             className="custom-btn mb-3"
  //             onClick={() => handleEditClick(props.data)}
  //           >
  //             Edit
  //           </Button>
  //         ) : (
  //           <></>
  //         );
  //       },
  //       filter: false,
  //     },
  //   ];
  // });

  // const defaultColDef = useMemo(() => {
  //   return {
  //     filter: "agTextColumnFilter",
  //     floatingFilter: true,
  //   };
  // }, []);

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
                <th></th>
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
