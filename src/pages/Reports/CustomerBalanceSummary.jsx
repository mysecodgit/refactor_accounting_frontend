import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Label,
  Input,
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
import { formatNumber } from "../../utils/numberFormat";

const CustomerBalanceSummary = () => {
  document.title = "Customer Balance Summary";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [buildingName, setBuildingName] = useState("");

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      as_of_date: moment().format("YYYY-MM-DD"),
    },
    validationSchema: Yup.object({
      as_of_date: Yup.string().required("As of date is required"),
    }),
    onSubmit: async (values) => {
      await fetchReport(values.as_of_date);
    },
  });

  const fetchReport = async (asOfDate) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      let url = `buildings/${buildingId}/reports/customer-balance-summary?as_of_date=${asOfDate}`;
      const { data } = await axiosInstance.get(url);
      setReport(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch report");
      console.error("Error fetching customer balance summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildingName = async () => {
    if (!buildingId) return;
    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}`);
      setBuildingName(data.name || "");
    } catch (error) {
      console.error("Error fetching building name:", error);
    }
  };

  const handlePrint = () => {
    if (!report) return;
    const originalTitle = document.title;
    const dateStr = moment(report.as_of_date).format("MMM D, YYYY").toLowerCase();
    document.title = `Customer Balance Summary As of ${dateStr}`;
    window.print();
    // Restore original title after a short delay
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  useEffect(() => {
    if (buildingId) {
      fetchBuildingName();
      fetchReport(validation.values.as_of_date);
    }
  }, [buildingId]);

  return (
    <React.Fragment>
      <style>{`
        @media print {
          .screen-only {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .page-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: A4;
            margin: 1.5cm;
          }
          .print-report {
            font-family: Arial, sans-serif;
            color: black;
          }
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .print-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
          }
          .print-header p {
            margin: 5px 0;
            font-size: 12px;
          }
          .print-building-name {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
            padding: 10px 0;
            text-transform: uppercase;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }
          .print-table th,
          .print-table td {
            padding: 6px 8px;
            border: 1px solid #000;
            text-align: left;
          }
          .print-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .print-table .text-right {
            text-align: right;
          }
          .print-table .total-row {
            font-weight: bold;
            border-top: 2px solid #000;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Customer Balance Summary" breadcrumbItem="Customer Balance Summary" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3 no-print">
                    <Col md={4}>
                      <Label>As Of Date <span className="text-danger">*</span></Label>
                      <Input
                        name="as_of_date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.as_of_date}
                        invalid={validation.touched.as_of_date && validation.errors.as_of_date ? true : false}
                      />
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      <Button
                        type="button"
                        color="primary"
                        className="me-2"
                        onClick={validation.handleSubmit}
                        disabled={isLoading}
                      >
                        Generate Report
                      </Button>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : report && report.customers && report.customers.length > 0 ? (
            <>
              {/* Dashboard view - screen only */}
              <Row className="screen-only">
                <Col xs={12}>
                  <Card>
                    <CardBody>
                      <div className="mb-3 text-center">
                        <h5>Customer Balance Summary</h5>
                        <p className="text-muted">
                          As of: {moment(report.as_of_date).format("YYYY-MM-DD")}
                        </p>
                        <Button color="primary" className="no-print" onClick={handlePrint}>
                          <i className="fas fa-print me-1"></i> Print
                        </Button>
                      </div>
                      <div className="table-responsive d-flex justify-content-center">
                        <Table bordered striped style={{ width: "60%" }}>
                          <thead className="table-light">
                            <tr>
                              <th>Customer Name</th>
                              <th className="text-end">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.customers.map((customer, index) => (
                              <tr key={`customer-${customer.people_id}-${index}`}>
                                <td>{customer.people_name}</td>
                                <td className="text-end">
                                  {customer.balance >= 0 ? (
                                    <span style={{ color: "black" }}>
                                      {formatNumber(customer.balance)}
                                    </span>
                                  ) : (
                                    <span style={{ color: "black" }}>
                                      {formatNumber(customer.balance)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                              <td className="text-end">Total Balance</td>
                              <td className="text-end">
                                <span style={{ color: "black" }}>
                                  {formatNumber(report.total_balance)}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </Table>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              {/* Print-only section */}
              <div className="print-only print-report">
                {/* Print-only building name header */}
                {buildingName && (
                  <div className="print-building-name">
                    {buildingName}
                  </div>
                )}
                <div className="print-header">
                  <h2>Customer Balance Summary</h2>
                  <p>As of: {moment(report.as_of_date).format("MMMM DD, YYYY")}</p>
                </div>

                <table className="print-table" style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "70%" }}>Customer Name</th>
                      <th style={{ width: "30%", textAlign: "right" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.customers.map((customer, index) => (
                      <tr key={`customer-${customer.people_id}-${index}`}>
                        <td>{customer.people_name}</td>
                        <td style={{ textAlign: "right" }}>
                          {formatNumber(customer.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="total-row">
                      <td style={{ textAlign: "right" }}>Total Balance</td>
                      <td style={{ textAlign: "right" }}>
                        {formatNumber(report.total_balance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          ) : report && report.customers && report.customers.length === 0 ? (
            <Row>
              <Col xs={12}>
                <Card>
                  <CardBody>
                    <div className="text-center">
                      <p>No customer balances found for the selected date.</p>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : null}
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default CustomerBalanceSummary;

