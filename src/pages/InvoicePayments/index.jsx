import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import TableContainer from "../../components/Common/TableContainer";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Table,
  Label,
  Input,
} from "reactstrap";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const InvoicePayments = () => {
  document.title = "Invoice Payments";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  
  // Filter states with defaults - load from localStorage if available
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const saved = localStorage.getItem(`invoice_payment_filter_start_date_${buildingId}`);
    return saved || moment().startOf('month').format("YYYY-MM-DD");
  });
  const [filterEndDate, setFilterEndDate] = useState(() => {
    const saved = localStorage.getItem(`invoice_payment_filter_end_date_${buildingId}`);
    return saved || moment().endOf('month').format("YYYY-MM-DD");
  });
  const [filterPeopleId, setFilterPeopleId] = useState(() => {
    const saved = localStorage.getItem(`invoice_payment_filter_people_id_${buildingId}`);
    return saved || "";
  });
  const [filterStatus, setFilterStatus] = useState(() => {
    const saved = localStorage.getItem(`invoice_payment_filter_status_${buildingId}`);
    return saved || "1"; // Default to active
  });

  const fetchInvoices = async () => {
    try {
      let url = "invoices";
      if (buildingId) {
        url = `buildings/${buildingId}/invoices`;
      }
      const { data } = await axiosInstance.get(url);
      setInvoices(data || []);
    } catch (error) {
      console.log("Error fetching invoices", error);
    }
  };

  const fetchUnits = async () => {
    try {
      let url = "units";
      if (buildingId) {
        url = `buildings/${buildingId}/units`;
      }
      const { data } = await axiosInstance.get(url);
      setUnits(data || []);
    } catch (error) {
      console.log("Error fetching units", error);
    }
  };

  const fetchPeople = async () => {
    try {
      let url = "people";
      if (buildingId) {
        url = `buildings/${buildingId}/people`;
      }
      const { data } = await axiosInstance.get(url);
      // Store all people for mapping people_id to names in the table
      setPeople(data || []);
    } catch (error) {
      console.log("Error fetching people", error);
    }
  };
  
  // Get customers only for the dropdown filter
  const customers = useMemo(() => {
    return (people || []).filter(person => 
      person.people_type?.title?.toLowerCase() === "customer" || 
      person.people_type?.Title?.toLowerCase() === "customer"
    );
  }, [people]);

  const fetchAccounts = async () => {
    try {
      let url = "accounts";
      if (buildingId) {
        url = `buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data || []);
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      let url = "invoice-payments";
      if (buildingId) {
        url = `buildings/${buildingId}/invoice-payments`;
      } else {
        url = `invoice-payments?building_id=${buildingId || ""}`;
      }
      
      // Add filter parameters
      const params = {};
      if (filterStartDate) {
        params.start_date = filterStartDate;
      }
      if (filterEndDate) {
        params.end_date = filterEndDate;
      }
      if (filterPeopleId) {
        params.people_id = filterPeopleId;
      }
      if (filterStatus) {
        params.status = filterStatus;
      }
      
      const { data } = await axiosInstance.get(url, { params });
      setPayments(data || []);
    } catch (error) {
      console.log("Error fetching invoice payments", error);
      toast.error("Failed to fetch invoice payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [buildingId, filterStartDate, filterEndDate, filterPeopleId, filterStatus]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (filterStartDate) {
      localStorage.setItem(`invoice_payment_filter_start_date_${buildingId}`, filterStartDate);
    }
  }, [filterStartDate, buildingId]);

  useEffect(() => {
    if (filterEndDate) {
      localStorage.setItem(`invoice_payment_filter_end_date_${buildingId}`, filterEndDate);
    }
  }, [filterEndDate, buildingId]);

  useEffect(() => {
    localStorage.setItem(`invoice_payment_filter_people_id_${buildingId}`, filterPeopleId);
  }, [filterPeopleId, buildingId]);

  useEffect(() => {
    if (filterStatus) {
      localStorage.setItem(`invoice_payment_filter_status_${buildingId}`, filterStatus);
    }
  }, [filterStatus, buildingId]);

  useEffect(() => {
    fetchInvoices();
    fetchAccounts();
    fetchUnits();
    fetchPeople();
  }, [buildingId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleViewClick = useCallback(async (paymentId) => {
    try {
      setLoading(true);
      let url = `invoice-payments/${paymentId}`;
      if (buildingId) {
        url = `buildings/${buildingId}/invoice-payments/${paymentId}`;
      }
      const { data } = await axiosInstance.get(url);
      setViewingPayment(data);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error fetching payment details", error);
      toast.error("Failed to fetch payment details");
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  const handleEditClick = useCallback((paymentId) => {
    navigate(`/building/${buildingId}/invoice-payments/${paymentId}/edit`);
  }, [buildingId, navigate]);

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        header: "Date",
        accessorKey: "date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.date ? moment(cell.row.original.date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Invoice #",
        accessorKey: "invoice_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const invoice = invoices.find((i) => i.id === cell.row.original.invoice_id);
          return <>{invoice ? `#${invoice.invoice_no}` : `ID: ${cell.row.original.invoice_id || "N/A"}`}</>;
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
        header: "Account",
        accessorKey: "account_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const account = accounts.find((a) => a.id === cell.row.original.account_id);
          return <>{account ? account.account_name : `ID: ${cell.row.original.account_id || "N/A"}`}</>;
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
            <span className={`badge ${status === 1 ? "bg-success" : "bg-secondary"}`}>
              {status === 1 ? "Active" : "Inactive"}
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
          const paymentId = cell.row.original.id;
          return (
            <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                color="info"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleViewClick(paymentId);
                }}
              >
                <i className="bx bx-show"></i> View
              </Button>
              <Button
                type="button"
                color="primary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditClick(paymentId);
                }}
              >
                <i className="bx bx-edit"></i> Edit
              </Button>
            </div>
          );
        },
      },
    ],
    [invoices, accounts, units, people, handleViewClick, handleEditClick]
  );

  const getAccountName = (accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.account_name : "N/A";
  };

  const getPeopleName = (peopleId) => {
    if (!peopleId) return "N/A";
    const person = people.find((p) => p.id === peopleId);
    return person ? person.name : "N/A";
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Invoice Payments" breadcrumbItem="Invoice Payments" />
          <Row className="mb-3">
            <Col>
              <Button
                color="success"
                onClick={() => navigate(`/building/${buildingId}/invoice-payments/create`)}
              >
                <i className="bx bx-plus-circle me-1"></i> Record Payment
              </Button>
            </Col>
          </Row>
          
          {/* Filters */}
          <Row className="mb-3">
            <Col lg={12}>
              <Card>
                <CardBody>
                  <Row>
                    <Col md={3}>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                      />
                    </Col>
                    <Col md={3}>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                      />
                    </Col>
                    <Col md={3}>
                      <Label>Customer</Label>
                      <Input
                        type="select"
                        value={filterPeopleId}
                        onChange={(e) => setFilterPeopleId(e.target.value)}
                      >
                        <option value="">All Customers</option>
                        {customers.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={3}>
                      <Label>Status</Label>
                      <Input
                        type="select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </Input>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col lg="12">
              <Card>
                <CardBody>
                  {isLoading ? (
                    <Spinners setLoading={setLoading} />
                  ) : (
                    <TableContainer
                      columns={columns}
                      data={payments || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={true}
                      tableClass="align-middle table-nowrap table-hover dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                      theadClass="table-light"
                      paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                      pagination="pagination"
                    />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* View Payment Modal */}
      <Modal isOpen={showViewModal} toggle={() => setShowViewModal(false)} size="xl">
        <ModalHeader toggle={() => setShowViewModal(false)}>Invoice Payment Details</ModalHeader>
        <ModalBody>
          {viewingPayment ? (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <h5>Payment Information</h5>
                  <Table bordered size="sm">
                    <tbody>
                      <tr>
                        <th>Date</th>
                        <td>{viewingPayment.payment?.date ? moment(viewingPayment.payment.date).format("YYYY-MM-DD") : "N/A"}</td>
                      </tr>
                      <tr>
                        <th>Amount</th>
                        <td>{parseFloat(viewingPayment.payment?.amount || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <th>Account</th>
                        <td>{getAccountName(viewingPayment.payment?.account_id)}</td>
                      </tr>
                      <tr>
                        <th>Status</th>
                        <td>
                          <span className={`badge ${(viewingPayment.payment?.status === 1 || viewingPayment.payment?.status === "1") ? "bg-success" : "bg-secondary"}`}>
                            {(viewingPayment.payment?.status === 1 || viewingPayment.payment?.status === "1") ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <h5>Invoice Information</h5>
                  <Table bordered size="sm">
                    <tbody>
                      <tr>
                        <th>Invoice #</th>
                        <td>#{viewingPayment.invoice?.invoice_no || "N/A"}</td>
                      </tr>
                      <tr>
                        <th>Sales Date</th>
                        <td>{viewingPayment.invoice?.sales_date ? moment(viewingPayment.invoice.sales_date).format("YYYY-MM-DD") : "N/A"}</td>
                      </tr>
                      <tr>
                        <th>Due Date</th>
                        <td>{viewingPayment.invoice?.due_date ? moment(viewingPayment.invoice.due_date).format("YYYY-MM-DD") : "N/A"}</td>
                      </tr>
                      <tr>
                        <th>Amount</th>
                        <td>{parseFloat(viewingPayment.invoice?.amount || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <th>Description</th>
                        <td>{viewingPayment.invoice?.description || "N/A"}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col>
                  <h5>Splits</h5>
                  <div className="table-responsive">
                    <Table bordered striped>
                      <thead className="table-light">
                        <tr>
                          <th>Account</th>
                          <th>People</th>
                          <th>Unit</th>
                          <th className="text-end">Debit</th>
                          <th className="text-end">Credit</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingPayment.splits && viewingPayment.splits.length > 0 ? (
                          viewingPayment.splits.map((split, index) => {
                            const unit = split.unit_id ? units.find((u) => u.id === split.unit_id) : null;
                            return (
                              <tr key={index}>
                                <td>{getAccountName(split.account_id)}</td>
                                <td>{getPeopleName(split.people_id)}</td>
                                <td>{unit ? unit.name : split.unit_id ? `ID: ${split.unit_id}` : "N/A"}</td>
                                <td className="text-end">
                                  {split.debit ? parseFloat(split.debit).toFixed(2) : "-"}
                                </td>
                                <td className="text-end">
                                  {split.credit ? parseFloat(split.credit).toFixed(2) : "-"}
                                </td>
                                <td>
                                  <span className={`badge ${(split.status === "1" || split.status === 1) ? "bg-success" : "bg-secondary"}`}>
                                    {(split.status === "1" || split.status === 1) ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center">No splits found</td>
                          </tr>
                        )}
                        {viewingPayment.splits && viewingPayment.splits.length > 0 && (
                          <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                            <td colSpan="3" className="text-end">TOTAL</td>
                            <td className="text-end">
                              {viewingPayment.splits.reduce((sum, split) => sum + (parseFloat(split.debit || 0)), 0).toFixed(2)}
                            </td>
                            <td className="text-end">
                              {viewingPayment.splits.reduce((sum, split) => sum + (parseFloat(split.credit || 0)), 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Col>
              </Row>
            </div>
          ) : (
            <div className="text-center">
              <p>Loading payment details...</p>
            </div>
          )}
        </ModalBody>
      </Modal>

      <ToastContainer />
    </React.Fragment>
  );
};

export default InvoicePayments;
