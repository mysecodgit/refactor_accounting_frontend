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

const Bills = () => {
  document.title = "Bills";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [viewingBill, setViewingBill] = useState(null);
  const [showBillDetailsModal, setShowBillDetailsModal] = useState(false);

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

  const fetchPeople = async () => {
    try {
      let url = "people";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/people`;
      }
      const { data } = await axiosInstance.get(url);
      setPeople(data.data || []);
    } catch (error) {
      console.log("Error fetching people", error);
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      let url = "bills";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/bills`;
      }
      const { data } = await axiosInstance.get(url);
      setBills(data.data || []);
    } catch (error) {
      console.log("Error fetching bills", error);
      toast.error("Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  const fetchBillDetails = async (billId) => {
    try {
      setLoading(true);
      let url = `bills/${billId}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/bills/${billId}`;
      }
      const { data: billResponse } = await axiosInstance.get(url);
      setViewingBill(billResponse.data);
      setShowBillDetailsModal(true);
    } catch (error) {
      console.log("Error fetching bill details", error);
      toast.error("Failed to fetch bill details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchUnits();
    fetchPeople();
    fetchBills();
  }, [buildingId]);

  const columns = useMemo(
    () => [
      {
        header: "Bill No",
        accessorKey: "bill_no",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Bill Date",
        accessorKey: "bill_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.bill_date ? moment(cell.row.original.bill_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Due Date",
        accessorKey: "due_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.due_date ? moment(cell.row.original.due_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "AP Account",
        accessorKey: "ap_account_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const account = accounts.find((a) => a.id === cell.row.original.ap_account_id);
          return <>{account ? `${account.account_name} (${account.account_number})` : `ID: ${cell.row.original.ap_account_id || "N/A"}`}</>;
        },
      },
      {
        header: "Vendor",
        accessorKey: "people_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const peopleId = cell.row.original.people_id;
          if (!peopleId) return <>N/A</>;
          const vendor = people.find((p) => p.id === peopleId);
          return <>{vendor ? vendor.name : `ID: ${peopleId}`}</>;
        },
      },
      {
        header: "Amount",
        accessorKey: "amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{parseFloat(cell.row.original.amount || 0).toFixed(2)}</>;
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return (
            <span className={`badge ${cell.row.original.status === "1" ? "bg-success" : "bg-secondary"}`}>
              {cell.row.original.status === "1" ? "Active" : "Inactive"}
            </span>
          );
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
                  fetchBillDetails(cell.row.original.id);
                }}
              >
                <i className="bx bx-show"></i> View
              </Button>
              <Button
                type="button"
                color="primary"
                size="sm"
                onClick={() => navigate(`/building/${buildingId}/bills/${cell.row.original.id}/edit`)}
              >
                <i className="bx bx-edit"></i> Edit
              </Button>
            </div>
          );
        },
      },
    ],
    [accounts, people, buildingId, navigate]
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Bills" breadcrumbItem="Bills" />
          <Row className="mb-3">
            <Col>
              <Button color="success" onClick={() => navigate(`/building/${buildingId}/bills/create`)}>
                <i className="bx bx-plus me-1"></i> Create Bill
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
                      data={bills || []}
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

          {/* Bill Details Modal */}
          <Modal isOpen={showBillDetailsModal} toggle={() => setShowBillDetailsModal(false)} size="xl">
            <ModalHeader toggle={() => setShowBillDetailsModal(false)}>Bill Details</ModalHeader>
            <ModalBody>
              {viewingBill ? (
                <div>
                  {/* Bill Information */}
                  <Row className="mb-4">
                    <Col md={6}>
                      <h5>Bill Information</h5>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td><strong>Bill No:</strong></td>
                            <td>{viewingBill.bill?.bill_no || viewingBill.bill_no || "N/A"}</td>
                          </tr>
                          <tr>
                            <td><strong>Bill Date:</strong></td>
                            <td>{viewingBill.bill?.bill_date ? moment(viewingBill.bill.bill_date).format("YYYY-MM-DD") : moment(viewingBill.bill_date).format("YYYY-MM-DD")}</td>
                          </tr>
                          <tr>
                            <td><strong>Due Date:</strong></td>
                            <td>{viewingBill.bill?.due_date ? moment(viewingBill.bill.due_date).format("YYYY-MM-DD") : moment(viewingBill.due_date).format("YYYY-MM-DD")}</td>
                          </tr>
                          <tr>
                            <td><strong>AP Account:</strong></td>
                            <td>
                              {(() => {
                                const accountId = viewingBill.bill?.ap_account_id || viewingBill.ap_account_id;
                                const account = accounts.find((a) => a.id === accountId);
                                return account ? `${account.account_name} (${account.account_number})` : `ID: ${accountId || "N/A"}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Vendor:</strong></td>
                            <td>
                              {(() => {
                                const peopleId = viewingBill.bill?.people_id || viewingBill.people_id;
                                if (!peopleId) return "N/A";
                                const vendor = people.find((p) => p.id === peopleId);
                                return vendor ? vendor.name : `ID: ${peopleId}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Amount:</strong></td>
                            <td>{parseFloat(viewingBill.bill?.amount || viewingBill.amount || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td><strong>Description:</strong></td>
                            <td>{viewingBill.bill?.description || viewingBill.description || "N/A"}</td>
                          </tr>
                          <tr>
                            <td><strong>Status:</strong></td>
                            <td>
                              <span className={`badge ${(viewingBill.bill?.status || viewingBill.status) === "1" ? "bg-success" : "bg-secondary"}`}>
                                {(viewingBill.bill?.status || viewingBill.status) === "1" ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>

                  {/* Expense Lines */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Expense Lines</h5>
                      <Table bordered responsive>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Unit</th>
                            <th>People</th>
                            <th>Description</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewingBill.expense_lines || []).map((line, index) => {
                            const account = accounts.find((a) => a.id === line.account_id);
                            const unit = line.unit_id ? units.find((u) => u.id === line.unit_id) : null;
                            const person = line.people_id ? people.find((p) => p.id === line.people_id) : null;
                            return (
                              <tr key={index}>
                                <td>{account ? `${account.account_name} (${account.account_number})` : `ID: ${line.account_id}`}</td>
                                <td>{unit ? unit.name : line.unit_id ? `ID: ${line.unit_id}` : "N/A"}</td>
                                <td>{person ? person.name : line.people_id ? `ID: ${line.people_id}` : "N/A"}</td>
                                <td>{line.description || "N/A"}</td>
                                <td>{parseFloat(line.amount || 0).toFixed(2)}</td>
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
                          {(viewingBill.splits || []).map((split, index) => {
                            const account = accounts.find((a) => a.id === split.account_id);
                            const unit = split.unit_id ? units.find((u) => u.id === split.unit_id) : null;
                            const person = split.people_id ? people.find((p) => p.id === split.people_id) : null;
                            return (
                              <tr key={index} style={{ backgroundColor: split.status === "1" ? "transparent" : "#f8f9fa" }}>
                                <td>{account ? `${account.account_name} (${account.account_number})` : `ID: ${split.account_id}`}</td>
                                <td>{person ? person.name : split.people_id ? `ID: ${split.people_id}` : "N/A"}</td>
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
                              {(viewingBill.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.debit) || 0), 0).toFixed(2)}
                            </td>
                            <td>
                              {(viewingBill.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.credit) || 0), 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </Col>
                  </Row>

                  <div className="text-end mt-3">
                    <Button color="secondary" onClick={() => setShowBillDetailsModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p>Loading bill details...</p>
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

export default Bills;
