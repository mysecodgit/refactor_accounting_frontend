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

const ProfitAndLossStandard = () => {
  document.title = "Profit and Loss (Standard)";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [buildingName, setBuildingName] = useState("");

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      start_date: moment().startOf("month").format("YYYY-MM-DD"),
      end_date: moment().endOf("month").format("YYYY-MM-DD"),
    },
    validationSchema: Yup.object({
      start_date: Yup.string().required("Start date is required"),
      end_date: Yup.string().required("End date is required"),
    }),
    onSubmit: async (values) => {
      await fetchReport(values);
    },
  });

  const fetchReport = async (filters) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      const url = `v1/buildings/${buildingId}/reports/profit-and-loss-standard?start_date=${filters.start_date}&end_date=${filters.end_date}`;
      const { data } = await axiosInstance.get(url);
      setReport(data.data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch report");
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildingName = async () => {
    if (!buildingId) return;
    try {
      const { data } = await axiosInstance.get(`v1/buildings/${buildingId}`);
      setBuildingName(data.data.name || "");
    } catch (error) {
      console.error("Error fetching building name:", error);
    }
  };

  const handlePrint = () => {
    if (!report) return;
    const originalTitle = document.title;
    const startDateStr = moment(report.start_date).format("MMM D, YYYY").toLowerCase();
    const endDateStr = moment(report.end_date).format("MMM D, YYYY").toLowerCase();
    document.title = `Profit and Loss Statement ${startDateStr} to ${endDateStr}`;
    window.print();
    // Restore original title after a short delay
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  useEffect(() => {
    if (buildingId) {
      fetchBuildingName();
      fetchReport(validation.values);
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
          .print-table .section-header {
            background-color: #e0e0e0;
            font-weight: bold;
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
          <Breadcrumbs title="Profit and Loss (Standard)" breadcrumbItem="Profit and Loss (Standard)" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3 no-print">
                    <Col md={3}>
                      <Label>Start Date <span className="text-danger">*</span></Label>
                      <Input
                        name="start_date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.start_date}
                        invalid={validation.touched.start_date && validation.errors.start_date ? true : false}
                      />
                    </Col>
                    <Col md={3}>
                      <Label>End Date <span className="text-danger">*</span></Label>
                      <Input
                        name="end_date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.end_date}
                        invalid={validation.touched.end_date && validation.errors.end_date ? true : false}
                      />
                    </Col>
                    <Col md={3} className="d-flex align-items-end">
                      <Button
                        type="button"
                        color="primary"
                        onClick={validation.handleSubmit}
                        disabled={isLoading}
                      >
                        Generate Report
                      </Button>
                    </Col>
                  </Row>

                  {isLoading && <Spinners />}

                  {report && !isLoading && (
                    <div className="screen-only">
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Row className="mb-3" style={{ width: "60%", textAlign: "center" }}>
                          <Col>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <div style={{ flex: 1 }}></div>
                              <div style={{ flex: 1, textAlign: "center" }}>
                                <h5>Profit and Loss Statement</h5>
                                <p className="text-muted">
                                  Period: {moment(report.start_date).format("MMM DD, YYYY")} - {moment(report.end_date).format("MMM DD, YYYY")}
                                </p>
                              </div>
                              <div style={{ flex: 1, textAlign: "right" }}>
                                <Button color="primary" size="sm" className="no-print" onClick={handlePrint}>
                                  <i className="fas fa-print me-1"></i> Print
                                </Button>
                              </div>
                            </div>
                          </Col>
                        </Row>

                        <div style={{ width: "60%", margin: "0 auto" }}>
                          <Table bordered striped className="table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>Account #</th>
                                <th>Account Name</th>
                                <th className="text-end">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td colSpan="3" className="bg-light">
                                  <strong>{report.income.section_name}</strong>
                                </td>
                              </tr>
                              {report.income.accounts.map((account, index) => (
                                <tr key={`income-${account.account_id}`}>
                                  <td>{account.account_number}</td>
                                  <td>{account.account_name}</td>
                                  <td className="text-end">{formatNumber(account.balance)}</td>
                                </tr>
                              ))}
                              {report.income.accounts.length === 0 && (
                                <tr>
                                  <td colSpan="3" className="text-center text-muted">No income accounts</td>
                                </tr>
                              )}
                              <tr className="table-info">
                                <td colSpan="2" className="text-end"><strong>Total Income</strong></td>
                                <td className="text-end"><strong>{formatNumber(report.income.total)}</strong></td>
                              </tr>
                              <tr>
                                <td colSpan="3" className="bg-light">
                                  <strong>{report.expenses.section_name}</strong>
                                </td>
                              </tr>
                              {report.expenses.accounts.map((account, index) => (
                                <tr key={`expense-${account.account_id}`}>
                                  <td>{account.account_number}</td>
                                  <td>{account.account_name}</td>
                                  <td className="text-end">{formatNumber(account.balance)}</td>
                                </tr>
                              ))}
                              {report.expenses.accounts.length === 0 && (
                                <tr>
                                  <td colSpan="3" className="text-center text-muted">No expense accounts</td>
                                </tr>
                              )}
                              <tr className="table-info">
                                <td colSpan="2" className="text-end"><strong>Total Expenses</strong></td>
                                <td className="text-end"><strong>{formatNumber(report.expenses.total)}</strong></td>
                              </tr>
                              <tr className={report.net_profit_loss >= 0 ? "table-success" : "table-danger"}>
                                <td colSpan="2" className="text-end"><strong>Net {report.net_profit_loss >= 0 ? "Profit" : "Loss"}</strong></td>
                                <td className="text-end"><strong>{formatNumber(report.net_profit_loss)}</strong></td>
                              </tr>
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Print-only section */}
                  {report && !isLoading && (
                    <div className="print-only print-report">
                      {/* Print-only building name header */}
                      {buildingName && (
                        <div className="print-building-name">
                          {buildingName}
                        </div>
                      )}
                      <div className="print-header">
                        <h2>Profit and Loss Statement</h2>
                        <p>Period: {moment(report.start_date).format("MMMM DD, YYYY")} - {moment(report.end_date).format("MMMM DD, YYYY")}</p>
                      </div>

                      <table className="print-table" style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
                        <thead>
                          <tr>
                            <th style={{ width: "15%" }}>Account #</th>
                            <th style={{ width: "55%" }}>Account Name</th>
                            <th style={{ width: "30%", textAlign: "right" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan="3" className="section-header">{report.income.section_name}</td>
                          </tr>
                          {report.income.accounts.map((account, index) => (
                            <tr key={`income-${account.account_id}`}>
                              <td>{account.account_number}</td>
                              <td>{account.account_name}</td>
                              <td style={{ textAlign: "right" }}>{formatNumber(account.balance)}</td>
                            </tr>
                          ))}
                          {report.income.accounts.length === 0 && (
                            <tr>
                              <td colSpan="3" style={{ textAlign: "center" }}>No income accounts</td>
                            </tr>
                          )}
                          <tr className="total-row">
                            <td colSpan="2" style={{ textAlign: "right" }}><strong>Total Income</strong></td>
                            <td style={{ textAlign: "right" }}><strong>{formatNumber(report.income.total)}</strong></td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="section-header">{report.expenses.section_name}</td>
                          </tr>
                          {report.expenses.accounts.map((account, index) => (
                            <tr key={`expense-${account.account_id}`}>
                              <td>{account.account_number}</td>
                              <td>{account.account_name}</td>
                              <td style={{ textAlign: "right" }}>{formatNumber(account.balance)}</td>
                            </tr>
                          ))}
                          {report.expenses.accounts.length === 0 && (
                            <tr>
                              <td colSpan="3" style={{ textAlign: "center" }}>No expense accounts</td>
                            </tr>
                          )}
                          <tr className="total-row">
                            <td colSpan="2" style={{ textAlign: "right" }}><strong>Total Expenses</strong></td>
                            <td style={{ textAlign: "right" }}><strong>{formatNumber(report.expenses.total)}</strong></td>
                          </tr>
                          <tr className="total-row">
                            <td colSpan="2" style={{ textAlign: "right" }}>
                              <strong>Net {report.net_profit_loss >= 0 ? "Profit" : "Loss"}</strong>
                            </td>
                            <td style={{ textAlign: "right" }}><strong>{formatNumber(report.net_profit_loss)}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default ProfitAndLossStandard;

