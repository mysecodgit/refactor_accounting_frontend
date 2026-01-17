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
  Table,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const CreateLease = () => {
  document.title = "Create Lease";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [units, setUnits] = useState([]);
  const [leaseFiles, setLeaseFiles] = useState([]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      people_id: "",
      unit_id: "",
      start_date: moment().format("YYYY-MM-DD"),
      end_date: "",
      rent_amount: 300,
      deposit_amount: 0,
      service_amount: 50,
      lease_terms: "",
      status: "1",
    },
    validationSchema: Yup.object({
      people_id: Yup.number().required("Customer is required").min(1, "Please select a customer"),
      unit_id: Yup.number().required("Unit is required").min(1, "Please select a unit"),
      start_date: Yup.date().required("Start date is required"),
      end_date: Yup.date().nullable(),
      rent_amount: Yup.number().min(0, "Rent amount cannot be negative").required("Rent amount is required"),
      deposit_amount: Yup.number().min(0, "Deposit amount cannot be negative").required("Deposit amount is required"),
      service_amount: Yup.number().min(0, "Service amount cannot be negative").required("Service amount is required"),
      lease_terms: Yup.string().nullable(),
      status: Yup.string().required("Status is required"),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const payload = {
          ...values,
          people_id: parseInt(values.people_id),
          unit_id: parseInt(values.unit_id),
          rent_amount: parseFloat(values.rent_amount),
          deposit_amount: parseFloat(values.deposit_amount),
          service_amount: parseFloat(values.service_amount),
          end_date: values.end_date || null,
          status: parseInt(values.status),
        };
        const { data } = await axiosInstance.post(`v1/buildings/${buildingId}/leases`, payload);
        toast.success("Lease created successfully");

        // Upload files if any
        if (leaseFiles.length > 0 && data.lease) {
          for (const file of leaseFiles) {
            await uploadFile(data.lease.id, file);
          }
        }

        navigate(`/building/${buildingId}/leases`);
      } catch (error) {
        const errorMsg = error.response?.data?.error || "Failed to create lease";
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchCustomers = async () => {
    try {
      const { data } = await axiosInstance.get(`v1/buildings/${buildingId}/people`);
      setCustomers(data.data || []);
    } catch (error) {
      console.log("Error fetching customers", error);
      toast.error("Failed to fetch customers");
    }
  };

  const fetchUnits = async () => {
    try {
      const { data } = await axiosInstance.get(`v1/buildings/${buildingId}/available-units`);
      setUnits(data.data || []);
    } catch (error) {
      console.log("Error fetching available units", error);
      toast.error("Failed to fetch available units");
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchUnits();
  }, [buildingId]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setLeaseFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setLeaseFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (leaseId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axiosInstance.post(`v1/buildings/${buildingId}/leases/${leaseId}/files`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload file: ${file.name}`);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Create Lease" breadcrumbItem="Create Lease" />
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
                          <Label>Customer *</Label>
                          <Input
                            name="people_id"
                            type="select"
                            className="form-select"
                            value={validation.values.people_id}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.people_id && validation.errors.people_id ? true : false}
                          >
                            <option value="">Select Customer</option>
                            {customers.map((customer) => (
                              <option key={customer.id} value={customer.id}>
                                {customer.name}
                              </option>
                            ))}
                          </Input>
                          {validation.touched.people_id && validation.errors.people_id ? (
                            <FormFeedback type="invalid">{validation.errors.people_id}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Unit *</Label>
                          <Input
                            name="unit_id"
                            type="select"
                            className="form-select"
                            value={validation.values.unit_id}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.unit_id && validation.errors.unit_id ? true : false}
                          >
                            <option value="">Select Unit</option>
                            {units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.name}
                              </option>
                            ))}
                          </Input>
                          {validation.touched.unit_id && validation.errors.unit_id ? (
                            <FormFeedback type="invalid">{validation.errors.unit_id}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Start Date *</Label>
                          <Input
                            name="start_date"
                            type="date"
                            value={validation.values.start_date}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.start_date && validation.errors.start_date ? true : false}
                          />
                          {validation.touched.start_date && validation.errors.start_date ? (
                            <FormFeedback type="invalid">{validation.errors.start_date}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="mb-3">
                          <Label>End Date</Label>
                          <Input
                            name="end_date"
                            type="date"
                            value={validation.values.end_date}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.end_date && validation.errors.end_date ? true : false}
                          />
                          {validation.touched.end_date && validation.errors.end_date ? (
                            <FormFeedback type="invalid">{validation.errors.end_date}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Rent Amount *</Label>
                          <Input
                            name="rent_amount"
                            type="number"
                            step="0.01"
                            value={validation.values.rent_amount}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.rent_amount && validation.errors.rent_amount ? true : false}
                          />
                          {validation.touched.rent_amount && validation.errors.rent_amount ? (
                            <FormFeedback type="invalid">{validation.errors.rent_amount}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Deposit Amount *</Label>
                          <Input
                            name="deposit_amount"
                            type="number"
                            step="0.01"
                            value={validation.values.deposit_amount}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.deposit_amount && validation.errors.deposit_amount ? true : false}
                          />
                          {validation.touched.deposit_amount && validation.errors.deposit_amount ? (
                            <FormFeedback type="invalid">{validation.errors.deposit_amount}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={4}>
                        <div className="mb-3">
                          <Label>Service Amount *</Label>
                          <Input
                            name="service_amount"
                            type="number"
                            step="0.01"
                            value={validation.values.service_amount}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.service_amount && validation.errors.service_amount ? true : false}
                          />
                          {validation.touched.service_amount && validation.errors.service_amount ? (
                            <FormFeedback type="invalid">{validation.errors.service_amount}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={12}>
                        <div className="mb-3">
                          <Label>Lease Terms</Label>
                          <Input
                            name="lease_terms"
                            type="textarea"
                            rows="5"
                            value={validation.values.lease_terms}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.lease_terms && validation.errors.lease_terms ? true : false}
                          />
                          {validation.touched.lease_terms && validation.errors.lease_terms ? (
                            <FormFeedback type="invalid">{validation.errors.lease_terms}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Status *</Label>
                          <Input
                            name="status"
                            type="select"
                            className="form-select"
                            value={validation.values.status}
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            invalid={validation.touched.status && validation.errors.status ? true : false}
                          >
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                          </Input>
                          {validation.touched.status && validation.errors.status ? (
                            <FormFeedback type="invalid">{validation.errors.status}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>

                      <Col md={12}>
                        <div className="mb-3">
                          <Label>Lease Files (Optional)</Label>
                          <Input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                          {leaseFiles.length > 0 && (
                            <Table className="mt-2" bordered size="sm">
                              <thead>
                                <tr>
                                  <th>File Name</th>
                                  <th>Size</th>
                                  <th>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {leaseFiles.map((file, index) => (
                                  <tr key={index}>
                                    <td>{file.name}</td>
                                    <td>{formatFileSize(file.size)}</td>
                                    <td>
                                      <Button
                                        color="danger"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                      >
                                        Remove
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          )}
                        </div>
                      </Col>
                    </Row>

                    <div className="text-end">
                      <Button type="submit" color="success" className="me-2">
                        Create Lease
                      </Button>
                      <Button
                        type="button"
                        color="secondary"
                        onClick={() => navigate(`/building/${buildingId}/leases`)}
                      >
                        Cancel
                      </Button>
                    </div>
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

export default CreateLease;

