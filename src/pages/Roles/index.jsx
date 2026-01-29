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
  Badge,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import DeleteModal from "/src/components/Common/DeleteModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";

const Roles = () => {
  document.title = "Roles";

  const [role, setRole] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [roles, setRoles] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [permissionsModal, setPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: (role && role.id) || "",
      name: (role && role.name) || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please Enter Role Name"),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          const { data } = await axiosInstance.put(`v1/roles/${values.id}`, {
            name: values.name,
          });
          toast.success("Role updated successfully");
          validation.resetForm();
          setIsNewModalOpen(false);
          fetchRoles();
        } else {
          const { data } = await axiosInstance.post("v1/roles", {
            name: values.name,
          });
          toast.success("Role created successfully");
          validation.resetForm();
          setIsNewModalOpen(false);
          fetchRoles();
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.error ||
          err.response?.data?.errors ||
          "Something went wrong";
        toast.error(
          typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg
        );
      }
    },
  });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("v1/roles");
      setRoles(data.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch roles");
      console.log("Error ", error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data } = await axiosInstance.get("v1/permissions");
      setAllPermissions(data.data || []);
    } catch (error) {
      console.log("Error fetching permissions", error);
    }
  };

  const fetchRolePermissions = async (roleId) => {
    try {
      const { data } = await axiosInstance.get(`v1/roles/${roleId}/permissions`);
      setRolePermissions(data.data || []);
    } catch (error) {
      console.log("Error fetching role permissions", error);
      setRolePermissions([]);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const onDeleteRole = async () => {
    try {
      await axiosInstance.delete("v1/roles/" + role.id);
      toast.success("Role deleted successfully");
      setDeleteModal(false);
      fetchRoles();
    } catch (err) {
      toast.error("Failed to delete role");
      console.log(err);
    }
  };

  const handleOpenPermissionsModal = async (roleData) => {
    setSelectedRole(roleData);
    setPermissionsModal(true);
    await fetchRolePermissions(roleData.id);
  };

  const handleTogglePermission = async (permissionId) => {
    const isAssigned = rolePermissions.some((p) => p.id === permissionId);

    try {
      if (isAssigned) {
        await axiosInstance.delete(
          `v1/roles/${selectedRole.id}/permissions/${permissionId}`
        );
        toast.success("Permission unassigned successfully");
      } else {
        await axiosInstance.post(`v1/roles/${selectedRole.id}/permissions`, {
          permission_id: permissionId,
        });
        toast.success("Permission assigned successfully");
      }
      await fetchRolePermissions(selectedRole.id);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to update permission";
      toast.error(errorMsg);
    }
  };

  const handleToggleModulePermissions = async (modulePermissions) => {
    const modulePermissionIds = modulePermissions.map((p) => p.id);
    const allAssigned = modulePermissionIds.every((id) =>
      rolePermissions.some((p) => p.id === id)
    );

    try {
      if (allAssigned) {
        // Remove all permissions in this module
        const removePromises = modulePermissionIds.map((id) =>
          axiosInstance.delete(`v1/roles/${selectedRole.id}/permissions/${id}`)
        );
        await Promise.all(removePromises);
        toast.success(`All ${modulePermissions[0]?.module} permissions removed successfully`);
      } else {
        // Add all permissions in this module that aren't already assigned
        const toAdd = modulePermissionIds.filter(
          (id) => !rolePermissions.some((p) => p.id === id)
        );
        const addPromises = toAdd.map((id) =>
          axiosInstance.post(`v1/roles/${selectedRole.id}/permissions`, {
            permission_id: id,
          })
        );
        await Promise.all(addPromises);
        toast.success(`All ${modulePermissions[0]?.module} permissions added successfully`);
      }
      await fetchRolePermissions(selectedRole.id);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Failed to update permissions";
      toast.error(errorMsg);
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
        header: "Created At",
        accessorKey: "created_at",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return new Date(cell.getValue()).toLocaleDateString();
        },
      },
      {
        header: "Action",
        cell: (cellProps) => {
          return (
            <div className="d-flex gap-3">
              <Link
                to="#"
                className="text-info"
                onClick={() => handleOpenPermissionsModal(cellProps.row.original)}
                title="Manage Permissions"
              >
                <i className="mdi mdi-shield-key font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-success"
                onClick={() => {
                  setIsEdit(true);
                  const roleData = cellProps.row.original;
                  setRole(roleData);
                  setIsNewModalOpen(true);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const roleData = cellProps.row.original;
                  setRole(roleData);
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

  return (
    <React.Fragment>
      <DeleteModal
        show={deleteModal}
        warningText={"Are you sure to delete this role "}
        boldText={role?.name}
        onDeleteClick={() => onDeleteRole()}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Roles" breadcrumbItem="Roles" />
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={roles || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={() => {
                        setIsEdit(false);
                        setRole("");
                        setIsNewModalOpen(!isNewModalOpen);
                      }}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="New Role"
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
            toggle={() => setIsNewModalOpen(!isNewModalOpen)}
            size="lg"
          >
            <ModalHeader
              toggle={() => setIsNewModalOpen(!isNewModalOpen)}
              tag="h4"
            >
              {!!isEdit ? "Edit Role" : "Add Role"}
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
                      <Label>Role Name</Label>
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
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <div className="text-end">
                      <Button
                        type="submit"
                        color="success"
                        className="save-role"
                      >
                        {!!isEdit ? "Update Role" : "Add Role"}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </ModalBody>
          </Modal>
          <Modal
            isOpen={permissionsModal}
            toggle={() => {
              setPermissionsModal(!permissionsModal);
              setSelectedRole(null);
              setRolePermissions([]);
            }}
            size="xl"
          >
            <ModalHeader
              toggle={() => {
                setPermissionsModal(!permissionsModal);
                setSelectedRole(null);
                setRolePermissions([]);
              }}
              tag="h4"
            >
              Manage Permissions - {selectedRole?.name}
            </ModalHeader>
            <ModalBody>
              <div className="mb-3">
                <Label>Available Permissions</Label>
                <div className="mt-2" style={{ maxHeight: "600px", overflowY: "auto" }}>
                  {(() => {
                    // Group permissions by module
                    const groupedByModule = {};
                    allPermissions.forEach((permission) => {
                      if (!groupedByModule[permission.module]) {
                        groupedByModule[permission.module] = [];
                      }
                      groupedByModule[permission.module].push(permission);
                    });

                    return Object.keys(groupedByModule).map((module) => {
                      const modulePermissions = groupedByModule[module];
                      const allAssigned = modulePermissions.every((p) =>
                        rolePermissions.some((rp) => rp.id === p.id)
                      );
                      const someAssigned = modulePermissions.some((p) =>
                        rolePermissions.some((rp) => rp.id === p.id)
                      );

                      return (
                        <div key={module} className="mb-3 border rounded p-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0">
                              <Badge color="primary" className="me-2">
                                {module}
                              </Badge>
                              Module
                              <span className="text-muted small ms-2">
                                ({modulePermissions.length} permissions)
                              </span>
                            </h6>
                            <div className="d-flex gap-2">
                              {allAssigned ? (
                                <Button
                                  color="danger"
                                  size="sm"
                                  onClick={() =>
                                    handleToggleModulePermissions(modulePermissions)
                                  }
                                >
                                  <i className="mdi mdi-minus-circle me-1"></i>
                                  Remove All
                                </Button>
                              ) : (
                                <Button
                                  color="success"
                                  size="sm"
                                  onClick={() =>
                                    handleToggleModulePermissions(modulePermissions)
                                  }
                                >
                                  <i className="mdi mdi-plus-circle me-1"></i>
                                  Add All
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="ms-3">
                            {modulePermissions.map((permission) => {
                              const isAssigned = rolePermissions.some(
                                (p) => p.id === permission.id
                              );
                              return (
                                <div
                                  key={permission.id}
                                  className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded bg-light"
                                >
                                  <div className="flex-grow-1">
                                    <strong className="d-block">{permission.action}</strong>
                                    <div className="text-muted small">{permission.key}</div>
                                  </div>
                                  <Button
                                    color={isAssigned ? "danger" : "success"}
                                    size="sm"
                                    onClick={() => handleTogglePermission(permission.id)}
                                    className="ms-2"
                                  >
                                    {isAssigned ? "Remove" : "Add"}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </ModalBody>
          </Modal>
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default Roles;
