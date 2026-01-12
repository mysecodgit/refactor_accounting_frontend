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

const Periods = () => {
  document.title = "Periods";
  const { id: buildingId } = useParams();

  const [period, setPeriod] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModelOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [periods, setPeriods] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: (period && period.id) || "",
      period_name: (period && period.period_name) || "",
      start: (period && period.start) || "",
      end: (period && period.end) || "",
      building_id: (period && period.building_id) || (buildingId ? parseInt(buildingId) : ""),
      is_closed: (period && period.is_closed) || 0,
    },
    validationSchema: Yup.object({
      period_name: Yup.string().required("Please Enter Period Name"),
      start: Yup.string().required("Please Enter Start Date"),
      end: Yup.string().required("Please Enter End Date"),
      building_id: Yup.number().required("Please Select Building").min(1, "Please Select Building"),
      is_closed: Yup.number().oneOf([0, 1], "Must be 0 or 1"),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          let url = `periods/${values.id}`;
          if (buildingId) {
            url = `buildings/${buildingId}/periods/${values.id}`;
          }
          const { data } = await axiosInstance.put(
            url,
            { 
              period_name: values.period_name,
              start: values.start,
              end: values.end,
              building_id: parseInt(values.building_id),
              is_closed: parseInt(values.is_closed)
            }
          );
          toast.success("Period updated successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchPeriods();
        } else {
          let url = "periods";
          if (buildingId) {
            url = `buildings/${buildingId}/periods`;
          }
          const { data } = await axiosInstance.post(url, {
            period_name: values.period_name,
            start: values.start,
            end: values.end,
            building_id: parseInt(values.building_id),
            is_closed: parseInt(values.is_closed),
          });
          toast.success("Period created successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchPeriods();
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
      }
    },
  });

  const fetchBuildings = async () => {
    try {
      const { data } = await axiosInstance.get("buildings");
      setBuildings(data || []);
    } catch (error) {
      console.log("Error fetching buildings", error);
    }
  };

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      let url = "periods";
      if (buildingId) {
        url = `buildings/${buildingId}/periods`;
      }
      const { data } = await axiosInstance.get(url);
      setPeriods(data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch periods");
      console.log("Error ", error);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchPeriods();
  }, [buildingId]);

  const onDeletePeriod = async () => {
    try {
      let url = `periods/${period.id}`;
      if (buildingId) {
        url = `buildings/${buildingId}/periods/${period.id}`;
      }
      await axiosInstance.delete(url);
      toast.success("Period deleted successfully");
      setDeleteModal(false);
      fetchPeriods();
    } catch (err) {
      toast.error("Failed to delete period");
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
        header: "Period Name",
        accessorKey: "period_name",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Start Date",
        accessorKey: "start",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "End Date",
        accessorKey: "end",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Building",
        accessorKey: "building.name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.building?.name || "N/A"}</>;
        },
      },
      {
        header: "Is Closed",
        accessorKey: "is_closed",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.is_closed === 1 ? "Yes" : "No"}</>;
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
                  const periodData = cellProps.row.original;
                  setPeriod(periodData);
                  setIsNewModelOpen(true);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const periodData = cellProps.row.original;
                  setPeriod(periodData);
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
        warningText={"Are you sure to delete this period "}
        boldText={period?.period_name}
        onDeleteClick={() => onDeletePeriod()}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Periods" breadcrumbItem="Periods" />
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={periods || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={() => {
                        setIsEdit(false);
                        setPeriod("");
                        setIsNewModelOpen(!isNewModalOpen);
                      }}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="New Period"
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
              {!!isEdit ? "Edit Period" : "Add Period"}
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
                      <Label>Period Name</Label>
                      <Input
                        name="period_name"
                        type="text"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.period_name || ""}
                        invalid={
                          validation.touched.period_name && validation.errors.period_name
                            ? true
                            : false
                        }
                      />
                      {validation.touched.period_name && validation.errors.period_name ? (
                        <FormFeedback type="invalid">
                          {validation.errors.period_name}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>Start Date</Label>
                      <Input
                        name="start"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.start || ""}
                        invalid={
                          validation.touched.start && validation.errors.start
                            ? true
                            : false
                        }
                      />
                      {validation.touched.start && validation.errors.start ? (
                        <FormFeedback type="invalid">
                          {validation.errors.start}
                        </FormFeedback>
                      ) : null}
                    </div>
                    <div className="mb-3">
                      <Label>End Date</Label>
                      <Input
                        name="end"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.end || ""}
                        invalid={
                          validation.touched.end && validation.errors.end
                            ? true
                            : false
                        }
                      />
                      {validation.touched.end && validation.errors.end ? (
                        <FormFeedback type="invalid">
                          {validation.errors.end}
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
                      <Label>Is Closed</Label>
                      <Input
                        name="is_closed"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.is_closed || 0}
                        invalid={
                          validation.touched.is_closed && validation.errors.is_closed
                            ? true
                            : false
                        }
                      >
                        <option value={0}>No</option>
                        <option value={1}>Yes</option>
                      </Input>
                      {validation.touched.is_closed && validation.errors.is_closed ? (
                        <FormFeedback type="invalid">
                          {validation.errors.is_closed}
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
                        {!!isEdit ? "Update Period" : "Add Period"}
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

export default Periods;

