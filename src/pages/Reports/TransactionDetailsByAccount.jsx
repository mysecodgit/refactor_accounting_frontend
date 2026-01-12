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

const TransactionDetailsByAccount = () => {
  document.title = "Transaction Details by Account";
  const { id: buildingId } = useParams();

  const [isLoading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      start_date: moment().subtract(30, "days").format("YYYY-MM-DD"),
      end_date: moment().format("YYYY-MM-DD"),
      unit_id: "",
    },
    validationSchema: Yup.object({
      start_date: Yup.string().required("Start date is required"),
      end_date: Yup.string().required("End date is required"),
      unit_id: Yup.number(),
    }),
    onSubmit: async (values) => {
      await fetchReport(values.start_date, values.end_date, selectedAccountIds, values.unit_id);
    },
  });

  const fetchAccounts = async () => {
    try {
      let url = "accounts";
      if (buildingId) {
        url = `buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data || []);
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const fetchUnits = async () => {
    try {
      let url = "units";
      if (buildingId) {
        url = `buildings/${buildingId}/units`;
      }
      const { data } = await axiosInstance.get(url);
      setUnits(data || []);
    } catch (error) {
      console.log("Error fetching units", error);
    }
  };

  const fetchReport = async (startDate, endDate, accountIds, unitId) => {
    if (!buildingId) {
      toast.error("Building ID is required");
      return;
    }

    setLoading(true);
    try {
      let url = `buildings/${buildingId}/reports/transaction-details-by-account?start_date=${startDate}&end_date=${endDate}`;
      // Add multiple account_id parameters
      if (accountIds && accountIds.length > 0) {
        accountIds.forEach((accountId) => {
          url += `&account_id=${accountId}`;
        });
      }
      if (unitId) {
        url += `&unit_id=${unitId}`;
      }
      const { data } = await axiosInstance.get(url);
      setReport(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch report");
      console.error("Error fetching transaction details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountToggle = (accountId) => {
    const accountIdNum = parseInt(accountId, 10);

    console.log("This is from handle toggle ", accountIdNum);
    setSelectedAccountIds((prev) =>
      prev.includes(accountIdNum)
        ? prev.filter((item) => item !== accountIdNum) // deselect
        : [...prev, accountIdNum] // select
    );
    
    
  };

  const handleSelectAllAccounts = (e) => {
    const isChecked = e.target.checked;
    if (isChecked) {
      setSelectedAccountIds(accounts.map((acc) => parseInt(acc.id, 10)));
    } else {
      setSelectedAccountIds([]);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchUnits();
  }, [buildingId]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Transaction Details by Account" breadcrumbItem="Transaction Details by Account" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Row className="mb-3">
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
                    <Col md={3}>
                      <Label>Account(s) (Optional)</Label>
                      <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ced4da", borderRadius: "0.25rem", padding: "8px" }}>
                        <div className="mb-2">
                          <input
                            type="checkbox"
                            checked={selectedAccountIds.length === accounts.length && accounts.length > 0}
                            onChange={handleSelectAllAccounts}
                            id="select-all-accounts"
                            style={{ cursor: "pointer", marginRight: "8px" }}
                          />
                          <label htmlFor="select-all-accounts" style={{ cursor: "pointer", marginBottom: 0 }}>
                            <strong>Select All</strong>
                          </label>
                        </div>
                        <hr className="my-2" />
                        {accounts.length === 0 ? (
                          <div className="text-muted">No accounts available</div>
                        ) : (
                          accounts.map((account) => {
                          
                            const accountId = parseInt(account.id, 10);
                            const isChecked = selectedAccountIds.some(id => parseInt(id, 10) === accountId);
                            return (
                              <div 
                                key={account.id} 
                                className="mb-1" 
                                style={{ display: "flex", alignItems: "center", position: "relative", zIndex: 1 }}
                                onClick={() => handleAccountToggle(account.id)}

                              >
                                <input
                                  type="checkbox"
                                  checked={selectedAccountIds.includes(account.id)}
                                  readOnly
                                  id={`account-${account.id}`}
                                  style={{ 
                                    cursor: "pointer", 
                                    marginRight: "8px", 
                                    width: "18px", 
                                    height: "18px", 
                                    flexShrink: 0,
                                    pointerEvents: "none"
                                  }}
                                />
                                <label 
                                  htmlFor={`account-${account.id}`} 
                                  style={{ 
                                    cursor: "pointer", 
                                    marginBottom: 0, 
                                    userSelect: "none", 
                                    flex: 1,
                                    pointerEvents: "auto"
                                  }}
                                >
                                  {account.account_name} ({account.account_number})
                                </label>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="mt-2">
                        <small className="text-muted">
                          {selectedAccountIds.length > 0 ? (
                            <span>{selectedAccountIds.length} account{selectedAccountIds.length !== 1 ? "s" : ""} selected: [{selectedAccountIds.join(", ")}]</span>
                          ) : (
                            <span>No accounts selected</span>
                          )}
                        </small>
                      </div>
                    </Col>
                    <Col md={3}>
                      <Label>Unit (Optional)</Label>
                      <Input
                        name="unit_id"
                        type="select"
                        onChange={validation.handleChange}
                        onBlur={validation.handleBlur}
                        value={validation.values.unit_id || ""}
                      >
                        <option value="">All Units</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.unit_number || unit.name || `Unit ${unit.id}`}
                          </option>
                        ))}
                      </Input>
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
          ) : report && report.accounts && report.accounts.length > 0 ? (
            <Row>
              <Col xs={12}>
                <Card>
                  <CardBody>
                    <div className="mb-3">
                      <h5>Transaction Details by Account</h5>
                      <p className="text-muted">
                        Period: {moment(report.start_date).format("YYYY-MM-DD")} to {moment(report.end_date).format("YYYY-MM-DD")}
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
                            <th>People</th>
                            <th>Description</th>
                            <th className="text-end">Debit</th>
                            <th className="text-end">Credit</th>
                            <th className="text-end">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.accounts.map((accountDetail, accountIndex) => {
                            if (accountDetail.is_total_row) {
                              // Total row for account
                              return (
                                <tr key={`total-${accountDetail.account_id}-${accountIndex}`} style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                                  <td colSpan="6" className="text-end">
                                    TOTAL
                                  </td>
                                  <td className="text-end">{formatNumber(accountDetail.total_debit || 0)}</td>
                                  <td className="text-end">{formatNumber(accountDetail.total_credit || 0)}</td>
                                  <td className="text-end">{formatNumber(accountDetail.total_balance || 0)}</td>
                                </tr>
                              );
                            } else {
                              // Account header and splits
                              return (
                                <React.Fragment key={`account-${accountDetail.account_id}-${accountIndex}`}>
                                  {/* Account Header */}
                                  <tr style={{ backgroundColor: "#e9ecef", fontWeight: "bold" }}>
                                    <td colSpan="9">
                                      {accountDetail.account_name} ({accountDetail.account_number}) - {accountDetail.account_type}
                                    </td>
                                  </tr>
                                  {/* Splits for this account */}
                                  {accountDetail.splits.map((split, splitIndex) => (
                                    <tr key={`split-${split.split_id}-${splitIndex}`}>
                                      <td>{moment(split.transaction_date).format("YYYY-MM-DD")}</td>
                                      <td>{split.transaction_number || "N/A"}</td>
                                      <td>{split.transaction_type}</td>
                                      <td></td>
                                      <td>{split.people_name || (split.people_id ? `ID: ${split.people_id}` : "N/A")}</td>
                                      <td>{split.transaction_memo || split.description || "N/A"}</td>
                                      <td className="text-end">{formatNumberOrDash(split.debit)}</td>
                                      <td className="text-end">{formatNumberOrDash(split.credit)}</td>
                                      <td className="text-end">{formatNumber(split.balance || 0)}</td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              );
                            }
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                            <td colSpan="6" className="text-end">Grand Total</td>
                            <td className="text-end">{formatNumber(report.grand_total_debit || 0)}</td>
                            <td className="text-end">{formatNumber(report.grand_total_credit || 0)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : report && report.accounts && report.accounts.length === 0 ? (
            <Row>
              <Col xs={12}>
                <Card>
                  <CardBody>
                    <div className="text-center">
                      <p>No transactions found for the selected criteria.</p>
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

export default TransactionDetailsByAccount;

