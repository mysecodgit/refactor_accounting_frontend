import PropTypes from "prop-types";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Table,
  Button,
} from "reactstrap";

//Import Breadcrumb
import Breadcrumbs from "../../components/Common/Breadcrumb";
import Spinners from "../../components/Common/Spinner";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";
import { formatNumber } from "../../utils/numberFormat";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "../../components/Common/ChartsDynamicColor";

//i18n
import { withTranslation } from "react-i18next";

const KpiCard = ({ title, value, subtitle, to, iconClass }) => {
  const content = (
    <Card className="h-100">
      <CardBody>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="text-muted">{title}</div>
            <div className="fs-4 fw-bold">{value}</div>
            {subtitle ? <div className="text-muted mt-1">{subtitle}</div> : null}
          </div>
          {iconClass ? (
            <div className="avatar-sm">
              <span className="avatar-title rounded bg-light text-primary">
                <i className={iconClass} />
              </span>
            </div>
          ) : null}
        </div>
      </CardBody>
    </Card>
  );

  if (!to) return content;
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      {content}
    </Link>
  );
};

const Dashboard = props => {
  const { id: buildingId } = useParams();

  //meta title
  document.title = "Dashboard";

  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [buildingName, setBuildingName] = useState("");
  const [arSummary, setArSummary] = useState(null);
  const [apSummary, setApSummary] = useState(null);
  const [pl, setPl] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentBills, setRecentBills] = useState([]);

  const today = useMemo(() => moment().format("YYYY-MM-DD"), []);
  const monthStart = useMemo(() => moment().startOf("month").format("YYYY-MM-DD"), []);
  const recentStart = useMemo(() => moment().subtract(45, "days").format("YYYY-MM-DD"), []);

  const fetchDashboard = async () => {
    if (!buildingId) return;
    setLoading(true);
    setError("");
    try {
      const [
        buildingRes,
        arRes,
        apRes,
        plRes,
        invoicesRes,
        billsRes,
      ] = await Promise.all([
        axiosInstance.get(`v1/buildings/${buildingId}`),
        axiosInstance.get(`v1/buildings/${buildingId}/reports/customer-balance-summary?as_of_date=${today}`),
        axiosInstance.get(`v1/buildings/${buildingId}/reports/vendor-balance-summary?as_of_date=${today}`),
        axiosInstance.get(`v1/buildings/${buildingId}/reports/profit-and-loss-standard?start_date=${monthStart}&end_date=${today}`),
        axiosInstance.get(`v1/buildings/${buildingId}/invoices?start_date=${recentStart}&end_date=${today}`),
        axiosInstance.get(`v1/buildings/${buildingId}/bills?start_date=${recentStart}&end_date=${today}`),
      ]);

      setBuildingName(buildingRes.data?.data?.name || "");
      setArSummary(arRes.data?.data ?? arRes.data);
      setApSummary(apRes.data?.data ?? apRes.data);
      setPl(plRes.data?.data ?? plRes.data);
      setRecentInvoices((invoicesRes.data?.data ?? invoicesRes.data ?? []).slice(0, 8));
      setRecentBills((billsRes.data?.data ?? billsRes.data ?? []).slice(0, 8));
    } catch (e) {
      console.error("Dashboard fetch error:", e);
      setError(e.response?.data?.error || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingId]);

  const arTotal = arSummary?.total_balance ?? 0;
  const apTotal = apSummary?.total_balance ?? 0;
  const monthIncome = pl?.income?.total ?? 0;
  const monthExpense = pl?.expenses?.total ?? 0;
  const monthNet = pl?.net_profit_loss ?? (monthIncome - monthExpense);

  const donutSeries = useMemo(() => [Number(arTotal) || 0, Number(apTotal) || 0], [arTotal, apTotal]);
  const donutOptions = useMemo(() => {
    const colors = getChartColorsArray('["--bs-primary", "--bs-success"]');
    return {
      chart: { type: "donut" },
      labels: ["Accounts Receivable", "Accounts Payable"],
      colors,
      legend: { position: "bottom" },
      dataLabels: { enabled: true },
      tooltip: {
        y: { formatter: (val) => formatNumber(val) },
      },
    };
  }, []);

  const plSeries = useMemo(() => {
    return [
      {
        name: "Amount",
        data: [Number(monthIncome) || 0, Number(monthExpense) || 0],
      },
    ];
  }, [monthIncome, monthExpense]);

  const plOptions = useMemo(() => {
    const colors = getChartColorsArray('["--bs-info"]');
    return {
      chart: { type: "bar", toolbar: { show: false } },
      colors,
      plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
      xaxis: { categories: ["Income (MTD)", "Expenses (MTD)"] },
      yaxis: {
        labels: { formatter: (val) => formatNumber(val) },
      },
      tooltip: {
        y: { formatter: (val) => formatNumber(val) },
      },
      annotations: {
        yaxis: [
          {
            y: Number(monthNet) || 0,
            borderColor: "#6c757d",
            label: {
              text: `Net: ${formatNumber(monthNet)}`,
              style: { background: "#6c757d", color: "#fff" },
            },
          },
        ],
      },
    };
  }, [monthNet]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          {/* Render Breadcrumb */}
          <Breadcrumbs
            title={props.t("Dashboards")}
            breadcrumbItem={props.t("Dashboard")}
          />

          {!buildingId ? (
            <div className="alert alert-warning">
              Please select a building to view the dashboard.
            </div>
          ) : null}

          {buildingId && buildingName ? (
            <div className="mb-3">
              <h4 className="mb-0">{buildingName}</h4>
              <div className="text-muted">As of {today}</div>
            </div>
          ) : null}

          {error ? (
            <div className="alert alert-danger d-flex justify-content-between align-items-center">
              <div>{error}</div>
              <Button color="danger" outline size="sm" onClick={fetchDashboard}>
                Retry
              </Button>
            </div>
          ) : null}

          {isLoading ? <Spinners setLoading={setLoading} /> : null}

          {buildingId ? (
            <>
              <Row className="mb-4">
                <Col xl={3} md={6} className="mb-3">
                  <KpiCard
                    title="Accounts Receivable"
                    value={formatNumber(arTotal)}
                    subtitle="Total outstanding from customers"
                    to={`/building/${buildingId}/reports/customer-balance-summary`}
                    iconClass="bx bx-user"
                  />
                </Col>
                <Col xl={3} md={6} className="mb-3">
                  <KpiCard
                    title="Accounts Payable"
                    value={formatNumber(apTotal)}
                    subtitle="Total outstanding to vendors"
                    to={`/building/${buildingId}/reports/vendor-balance-summary`}
                    iconClass="bx bx-store"
                  />
                </Col>
                <Col xl={3} md={6} className="mb-3">
                  <KpiCard
                    title="Income (MTD)"
                    value={formatNumber(monthIncome)}
                    subtitle={`${monthStart} → ${today}`}
                    to={`/building/${buildingId}/reports/profit-and-loss-standard`}
                    iconClass="bx bx-line-chart"
                  />
                </Col>
                <Col xl={3} md={6} className="mb-3">
                  <KpiCard
                    title="Net Profit/Loss (MTD)"
                    value={formatNumber(monthNet)}
                    subtitle={`Expenses: ${formatNumber(monthExpense)}`}
                    to={`/building/${buildingId}/reports/profit-and-loss-standard`}
                    iconClass="bx bx-bar-chart-alt-2"
                  />
                </Col>
              </Row>

              <Row className="mb-4">
                <Col lg={4} className="mb-3">
                  <Card className="h-100">
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">AR vs AP</h5>
                        <Link to={`/building/${buildingId}/reports/vendor-balance-summary`}>Details</Link>
                      </div>
                      <div className="text-muted mb-2">Snapshot as of {today}</div>
                      <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height={280} />
                    </CardBody>
                  </Card>
                </Col>

                <Col lg={8} className="mb-3">
                  <Card className="h-100">
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">Month-to-date Income vs Expenses</h5>
                        <Link to={`/building/${buildingId}/reports/profit-and-loss-standard`}>Open report</Link>
                      </div>
                      <div className="text-muted mb-2">{monthStart} → {today}</div>
                      <ReactApexChart options={plOptions} series={plSeries} type="bar" height={280} />
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col lg={6} className="mb-3">
                  <Card className="h-100">
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">Recent Invoices</h5>
                        <Link to={`/building/${buildingId}/invoices`}>View all</Link>
                      </div>
                      <div className="text-muted mb-3">Last 45 days</div>
                      <div className="table-responsive">
                        <Table className="align-middle table-nowrap mb-0" hover>
                          <thead className="table-light">
                            <tr>
                              <th>Invoice #</th>
                              <th>Date</th>
                              <th className="text-end">Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentInvoices.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="text-center text-muted py-4">
                                  No invoices found in this period.
                                </td>
                              </tr>
                            ) : (
                              recentInvoices.map(inv => (
                                <tr key={inv.id}>
                                  <td>{inv.invoice_no || inv.invoice_number || inv.id}</td>
                                  <td>{inv.invoice_date ? moment(inv.invoice_date).format("YYYY-MM-DD") : "N/A"}</td>
                                  <td className="text-end">{formatNumber(inv.total_amount ?? inv.amount ?? 0)}</td>
                                  <td>
                                    <span className={`badge ${inv.status === "1" ? "bg-success" : "bg-secondary"}`}>
                                      {inv.status === "1" ? "Active" : "Inactive"}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </CardBody>
                  </Card>
                </Col>

                <Col lg={6} className="mb-3">
                  <Card className="h-100">
                    <CardBody>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5 className="mb-0">Recent Bills</h5>
                        <Link to={`/building/${buildingId}/bills`}>View all</Link>
                      </div>
                      <div className="text-muted mb-3">Last 45 days</div>
                      <div className="table-responsive">
                        <Table className="align-middle table-nowrap mb-0" hover>
                          <thead className="table-light">
                            <tr>
                              <th>Bill #</th>
                              <th>Date</th>
                              <th className="text-end">Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentBills.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="text-center text-muted py-4">
                                  No bills found in this period.
                                </td>
                              </tr>
                            ) : (
                              recentBills.map(bill => (
                                <tr key={bill.id}>
                                  <td>{bill.bill_no || bill.id}</td>
                                  <td>{bill.bill_date ? moment(bill.bill_date).format("YYYY-MM-DD") : "N/A"}</td>
                                  <td className="text-end">{formatNumber(bill.amount ?? 0)}</td>
                                  <td>
                                    <span className={`badge ${bill.status === "1" ? "bg-success" : "bg-secondary"}`}>
                                      {bill.status === "1" ? "Active" : "Inactive"}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col xs={12}>
                  <Card>
                    <CardBody>
                      <h5 className="mb-3">Quick Actions</h5>
                      <div className="d-flex flex-wrap gap-2">
                        <Link to={`/building/${buildingId}/invoices/create`} className="btn btn-primary">
                          <i className="bx bx-plus me-1" /> New Invoice
                        </Link>
                        <Link to={`/building/${buildingId}/invoice-payments/create`} className="btn btn-outline-primary">
                          <i className="bx bx-credit-card me-1" /> Receive Payment
                        </Link>
                        <Link to={`/building/${buildingId}/bills/create`} className="btn btn-success">
                          <i className="bx bx-plus me-1" /> New Bill
                        </Link>
                        <Link to={`/building/${buildingId}/bill-payments/create`} className="btn btn-outline-success">
                          <i className="bx bx-money-withdraw me-1" /> Pay Bill
                        </Link>
                        <Link to={`/building/${buildingId}/reports/profit-and-loss-by-unit`} className="btn btn-outline-secondary">
                          <i className="bx bx-bar-chart me-1" /> P&L by Unit
                        </Link>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            </>
          ) : null}
        </Container>
      </div>

    </React.Fragment>
  );
};

Dashboard.propTypes = {
  t: PropTypes.any,
  chartsData: PropTypes.any,
  onGetChartsData: PropTypes.func,
};

export default withTranslation()(Dashboard);
