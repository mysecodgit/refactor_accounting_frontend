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

const Units = () => {
  document.title = "Units";
  const { id: buildingId } = useParams();

  const [unit, setUnit] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModelOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [units, setUnits] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      id: (unit && unit.id) || "",
      name: (unit && unit.name) || "",
      building_id: (unit && unit.building_id) || (buildingId ? parseInt(buildingId) : ""),
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Please Enter Unit Name"),
      building_id: Yup.number().required("Please Select Building").min(1, "Please Select Building"),
    }),
    onSubmit: async (values) => {
      try {
        if (isEdit) {
          let url = `units/${values.id}`;
          if (buildingId) {
            url = `v1/buildings/${buildingId}/units/${values.id}`;
          }
          const { data } = await axiosInstance.put(
            url,
            { name: values.name, building_id: parseInt(values.building_id) }
          );
          toast.success("Unit updated successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchUnits();
        } else {
          let url = "units";
          if (buildingId) {
            url = `v1/buildings/${buildingId}/units`;
          }
          const { data } = await axiosInstance.post(url, {
            name: values.name,
            building_id: parseInt(values.building_id),
          });
          toast.success("Unit created successfully");
          validation.resetForm();
          setIsNewModelOpen(false);
          fetchUnits();
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

  const fetchUnits = async () => {
    try {
      setLoading(true);
      let url = "units";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/units`;
      }
      const { data } = await axiosInstance.get(url);
      setUnits(data.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error("Failed to fetch units");
      console.log("Error ", error);
    }
  };

  useEffect(() => {
    fetchBuildings();
    fetchUnits();
  }, [buildingId]);

  const onDeleteUnit = async () => {
    try {
      let url = `units/${unit.id}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/units/${unit.id}`;
      }
      await axiosInstance.delete(url);
      toast.success("Unit deleted successfully");
      setDeleteModal(false);
      fetchUnits();
    } catch (err) {
      toast.error("Failed to delete unit");
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
        header: "Created At",
        accessorKey: "created_at",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const formattedDate = moment(cell.row.original.created_at).format("D MMM YY h:mmA");
          return <>{formattedDate}</>;
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
                  const unitData = cellProps.row.original;
                  setUnit(unitData);
                  setIsNewModelOpen(true);
                }}
              >
                <i className="mdi mdi-pencil font-size-18" />
              </Link>
              <Link
                to="#"
                className="text-danger"
                onClick={() => {
                  const unitData = cellProps.row.original;
                  setUnit(unitData);
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
        warningText={"Are you sure to delete this unit "}
        boldText={unit?.name}
        onDeleteClick={() => onDeleteUnit()}
        onCloseClick={() => setDeleteModal(false)}
      />
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Units" breadcrumbItem="Units" />
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={units || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
                      isAddButton={true}
                      handleUserClick={() => {
                        setIsEdit(false);
                        setUnit("");
                        setIsNewModelOpen(!isNewModalOpen);
                      }}
                      buttonClass="btn btn-success btn-rounded waves-effect waves-light addContact-modal mb-2"
                      buttonName="New Unit"
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
              {!!isEdit ? "Edit Unit" : "Add Unit"}
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
                        {!!isEdit ? "Update Unit" : "Add Unit"}
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

export default Units;

