import React, { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import moment from "moment";
import Select from "react-select";
import {
  Button,
  Form,
  Card,
  Row,
  Col,
  Table,
  Container,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import EditUserModal from "./EditUserModal";
// import { AgGridReact } from "ag-grid-react";
// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-select-dt";
import "datatables.net-responsive-dt";
import "datatables.net-buttons-dt";
const apiUrl = import.meta.env.VITE_API_URL;

DataTable.use(DT);

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [audiences, setAudiences] = useState([]);
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    audience: "",
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const userId = JSON.parse(localStorage.getItem("userData")).id;

  let options = [];
  audiences.map((audience) =>
    options.push({ value: audience._id, label: audience.role })
  );
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
            error.response.data.message || "Fetching User List failed"
          );
        }
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${apiUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        console.log("Users fetched from the backend", response.data);
        setUsers(response.data);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          navigate("/logout");
        } else {
          toast.error(
            error.response.data.message || "Fetching User List failed"
          );
        }
      }
    };

    fetchAudiences();
    fetchUsers();
  }, []);

  useEffect(() => {
    // console.log("users", users);
    const loadDataTable = async () => {
      const DataTable = (await import("datatables.net")).default;
      if (users.length > 0) {
        let table = new DataTable(tableRef.current, {
          data: users,
          columns: [
            {
              data: null,
              render: DT.render.select(),
            },
            {
              data: null,
              render: (data, type, row) => {
                const { firstName, lastName } = row.contact || {};
                return `${firstName || ""} ${lastName || ""}`.trim();
              },
            },
            {
              data: null,
              render: (data, type, row) => {
                return row.contact?.email || "";
              },
            },
            {
              data: "lastLogin",
              render: DT.render.datetime(),
            },
            {
              data: "isMfaEnabled",
              render: (data, type, row) => {
                return data ? "Yes" : "No";
              },
            },
            {
              data: "isActive",
              render: (data, type, row) => {
                return data ? "Yes" : "No";
              },
            },
            {
              data: "audience.role",
              render: (data, type, row) => {
                return data || "";
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
                handleEditClick(data);
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
  }, [users]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${apiUrl}/admin/users`,
        { newUser },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setNewUser({ firstName: "", lastName: "", email: "", audience: "" });
      setSelectedAudience(null);
      const users = await axios.get(`${apiUrl}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(users.data);
      toast.success(response.data.message);
    } catch (error) {
      if (error.response.status === 401) {
        navigate("/logout");
      } else if (
        error.response.data.message.includes(
          "E11000 duplicate key error collection"
        )
      ) {
        toast.error("User with same email already exists");
      } else {
        toast.error(error.response.data.message || "Create user failed");
      }
    }
  };

  const handleAudienceChange = (e) => {
    if (e) {
      setSelectedAudience({ value: e.value, label: e.label });
      setNewUser({ ...newUser, audience: e.value });
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  const handleUpdateUser = async (updatedUser) => {
    try {
      const response = await axios.put(
        `${apiUrl}/admin/users/${updatedUser._id}`,
        { updatedUser },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      handleClose();
      toast.success(response.data.message);
      if (updatedUser._id === userId) {
        navigate("/logout");
      } else {
        const users = await axios.get(`${apiUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUsers(users.data);
        if (tableInstance) {
          tableInstance.clear();
          tableInstance.rows.add(users.data).draw();
        }
      }
    } catch (error) {
      handleClose();
      if (error.response && error.response.status === 401) {
        navigate("/logout");
      } else {
        const users = await axios.get(`${apiUrl}/admin/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setUsers(users.data);
        toast.error(error.response.data.message || "Update user failed");
        if (tableInstance) {
          tableInstance.clear();
          tableInstance.rows.add(users.data).draw();
        }
      }
    }
  };

  // const colDefs = useMemo(() => {
  //   return [
  //     {
  //       field: "username",
  //       headerName: "Username",
  //       valueGetter: (params) =>
  //         `${params.data.contact.firstName} ${params.data.contact.lastName}`,
  //     },
  //     {
  //       field: "contact.email",
  //       headerName: "Email",
  //       valueGetter: (params) => params.data.contact.email,
  //     },
  //     {
  //       field: "lastLogin",
  //       headerName: "Last Login",
  //       valueFormatter: (params) =>
  //         params.value
  //           ? moment(params.value).format("MM/DD/YYYY h:mm:ss a")
  //           : "N/A",
  //       filter: "agDateColumnFilter",
  //     },
  //     {
  //       field: "isMfaEnabled",
  //       headerName: "MFA Enabled",
  //       cellRenderer: (params) => (params.value ? "Yes" : "No"),
  //       filter: false,
  //     },
  //     {
  //       field: "isActive",
  //       headerName: "Active Status",
  //       cellRenderer: (params) => (params.value ? "Yes" : "No"),
  //     },
  //     {
  //       field: "audience.role",
  //       headerName: "Role",
  //       valueGetter: (params) => params.data.audience.role,
  //     },
  //     {
  //       field: "actions",
  //       cellRenderer: (props) => {
  //         return (
  //           <Button
  //             className="custom-btn mb-3"
  //             onClick={() => handleEditClick(props.data)}
  //           >
  //             Edit
  //           </Button>
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
  //     floatingFilter: true,
  //     autoHeight: true,
  //     resizable: true,
  //   };
  // }, []);

  return (
    <Container>
      <Card className="mt-3">
        <Card.Header>Manage Users</Card.Header>
        <Card.Body>
          <Form onSubmit={handleCreateUser}>
            <Row className="mt-3" md={12}>
              <Col md={3}>
                <Form.Label htmlFor="firstName">First Name</Form.Label>
                <Form.Control
                  type="text"
                  id="firstName"
                  placeholder="First Name"
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, firstName: e.target.value })
                  }
                  autoComplete="on"
                  required
                />
              </Col>
              <Col md={3}>
                <Form.Label htmlFor="lastName">Last Name</Form.Label>
                <Form.Control
                  type="text"
                  id="lastName"
                  placeholder="Last Name"
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                  autoComplete="on"
                  required
                />
              </Col>
              <Col md={3}>
                <Form.Label htmlFor="email">Email</Form.Label>
                <Form.Control
                  type="email"
                  id="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  autoComplete="on"
                  required
                />
              </Col>
              <Col md={3}>
                <Form.Label htmlFor="audience">Audience</Form.Label>
                <Select
                  inputId="audience"
                  defaultValue={selectedAudience}
                  onChange={handleAudienceChange}
                  options={options}
                  placeholder="Select audience..."
                  autoFocus
                  isSearchable
                  isClearable
                  required
                />
              </Col>
            </Row>
            <Row className="text-center mt-3" md={12}>
              <Col md={12}>
                <Button type="submit" className="custom-btn">
                  Create User
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      <Card className="mt-3">
        <Card.Header>Users List</Card.Header>
        <Card.Body>
          <table
            ref={tableRef}
            className="display table table-sm table-bordered"
            style={{ width: "100%" }}
          >
            <thead>
              <tr>
                <th></th>
                <th>User Name</th>
                <th>Email</th>
                <th>Last Login</th>
                <th>MFA Enable</th>
                <th>Active</th>
                <th>Audience</th>
              </tr>
            </thead>
            <tfoot>
              <tr>
                <th></th>
                <th>User Name</th>
                <th>Email</th>
                <th>Last Login</th>
                <th>MFA Enable</th>
                <th>Active</th>
                <th>Audience</th>
              </tr>
            </tfoot>
            <tbody></tbody>
          </table>
        </Card.Body>
      </Card>
      {selectedUser && (
        <EditUserModal
          show={showModal}
          user={selectedUser}
          audiences={audiences}
          handleClose={handleClose}
          handleSave={handleUpdateUser}
        />
      )}
    </Container>
  );
};

export default ManageUsers;
