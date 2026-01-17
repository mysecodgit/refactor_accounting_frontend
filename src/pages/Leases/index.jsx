import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import TableContainer from "../../components/Common/TableContainer";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  Button,
  Table,
  Badge,
} from "reactstrap";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const Leases = () => {
  document.title = "Leases";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [leases, setLeases] = useState([]);
  const [people, setPeople] = useState([]);
  const [units, setUnits] = useState([]);
  const [viewingLease, setViewingLease] = useState(null);
  const [showLeaseDetailsModal, setShowLeaseDetailsModal] = useState(false);

  const fetchPeople = async () => {
    try {
      const { data } = await axiosInstance.get(`v1/buildings/${buildingId}/people`);
      setPeople(data.data || []);
    } catch (error) {
      console.log("Error fetching people", error);
    }
  };

  const fetchUnits = async () => {
    try {
      const { data } = await axiosInstance.get(`v1/buildings/${buildingId}/units`);
      setUnits(data.data || []);
    } catch (error) {
      console.log("Error fetching units", error);
    }
  };

  const fetchLeases = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`v1/buildings/${buildingId}/leases`);
      setLeases(data.data || []);
    } catch (error) {
      console.log("Error fetching leases", error);
      toast.error("Failed to fetch leases");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaseDetails = async (leaseId) => {
    try {
      setLoading(true);
      const { data: leaseResponse } = await axiosInstance.get(`v1/buildings/${buildingId}/leases/${leaseId}`);
      setViewingLease(leaseResponse.data);
      setShowLeaseDetailsModal(true);
    } catch (error) {
      console.log("Error fetching lease details", error);
      toast.error("Failed to fetch lease details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
    fetchUnits();
    fetchLeases();
  }, [buildingId]);

  const getPeopleName = (peopleId) => {
    const person = people.find((p) => p.id === peopleId);
    return person ? person.name : "N/A";
  };

  const getUnitName = (unitId) => {
    const unit = units.find((u) => u.id === unitId);
    return unit ? unit.name : "N/A";
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const downloadFile = async (leaseId, fileId, originalName) => {
    try {
      const response = await axiosInstance.get(
        `v1/buildings/${buildingId}/leases/${leaseId}/files/${fileId}/download`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Start Date",
        accessorKey: "start_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const lease = cell.row.original.lease || cell.row.original;
          return <>{lease.start_date ? moment(lease.start_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "End Date",
        accessorKey: "end_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const lease = cell.row.original.lease || cell.row.original;
          return <>{lease.end_date ? moment(lease.end_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Customer",
        accessorKey: "people_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const lease = cell.row.original.lease || cell.row.original;
          const peopleName = cell.row.original.people?.name;
          return <>{peopleName || getPeopleName(lease.people_id)}</>;
        },
      },
      {
        header: "Unit",
        accessorKey: "unit_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const lease = cell.row.original.lease || cell.row.original;
          return <>{getUnitName(lease.unit_id)}</>;
        },
      },
      {
        header: "Rent Amount",
        accessorKey: "rent_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const lease = cell.row.original.lease || cell.row.original;
          return <>{parseFloat(lease.rent_amount || 0).toFixed(2)}</>;
        },
      },
      {
        header: "Deposit Amount",
        accessorKey: "deposit_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const lease = cell.row.original.lease || cell.row.original;
          return <>{parseFloat(lease.deposit_amount || 0).toFixed(2)}</>;
        },
      },
      {
        header: "Service Amount",
        accessorKey: "service_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const lease = cell.row.original.lease || cell.row.original;
          return <>{parseFloat(lease.service_amount || 0).toFixed(2)}</>;
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const lease = cell.row.original.lease || cell.row.original;
          const status = lease.status;
          return (
            <Badge color={status == "1" ? "success" : "secondary"}>
              {status == "1" ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        header: "Actions",
        accessorKey: "actions",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (cell) => {
          const lease = cell.row.original.lease || cell.row.original;
          const leaseId = lease.id;
          return (
            <>
              <Button
                color="info"
                size="sm"
                className="me-2"
                onClick={() => fetchLeaseDetails(leaseId)}
              >
                View
              </Button>
              <Button
                color="primary"
                size="sm"
                onClick={() => navigate(`/building/${buildingId}/leases/${leaseId}/edit`)}
              >
                Edit
              </Button>
            </>
          );
        },
      },
    ],
    [people, units, buildingId, navigate]
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Leases" breadcrumbItem="Leases" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="card-title mb-0">Leases</h4>
                    <Button
                      color="success"
                      onClick={() => navigate(`/building/${buildingId}/leases/create`)}
                    >
                      <i className="mdi mdi-plus me-1"></i> Create Lease
                    </Button>
                  </div>
                  {isLoading ? (
                    <Spinners setLoading={setLoading} />
                  ) : (
                    <TableContainer
                      columns={columns}
                      data={leases}
                      isGlobalFilter={true}
                      isPagination={false}
                      isShowingPageSize={false}
                      paginationDiv="col-sm-12 col-md-7"
                      pagination="pagination justify-content-end pagination-rounded"
                    />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Lease Details Modal */}
      <Modal
        isOpen={showLeaseDetailsModal}
        toggle={() => setShowLeaseDetailsModal(false)}
        size="lg"
      >
        <ModalHeader toggle={() => setShowLeaseDetailsModal(false)}>
          Lease Details
        </ModalHeader>
        <ModalBody>
          {viewingLease && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Start Date:</strong> {moment(viewingLease.lease.start_date).format("YYYY-MM-DD")}
                </Col>
                <Col md={6}>
                  <strong>End Date:</strong> {viewingLease.lease.end_date ? moment(viewingLease.lease.end_date).format("YYYY-MM-DD") : "N/A"}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Customer:</strong> {getPeopleName(viewingLease.lease.people_id)}
                </Col>
                <Col md={6}>
                  <strong>Unit:</strong> {getUnitName(viewingLease.lease.unit_id)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={4}>
                  <strong>Rent Amount:</strong> {parseFloat(viewingLease.lease.rent_amount || 0).toFixed(2)}
                </Col>
                <Col md={4}>
                  <strong>Deposit Amount:</strong> {parseFloat(viewingLease.lease.deposit_amount || 0).toFixed(2)}
                </Col>
                <Col md={4}>
                  <strong>Service Amount:</strong> {parseFloat(viewingLease.lease.service_amount || 0).toFixed(2)}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Status:</strong>{" "}
                  <Badge color={viewingLease.lease.status == "1" ? "success" : "secondary"}>
                    {viewingLease.lease.status == "1" ? "Active" : "Inactive"}
                  </Badge>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Lease Terms:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    {viewingLease.lease.lease_terms || "N/A"}
                  </div>
                </Col>
              </Row>

              {/* Lease Files */}
              {viewingLease.lease_files && viewingLease.lease_files.length > 0 && (
                <>
                  <hr />
                  <h5 className="mb-3">Lease Files</h5>
                  <Table bordered striped>
                    <thead className="table-light">
                      <tr>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingLease.lease_files.map((file, index) => (
                        <tr key={index}>
                          <td>{file.original_name}</td>
                          <td>{file.file_type}</td>
                          <td>{formatFileSize(file.file_size)}</td>
                          <td>
                            <Button
                              color="primary"
                              size="sm"
                              onClick={() => downloadFile(file.lease_id, file.id, file.original_name)}
                            >
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </>
          )}
        </ModalBody>
      </Modal>

      <ToastContainer />
    </React.Fragment>
  );
};

export default Leases;

