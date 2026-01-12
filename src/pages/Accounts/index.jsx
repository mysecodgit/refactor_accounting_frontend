import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
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

const Accounts = () => {
  document.title = "Accounts";
  const { id: buildingId } = useParams();

  const [account, setAccount] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModelOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: (account && account.id) || "",
      account_number: (account && account.account_number) || "",
      account_name: (account && account.account_name) || "",
      account_type: (account && account.account_type) || "",
      building_id: (account && account.building_id) || (buildingId ? parseInt(buildingId) : ""),
      isDefault: (account && account.isDefault) || 0,
    },
    validationSchema: Yup.object({
      account_number: Yup.number().required("Please Enter Account Number").min(1, "Account number must be greater than 0"),
      account_name: Yup.string().required("Please Enter Account Name"),
      account_type: Yup.number().required("Please Select Account Type").min(1, "Please Select Account Type"),
      building_id: Yup.number().required("Please Select Building").min(1, "Please Select Building"),
      isDefault: Yup.number().oneOf([0, 1], "Must be 0 or 1"),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          let url = `accounts/${values.id}`;
          if (buildingId) {
            url = `v1/buildings/${buildingId}/accounts/${values.id}`;
          }
          const { data } = await axiosInstance.put(
            url,
            { 
              account_number: parseInt(values.account_number),
              account_name: values.account_name,
              account_type: parseInt(values.account_type),
              building_id: parseInt(values.building_id),
              isDefault: parseInt(values.isDefault)
            }
          );
          toast.success("Account updated successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchAccounts();
        } else {
          let url = "accounts";
          if (buildingId) {
            url = `v1/buildings/${buildingId}/accounts`;
          }
          const { data } = await axiosInstance.post(url, {
            account_number: parseInt(values.account_number),
            account_name: values.account_name,
            account_type: parseInt(values.account_type),
            building_id: parseInt(values.building_id),
            isDefault: parseInt(values.isDefault),
          });
          toast.success("Account created successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchAccounts();
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
      }
    },
  });

  const fetchBuildings = async () => {
    try {
      const { data } = await axiosInstance.get("v1/buildings");
      setBuildings(data.data || []);
    } catch (error) {
      console.log("Error fetching buildings", error);
    }
  };

  const fetchAccountTypes = async () => {
    try {
      const { data } = await axiosInstance.get("v1/account_types");
      setAccountTypes(data.data || []);
    } catch (error) {
      console.log("Error fetching account types", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      let url = "accounts";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch accounts");
      console.log("Error ", error);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchAccountTypes();
    fetchAccounts();
  }, [buildingId]);

  const onDeleteAccount = async () => {
    try {
      let url = `accounts/${account.id}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/accounts/${account.id}`;
      }
      await axiosInstance.delete(url);
      toast.success("Account deleted successfully");
      setDeleteModal(false);
      fetchAccounts();
    } catch (err) {
      toast.error("Failed to delete account");
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
        header: "Account Number",
        accessorKey: "account_number",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Account Name",
        accessorKey: "account_name",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Account Type",
        accessorKey: "type.typeName",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.type?.typeName || "N/A"}</>;
        },
      },
      // {
      //   header: "Building",
      //   accessorKey: "building.name",
      //   enableColumnFilter: false,
      //   enableSorting: true,
      //   cell: (cell) => {
      //     return <>{cell.row.original.building?.name || "N/A"}</>;
      //   },
      // },
      {
        header: "Is Default",
        accessorKey: "isDefault",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.isDefault === 1 ? "Yes" : "No"}</>;
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
                  const accountData = cellProps.row.original;
                  setAccount(accountData);
                  setIsNewModelOpen(true);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const accountData = cellProps.row.original;
                  setAccount(accountData);
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
        warningText={"Are you sure to delete this account "}
        boldText={account?.account_name}
        onDeleteClick={() => onDeleteAccount()}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Accounts" breadcrumbItem="Accounts" />
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={accounts || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={() => {
                        setIsEdit(false);
                        setAccount("");
                        setIsNewModelOpen(!isNewModalOpen);
                      }}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="New Account"
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
              {!!isEdit ? "Edit Account" : "Add Account"}
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
                      <Label>Account Number</Label>
                      <Input
                        name="account_number"
                        type="number"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.account_number || ""}
                        invalid={
                          validation.touched.account_number && validation.errors.account_number
                            ? true
                            : false
                        }
                      />
                      {validation.touched.account_number && validation.errors.account_number ? (
                        <FormFeedback type="invalid">
                          {validation.errors.account_number}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Account Name</Label>
                      <Input
                        name="account_name"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.account_name || ""}
                        invalid={
                          validation.touched.account_name && validation.errors.account_name
                            ? true
                            : false
                        }
                      />
                      {validation.touched.account_name && validation.errors.account_name ? (
                        <FormFeedback type="invalid">
                          {validation.errors.account_name}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Account Type</Label>
                      <Input
                        name="account_type"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.account_type || ""}
                        invalid={
                          validation.touched.account_type && validation.errors.account_type
                            ? true
                            : false
                        }
                      >
                        <option value="">Select Account Type</option>
                        {accountTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.typeName}
                          </option>
                        ))}
                      </Input>
                      {validation.touched.account_type && validation.errors.account_type ? (
                        <FormFeedback type="invalid">
                          {validation.errors.account_type}
                        </FormFeedback>
                      ) : null}
                    </div>
                    {!buildingId && (
                      <div className="mb-3">
                        <Label>Building</Label>
                        <Input
                          name="building_id"
                          type="select"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.building_id || ""}
                          invalid={
                            validation.touched.building_id && validation.errors.building_id
                              ? true
                              : false
                          }
                        >
                          <option value="">Select Building</option>
                          {buildings.map((building) => (
                            <option key={building.id} value={building.id}>
                              {building.name}
                            </option>
                          ))}
                        </Input>
                        {validation.touched.building_id && validation.errors.building_id ? (
                          <FormFeedback type="invalid">
                            {validation.errors.building_id}
                          </FormFeedback>
                        ) : null}
                      </div>
                    )}
                    <div className="mb-3">
                      <Label>Is Default</Label>
                      <Input
                        name="isDefault"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.isDefault || 0}
                        invalid={
                          validation.touched.isDefault && validation.errors.isDefault
                            ? true
                            : false
                        }
                      >
                        <option value={0}>No</option>
                        <option value={1}>Yes</option>
                      </Input>
                      {validation.touched.isDefault && validation.errors.isDefault ? (
                        <FormFeedback type="invalid">
                          {validation.errors.isDefault}
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
                        {!!isEdit ? "Update Account" : "Add Account"}
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

export default Accounts;

