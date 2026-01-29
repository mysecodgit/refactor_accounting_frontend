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

const Permissions = () => {
  document.title = "Permissions";

  const [permission, setPermission] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModelOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: (permission && permission.id) || "",
      module: (permission && permission.module) || "",
      action: (permission && permission.action) || "",
      key: (permission && permission.key) || "",
    },
    validationSchema: Yup.object({
      module: Yup.string().required("Please Enter Module"),
      action: Yup.string().required("Please Enter Action"),
      key: Yup.string().required("Please Enter Key"),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          const { data } = await axiosInstance.put(
            `v1/permissions/${values.id}`,
            {
              module: values.module,
              action: values.action,
              key: values.key,
            }
          );
          toast.success("Permission updated successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchPermissions();
        } else {
          const { data } = await axiosInstance.post("v1/permissions", {
            module: values.module,
            action: values.action,
            key: values.key,
          });
          toast.success("Permission created successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchPermissions();
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

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("v1/permissions");
      setPermissions(data.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch permissions");
      console.log("Error ", error);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const onDeletePermission = async () => {
    try {
      await axiosInstance.delete("v1/permissions/" + permission.id);
      toast.success("Permission deleted successfully");
      setDeleteModal(false);
      fetchPermissions();
    } catch (err) {
      toast.error("Failed to delete permission");
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
        header: "Module",
        accessorKey: "module",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Action",
        accessorKey: "action",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Key",
        accessorKey: "key",
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
                  const permissionData = cellProps.row.original;
                  setPermission(permissionData);
                  setIsNewModelOpen(true);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const permissionData = cellProps.row.original;
                  setPermission(permissionData);
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
        warningText={"Are you sure to delete this permission "}
        boldText={permission?.key}
        onDeleteClick={() => onDeletePermission()}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Permissions" breadcrumbItem="Permissions" />
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={permissions || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={() => {
                        setIsEdit(false);
                        setPermission("");
                        setIsNewModelOpen(!isNewModalOpen);
                      }}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="New Permission"
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
              {!!isEdit ? "Edit Permission" : "Add Permission"}
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
                      <Label>Module</Label>
                      <Input
                        name="module"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.module || ""}
                        invalid={
                          validation.touched.module && validation.errors.module
                            ? true
                            : false
                        }
                      />
                      {validation.touched.module && validation.errors.module ? (
                        <FormFeedback type="invalid">
                          {validation.errors.module}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Action</Label>
                      <Input
                        name="action"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.action || ""}
                        invalid={
                          validation.touched.action && validation.errors.action
                            ? true
                            : false
                        }
                      />
                      {validation.touched.action && validation.errors.action ? (
                        <FormFeedback type="invalid">
                          {validation.errors.action}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Key</Label>
                      <Input
                        name="key"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.key || ""}
                        invalid={
                          validation.touched.key && validation.errors.key
                            ? true
                            : false
                        }
                      />
                      {validation.touched.key && validation.errors.key ? (
                        <FormFeedback type="invalid">
                          {validation.errors.key}
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
                        className="save-permission"
                      >
                        {!!isEdit ? "Update Permission" : "Add Permission"}
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

export default Permissions;
