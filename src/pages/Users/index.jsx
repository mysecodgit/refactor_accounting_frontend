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
            `users/${values.id}`,
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
          const { data } = await axiosInstance.post("users", {
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
      const { data } = await axiosInstance.get("users");
      setUsers(data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch users");
      console.log("Error ", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onDeleteUser = async () => {
    try {
      await axiosInstance.delete("users/" + user.id);
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
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default Users;

