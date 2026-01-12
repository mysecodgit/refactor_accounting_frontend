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

const ProfitAndLossByUnit = () => {
  document.title = "Profit and Loss (By Unit)";
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
      const url = `buildings/${buildingId}/reports/profit-and-loss-by-unit?start_date=${filters.start_date}&end_date=${filters.end_date}`;
      const { data } = await axiosInstance.get(url);
      setReport(data);
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
      const { data } = await axiosInstance.get(`buildings/${buildingId}`);
      setBuildingName(data.name || "");
    } catch (error) {
      console.error("Error fetching building name:", error);
    }
  };

  const handlePrint = () => {
    if (!report) return;
    const originalTitle = document.title;
    const startDateStr = moment(report.start_date).format("MMM D, YYYY").toLowerCase();
    const endDateStr = moment(report.end_date).format("MMM D, YYYY").toLowerCase();
    document.title = `Profit and Loss by Class ${startDateStr} to ${endDateStr}`;
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

  // Calculate how many units fit per page for printing (approximately 6-7 units per A4 landscape page without TOTAL column)
  const getUnitsPerPage = () => {
    if (!report || !report.units) return 6;
    const totalUnits = report.units.length;
    // For A4 landscape without TOTAL column, we can fit about 6-7 unit columns comfortably
    if (totalUnits <= 7) return totalUnits; // All on one page if 7 or fewer
    if (totalUnits <= 14) return 7; // 2 pages if 8-14 units
    return 6; // 6 units per page for larger reports
  };

  // Split units into pages for printing
  const getUnitPages = () => {
    if (!report || !report.units) return [];
    const unitsPerPage = getUnitsPerPage();
    const pages = [];
    for (let i = 0; i < report.units.length; i += unitsPerPage) {
      pages.push(report.units.slice(i, i + unitsPerPage));
    }
    return pages;
  };

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
            size: A4 landscape;
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
            font-size: 10px;
          }
          .print-table th,
          .print-table td {
            padding: 5px 5px;
            border: 1px solid #000;
            text-align: left;
            line-height: 1.4;
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
          .print-page-break {
            page-break-before: always;
            page-break-inside: avoid;
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
          <Breadcrumbs title="Profit and Loss (By Unit)" breadcrumbItem="Profit and Loss (By Unit)" />
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
                      <Row className="mb-3" style={{ textAlign: "center" }}>
                        <Col>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div style={{ flex: 1 }}></div>
                            <div style={{ flex: 1, textAlign: "center" }}>
                              <h5>Profit & Loss by Class</h5>
                              <p className="text-muted">
                                {moment(report.start_date).format("MMMM D")} through {moment(report.end_date).format("MMMM D, YYYY")}
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

                      <div className="table-responsive">
                        <Table bordered className="table-hover" style={{ fontSize: "0.9rem" }}>
                          <thead className="table-light">
                            <tr>
                              <th style={{ minWidth: "200px" }}>Account</th>
                              {report.units.map((unit) => (
                                <th key={unit.unit_id} className="text-end" style={{ minWidth: "100px" }}>
                                  {unit.unit_name}
                                </th>
                              ))}
                              <th className="text-end" style={{ minWidth: "120px", fontWeight: "bold" }}>
                                TOTAL
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Income Section Header */}
                            <tr className="bg-light">
                              <td colSpan={report.units.length + 2}>
                                <strong>Income</strong>
                              </td>
                            </tr>
                            
                            {/* Income Accounts */}
                            {report.income_accounts.map((account) => (
                              <tr key={`income-${account.account_id}`}>
                                <td>
                                  {account.account_number} · {account.account_name}
                                </td>
                                {report.units.map((unit) => (
                                  <td key={`${account.account_id}-${unit.unit_id}`} className="text-end">
                                    {account.balances[unit.unit_id] 
                                      ? formatNumber(account.balances[unit.unit_id])
                                      : formatNumber(0)}
                                  </td>
                                ))}
                                <td className="text-end">
                                  <strong>{formatNumber(account.total)}</strong>
                                </td>
                              </tr>
                            ))}
                            
                            {/* Total Income Row */}
                            <tr style={{ borderTop: "2px solid #000", backgroundColor: "#f8f9fa" }}>
                              <td>
                                <strong>Total Income</strong>
                              </td>
                              {report.units.map((unit) => (
                                <td key={`total-income-${unit.unit_id}`} className="text-end">
                                  <strong style={{ textDecoration: "underline" }}>
                                    {formatNumber(report.total_income[unit.unit_id] || 0)}
                                  </strong>
                                </td>
                              ))}
                              <td className="text-end">
                                <strong style={{ textDecoration: "underline" }}>
                                  {formatNumber(report.grand_total_income)}
                                </strong>
                              </td>
                            </tr>

                            {/* Expense Section Header */}
                            <tr className="bg-light">
                              <td colSpan={report.units.length + 2}>
                                <strong>Expense</strong>
                              </td>
                            </tr>
                            
                            {/* Expense Accounts */}
                            {report.expense_accounts.length > 0 ? (
                              report.expense_accounts.map((account) => (
                                <tr key={`expense-${account.account_id}`}>
                                  <td>
                                    {account.account_number} · {account.account_name}
                                  </td>
                                  {report.units.map((unit) => (
                                    <td key={`${account.account_id}-${unit.unit_id}`} className="text-end">
                                      {account.balances[unit.unit_id] 
                                        ? formatNumber(account.balances[unit.unit_id])
                                        : formatNumber(0)}
                                    </td>
                                  ))}
                                  <td className="text-end">
                                    <strong>{formatNumber(account.total)}</strong>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={report.units.length + 2} className="text-center text-muted">
                                  No expense accounts
                                </td>
                              </tr>
                            )}
                            
                            {/* Total Expenses Row */}
                            <tr style={{ borderTop: "2px solid #000", backgroundColor: "#f8f9fa" }}>
                              <td>
                                <strong>Total Expenses</strong>
                              </td>
                              {report.units.map((unit) => (
                                <td key={`total-expenses-${unit.unit_id}`} className="text-end">
                                  <strong style={{ textDecoration: "underline" }}>
                                    {formatNumber(report.total_expenses[unit.unit_id] || 0)}
                                  </strong>
                                </td>
                              ))}
                              <td className="text-end">
                                <strong style={{ textDecoration: "underline" }}>
                                  {formatNumber(report.grand_total_expenses)}
                                </strong>
                              </td>
                            </tr>

                            {/* Net Income Row */}
                            <tr style={{ borderTop: "2px solid #000", backgroundColor: "#f8f9fa" }}>
                              <td>
                                <strong>Net Income</strong>
                              </td>
                              {report.units.map((unit) => (
                                <td key={`net-income-${unit.unit_id}`} className="text-end">
                                  <strong style={{ textDecoration: "underline" }}>
                                    {formatNumber(report.net_profit_loss[unit.unit_id] || 0)}
                                  </strong>
                                </td>
                              ))}
                              <td className="text-end">
                                <strong style={{ textDecoration: "underline" }}>
                                  {formatNumber(report.grand_total_net_profit_loss)}
                                </strong>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Print-only section with page breaks */}
                  {report && !isLoading && (
                    <div className="print-only">
                      {/* Print-only building name header - only on first page */}
                      {buildingName && getUnitPages().length > 0 && (
                        <div className="print-building-name" style={{ pageBreakAfter: "avoid" }}>
                          {buildingName}
                        </div>
                      )}
                      {getUnitPages().map((unitPage, pageIndex) => (
                        <div key={`print-page-${pageIndex}`} className={pageIndex > 0 ? "print-page-break" : ""}>
                          <div className="print-report">
                            <div className="print-header">
                              <h2>Profit & Loss by Class</h2>
                              <p>
                                {moment(report.start_date).format("MMMM D")} through {moment(report.end_date).format("MMMM D, YYYY")}
                              </p>
                              <p>Page {pageIndex + 1} of {getUnitPages().length + 1}</p>
                            </div>

                            <table className="print-table">
                              <thead>
                                <tr>
                                  <th style={{ width: "150px" }}>Account</th>
                                  {unitPage.map((unit) => (
                                    <th key={unit.unit_id} style={{ textAlign: "right", width: "65px" }}>
                                      {unit.unit_name}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {/* Income Section */}
                                <tr>
                                  <td colSpan={unitPage.length + 1} className="section-header">Income</td>
                                </tr>
                                {report.income_accounts.map((account) => (
                                  <tr key={`print-income-${account.account_id}`}>
                                    <td>{account.account_number} · {account.account_name}</td>
                                    {unitPage.map((unit) => (
                                      <td key={`${account.account_id}-${unit.unit_id}`} style={{ textAlign: "right" }}>
                                        {account.balances[unit.unit_id] 
                                          ? formatNumber(account.balances[unit.unit_id])
                                          : formatNumber(0)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                                <tr className="total-row">
                                  <td><strong>Total Income</strong></td>
                                  {unitPage.map((unit) => (
                                    <td key={`print-total-income-${unit.unit_id}`} style={{ textAlign: "right" }}>
                                      <strong>{formatNumber(report.total_income[unit.unit_id] || 0)}</strong>
                                    </td>
                                  ))}
                                </tr>

                                {/* Expense Section */}
                                <tr>
                                  <td colSpan={unitPage.length + 1} className="section-header">Expense</td>
                                </tr>
                                {report.expense_accounts.length > 0 ? (
                                  report.expense_accounts.map((account) => (
                                    <tr key={`print-expense-${account.account_id}`}>
                                      <td>{account.account_number} · {account.account_name}</td>
                                      {unitPage.map((unit) => (
                                        <td key={`${account.account_id}-${unit.unit_id}`} style={{ textAlign: "right" }}>
                                          {account.balances[unit.unit_id] 
                                            ? formatNumber(account.balances[unit.unit_id])
                                            : formatNumber(0)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={unitPage.length + 1} style={{ textAlign: "center" }}>
                                      No expense accounts
                                    </td>
                                  </tr>
                                )}
                                <tr className="total-row">
                                  <td><strong>Total Expenses</strong></td>
                                  {unitPage.map((unit) => (
                                    <td key={`print-total-expenses-${unit.unit_id}`} style={{ textAlign: "right" }}>
                                      <strong>{formatNumber(report.total_expenses[unit.unit_id] || 0)}</strong>
                                    </td>
                                  ))}
                                </tr>
                                <tr className="total-row">
                                  <td><strong>Net Income</strong></td>
                                  {unitPage.map((unit) => (
                                    <td key={`print-net-income-${unit.unit_id}`} style={{ textAlign: "right" }}>
                                      <strong>{formatNumber(report.net_profit_loss[unit.unit_id] || 0)}</strong>
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                      
                      {/* Total Column Page */}
                      <div className="print-page-break">
                        <div className="print-report">
                          <div className="print-header">
                            <h2>Profit & Loss by Class - Totals</h2>
                            <p>
                              {moment(report.start_date).format("MMMM D")} through {moment(report.end_date).format("MMMM D, YYYY")}
                            </p>
                            <p>Page {getUnitPages().length + 1} of {getUnitPages().length + 1}</p>
                          </div>

                          <table className="print-table">
                            <thead>
                              <tr>
                                <th style={{ width: "150px" }}>Account</th>
                                <th style={{ textAlign: "right", fontWeight: "bold", width: "100px" }}>
                                  TOTAL
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Income Section */}
                              <tr>
                                <td colSpan={2} className="section-header">Income</td>
                              </tr>
                              {report.income_accounts.map((account) => (
                                <tr key={`print-total-income-${account.account_id}`}>
                                  <td>{account.account_number} · {account.account_name}</td>
                                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                                    {formatNumber(account.total)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="total-row">
                                <td><strong>Total Income</strong></td>
                                <td style={{ textAlign: "right" }}>
                                  <strong>{formatNumber(report.grand_total_income)}</strong>
                                </td>
                              </tr>

                              {/* Expense Section */}
                              <tr>
                                <td colSpan={2} className="section-header">Expense</td>
                              </tr>
                              {report.expense_accounts.length > 0 ? (
                                report.expense_accounts.map((account) => (
                                  <tr key={`print-total-expense-${account.account_id}`}>
                                    <td>{account.account_number} · {account.account_name}</td>
                                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                                      {formatNumber(account.total)}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={2} style={{ textAlign: "center" }}>
                                    No expense accounts
                                  </td>
                                </tr>
                              )}
                              <tr className="total-row">
                                <td><strong>Total Expenses</strong></td>
                                <td style={{ textAlign: "right" }}>
                                  <strong>{formatNumber(report.grand_total_expenses)}</strong>
                                </td>
                              </tr>
                              <tr className="total-row">
                                <td><strong>Net Income</strong></td>
                                <td style={{ textAlign: "right" }}>
                                  <strong>{formatNumber(report.grand_total_net_profit_loss)}</strong>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
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

export default ProfitAndLossByUnit;
