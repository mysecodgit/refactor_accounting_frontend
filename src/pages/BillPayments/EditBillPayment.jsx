import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Label,
  FormFeedback,
  Input,
  Form,
  Button,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const EditBillPayment = () => {
  document.title = "Edit Bill Payment";
  const { id: buildingId, paymentId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [assetAccounts, setAssetAccounts] = useState([]);
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

        let url = `bill-payments/${paymentId}`;
        if (buildingId) {
          url = `v1/buildings/${buildingId}/bill-payments/${paymentId}`;
        }

        await axiosInstance.put(url, payload);
        toast.success("Bill payment updated successfully");
        navigate(`/building/${buildingId}/bill-payments`);
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
      }
    },
  });

  const fetchPaymentForEdit = async () => {
    if (!paymentId) {
      return;
    }
    try {
      setLoading(true);
      validation.resetForm();
      
      let url = `bill-payments/${paymentId}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/bill-payments/${paymentId}`;
      }
      const { data: response } = await axiosInstance.get(url);
      
      const payment = response.data.payment || response.data;
      
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
        const momentDate = moment(dateStr);
        if (momentDate.isValid()) {
          return momentDate.format("YYYY-MM-DD");
        }
        return "";
      };
      
      const rawDate = payment.date || payment.Date || "";
      let paymentDate = formatDate(rawDate);
      
      if (!paymentDate && rawDate) {
        const momentDate = moment(rawDate);
        if (momentDate.isValid()) {
          paymentDate = momentDate.format("YYYY-MM-DD");
        }
      }
      
      if (!paymentDate) {
        paymentDate = moment().format("YYYY-MM-DD");
      }
      
      validation.setValues({
        reference: payment.reference || "",
        date: paymentDate,
        account_id: payment.account_id || "",
        amount: payment.amount || 0,
        status: payment.status === "1" || payment.status === 1 ? 1 : 0,
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

  useEffect(() => {
    fetchAccounts();
    if (paymentId) {
      fetchPaymentForEdit();
    }
  }, [buildingId, paymentId]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Edit Bill Payment" breadcrumbItem="Edit Payment" />
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
                            value={validation.values.status}
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
                          <Button type="button" color="secondary" className="me-2" onClick={() => navigate(`/building/${buildingId}/bill-payments`)}>
                            Cancel
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

      <ToastContainer />
      {isLoading && <Spinners setLoading={setLoading} />}
    </React.Fragment>
  );
};

export default EditBillPayment;
