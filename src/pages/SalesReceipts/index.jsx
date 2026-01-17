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

const SalesReceipts = () => {
  document.title = "Sales Receipts";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [showReceiptDetailsModal, setShowReceiptDetailsModal] = useState(false);

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

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      let url = "sales-receipts";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/sales-receipts`;
      } else {
        url = `sales-receipts?building_id=${buildingId || ""}`;
      }
      const { data } = await axiosInstance.get(url);
      setReceipts(data.data || []);
    } catch (error) {
      console.log("Error fetching sales receipts", error);
      toast.error("Failed to fetch sales receipts");
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptDetails = async (receiptId) => {
    try {
      setLoading(true);
      let url = `sales-receipts/${receiptId}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/sales-receipts/${receiptId}`;
      }
      const { data: receiptResponse } = await axiosInstance.get(url);
      setViewingReceipt(receiptResponse.data);
      setShowReceiptDetailsModal(true);
    } catch (error) {
      console.log("Error fetching sales receipt details", error);
      toast.error("Failed to fetch sales receipt details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchPeople();
    fetchAccounts();
    fetchReceipts();
  }, [buildingId]);

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        header: "Receipt #",
        accessorKey: "receipt_no",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Receipt Date",
        accessorKey: "receipt_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.receipt_date ? moment(cell.row.original.receipt_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Customer",
        accessorKey: "people_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const person = people.find((p) => p.id === cell.row.original.people_id);
          return <>{person ? person.name : `ID: ${cell.row.original.people_id || "N/A"}`}</>;
        },
      },
      {
        header: "Unit",
        accessorKey: "unit_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const unit = units.find((u) => u.id === cell.row.original.unit_id);
          return <>{unit ? unit.unit_number || unit.name : `ID: ${cell.row.original.unit_id || "N/A"}`}</>;
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
        header: "Description",
        accessorKey: "description",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.description || "N/A"}</>;
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const status = cell.row.original.status;
          return (
            <span className={`badge ${(status === 1 || status === "1") ? "bg-success" : "bg-secondary"}`}>
              {(status === 1 || status === "1") ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        header: "Created",
        accessorKey: "created_at",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.created_at ? moment(cell.row.original.created_at).format("YYYY-MM-DD") : "N/A"}</>;
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
                  fetchReceiptDetails(cell.row.original.id);
                }}
              >
                <i className="bx bx-show"></i> View
              </Button>
              <Button
                type="button"
                color="primary"
                size="sm"
                onClick={() => navigate(`/building/${buildingId}/sales-receipts/${cell.row.original.id}/edit`)}
              >
                <i className="bx bx-edit"></i> Edit
              </Button>
            </div>
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
          <Breadcrumbs title="Sales Receipts" breadcrumbItem="Sales Receipts" />
          <Row className="mb-3">
            <Col>
              <Button
                color="primary"
                onClick={() => navigate(`/building/${buildingId}/sales-receipts/create`)}
              >
                <i className="bx bx-plus-circle me-1"></i> Create Sales Receipt
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
                      data={receipts || []}
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

          {/* Receipt Details Modal */}
          <Modal isOpen={showReceiptDetailsModal} toggle={() => setShowReceiptDetailsModal(false)} size="xl">
            <ModalHeader toggle={() => setShowReceiptDetailsModal(false)}>Sales Receipt Details</ModalHeader>
            <ModalBody>
              {viewingReceipt ? (
                <div>
                  {/* Receipt Information */}
                  <Row className="mb-4">
                    <Col md={6}>
                      <h5>Receipt Information</h5>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td><strong>Receipt Number:</strong></td>
                            <td>{viewingReceipt.receipt?.receipt_no || viewingReceipt.receipt_no}</td>
                          </tr>
                          <tr>
                            <td><strong>Receipt Date:</strong></td>
                            <td>{viewingReceipt.receipt?.receipt_date ? moment(viewingReceipt.receipt.receipt_date).format("YYYY-MM-DD") : moment(viewingReceipt.receipt_date).format("YYYY-MM-DD")}</td>
                          </tr>
                          <tr>
                            <td><strong>Unit:</strong></td>
                            <td>
                              {(() => {
                                const unitId = viewingReceipt.receipt?.unit_id || viewingReceipt.unit_id;
                                const unit = units.find((u) => u.id === unitId);
                                return unit ? unit.name : `ID: ${unitId || "N/A"}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Customer:</strong></td>
                            <td>
                              {(() => {
                                const peopleId = viewingReceipt.receipt?.people_id || viewingReceipt.people_id;
                                const person = people.find((p) => p.id === peopleId);
                                return person ? person.name : `ID: ${peopleId || "N/A"}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Asset Account:</strong></td>
                            <td>
                              {(() => {
                                const accountId = viewingReceipt.receipt?.account_id || viewingReceipt.account_id;
                                const account = accounts.find((a) => a.id === accountId);
                                return account ? `${account.account_name} (${account.account_number})` : `ID: ${accountId || "N/A"}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Amount:</strong></td>
                            <td>{parseFloat(viewingReceipt.receipt?.amount || viewingReceipt.amount || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td><strong>Description:</strong></td>
                            <td>{viewingReceipt.receipt?.description || viewingReceipt.description || "N/A"}</td>
                          </tr>
                          <tr>
                            <td><strong>Status:</strong></td>
                            <td>
                              <span className={`badge ${(viewingReceipt.receipt?.status || viewingReceipt.status) === 1 || (viewingReceipt.receipt?.status || viewingReceipt.status) === "1" ? "bg-success" : "bg-secondary"}`}>
                                {(viewingReceipt.receipt?.status || viewingReceipt.status) === 1 || (viewingReceipt.receipt?.status || viewingReceipt.status) === "1" ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>

                  {/* Receipt Items */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Receipt Items</h5>
                      {/* Active Items */}
                      {(viewingReceipt.items || []).filter(item => item.status === "1" || item.status === 1).length > 0 && (
                        <Table bordered responsive className="mb-3">
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th>Previous Value</th>
                              <th>Current Value</th>
                              <th>Qty</th>
                              <th>Rate</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(viewingReceipt.items || []).filter(item => item.status === "1" || item.status === 1).map((item, index) => (
                              <tr key={index}>
                                <td>{item.item_name}</td>
                                <td>{item.previous_value !== null && item.previous_value !== undefined ? parseFloat(item.previous_value).toFixed(3) : "N/A"}</td>
                                <td>{item.current_value !== null && item.current_value !== undefined ? parseFloat(item.current_value).toFixed(3) : "N/A"}</td>
                                <td>{item.qty !== null && item.qty !== undefined ? parseFloat(item.qty).toFixed(2) : "N/A"}</td>
                                <td>{item.rate || "N/A"}</td>
                                <td>{parseFloat(item.total || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}

                      {/* Previous Receipt Items (Inactive) */}
                      {(viewingReceipt.items || []).filter(item => item.status !== "1" && item.status !== 1).length > 0 && (
                        <div>
                          <h6 className="text-muted mt-3 mb-2">Previous Receipt Items</h6>
                          <Table bordered responsive>
                            <thead>
                              <tr>
                                <th>Item Name</th>
                                <th>Previous Value</th>
                                <th>Current Value</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>Total</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(viewingReceipt.items || []).filter(item => item.status !== "1" && item.status !== 1).map((item, index) => (
                                <tr key={index} style={{ backgroundColor: "#f8f9fa" }}>
                                  <td>{item.item_name}</td>
                                  <td>{item.previous_value !== null && item.previous_value !== undefined ? parseFloat(item.previous_value).toFixed(3) : "N/A"}</td>
                                  <td>{item.current_value !== null && item.current_value !== undefined ? parseFloat(item.current_value).toFixed(3) : "N/A"}</td>
                                  <td>{item.qty !== null && item.qty !== undefined ? parseFloat(item.qty).toFixed(2) : "N/A"}</td>
                                  <td>{item.rate || "N/A"}</td>
                                  <td>{parseFloat(item.total || 0).toFixed(2)}</td>
                                  <td>
                                    <span className="badge bg-secondary">Inactive</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Col>
                  </Row>

                  {/* Splits - Active and Inactive */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Double-Entry Accounting Splits</h5>
                      <Table bordered responsive>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Customer/Vendor</th>
                            <th>Unit</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewingReceipt.splits || []).map((split, index) => {
                            const account = accounts.find((a) => a.id === split.account_id);
                            const person = split.people_id ? people.find((p) => p.id === split.people_id) : null;
                            const unit = split.unit_id ? units.find((u) => u.id === split.unit_id) : null;
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
                              {(viewingReceipt.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.debit) || 0), 0).toFixed(2)}
                            </td>
                            <td>
                              {(viewingReceipt.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.credit) || 0), 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </Col>
                  </Row>

                  <div className="text-end mt-3">
                    <Button color="secondary" onClick={() => setShowReceiptDetailsModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p>Loading sales receipt details...</p>
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

export default SalesReceipts;
