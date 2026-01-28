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

const CreateBillPayment = () => {
  document.title = "Record Bill Payment";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [assetAccounts, setAssetAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [billBalances, setBillBalances] = useState({});
  const [splitsPreview, setSplitsPreview] = useState(null);
  const [showSplitsModal, setShowSplitsModal] = useState(false);
  const [userId] = useState(1); // TODO: Get from auth context

  // Load date from localStorage if available
  const getInitialDate = () => {
    const saved = localStorage.getItem(`create_bill_payment_date_${buildingId}`);
    return saved || moment().format("YYYY-MM-DD");
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      reference: "",
      date: getInitialDate(),
      bill_id: "",
      account_id: "",
      amount: 0,
      status: 1,
      building_id: buildingId ? parseInt(buildingId) : "",
    },
    validationSchema: Yup.object({
      reference: Yup.string().required("Reference is required"),
      date: Yup.date().required("Date is required"),
      bill_id: Yup.number().required("Bill is required").min(1, "Please select a bill"),
      account_id: Yup.number().required("Asset Account is required").min(1, "Please select an asset account"),
      amount: Yup.number().required("Amount is required").min(0.01, "Amount must be greater than 0"),
      status: Yup.number().oneOf([0, 1]),
      building_id: Yup.number().required("Building ID is required"),
    }),
    onSubmit: async (values) => {
      if (isSubmitting) {
        return;
      }
      
      setIsSubmitting(true);
      try {
        const payload = {
          reference: values.reference,
          date: values.date,
          bill_id: parseInt(values.bill_id),
          account_id: parseInt(values.account_id),
          amount: parseFloat(values.amount),
          status: parseInt(values.status),
          building_id: parseInt(values.building_id),
        };

        let url = "bill-payments";
        if (buildingId) {
          url = `v1/buildings/${buildingId}/bill-payments`;
        }

        await axiosInstance.post(url, payload);
        toast.success("Bill payment created successfully");
        navigate(`/building/${buildingId}/bill-payments`);
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const fetchBills = async () => {
    try {
      let url = "bills";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/bills`;
      }
      const { data } = await axiosInstance.get(url);
      setBills(data.data || []);
    } catch (error) {
      console.log("Error fetching bills", error);
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

  // Save date to localStorage whenever it changes
  useEffect(() => {
    if (validation.values.date) {
      localStorage.setItem(`create_bill_payment_date_${buildingId}`, validation.values.date);
    }
  }, [validation.values.date, buildingId]);

  useEffect(() => {
    fetchBills();
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

  const getUnitName = (unitId) => {
    if (!unitId) return "N/A";
    const unit = units.find((u) => u.id === unitId);
    return unit ? unit.name : "N/A";
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Record Bill Payment" breadcrumbItem="Record Payment" />
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
                          <Label>Bill <span className="text-danger">*</span></Label>
                          <Input
                            name="bill_id"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.bill_id || ""}
                            invalid={validation.touched.bill_id && validation.errors.bill_id ? true : false}
                          >
                            <option value="">Select Bill</option>
                            {bills
                              .filter((bill) => bill.status === "1")
                              .map((bill) => {
                                const unitName = getUnitName(bill.unit_id);
                                const vendorName = getPeopleName(bill.people_id);
                                return (
                                  <option key={bill.id} value={bill.id}>
                                    Bill #{bill.bill_no} | Unit: {unitName} | Vendor: {vendorName} | Amount: {parseFloat(bill.amount || 0).toFixed(2)}
                                  </option>
                                );
                              })}
                          </Input>
                          {validation.touched.bill_id && validation.errors.bill_id ? (
                            <FormFeedback type="invalid">{validation.errors.bill_id}</FormFeedback>
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
                          <Button type="button" color="secondary" className="me-2" onClick={() => navigate(`/building/${buildingId}/bill-payments`)}>
                            Cancel
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

      <ToastContainer />
      {isLoading && <Spinners setLoading={setLoading} />}
    </React.Fragment>
  );
};

export default CreateBillPayment;
