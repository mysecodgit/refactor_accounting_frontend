import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import TableContainer from "../../components/Common/TableContainer";
import Spinners from "../../components/Common/Spinner";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  Label,
  FormFeedback,
  Input,
  Form,
  Button,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import DeleteModal from "/src/components/Common/DeleteModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";

const Users = () => {
  document.title = "Users";

  const [user, setUser] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModelOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [users, setUsers] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [assignBuildingModal, setAssignBuildingModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [assignRoleModal, setAssignRoleModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [userBuildingRoles, setUserBuildingRoles] = useState([]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: (user && user.id) || "",
      name: (user && user.name) || "",
      username: (user && user.username) || "",
      phone: (user && user.phone) || "",
      password: (user && user.password) || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please Enter Name"),
      username: Yup.string().required("Please Enter Username"),
      phone: Yup.string().required("Please Enter Phone"),
      password: Yup.string().required("Please Enter Password"),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          const { data } = await axiosInstance.put(
            `v1/users/${values.id}`,
            { 
              name: values.name,
              username: values.username,
              phone: values.phone,
              password: values.password
            }
          );
          toast.success("User updated successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchUsers();
        } else {
          const { data } = await axiosInstance.post("v1/users", {
            name: values.name,
            username: values.username,
            phone: values.phone,
            password: values.password,
          });
          toast.success("User created successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchUsers();
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
      }
    },
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("v1/users");
      setUsers(data.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch users");
      console.log("Error ", error);
    }
  };

  const fetchBuildings = async () => {
    try {
      const { data } = await axiosInstance.get("v1/buildings");
      setBuildings(data.data || []);
    } catch (error) {
      console.log("Error fetching buildings", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await axiosInstance.get("v1/roles");
      setRoles(data.data || []);
    } catch (error) {
      console.log("Error fetching roles", error);
    }
  };

  const fetchUserBuildingRoles = async (userId, buildingId) => {
    try {
      const { data } = await axiosInstance.get(
        `v1/users/${userId}/buildings/${buildingId}/roles`
      );
      setUserBuildingRoles(data.data || []);
    } catch (error) {
      console.log("Error fetching user building roles", error);
      setUserBuildingRoles([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBuildings();
    fetchRoles();
  }, []);

  const onDeleteUser = async () => {
    try {
      await axiosInstance.delete("v1/users/" + user.id);
      toast.success("User deleted successfully");
      setDeleteModal(false);
      fetchUsers();
    } catch (err) {
      toast.error("Failed to delete user");
      console.log(err);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Name",
        accessorKey: "name",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Username",
        accessorKey: "username",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Phone",
        accessorKey: "phone",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Buildings & Roles",
        accessorKey: "buildings",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (cell) => {
          const buildings = cell.row.original.buildings || [];
          if (buildings.length === 0) {
            return <span className="text-muted">No buildings assigned</span>;
          }
          return (
            <div>
              {buildings.map((building, idx) => (
                <div key={building.id} className="mb-2">
                  <div className="d-flex align-items-center mb-1">
                    <span className="badge bg-primary me-1">{building.name}</span>
                    {building.roles && building.roles.length > 0 && (
                      <div className="d-flex flex-wrap gap-1">
                        {building.roles.map((role) => (
                          <span key={role.id} className="badge bg-info">
                            {role.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        },
      },
      {
        header: "Action",
        cell: (cellProps) => {
          return (
            <div className="d-flex gap-3">
              <Link
                to="#"
                className="text-success"
                onClick={() => {
                  setIsEdit(true);
                  const userData = cellProps.row.original;
                  setUser(userData);
                  setIsNewModelOpen(true);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-info"
                onClick={() => {
                  const userData = cellProps.row.original;
                  setSelectedUser(userData);
                  setAssignBuildingModal(true);
                }}
                title="Assign Buildings"
              >
                <i className="mdi mdi-office-building font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-warning"
                onClick={() => {
                  const userData = cellProps.row.original;
                  setSelectedUser(userData);
                  // Show building selection first
                  if (userData.buildings && userData.buildings.length > 0) {
                    // If user has buildings, show a prompt or use first building
                    setSelectedBuilding(userData.buildings[0]);
                    fetchUserBuildingRoles(userData.id, userData.buildings[0].id);
                    setAssignRoleModal(true);
                  } else {
                    toast.info("Please assign buildings to this user first");
                  }
                }}
                title="Assign Roles"
              >
                <i className="mdi mdi-shield-account font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const userData = cellProps.row.original;
                  setUser(userData);
                  setDeleteModal(true);
                }}
              >
                <i className="mdi mdi-delete font-size-18" />
              </Link>
            </div>
          );
        },
      },
    ],
    []
  );

  const handleAssignBuilding = async (buildingId) => {
    try {
      await axiosInstance.post(`v1/users/${selectedUser.id}/buildings`, {
        building_id: buildingId,
      });
      toast.success("Building assigned successfully");
      fetchUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to assign building";
      toast.error(errorMsg);
    }
  };

  const handleUnassignBuilding = async (buildingId) => {
    try {
      await axiosInstance.delete(`v1/users/${selectedUser.id}/buildings/${buildingId}`);
      toast.success("Building unassigned successfully");
      fetchUsers();
      // Refresh selected user data
      const { data } = await axiosInstance.get(`v1/users/${selectedUser.id}`);
      setSelectedUser(data.data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to unassign building";
      toast.error(errorMsg);
    }
  };

  return (
    <React.Fragment>
      <DeleteModal
        show={deleteModal}
        warningText={"Are you sure to delete this user "}
        boldText={user?.name}
        onDeleteClick={() => onDeleteUser()}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Users" breadcrumbItem="Users" />
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={users || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={() => {
                        setIsEdit(false);
                        setUser("");
                        setIsNewModelOpen(!isNewModalOpen);
                      }}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="New User"
                      tableClass="align-middle table-nowrap table-hover dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                      theadClass="table-light"
                      paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                      pagination="pagination"
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
          <Modal
            isOpen={isNewModalOpen}
            toggle={() => setIsNewModelOpen(!isNewModalOpen)}
            size="lg"
          >
            <ModalHeader
              toggle={() => setIsNewModelOpen(!isNewModalOpen)}
              tag="h4"
            >
              {!!isEdit ? "Edit User" : "Add User"}
            </ModalHeader>
            <ModalBody>
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  validation.handleSubmit();
                  return false;
                }}
              >
                <Row>
                  <Col xs={12}>
                    <div className="mb-3">
                      <Label>Name</Label>
                      <Input
                        name="name"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.name || ""}
                        invalid={
                          validation.touched.name && validation.errors.name
                            ? true
                            : false
                        }
                      />
                      {validation.touched.name && validation.errors.name ? (
                        <FormFeedback type="invalid">
                          {validation.errors.name}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Username</Label>
                      <Input
                        name="username"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.username || ""}
                        invalid={
                          validation.touched.username && validation.errors.username
                            ? true
                            : false
                        }
                      />
                      {validation.touched.username && validation.errors.username ? (
                        <FormFeedback type="invalid">
                          {validation.errors.username}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Phone</Label>
                      <Input
                        name="phone"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.phone || ""}
                        invalid={
                          validation.touched.phone && validation.errors.phone
                            ? true
                            : false
                        }
                      />
                      {validation.touched.phone && validation.errors.phone ? (
                        <FormFeedback type="invalid">
                          {validation.errors.phone}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Password</Label>
                      <Input
                        name="password"
                        type="password"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.password || ""}
                        invalid={
                          validation.touched.password && validation.errors.password
                            ? true
                            : false
                        }
                      />
                      {validation.touched.password && validation.errors.password ? (
                        <FormFeedback type="invalid">
                          {validation.errors.password}
                        </FormFeedback>
                      ) : null}
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      <Button
                        type="submit"
                        color="success"
                        className="save-user"
                      >
                        {!!isEdit ? "Update User" : "Add User"}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </ModalBody>
          </Modal>
          <Modal
            isOpen={assignBuildingModal}
            toggle={() => {
              setAssignBuildingModal(!assignBuildingModal);
              setSelectedUser(null);
            }}
            size="lg"
          >
            <ModalHeader
              toggle={() => {
                setAssignBuildingModal(!assignBuildingModal);
                setSelectedUser(null);
              }}
              tag="h4"
            >
              Assign Buildings - {selectedUser?.name}
            </ModalHeader>
            <ModalBody>
              <div className="mb-3">
                <Label>Available Buildings</Label>
                <div className="mt-2">
                  {buildings.map((building) => {
                    const isAssigned =
                      selectedUser?.buildings?.some(
                        (b) => b.id === building.id
                      ) || false;
                    return (
                      <div
                        key={building.id}
                        className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                      >
                        <span>{building.name}</span>
                        {isAssigned ? (
                          <Button
                            color="danger"
                            size="sm"
                            onClick={() => handleUnassignBuilding(building.id)}
                          >
                            Unassign
                          </Button>
                        ) : (
                          <Button
                            color="success"
                            size="sm"
                            onClick={() => handleAssignBuilding(building.id)}
                          >
                            Assign
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </ModalBody>
          </Modal>
          <Modal
            isOpen={assignRoleModal}
            toggle={() => {
              setAssignRoleModal(!assignRoleModal);
              setSelectedUser(null);
              setSelectedBuilding(null);
              setUserBuildingRoles([]);
            }}
            size="lg"
          >
            <ModalHeader
              toggle={() => {
                setAssignRoleModal(!assignRoleModal);
                setSelectedUser(null);
                setSelectedBuilding(null);
                setUserBuildingRoles([]);
              }}
              tag="h4"
            >
              Assign Role - {selectedUser?.name} {selectedBuilding && `(${selectedBuilding.name})`}
            </ModalHeader>
            <ModalBody>
              {selectedUser?.buildings && selectedUser.buildings.length > 1 && (
                <div className="mb-3">
                  <Label>Select Building</Label>
                  <Input
                    type="select"
                    value={selectedBuilding?.id || ""}
                    onChange={(e) => {
                      const buildingId = parseInt(e.target.value);
                      const building = selectedUser.buildings.find(
                        (b) => b.id === buildingId
                      );
                      setSelectedBuilding(building);
                      fetchUserBuildingRoles(selectedUser.id, buildingId);
                    }}
                  >
                    <option value="">Select Building</option>
                    {selectedUser.buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))}
                  </Input>
                </div>
              )}
              {selectedBuilding && (
                <div className="mb-3">
                  <Label>Available Roles</Label>
                  <div className="mt-2">
                    {roles.map((role) => {
                      const isAssigned = userBuildingRoles.some(
                        (r) => r.id === role.id
                      );
                      return (
                        <div
                          key={role.id}
                          className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                        >
                          <span>{role.name}</span>
                          {isAssigned ? (
                            <Button
                              color="danger"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await axiosInstance.delete(
                                    `v1/users/${selectedUser.id}/buildings/${selectedBuilding.id}/roles/${role.id}`
                                  );
                                  toast.success("Role unassigned successfully");
                                  fetchUserBuildingRoles(
                                    selectedUser.id,
                                    selectedBuilding.id
                                  );
                                  fetchUsers();
                                } catch (err) {
                                  const errorMsg =
                                    err.response?.data?.error ||
                                    "Failed to unassign role";
                                  toast.error(errorMsg);
                                }
                              }}
                            >
                              Unassign
                            </Button>
                          ) : (
                            <Button
                              color="success"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await axiosInstance.post(
                                    `v1/users/${selectedUser.id}/buildings/${selectedBuilding.id}/roles`,
                                    {
                                      role_id: role.id,
                                    }
                                  );
                                  toast.success("Role assigned successfully");
                                  fetchUserBuildingRoles(
                                    selectedUser.id,
                                    selectedBuilding.id
                                  );
                                  fetchUsers();
                                } catch (err) {
                                  const errorMsg =
                                    err.response?.data?.error ||
                                    "Failed to assign role";
                                  toast.error(errorMsg);
                                }
                              }}
                            >
                              Assign
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </ModalBody>
          </Modal>
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default Users;

