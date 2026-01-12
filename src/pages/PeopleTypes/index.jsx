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

const PeopleTypes = () => {
  document.title = "People Types";

  const [peopleType, setPeopleType] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModelOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [peopleTypes, setPeopleTypes] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: (peopleType && peopleType.id) || "",
      title: (peopleType && peopleType.title) || "",
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Please Enter Title"),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          const { data } = await axiosInstance.put(
            `people-types/${values.id}`,
            { title: values.title }
          );
          toast.success("People Type updated successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchPeopleTypes();
        } else {
          const { data } = await axiosInstance.post("people-types", {
            title: values.title,
          });
          toast.success("People Type created successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchPeopleTypes();
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
      }
    },
  });

  const fetchPeopleTypes = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("people-types");
      setPeopleTypes(data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch people types");
      console.log("Error ", error);
    }
  };

  useEffect(() => {
    fetchPeopleTypes();
  }, []);

  const onDeletePeopleType = async () => {
    try {
      await axiosInstance.delete(`people-types/${peopleType.id}`);
      toast.success("People Type deleted successfully");
      setDeleteModal(false);
      fetchPeopleTypes();
    } catch (err) {
      toast.error("Failed to delete people type");
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
        header: "Title",
        accessorKey: "title",
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
                  const peopleTypeData = cellProps.row.original;
                  setPeopleType(peopleTypeData);
                  setIsNewModelOpen(true);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const peopleTypeData = cellProps.row.original;
                  setPeopleType(peopleTypeData);
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
        warningText={"Are you sure to delete this people type "}
        boldText={peopleType?.title}
        onDeleteClick={() => onDeletePeopleType()}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="People Types" breadcrumbItem="People Types" />
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={peopleTypes || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={() => {
                        setIsEdit(false);
                        setPeopleType("");
                        setIsNewModelOpen(!isNewModalOpen);
                      }}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="New People Type"
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
          >
            <ModalHeader
              toggle={() => setIsNewModelOpen(!isNewModalOpen)}
              tag="h4"
            >
              {!!isEdit ? "Edit People Type" : "Add People Type"}
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
                      <Label>Title</Label>
                      <Input
                        name="title"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.title || ""}
                        invalid={
                          validation.touched.title && validation.errors.title
                            ? true
                            : false
                        }
                      />
                      {validation.touched.title && validation.errors.title ? (
                        <FormFeedback type="invalid">
                          {validation.errors.title}
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
                        {!!isEdit ? "Update People Type" : "Add People Type"}
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

export default PeopleTypes;

