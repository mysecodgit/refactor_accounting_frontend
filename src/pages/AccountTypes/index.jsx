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
import moment from "moment/moment";

const AccountTypes = () => {
  document.title = "Account Types";

  const [accountType, setAccountType] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModelOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [accountTypes, setAccountTypes] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: (accountType && accountType.id) || "",
      typeName: (accountType && accountType.typeName) || "",
      type: (accountType && accountType.type) || "",
      sub_type: (accountType && accountType.sub_type) || "",
      typeStatus: (accountType && accountType.typeStatus) || "",
    },
    validationSchema: Yup.object({
      typeName: Yup.string().required("Please Enter Type Name"),
      type: Yup.string().required("Please Enter Type"),
      sub_type: Yup.string().required("Please Enter Sub Type"),
      typeStatus: Yup.string().required("Please Enter Type Status"),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          const { data } = await axiosInstance.put(
            `account-types/${values.id}`,
            { 
              typeName: values.typeName,
              type: values.type,
              sub_type: values.sub_type,
              typeStatus: values.typeStatus
            }
          );
          toast.success("Account Type updated successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchAccountTypes();
        } else {
          const { data } = await axiosInstance.post("account-types", {
            typeName: values.typeName,
            type: values.type,
            sub_type: values.sub_type,
            typeStatus: values.typeStatus,
          });
          toast.success("Account Type created successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchAccountTypes();
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
      }
    },
  });

  const fetchAccountTypes = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("account-types");
      setAccountTypes(data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch account types");
      console.log("Error ", error);
    }
  };

  useEffect(() => {
    fetchAccountTypes();
  }, []);

  const onDeleteAccountType = async () => {
    try {
      await axiosInstance.delete("account-types/" + accountType.id);
      toast.success("Account Type deleted successfully");
      setDeleteModal(false);
      fetchAccountTypes();
    } catch (err) {
      toast.error("Failed to delete account type");
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
        header: "Type Name",
        accessorKey: "typeName",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Type",
        accessorKey: "type",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Sub Type",
        accessorKey: "sub_type",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Status",
        accessorKey: "typeStatus",
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
                  const accountTypeData = cellProps.row.original;
                  setAccountType(accountTypeData);
                  setIsNewModelOpen(true);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const accountTypeData = cellProps.row.original;
                  setAccountType(accountTypeData);
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
        warningText={"Are you sure to delete this account type "}
        boldText={accountType?.typeName}
        onDeleteClick={() => onDeleteAccountType()}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Account Types" breadcrumbItem="Account Types" />
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={accountTypes || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={() => {
                        setIsEdit(false);
                        setAccountType("");
                        setIsNewModelOpen(!isNewModalOpen);
                      }}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="New Account Type"
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
              {!!isEdit ? "Edit Account Type" : "Add Account Type"}
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
                      <Label>Type Name</Label>
                      <Input
                        name="typeName"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.typeName || ""}
                        invalid={
                          validation.touched.typeName && validation.errors.typeName
                            ? true
                            : false
                        }
                      />
                      {validation.touched.typeName && validation.errors.typeName ? (
                        <FormFeedback type="invalid">
                          {validation.errors.typeName}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Type</Label>
                      <Input
                        name="type"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.type || ""}
                        invalid={
                          validation.touched.type && validation.errors.type
                            ? true
                            : false
                        }
                      />
                      {validation.touched.type && validation.errors.type ? (
                        <FormFeedback type="invalid">
                          {validation.errors.type}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Sub Type</Label>
                      <Input
                        name="sub_type"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.sub_type || ""}
                        invalid={
                          validation.touched.sub_type && validation.errors.sub_type
                            ? true
                            : false
                        }
                      />
                      {validation.touched.sub_type && validation.errors.sub_type ? (
                        <FormFeedback type="invalid">
                          {validation.errors.sub_type}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Type Status</Label>
                      <Input
                        name="typeStatus"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.typeStatus || ""}
                        invalid={
                          validation.touched.typeStatus && validation.errors.typeStatus
                            ? true
                            : false
                        }
                      />
                      {validation.touched.typeStatus && validation.errors.typeStatus ? (
                        <FormFeedback type="invalid">
                          {validation.errors.typeStatus}
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
                        {!!isEdit ? "Update Account Type" : "Add Account Type"}
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

export default AccountTypes;

