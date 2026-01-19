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

const BalanceSheet = () => {
  document.title = "Balance Sheet";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [balanceSheet, setBalanceSheet] = useState(null);
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
      await fetchBalanceSheet(values.as_of_date);
    },
  });

  const fetchBalanceSheet = async (asOfDate) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      const url = `v1/buildings/${buildingId}/reports/balance-sheet?as_of_date=${asOfDate}`;
      const { data } = await axiosInstance.get(url);
      setBalanceSheet(data.data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch balance sheet");
      console.error("Error fetching balance sheet:", error);
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
    if (!balanceSheet) return;
    const originalTitle = document.title;
    const dateStr = moment(balanceSheet.as_of_date).format("MMM D, YYYY").toLowerCase();
    document.title = `Balance Sheet As of ${dateStr}`;
    window.print();
    // Restore original title after a short delay
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  useEffect(() => {
    if (buildingId) {
      fetchBuildingName();
      fetchBalanceSheet(validation.values.as_of_date);
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
            .full-width {
              width: 100% !important;
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
          .print-summary {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 2px solid #000;
          }
          .liabilities-equity-col {
            width: 100% !important;
            max-width: 100% !important;
            flex: 0 0 100% !important;
          }
          .equity-table-print {
            width: 100% !important;
          }
          .print-only.full-width {
            display: table-row !important;
          }
          .print-only.full-width td {
            width: 50% !important;
          }
          .print-only.full-width td:first-child {
            width: 70% !important;
          }
          .print-only.full-width td:last-child {
            width: 30% !important;
            text-align: right !important;
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
          <Breadcrumbs title="Balance Sheet" breadcrumbItem="Balance Sheet" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3 no-print">
                    <Col md={4}>
                      <Label>As of Date <span className="text-danger">*</span></Label>
                      <Input
                        name="as_of_date"
                        type="date"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.as_of_date}
                        invalid={validation.touched.as_of_date && validation.errors.as_of_date ? true : false}
                      />
                    </Col>
                    <Col md={4} className="d-flex align-items-end">
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

                  {isLoading && <Spinners />}

                  {balanceSheet && !isLoading && (
                    <div>
                      {/* Print-only building name header */}
                      {buildingName && (
                        <div className="print-only print-building-name">
                          {buildingName}
                        </div>
                      )}
                      {/* Print-only centered header */}
                      <div className="print-only print-header">
                        <h2>Balance Sheet</h2>
                        <p>As of: {moment(balanceSheet.as_of_date).format("MMMM DD, YYYY")}</p>
                      </div>
                      <Row className="mb-3 screen-only">
                        <Col>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h4>Balance Sheet</h4>
                              <p className="text-muted">As of: {moment(balanceSheet.as_of_date).format("MMMM DD, YYYY")}</p>
                            </div>
                            <Button color="primary" className="no-print" onClick={handlePrint}>
                              <i className="fas fa-print me-1"></i> Print
                            </Button>
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Card>
                            <CardBody>
                              <h5 className="mb-3">{balanceSheet.assets.section_name}</h5>
                              <Table striped>
                                <thead>
                                  <tr>
                                    <th>Account</th>
                                    <th className="text-end">Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {balanceSheet.assets.accounts.map((account, index) => (
                                    <tr key={index}>
                                      <td>{account.account_name}</td>
                                      <td className="text-end">{formatNumber(account.balance)}</td>
                                    </tr>
                                  ))}
                                  <tr className="fw-bold">
                                    <td>Total Assets</td>
                                    <td className="text-end">{formatNumber(balanceSheet.total_assets)}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </CardBody>
                          </Card>
                        </Col>

                        <Col md={6} className="liabilities-equity-col">
                          <Card>
                            <CardBody>
                              <h5 className="mb-3">{balanceSheet.liabilities.section_name}</h5>
                              <Table striped>
                                <thead>
                                  <tr>
                                    <th>Account</th>
                                    <th className="text-end">Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {balanceSheet.liabilities.accounts.map((account, index) => (
                                    <tr key={index}>
                                      <td>{account.account_name}</td>
                                      <td className="text-end">{formatNumber(account.balance)}</td>
                                    </tr>
                                  ))}
                                  <tr className="fw-bold">
                                    <td>Total Liabilities</td>
                                    <td className="text-end">{formatNumber(balanceSheet.liabilities.total)}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </CardBody>
                          </Card>

                          <Card className="mt-3">
                            <CardBody>
                              <h5 className="mb-3">{balanceSheet.equity.section_name}</h5>
                              <Table striped className="equity-table-print">
                                <thead>
                                  <tr>
                                    <th>Account</th>
                                    <th className="text-end">Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {balanceSheet.equity.accounts.map((account, index) => (
                                    <tr key={index} style={account.account_id === 0 ? { fontStyle: "italic" } : {}}>
                                      <td>{account.account_name}</td>
                                      <td className="text-end">{formatNumber(account.balance)}</td>
                                    </tr>
                                  ))}
                                  <tr className="fw-bold">
                                    <td>Total Equity</td>
                                    <td className="text-end">{formatNumber(balanceSheet.equity.total)}</td>
                                  </tr>
                                  <tr className="">
                                    <td></td>
                                    <td className="text-end"> </td>
                                  </tr>
                                
                                  <tr className="fw-bold print-only full-width" >
                                    <td >Total Liabilities & Equity </td>
                                    <td  className="text-end">{formatNumber(balanceSheet.total_liabilities_and_equity)}</td>
                                  </tr>
                                </tbody>
                              </Table>
                            </CardBody>
                          </Card>
                        </Col>
                      </Row>

                      <Row className="mt-4 screen-only">
                        <Col>
                          <Card className="border-0 shadow-sm">
                            <CardBody className="bg-light">
                              <Row className="align-items-center">
                                <Col md={6} className="text-center mb-3 mb-md-0">
                                  <div className="p-3 bg-white rounded border">
                                    <h6 className="text-muted mb-2" style={{ fontSize: "0.9rem", fontWeight: "normal" }}>Total Assets</h6>
                                    <h4 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                                      {formatNumber(balanceSheet.total_assets)}
                                    </h4>
                                  </div>
                                </Col>
                                <Col md={6} className="text-center">
                                  <div className="p-3 bg-white rounded border">
                                    <h6 className="text-muted mb-2" style={{ fontSize: "0.9rem", fontWeight: "normal" }}>Total Liabilities & Equity</h6>
                                    <h4 className="mb-0 fw-bold" style={{ color: "#2c3e50" }}>
                                      {formatNumber(balanceSheet.total_liabilities_and_equity)}
                                    </h4>
                                  </div>
                                </Col>
                              </Row>
                              <Row className="mt-3">
                                <Col className="text-center">
                                  <div className={`d-inline-block px-4 py-2 rounded ${balanceSheet.is_balanced ? "bg-success" : "bg-danger"} text-white`}>
                                    <strong>
                                      {balanceSheet.is_balanced ? "✓ Balanced" : "✗ Not Balanced"}
                                    </strong>
                                  </div>
                                </Col>
                              </Row>
                            </CardBody>
                          </Card>
                        </Col>
                      </Row>

                     
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

export default BalanceSheet;

