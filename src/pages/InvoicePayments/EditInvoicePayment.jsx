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

const EditInvoicePayment = () => {
  document.title = "Edit Invoice Payment";
  const { id: buildingId, paymentId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [assetAccounts, setAssetAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [splitsPreview, setSplitsPreview] = useState(null);
  const [showSplitsModal, setShowSplitsModal] = useState(false);
  const [userId] = useState(1); // TODO: Get from auth context

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      reference: "",
      date: moment().format("YYYY-MM-DD"),
      account_id: "",
      amount: 0,
      status: 1,
      building_id: buildingId ? parseInt(buildingId) : "",
    },
    validationSchema: Yup.object({
      reference: Yup.string().required("Reference is required"),
      date: Yup.date().required("Date is required"),
      account_id: Yup.number().required("Asset Account is required").min(1, "Please select an asset account"),
      amount: Yup.number().required("Amount is required").min(0.01, "Amount must be greater than 0"),
      status: Yup.number().oneOf([0, 1]),
      building_id: Yup.number().required("Building ID is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          reference: values.reference,
          date: values.date,
          account_id: parseInt(values.account_id),
          amount: parseFloat(values.amount),
          status: parseInt(values.status),
          building_id: parseInt(values.building_id),
        };

        let url = `invoice-payments/${paymentId}`;
        if (buildingId) {
          url = `buildings/${buildingId}/invoice-payments/${paymentId}`;
        }

        const config = {
          headers: {
            "User-ID": userId.toString(),
          },
        };

        await axiosInstance.put(url, payload, config);
        toast.success("Invoice payment updated successfully");
        navigate(`/building/${buildingId}/invoice-payments`);
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
      }
    },
  });

  const fetchPaymentForEdit = async () => {
    if (!paymentId) {
      console.log("No paymentId found in params");
      return;
    }
    console.log("Fetching payment for edit, paymentId:", paymentId, "buildingId:", buildingId); // Debug
    try {
      setLoading(true);
      // Reset form first to clear any previous payment data
      validation.resetForm();
      
      let url = `invoice-payments/${paymentId}`;
      if (buildingId) {
        url = `buildings/${buildingId}/invoice-payments/${paymentId}`;
      }
      console.log("Fetching from URL:", url); // Debug
      const { data: response } = await axiosInstance.get(url);
      console.log("Full API response for edit:", response); // Debug
      
      // The API returns InvoicePaymentResponse with payment, splits, transaction, invoice
      const payment = response.payment || response;
      console.log("Payment object extracted:", payment); // Debug
      console.log("Payment.date:", payment.date); // Debug
      console.log("Payment.Date:", payment.Date); // Debug
      
      // Format date helper - same pattern as EditInvoice
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        // Handle both string and date formats
        const dateValue = dateStr;
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateValue;
        }
        // Try to format with moment
        const momentDate = moment(dateValue);
        if (momentDate.isValid()) {
          return momentDate.format("YYYY-MM-DD");
        }
        return "";
      };
      
      // Get date from payment object - try multiple possible field names
      const rawDate = payment.date || payment.Date || "";
      console.log("Raw date value:", rawDate, "Type:", typeof rawDate); // Debug
      
      let paymentDate = formatDate(rawDate);
      console.log("Formatted payment date after formatDate:", paymentDate); // Debug
      
      // If formatDate returned empty but we have a rawDate, try direct moment formatting
      if (!paymentDate && rawDate) {
        const momentDate = moment(rawDate);
        if (momentDate.isValid()) {
          paymentDate = momentDate.format("YYYY-MM-DD");
          console.log("Date formatted with moment fallback:", paymentDate); // Debug
        } else {
          console.warn("Could not parse date:", rawDate);
        }
      }
      
      // Only use today as last resort if we truly have no date
      if (!paymentDate && !rawDate) {
        paymentDate = moment().format("YYYY-MM-DD");
        console.warn("No date found in response, using today:", paymentDate);
      } else if (!paymentDate) {
        // If we have rawDate but formatDate failed, try one more time with moment
        paymentDate = moment(rawDate).isValid() ? moment(rawDate).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
        console.log("Final payment date after all attempts:", paymentDate);
      }
      
      // Handle status - convert string "1" to int 1, or keep int
      let paymentStatus = payment.status;
      if (paymentStatus === undefined || paymentStatus === null) {
        paymentStatus = payment.Status;
      }
      if (paymentStatus === "1" || paymentStatus === 1) {
        paymentStatus = 1;
      } else if (paymentStatus === "0" || paymentStatus === 0) {
        paymentStatus = 0;
      } else {
        paymentStatus = 1; // Default to active
      }
      
      // Handle reference
      const reference = payment.reference || payment.Reference || "";
      
      // Handle account_id
      const accountId = payment.account_id || payment.AccountID || "";
      
      // Handle amount
      const amount = payment.amount || payment.Amount || 0;
      
      console.log("Setting form values:", {
        reference: reference,
        date: paymentDate,
        account_id: accountId,
        amount: amount,
        status: paymentStatus,
      });
      
      validation.setValues({
        reference: reference,
        date: paymentDate,
        account_id: accountId,
        amount: amount,
        status: paymentStatus,
        building_id: buildingId ? parseInt(buildingId) : "",
      });
    } catch (error) {
      console.log("Error fetching payment for edit", error);
      toast.error("Failed to fetch payment details");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      let url = "accounts";
      if (buildingId) {
        url = `buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data || []);
      
      const assetAccountsList = (data || []).filter((account) => {
        const typeName = account.account_type?.typeName || "";
        return typeName.toLowerCase().includes("asset") || 
               typeName.toLowerCase().includes("cash") ||
               typeName.toLowerCase().includes("bank");
      });
      setAssetAccounts(assetAccountsList);
    } catch (error) {
      console.log("Error fetching accounts", error);
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
      setPeople(data || []);
    } catch (error) {
      console.log("Error fetching people", error);
    }
  };

  const previewSplits = async () => {
    if (!validation.values.account_id || !validation.values.amount) {
      toast.error("Please fill in all required fields before previewing splits");
      return;
    }

    // Get the invoice_id from the payment
    try {
      setLoading(true);
      let url = `invoice-payments/${paymentId}`;
      if (buildingId) {
        url = `buildings/${buildingId}/invoice-payments/${paymentId}`;
      }
      const { data: response } = await axiosInstance.get(url);
      // The API returns InvoicePaymentResponse with payment, splits, transaction, invoice
      const payment = response.payment || response;

      const payload = {
        date: validation.values.date,
        invoice_id: payment.invoice_id,
        account_id: parseInt(validation.values.account_id),
        amount: parseFloat(validation.values.amount),
        building_id: parseInt(validation.values.building_id),
      };

      let previewUrl = "invoice-payments/preview";
      if (buildingId) {
        previewUrl = `buildings/${buildingId}/invoice-payments/preview`;
      }

      const { data } = await axiosInstance.post(previewUrl, payload);
      setSplitsPreview(data);
      setShowSplitsModal(true);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
      toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchUnits();
    fetchPeople();
  }, [buildingId]);

  useEffect(() => {
    // Separate effect for paymentId to ensure it runs when paymentId changes
    console.log("useEffect triggered, paymentId:", paymentId, "buildingId:", buildingId); // Debug
    if (paymentId) {
      fetchPaymentForEdit();
    }
  }, [paymentId, buildingId]); // Re-run when paymentId or buildingId changes

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
          <Breadcrumbs title="Edit Invoice Payment" breadcrumbItem="Edit Payment" />
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
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Status</Label>
                          <Input
                            name="status"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.status !== undefined ? validation.values.status : 1}
                          >
                            <option value={1}>Active</option>
                            <option value={0}>Inactive</option>
                          </Input>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col>
                        <div className="text-end">
                          <Button
                            type="button"
                            color="secondary"
                            className="me-2"
                            onClick={() => navigate(`/building/${buildingId}/invoice-payments`)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            color="info"
                            className="me-2"
                            onClick={previewSplits}
                            disabled={isLoading || !validation.values.account_id || !validation.values.amount}
                          >
                            Preview Splits
                          </Button>
                          <Button type="submit" color="primary" disabled={isLoading}>
                            Update Payment
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
                      <th className="text-end">Debit</th>
                      <th className="text-end">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {splitsPreview.splits.map((split, index) => (
                      <tr key={index}>
                        <td>{getAccountName(split.account_id)}</td>
                        <td>{getPeopleName(split.people_id)}</td>
                        <td className="text-end">
                          {split.debit ? parseFloat(split.debit).toFixed(2) : "-"}
                        </td>
                        <td className="text-end">
                          {split.credit ? parseFloat(split.credit).toFixed(2) : "-"}
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                      <td colSpan="2" className="text-end">TOTAL</td>
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

export default EditInvoicePayment;

