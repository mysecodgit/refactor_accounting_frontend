import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
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

const CreateCheck = () => {
  document.title = "Create Check";
  const { id: buildingId, checkId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submissions
  const [accounts, setAccounts] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [expenseLines, setExpenseLines] = useState([]);
  const [splitsPreview, setSplitsPreview] = useState(null);
  const [showSplitsModal, setShowSplitsModal] = useState(false);
  const [userId, setUserId] = useState(1); // TODO: Get from auth context

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      check_date: moment().format("YYYY-MM-DD"),
      reference_number: "",
      payment_account_id: "",
      memo: "",
      total_amount: 0,
      building_id: buildingId ? parseInt(buildingId) : "",
    },
    validationSchema: Yup.object({
      check_date: Yup.date().required("Check date is required"),
      payment_account_id: Yup.number().required("Payment account is required").min(1, "Please select a payment account"),
      total_amount: Yup.number().required("Total amount is required").min(0.01, "Total amount must be greater than 0"),
      building_id: Yup.number().required("Building ID is required"),
    }),
    onSubmit: async (values) => {
      // Prevent double submission
      if (isSubmitting) {
        return;
      }
      
      if (expenseLines.length === 0) {
        toast.error("Please add at least one expense line");
        return;
      }
      
      setIsSubmitting(true);
      try {
        const payload = {
          check_date: values.check_date,
          reference_number: values.reference_number || null,
          payment_account_id: parseInt(values.payment_account_id),
          memo: values.memo || null,
          total_amount: parseFloat(values.total_amount),
          building_id: parseInt(values.building_id),
          expense_lines: expenseLines.map((line) => ({
            account_id: parseInt(line.account_id),
            unit_id: line.unit_id ? parseInt(line.unit_id) : null,
            people_id: line.people_id ? parseInt(line.people_id) : null,
            description: line.description || null,
            amount: parseFloat(line.amount),
          })),
        };

        let url = checkId ? `checks/${checkId}` : "checks";
        if (buildingId) {
          url = checkId ? `v1/buildings/${buildingId}/checks/${checkId}` : `v1/buildings/${buildingId}/checks`;
        }

        const config = {
          headers: {
            "User-ID": userId.toString(),
          },
        };

        if (checkId) {
          const { data } = await axiosInstance.put(url, payload);
          toast.success("Check updated successfully");
        } else {
          const { data } = await axiosInstance.post(url, payload);
          toast.success("Check created successfully");
        }
        navigate(`/building/${buildingId}/checks`);
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const fetchAccounts = async () => {
    try {
      let url = "accounts";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data.data || []);
      
      // Filter payment accounts (Bank, Credit Card, etc. - Asset accounts)
      const paymentAccountsList = (data.data || []).filter((account) => {
        const typeName = account.type?.typeName || "";
        return typeName.toLowerCase().includes("bank") || 
               typeName.toLowerCase().includes("credit card") ||
               typeName.toLowerCase().includes("cash");
      });
      setPaymentAccounts(paymentAccountsList);
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const fetchUnits = async () => {
    try {
      let url = "units";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/units`;
      }
      const { data } = await axiosInstance.get(url);
      setUnits(data.data || []);
    } catch (error) {
      console.log("Error fetching units", error);
    }
  };

  const fetchPeople = async () => {
    try {
      let url = "people";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/people`;
      }
      const { data } = await axiosInstance.get(url);
      setPeople(data.data || []);
    } catch (error) {
      console.log("Error fetching people", error);
    }
  };

  const fetchCheckForEdit = async () => {
    if (!checkId) return;
    try {
      setLoading(true);
      let url = `checks/${checkId}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/checks/${checkId}`;
      }
      const { data: checkResponse } = await axiosInstance.get(url);
      const check = checkResponse.data.check || checkResponse.data;
      validation.setValues({
        check_date: check.check_date ? moment(check.check_date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
        reference_number: check.reference_number || "",
        payment_account_id: check.payment_account_id || "",
        memo: check.memo || "",
        total_amount: check.total_amount || 0,
        building_id: buildingId ? parseInt(buildingId) : "",
      });
      
      // Set expense lines
      const lines = (checkResponse.data.expense_lines || []).map((line) => ({
        account_id: line.account_id || "",
        unit_id: line.unit_id || "",
        people_id: line.people_id || "",
        description: line.description || "",
        amount: line.amount || 0,
      }));
      setExpenseLines(lines);
      calculateTotal(lines);
    } catch (error) {
      console.log("Error fetching check for edit", error);
      toast.error("Failed to fetch check details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchUnits();
    fetchPeople();
    if (checkId) {
      fetchCheckForEdit();
    }
  }, [buildingId, checkId]);

  const addExpenseLine = () => {
    setExpenseLines([
      ...expenseLines,
      {
        account_id: "",
        unit_id: "",
        people_id: "",
        description: "",
        amount: 0,
      },
    ]);
  };

  const removeExpenseLine = (index) => {
    const newLines = expenseLines.filter((_, i) => i !== index);
    setExpenseLines(newLines);
    calculateTotal(newLines);
  };

  const updateExpenseLine = (index, field, value) => {
    const newLines = [...expenseLines];
    newLines[index][field] = value;
    
    // If account is A/R or A/P, validate people_id
    if (field === "account_id") {
      const account = accounts.find((a) => a.id === parseInt(value));
      if (account) {
        const typeName = account.account_type?.typeName || "";
        if ((typeName.toLowerCase().includes("receivable") || typeName.toLowerCase().includes("payable")) && !newLines[index].people_id) {
          toast.warning(`People is required for ${typeName} accounts`);
        }
      }
    }
    
    setExpenseLines(newLines);
    if (field === "amount") {
      calculateTotal(newLines);
    }
  };

  const calculateTotal = (expenseLinesList) => {
    let total = 0;
    expenseLinesList.forEach((line) => {
      total += parseFloat(line.amount || 0);
    });
    validation.setFieldValue("total_amount", total.toFixed(2));
  };

  const previewSplits = async () => {
    if (expenseLines.length === 0) {
      toast.error("Please add at least one expense line");
      return;
    }

    // Validate expense lines
    for (const line of expenseLines) {
      if (!line.account_id) {
        toast.error("Please select an account for all expense lines");
        return;
      }
      if (!line.amount || parseFloat(line.amount) <= 0) {
        toast.error("Please enter a valid amount for all expense lines");
        return;
      }
      
      const account = accounts.find((a) => a.id === parseInt(line.account_id));
      if (account) {
        const typeName = account.account_type?.typeName || "";
        if ((typeName.toLowerCase().includes("receivable") || typeName.toLowerCase().includes("payable")) && !line.people_id) {
          toast.error(`People is required for ${typeName} accounts`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      const payload = {
        check_date: validation.values.check_date,
        reference_number: validation.values.reference_number || null,
        payment_account_id: parseInt(validation.values.payment_account_id),
        memo: validation.values.memo || null,
        total_amount: parseFloat(validation.values.total_amount),
        building_id: parseInt(validation.values.building_id),
        expense_lines: expenseLines.map((line) => ({
          account_id: parseInt(line.account_id),
          unit_id: line.unit_id ? parseInt(line.unit_id) : null,
          people_id: line.people_id ? parseInt(line.people_id) : null,
          description: line.description || null,
          amount: parseFloat(line.amount),
        })),
      };

      let url = "checks/preview";
      if (buildingId) {
        url = `buildings/${buildingId}/checks/preview`;
      }

      const config = {
        headers: {
          "User-ID": userId.toString(),
        },
      };

      const { data } = await axiosInstance.post(url, payload, config);
      setSplitsPreview(data);
      setShowSplitsModal(true);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
      toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title={checkId ? "Edit Check" : "Create Check"} breadcrumbItem={checkId ? "Edit Check" : "Create Check"} />
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
                          <Label>Check Date <span className="text-danger">*</span></Label>
                          <Input
                            name="check_date"
                            type="date"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.check_date || ""}
                            invalid={validation.touched.check_date && validation.errors.check_date ? true : false}
                          />
                          {validation.touched.check_date && validation.errors.check_date ? (
                            <FormFeedback type="invalid">{validation.errors.check_date}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Reference Number</Label>
                          <Input
                            name="reference_number"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.reference_number || ""}
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Payment Account <span className="text-danger">*</span></Label>
                          <Input
                            name="payment_account_id"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.payment_account_id || ""}
                            invalid={validation.touched.payment_account_id && validation.errors.payment_account_id ? true : false}
                          >
                            <option value="">Select Payment Account</option>
                            {paymentAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.account_name} ({account.account_number})
                              </option>
                            ))}
                          </Input>
                          {validation.touched.payment_account_id && validation.errors.payment_account_id ? (
                            <FormFeedback type="invalid">{validation.errors.payment_account_id}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Total Amount</Label>
                          <Input
                            name="total_amount"
                            type="number"
                            step="0.01"
                            readOnly
                            value={validation.values.total_amount || 0}
                          />
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="mb-3">
                          <Label>Memo</Label>
                          <Input
                            name="memo"
                            type="textarea"
                            rows="3"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.memo || ""}
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label>Expense Lines</Label>
                            <Button type="button" color="primary" size="sm" onClick={addExpenseLine}>
                              <i className="bx bx-plus me-1"></i> Add Expense Line
                            </Button>
                          </div>
                          <Table bordered responsive>
                            <thead>
                              <tr>
                                <th>Account</th>
                                <th>Unit</th>
                                <th>People</th>
                                <th>Description</th>
                                <th>Amount</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {expenseLines.map((line, index) => {
                                const account = accounts.find((a) => a.id === parseInt(line.account_id));
                                const requiresPeople = account && (account.account_type?.typeName?.toLowerCase().includes("receivable") || account.account_type?.typeName?.toLowerCase().includes("payable"));
                                return (
                                  <tr key={index}>
                                    <td>
                                      <Input
                                        type="select"
                                        value={line.account_id || ""}
                                        onChange={(e) => updateExpenseLine(index, "account_id", e.target.value)}
                                      >
                                        <option value="">Select Account</option>
                                        {accounts.map((acc) => (
                                          <option key={acc.id} value={acc.id}>
                                            {acc.account_name} ({acc.account_number})
                                          </option>
                                        ))}
                                      </Input>
                                    </td>
                                    <td>
                                      <Input
                                        type="select"
                                        value={line.unit_id || ""}
                                        onChange={(e) => updateExpenseLine(index, "unit_id", e.target.value)}
                                      >
                                        <option value="">Select Unit</option>
                                        {units.map((unit) => (
                                          <option key={unit.id} value={unit.id}>
                                            {unit.name}
                                          </option>
                                        ))}
                                      </Input>
                                    </td>
                                    <td>
                                      <Input
                                        type="select"
                                        value={line.people_id || ""}
                                        onChange={(e) => updateExpenseLine(index, "people_id", e.target.value)}
                                        required={requiresPeople}
                                        style={requiresPeople && !line.people_id ? { borderColor: "red" } : {}}
                                      >
                                        <option value="">Select People</option>
                                        {people.map((person) => (
                                          <option key={person.id} value={person.id}>
                                            {person.name}
                                          </option>
                                        ))}
                                      </Input>
                                      {requiresPeople && !line.people_id && (
                                        <small className="text-danger">Required for this account type</small>
                                      )}
                                    </td>
                                    <td>
                                      <Input
                                        type="text"
                                        value={line.description || ""}
                                        onChange={(e) => updateExpenseLine(index, "description", e.target.value)}
                                      />
                                    </td>
                                    <td>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={line.amount || 0}
                                        onChange={(e) => updateExpenseLine(index, "amount", e.target.value)}
                                      />
                                    </td>
                                    <td>
                                      <Button
                                        type="button"
                                        color="danger"
                                        size="sm"
                                        onClick={() => removeExpenseLine(index)}
                                      >
                                        <i className="bx bx-trash"></i>
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <div className="d-flex justify-content-end gap-2">
                          <Button type="button" color="info" onClick={previewSplits} disabled={expenseLines.length === 0 || isLoading}>
                            <i className="bx bx-show me-1"></i> Preview Splits
                          </Button>
                          <Button type="button" color="secondary" onClick={() => navigate(`/building/${buildingId}/checks`)}>
                            Cancel
                          </Button>
                          <Button type="submit" color="primary" disabled={isSubmitting}>
                            <i className="bx bx-save me-1"></i> {isSubmitting ? (checkId ? "Updating..." : "Creating...") : (checkId ? "Update Check" : "Create Check")}
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

      {/* Preview Splits Modal */}
      <Modal isOpen={showSplitsModal} toggle={() => setShowSplitsModal(false)} size="lg">
        <ModalHeader toggle={() => setShowSplitsModal(false)}>Preview Splits</ModalHeader>
        <ModalBody>
          {splitsPreview ? (
            <div>
              <Table bordered responsive>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>People</th>
                    <th>Unit</th>
                    <th>Debit</th>
                    <th>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {splitsPreview.splits?.map((split, index) => {
                    const account = accounts.find((a) => a.id === split.account_id);
                    const person = split.people_id ? people.find((p) => p.id === split.people_id) : null;
                    const unit = split.unit_id ? units.find((u) => u.id === split.unit_id) : null;
                    return (
                      <tr key={index}>
                        <td>{account ? `${account.account_name} (${account.account_number})` : `ID: ${split.account_id}`}</td>
                        <td>{person ? person.name : split.people_id ? `ID: ${split.people_id}` : "N/A"}</td>
                        <td>{unit ? unit.name : split.unit_id ? `ID: ${split.unit_id}` : "N/A"}</td>
                        <td>{split.debit ? parseFloat(split.debit).toFixed(2) : "-"}</td>
                        <td>{split.credit ? parseFloat(split.credit).toFixed(2) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: "bold", backgroundColor: "#f8f9fa" }}>
                    <td colSpan="3">Total</td>
                    <td>{parseFloat(splitsPreview.total_debit || 0).toFixed(2)}</td>
                    <td>{parseFloat(splitsPreview.total_credit || 0).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="5" className="text-center">
                      {splitsPreview.is_balanced ? (
                        <span className="text-success">✓ Balanced</span>
                      ) : (
                        <span className="text-danger">✗ Not Balanced</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </Table>
              <div className="text-end mt-3">
                <Button color="secondary" onClick={() => setShowSplitsModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p>Loading preview...</p>
            </div>
          )}
        </ModalBody>
      </Modal>

      <ToastContainer />
      {isLoading && <Spinners setLoading={setLoading} />}
    </React.Fragment>
  );
};

export default CreateCheck;

