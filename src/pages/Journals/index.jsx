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
} from "reactstrap";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const Journals = () => {
  document.title = "Journals";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [viewingJournal, setViewingJournal] = useState(null);
  const [showJournalDetailsModal, setShowJournalDetailsModal] = useState(false);

  const fetchAccounts = async () => {
    try {
      let url = "accounts";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data.data || []);
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const fetchUnits = async () => {
    try {
      let url = "units";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/units`;
      }
      const { data } = await axiosInstance.get(url);
      setUnits(data.data || []);
    } catch (error) {
      console.log("Error fetching units", error);
    }
  };

  const fetchJournals = async () => {
    try {
      setLoading(true);
      let url = "journals";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/journals`;
      } else {
        url = `journals?building_id=${buildingId || ""}`;
      }
      const { data } = await axiosInstance.get(url);
      setJournals(data.data || []);
    } catch (error) {
      console.log("Error fetching journals", error);
      toast.error("Failed to fetch journals");
    } finally {
      setLoading(false);
    }
  };

  const fetchJournalDetails = async (journalId) => {
    try {
      setLoading(true);
      let url = `journals/${journalId}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/journals/${journalId}`;
      }
      const { data: journalResponse } = await axiosInstance.get(url);
      setViewingJournal(journalResponse.data);
      setShowJournalDetailsModal(true);
    } catch (error) {
      console.log("Error fetching journal details", error);
      toast.error("Failed to fetch journal details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchUnits();
    fetchJournals();
  }, [buildingId]);

  const columns = useMemo(
    () => [
      {
        header: "Journal Date",
        accessorKey: "journal_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.journal_date ? moment(cell.row.original.journal_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Total Amount",
        accessorKey: "total_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{parseFloat(cell.row.original.total_amount || 0).toFixed(2)}</>;
        },
      },
      {
        header: "Actions",
        accessorKey: "actions",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (cell) => {
          return (
            <div className="d-flex gap-2">
              <Button
                type="button"
                color="info"
                size="sm"
                onClick={() => {
                  fetchJournalDetails(cell.row.original.id);
                }}
              >
                <i className="bx bx-show"></i> View
              </Button>
              <Button
                type="button"
                color="primary"
                size="sm"
                onClick={() => navigate(`/building/${buildingId}/journals/${cell.row.original.id}/edit`)}
              >
                <i className="bx bx-edit"></i> Edit
              </Button>
            </div>
          );
        },
      },
    ],
    [buildingId, navigate]
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Journals" breadcrumbItem="Journals" />
          <Row className="mb-3">
            <Col>
              <Button color="success" onClick={() => navigate(`/building/${buildingId}/journals/create`)}>
                <i className="bx bx-plus me-1"></i> Create Journal
              </Button>
            </Col>
          </Row>
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={journals || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
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

          {/* Journal Details Modal */}
          <Modal isOpen={showJournalDetailsModal} toggle={() => setShowJournalDetailsModal(false)} size="xl">
            <ModalHeader toggle={() => setShowJournalDetailsModal(false)}>Journal Details</ModalHeader>
            <ModalBody>
              {viewingJournal ? (
                <div>
                  {/* Journal Information */}
                  <Row className="mb-4">
                    <Col md={6}>
                      <h5>Journal Information</h5>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td><strong>Journal Date:</strong></td>
                            <td>{viewingJournal.journal?.journal_date ? moment(viewingJournal.journal.journal_date).format("YYYY-MM-DD") : moment(viewingJournal.journal_date).format("YYYY-MM-DD")}</td>
                          </tr>
                          <tr>
                            <td><strong>Total Amount:</strong></td>
                            <td>{parseFloat(viewingJournal.journal?.total_amount || viewingJournal.total_amount || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td><strong>Memo:</strong></td>
                            <td>{viewingJournal.journal?.memo || viewingJournal.memo || "N/A"}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>

                  {/* Journal Lines */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Journal Lines</h5>
                      <Table bordered responsive>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Unit</th>
                            <th>People</th>
                            <th>Description</th>
                            <th>Debit</th>
                            <th>Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewingJournal.lines || []).map((line, index) => {
                            const account = accounts.find((a) => a.id === line.account_id);
                            const unit = line.unit_id ? units.find((u) => u.id === line.unit_id) : null;
                            return (
                              <tr key={index}>
                                <td>{account ? `${account.account_name} (${account.account_number})` : `ID: ${line.account_id}`}</td>
                                <td>{unit ? unit.name : line.unit_id ? `ID: ${line.unit_id}` : "N/A"}</td>
                                <td>{line.people_id || "N/A"}</td>
                                <td>{line.description || "N/A"}</td>
                                <td>{line.debit ? parseFloat(line.debit).toFixed(2) : "-"}</td>
                                <td>{line.credit ? parseFloat(line.credit).toFixed(2) : "-"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </Col>
                  </Row>

                  {/* Splits */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Double-Entry Accounting Splits</h5>
                      <Table bordered responsive>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>People</th>
                            <th>Unit</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewingJournal.splits || []).map((split, index) => {
                            const account = accounts.find((a) => a.id === split.account_id);
                            const unit = split.unit_id ? units.find((u) => u.id === split.unit_id) : null;
                            return (
                              <tr key={index} style={{ backgroundColor: split.status === "1" ? "transparent" : "#f8f9fa" }}>
                                <td>{account ? `${account.account_name} (${account.account_number})` : `ID: ${split.account_id}`}</td>
                                <td>{split.people_id || "N/A"}</td>
                                <td>{unit ? unit.name : split.unit_id ? `ID: ${split.unit_id}` : "N/A"}</td>
                                <td>{split.debit ? parseFloat(split.debit).toFixed(2) : "-"}</td>
                                <td>{split.credit ? parseFloat(split.credit).toFixed(2) : "-"}</td>
                                <td>
                                  <span className={`badge ${split.status === "1" ? "bg-success" : "bg-secondary"}`}>
                                    {split.status === "1" ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ fontWeight: "bold", backgroundColor: "#f8f9fa" }}>
                            <td colSpan="3">Total (Active Only)</td>
                            <td>
                              {(viewingJournal.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.debit) || 0), 0).toFixed(2)}
                            </td>
                            <td>
                              {(viewingJournal.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.credit) || 0), 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </Col>
                  </Row>

                  <div className="text-end mt-3">
                    <Button color="secondary" onClick={() => setShowJournalDetailsModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p>Loading journal details...</p>
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

export default Journals;

