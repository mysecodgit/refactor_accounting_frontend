import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import TableContainer from "../../components/Common/TableContainer";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Label,
  Input,
  Button,
} from "reactstrap";
import * as Yup from "yup";
import { useFormik } from "formik";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";
import { formatNumber, formatNumberOrDash } from "../../utils/numberFormat";

const TrialBalance = () => {
  document.title = "Trial Balance";
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
      as_of_date: Yup.string().required("Date is required"),
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
      const url = `v1/buildings/${buildingId}/reports/trial-balance?as_of_date=${filters.as_of_date}`;
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
    const dateStr = moment(report.as_of_date).format("MMM D, YYYY").toLowerCase();
    document.title = `Trial Balance As of ${dateStr}`;
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

  const columns = [
    {
      id: "account_number",
      header: "Account #",
      accessorKey: "account_number",
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.is_total_row) {
          return <>-</>;
        }
        return <>{row.original.account_number || "-"}</>;
      },
    },
    {
      id: "account_name",
      header: "Account Name",
      accessorKey: "account_name",
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.is_total_row) {
          return <strong>TOTAL</strong>;
        }
        return <>{row.original.account_name || "-"}</>;
      },
    },
    // {
    //   id: "account_type",
    //   header: "Account Type",
    //   accessorKey: "account_type",
    //   enableColumnFilter: false,
    //   enableSorting: false,
    //   cell: ({ row }) => {
    //     if (row.original.is_total_row) {
    //       return <>-</>;
    //     }
    //     return <>{row.original.account_type || "-"}</>;
    //   },
    // },
    {
      id: "debit_balance",
      header: "Debit",
      accessorKey: "debit_balance",
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.is_total_row) {
          return <strong>{formatNumber(row.original.debit_balance || 0)}</strong>;
        }
        const val = parseFloat(row.original.debit_balance || 0);
        return <>{formatNumberOrDash(val)}</>;
      },
    },
    {
      id: "credit_balance",
      header: "Credit",
      accessorKey: "credit_balance",
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ row }) => {
        if (row.original.is_total_row) {
          return <strong>{formatNumber(row.original.credit_balance || 0)}</strong>;
        }
        const val = parseFloat(row.original.credit_balance || 0);
        return <>{formatNumberOrDash(val)}</>;
      },
    },
  ];

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
          <Breadcrumbs title="Trial Balance" breadcrumbItem="Trial Balance" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3 no-print">
                    <Col md={3}>
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
                                <h5>Trial Balance</h5>
                                <p className="text-muted">
                                  As of: {moment(report.as_of_date).format("MMM DD, YYYY")}
                                  {report.is_balanced ? (
                                    <span className="text-success ms-2 no-print">
                                      <strong>✓ Balanced</strong>
                                    </span>
                                  ) : (
                                    <span className="text-danger ms-2 no-print">
                                      <strong>✗ Not Balanced</strong> (Difference: {formatNumber(Math.abs(parseFloat(report.total_debit || 0) - parseFloat(report.total_credit || 0)))})
                                    </span>
                                  )}
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

                        <div style={{ width: "30%", margin: "0 auto" }}>
                          <TableContainer
                            columns={columns}
                            data={report.accounts || []}
                            isGlobalFilter={true}
                            isPagination={false}
                            tableClass="table-hover dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                            theadClass="table-light"
                          />
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
                        <h2>Trial Balance</h2>
                        <p>As of: {moment(report.as_of_date).format("MMMM DD, YYYY")}</p>
                        <p className="no-print">
                          {report.is_balanced ? (
                            <strong>✓ Balanced</strong>
                          ) : (
                            <strong>✗ Not Balanced (Difference: {formatNumber(Math.abs(parseFloat(report.total_debit || 0) - parseFloat(report.total_credit || 0)))})</strong>
                          )}
                        </p>
                      </div>

                      <table className="print-table" style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
                        <thead>
                          <tr>
                            <th style={{ width: "15%" }}>Account #</th>
                            <th style={{ width: "50%" }}>Account Name</th>
                            <th style={{ width: "17.5%", textAlign: "right" }}>Debit</th>
                            <th style={{ width: "17.5%", textAlign: "right" }}>Credit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.accounts.filter(acc => !acc.is_total_row).map((account, index) => (
                            <tr key={index}>
                              <td>{account.account_number || "-"}</td>
                              <td>{account.account_name || "-"}</td>
                              <td style={{ textAlign: "right" }}>
                                {parseFloat(account.debit_balance || 0) > 0 ? formatNumber(account.debit_balance) : "-"}
                              </td>
                              <td style={{ textAlign: "right" }}>
                                {parseFloat(account.credit_balance || 0) > 0 ? formatNumber(account.credit_balance) : "-"}
                              </td>
                            </tr>
                          ))}
                          <tr className="total-row">
                            <td>-</td>
                            <td><strong>TOTAL</strong></td>
                            <td style={{ textAlign: "right" }}><strong>{formatNumber(report.total_debit || 0)}</strong></td>
                            <td style={{ textAlign: "right" }}><strong>{formatNumber(report.total_credit || 0)}</strong></td>
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

export default TrialBalance;

