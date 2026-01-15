import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Table,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const CreateInvoicePayment = () => {
  document.title = "Record Invoice Payment";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submissions
  const [invoices, setInvoices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [assetAccounts, setAssetAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [invoiceBalances, setInvoiceBalances] = useState({});
  const [splitsPreview, setSplitsPreview] = useState(null);
  const [showSplitsModal, setShowSplitsModal] = useState(false);
  const [userId] = useState(1); // TODO: Get from auth context

  // Load date from localStorage if available
  const getInitialDate = () => {
    const saved = localStorage.getItem(`create_invoice_payment_date_${buildingId}`);
    return saved || moment().format("YYYY-MM-DD");
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      reference: "",
      date: getInitialDate(),
      invoice_id: "",
      account_id: "",
      amount: 0,
      status: 1,
      building_id: buildingId ? parseInt(buildingId) : "",
    },
    validationSchema: Yup.object({
      reference: Yup.string().required("Reference is required"),
      date: Yup.date().required("Date is required"),
      invoice_id: Yup.number().required("Invoice is required").min(1, "Please select an invoice"),
      account_id: Yup.number().required("Asset Account is required").min(1, "Please select an asset account"),
      amount: Yup.number().required("Amount is required").min(0.01, "Amount must be greater than 0"),
      status: Yup.number().oneOf([0, 1]),
      building_id: Yup.number().required("Building ID is required"),
    }),
    onSubmit: async (values) => {
      // Prevent double submission
      if (isSubmitting) {
        return;
      }
      
      setIsSubmitting(true);
      try {
        const payload = {
          reference: values.reference,
          date: values.date,
          invoice_id: parseInt(values.invoice_id),
          account_id: parseInt(values.account_id),
          amount: parseFloat(values.amount),
          status: parseInt(values.status),
          building_id: parseInt(values.building_id),
        };

        let url = "invoice-payments";
        if (buildingId) {
          url = `v1/buildings/${buildingId}/invoice-payments`;
        }

        const config = {
          headers: {
            "User-ID": userId.toString(),
          },
        };

        await axiosInstance.post(url, payload);
        toast.success("Invoice payment created successfully");
        navigate(`/building/${buildingId}/invoice-payments`);
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const fetchInvoices = async () => {
    try {
      let url = "invoices";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices`;
      }
      const { data } = await axiosInstance.get(url);
      setInvoices(data.data || []);
      // calculateInvoiceBalances(data.data || []); // TODO: remove it if not needed
    } catch (error) {
      console.log("Error fetching invoices", error);
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

  const calculateInvoiceBalances = async (invoicesList) => {
    try {
      const balances = {};
      for (const invoice of invoicesList) {
        let url = `v1/invoices/${invoice.id}/payments`;
        if (buildingId) {
          url = `v1/buildings/${buildingId}/invoices/${invoice.id}/payments`;
        }
        try {
          const { data: invoicePayments } = await axiosInstance.get(url);
          const totalPaid = (invoicePayments.data || []).reduce((sum, payment) => {
            return sum + (parseFloat(payment.amount) || 0);
          }, 0);
          balances[invoice.id] = (parseFloat(invoice.amount) || 0) - totalPaid;
        } catch (err) {
          balances[invoice.id] = parseFloat(invoice.amount) || 0;
        }
      }
      setInvoiceBalances(balances);
    } catch (error) {
      console.log("Error calculating invoice balances", error);
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
      
      const assetAccountsList = (data.data || []).filter((account) => {
        const typeName = account.type?.typeName || "";
        return typeName.toLowerCase().includes("asset") || 
               typeName.toLowerCase().includes("cash") ||
               typeName.toLowerCase().includes("bank");
      });
      setAssetAccounts(assetAccountsList);
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const previewSplits = async () => {
    if (!validation.values.invoice_id || !validation.values.account_id || !validation.values.amount) {
      toast.error("Please fill in all required fields before previewing splits");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        date: validation.values.date,
        invoice_id: parseInt(validation.values.invoice_id),
        account_id: parseInt(validation.values.account_id),
        amount: parseFloat(validation.values.amount),
        building_id: parseInt(validation.values.building_id),
      };

      let url = "invoice-payments/preview";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoice-payments/preview`;
      }

      const { data } = await axiosInstance.post(url, payload);
      console.log("Preview splits response:", data.data);
      console.log("First split:", data.data?.splits?.[0]);
      setSplitsPreview(data.data);
      setShowSplitsModal(true);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
      toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Save date to localStorage whenever it changes
  useEffect(() => {
    if (validation.values.date) {
      localStorage.setItem(`create_invoice_payment_date_${buildingId}`, validation.values.date);
    }
  }, [validation.values.date, buildingId]);

  useEffect(() => {
    fetchInvoices();
    fetchAccounts();
    fetchUnits();
    fetchPeople();
  }, [buildingId]);

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
          <Breadcrumbs title="Record Invoice Payment" breadcrumbItem="Record Payment" />
          <Row>
            <Col lg="12">
              <Card>
                <CardBody>
                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      validation.handleSubmit();
                      return false;
                    }}
                  >
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Reference <span className="text-danger">*</span></Label>
                          <Input
                            name="reference"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.reference || ""}
                            invalid={validation.touched.reference && validation.errors.reference ? true : false}
                          />
                          {validation.touched.reference && validation.errors.reference ? (
                            <FormFeedback type="invalid">{validation.errors.reference}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Date <span className="text-danger">*</span></Label>
                          <Input
                            name="date"
                            type="date"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.date || ""}
                            invalid={validation.touched.date && validation.errors.date ? true : false}
                          />
                          {validation.touched.date && validation.errors.date ? (
                            <FormFeedback type="invalid">{validation.errors.date}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Invoice <span className="text-danger">*</span></Label>
                          <Input
                            name="invoice_id"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.invoice_id || ""}
                            invalid={validation.touched.invoice_id && validation.errors.invoice_id ? true : false}
                          >
                            <option value="">Select Invoice</option>
                            {invoices
                              .filter((invoice) => {
                                const balance = invoice.amount - invoice.paid_amount - invoice.applied_credits_total;
                                return balance !== 0;
                              })
                              .map((invoice) => {
                                const balance = invoice.amount - invoice.paid_amount - invoice.applied_credits_total;
                                  
                                const balanceText = balance >= 0 ? balance.toFixed(2) : `(${Math.abs(balance).toFixed(2)})`;
                                
                                return (
                                  <option key={invoice.id} value={invoice.id}>
                                    Invoice #{invoice.invoice_no} | Unit: {invoice.unit.name} | Customer: {invoice.people.name} | Balance: {balanceText}
                                  </option>
                                );
                              })}
                          </Input>
                          {validation.touched.invoice_id && validation.errors.invoice_id ? (
                            <FormFeedback type="invalid">{validation.errors.invoice_id}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Asset Account <span className="text-danger">*</span></Label>
                          <Input
                            name="account_id"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.account_id || ""}
                            invalid={validation.touched.account_id && validation.errors.account_id ? true : false}
                          >
                            <option value="">Select Asset Account</option>
                            {assetAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.account_name} ({account.account_number})
                              </option>
                            ))}
                          </Input>
                          {validation.touched.account_id && validation.errors.account_id ? (
                            <FormFeedback type="invalid">{validation.errors.account_id}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Amount <span className="text-danger">*</span></Label>
                          <Input
                            name="amount"
                            type="number"
                            step="0.01"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.amount || 0}
                            invalid={validation.touched.amount && validation.errors.amount ? true : false}
                          />
                          {validation.touched.amount && validation.errors.amount ? (
                            <FormFeedback type="invalid">{validation.errors.amount}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col>
                        <div className="text-end">
                          <Button
                            type="button"
                            color="info"
                            className="me-2"
                            onClick={previewSplits}
                            disabled={isLoading || !validation.values.invoice_id || !validation.values.account_id || !validation.values.amount}
                          >
                            Preview Splits
                          </Button>
                          <Button type="submit" color="success" disabled={isLoading || isSubmitting}>
                            {isSubmitting ? "Recording..." : "Record Payment"}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Preview Splits Modal */}
      <Modal isOpen={showSplitsModal} toggle={() => setShowSplitsModal(false)} size="lg">
        <ModalHeader toggle={() => setShowSplitsModal(false)}>Preview Splits</ModalHeader>
        <ModalBody>
          {splitsPreview && (
            <>
              <div className="table-responsive">
                <Table bordered striped>
                  <thead className="table-light">
                    <tr>
                      <th>Account</th>
                      <th>People</th>
                      <th>Unit</th>
                      <th className="text-end">Debit</th>
                      <th className="text-end">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {splitsPreview.splits.map((split, index) => {
                      // Handle both camelCase and snake_case for unit_id, and handle null values
                      const unitId = split.unit_id !== null && split.unit_id !== undefined 
                        ? split.unit_id 
                        : (split.unitId !== null && split.unitId !== undefined ? split.unitId : null);
                      const unit = unitId ? units.find((u) => u.id === unitId) : null;
                      return (
                        <tr key={index}>
                          <td>{getAccountName(split.account_id)}</td>
                          <td>{getPeopleName(split.people_id)}</td>
                          <td>{unit ? unit.name : unitId ? `ID: ${unitId}` : "N/A"}</td>
                          <td className="text-end">
                            {split.debit ? parseFloat(split.debit).toFixed(2) : "-"}
                          </td>
                          <td className="text-end">
                            {split.credit ? parseFloat(split.credit).toFixed(2) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total Row */}
                    <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                      <td colSpan="3" className="text-end">TOTAL</td>
                      <td className="text-end">{parseFloat(splitsPreview.total_debit || 0).toFixed(2)}</td>
                      <td className="text-end">{parseFloat(splitsPreview.total_credit || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
              <div className="mt-3">
                <p>
                  <strong>Balanced:</strong> {splitsPreview.is_balanced ? "Yes ✓" : "No ✗"}
                </p>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>

      <ToastContainer />
      {isLoading && <Spinners setLoading={setLoading} />}
    </React.Fragment>
  );
};

export default CreateInvoicePayment;

