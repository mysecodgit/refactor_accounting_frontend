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
import { formatNumber, formatNumberOrDash } from "../../utils/numberFormat";

const CustomerBalanceDetails = () => {
  document.title = "Customer Balance Details";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [customers, setCustomers] = useState([]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      as_of_date: moment().format("YYYY-MM-DD"),
      people_id: "",
    },
    validationSchema: Yup.object({
      as_of_date: Yup.string().required("As of date is required"),
      people_id: Yup.number(),
    }),
    onSubmit: async (values) => {
      await fetchReport(values.as_of_date, values.people_id);
    },
  });

  const fetchCustomers = async () => {
    try {
      let url = "people";
      if (buildingId) {
        url = `buildings/${buildingId}/people`;
      }
      const { data } = await axiosInstance.get(url);
      // Filter to only customers
      const customerList = (data || []).filter((person) => {
        const typeTitle = person.people_type?.title || person.type?.title || "";
        return typeTitle.toLowerCase() === "customer";
      });
      setCustomers(customerList);
    } catch (error) {
      console.log("Error fetching customers", error);
    }
  };

  const fetchReport = async (asOfDate, peopleId) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      let url = `buildings/${buildingId}/reports/customer-balance-details?as_of_date=${asOfDate}`;
      if (peopleId) {
        url += `&people_id=${peopleId}`;
      }
      const { data } = await axiosInstance.get(url);
      setReport(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch report");
      console.error("Error fetching customer balance details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [buildingId]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Customer Balance Details" breadcrumbItem="Customer Balance Details" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3">
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
                    <Col md={4}>
                      <Label>Customer (Optional)</Label>
                      <Input
                        name="people_id"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.people_id || ""}
                      >
                        <option value="">All Customers</option>
                        {customers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </Input>
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
                </CardBody>
              </Card>
            </Col>
          </Row>

          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : report && report.customers && report.customers.length > 0 ? (
            <Row>
              <Col xs={12}>
                <Card>
                  <CardBody>
                    <div className="mb-3">
                      <h5>Customer Balance Details</h5>
                      <p className="text-muted">
                        As of: {moment(report.as_of_date).format("YYYY-MM-DD")}
                      </p>
                    </div>
                    <div className="table-responsive">
                      <Table bordered striped>
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Transaction #</th>
                            <th>Type</th>
                            <th>Account</th>
                            <th>Description</th>
                            <th className="text-end">Debit</th>
                            <th className="text-end">Credit</th>
                            <th className="text-end">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.customers.map((customerDetail, customerIndex) => {
                            if (customerDetail.is_total_row) {
                              // Total row for customer
                              return (
                                <tr key={`total-${customerDetail.people_id}-${customerIndex}`} style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                                  <td colSpan="5" className="text-end">
                                    TOTAL
                                  </td>
                                  <td className="text-end">{formatNumber(customerDetail.total_debit || 0)}</td>
                                  <td className="text-end">{formatNumber(customerDetail.total_credit || 0)}</td>
                                  <td className="text-end">{formatNumber(customerDetail.total_balance || 0)}</td>
                                </tr>
                              );
                            } else if (customerDetail.is_header) {
                              // Customer header and accounts
                              return (
                                <React.Fragment key={`customer-${customerDetail.people_id}-${customerIndex}`}>
                                  {/* Customer Header */}
                                  <tr style={{ backgroundColor: "#e9ecef", fontWeight: "bold" }}>
                                    <td colSpan="8">
                                      {customerDetail.people_name}
                                    </td>
                                  </tr>
                                  {/* Accounts for this customer */}
                                  {customerDetail.accounts.map((account, accountIndex) => (
                                    <React.Fragment key={`account-${account.account_id}-${accountIndex}`}>
                                      {/* Account Header */}
                                      <tr style={{ backgroundColor: "#f1f3f5", fontWeight: "600" }}>
                                        <td colSpan="8" style={{ paddingLeft: "20px" }}>
                                          {account.account_name} ({account.account_number})
                                        </td>
                                      </tr>
                                      {/* Splits for this account */}
                                      {account.splits.map((split, splitIndex) => (
                                        <tr key={`split-${split.split_id}-${splitIndex}`} style={{ paddingLeft: "40px" }}>
                                          <td style={{ paddingLeft: "40px" }}>{moment(split.transaction_date).format("YYYY-MM-DD")}</td>
                                          <td>{split.transaction_number || "N/A"}</td>
                                          <td>{split.transaction_type}</td>
                                          <td>{split.account_name} ({split.account_number})</td>
                                          <td>{split.transaction_memo || "N/A"}</td>
                                          <td className="text-end">{formatNumberOrDash(split.debit)}</td>
                                          <td className="text-end">{formatNumberOrDash(split.credit)}</td>
                                          <td className="text-end">{formatNumber(split.balance || 0)}</td>
                                        </tr>
                                      ))}
                                      {/* Account Total */}
                                      <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "600" }}>
                                        <td colSpan="4" className="text-end" style={{ paddingLeft: "20px" }}>
                                          Total - {account.account_name}
                                        </td>
                                        <td></td>
                                        <td className="text-end">{formatNumber(account.total_debit || 0)}</td>
                                        <td className="text-end">{formatNumber(account.total_credit || 0)}</td>
                                        <td className="text-end">{formatNumber(account.total_balance || 0)}</td>
                                      </tr>
                                    </React.Fragment>
                                  ))}
                                </React.Fragment>
                              );
                            }
                            return null;
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                            <td colSpan="5" className="text-end">Grand Total</td>
                            <td className="text-end">{formatNumber(report.grand_total_debit || 0)}</td>
                            <td className="text-end">{formatNumber(report.grand_total_credit || 0)}</td>
                            <td className="text-end">{formatNumber(report.grand_total_balance || 0)}</td>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : report && report.customers && report.customers.length === 0 ? (
            <Row>
              <Col xs={12}>
                <Card>
                  <CardBody>
                    <div className="text-center">
                      <p>No customer transactions found for the selected criteria.</p>
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

export default CustomerBalanceDetails;

