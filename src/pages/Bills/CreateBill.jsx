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

const CreateBill = () => {
  document.title = "Create Bill";
  const { id: buildingId, billId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [apAccounts, setApAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [expenseLines, setExpenseLines] = useState([]);
  const [userId, setUserId] = useState(1); // TODO: Get from auth context

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      bill_no: "",
      bill_date: moment().format("YYYY-MM-DD"),
      due_date: moment().add(30, "days").format("YYYY-MM-DD"),
      ap_account_id: "",
      unit_id: "",
      people_id: "",
      description: "",
      amount: 0,
      building_id: buildingId ? parseInt(buildingId) : "",
    },
    validationSchema: Yup.object({
      bill_no: Yup.string().required("Bill number is required"),
      bill_date: Yup.date().required("Bill date is required"),
      due_date: Yup.date().required("Due date is required"),
      ap_account_id: Yup.number().required("AP account is required").min(1, "Please select an AP account"),
      amount: Yup.number().required("Total amount is required").min(0.01, "Total amount must be greater than 0"),
      building_id: Yup.number().required("Building ID is required"),
    }),
    onSubmit: async (values) => {
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
          bill_no: values.bill_no,
          bill_date: values.bill_date,
          due_date: values.due_date,
          ap_account_id: parseInt(values.ap_account_id),
          unit_id: values.unit_id ? parseInt(values.unit_id) : null,
          people_id: values.people_id ? parseInt(values.people_id) : null,
          description: values.description || "",
          amount: parseFloat(values.amount),
          building_id: parseInt(values.building_id),
          expense_lines: expenseLines.map((line) => ({
            account_id: parseInt(line.account_id),
            unit_id: line.unit_id ? parseInt(line.unit_id) : null,
            people_id: line.people_id ? parseInt(line.people_id) : null,
            description: line.description || null,
            amount: parseFloat(line.amount),
          })),
        };

        let url = billId ? `bills/${billId}` : "bills";
        if (buildingId) {
          url = billId ? `v1/buildings/${buildingId}/bills/${billId}` : `v1/buildings/${buildingId}/bills`;
        }

        if (billId) {
          await axiosInstance.put(url, payload);
          toast.success("Bill updated successfully");
        } else {
          await axiosInstance.post(url, payload);
          toast.success("Bill created successfully");
        }
        navigate(`/building/${buildingId}/bills`);
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
      
      // Filter AP accounts (Accounts Payable - Liability accounts)
      const apAccountsList = (data.data || []).filter((account) => {
        const typeName = account.type?.typeName || "";
        return typeName.toLowerCase().includes("payable");
      });
      setApAccounts(apAccountsList);
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

  const fetchBillForEdit = async () => {
    if (!billId) return;
    try {
      setLoading(true);
      let url = `bills/${billId}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/bills/${billId}`;
      }
      const { data: billResponse } = await axiosInstance.get(url);
      const bill = billResponse.data.bill || billResponse.data;
      validation.setValues({
        bill_no: bill.bill_no || "",
        bill_date: bill.bill_date ? moment(bill.bill_date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
        due_date: bill.due_date ? moment(bill.due_date).format("YYYY-MM-DD") : moment().add(30, "days").format("YYYY-MM-DD"),
        ap_account_id: bill.ap_account_id || "",
        unit_id: bill.unit_id || "",
        people_id: bill.people_id || "",
        description: bill.description || "",
        amount: bill.amount || 0,
        building_id: buildingId ? parseInt(buildingId) : "",
      });
      
      // Set expense lines
      const lines = (billResponse.data.expense_lines || []).map((line) => ({
        account_id: line.account_id || "",
        unit_id: line.unit_id || "",
        people_id: line.people_id || "",
        description: line.description || "",
        amount: line.amount || 0,
      }));
      setExpenseLines(lines);
      calculateTotal(lines);
    } catch (error) {
      console.log("Error fetching bill for edit", error);
      toast.error("Failed to fetch bill details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchUnits();
    fetchPeople();
    if (billId) {
      fetchBillForEdit();
    }
  }, [buildingId, billId]);

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
    validation.setFieldValue("amount", total.toFixed(2));
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title={billId ? "Edit Bill" : "Create Bill"} breadcrumbItem={billId ? "Edit Bill" : "Create Bill"} />
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
                          <Label>Bill No <span className="text-danger">*</span></Label>
                          <Input
                            name="bill_no"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.bill_no || ""}
                            invalid={validation.touched.bill_no && validation.errors.bill_no ? true : false}
                          />
                          {validation.touched.bill_no && validation.errors.bill_no ? (
                            <FormFeedback type="invalid">{validation.errors.bill_no}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Bill Date <span className="text-danger">*</span></Label>
                          <Input
                            name="bill_date"
                            type="date"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.bill_date || ""}
                            invalid={validation.touched.bill_date && validation.errors.bill_date ? true : false}
                          />
                          {validation.touched.bill_date && validation.errors.bill_date ? (
                            <FormFeedback type="invalid">{validation.errors.bill_date}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Due Date <span className="text-danger">*</span></Label>
                          <Input
                            name="due_date"
                            type="date"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.due_date || ""}
                            invalid={validation.touched.due_date && validation.errors.due_date ? true : false}
                          />
                          {validation.touched.due_date && validation.errors.due_date ? (
                            <FormFeedback type="invalid">{validation.errors.due_date}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>AP Account <span className="text-danger">*</span></Label>
                          <Input
                            name="ap_account_id"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.ap_account_id || ""}
                            invalid={validation.touched.ap_account_id && validation.errors.ap_account_id ? true : false}
                          >
                            <option value="">Select AP Account</option>
                            {apAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.account_name} ({account.account_number})
                              </option>
                            ))}
                          </Input>
                          {validation.touched.ap_account_id && validation.errors.ap_account_id ? (
                            <FormFeedback type="invalid">{validation.errors.ap_account_id}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Unit</Label>
                          <Input
                            name="unit_id"
                            type="select"
                            onChange={validation.handleChange}
                            value={validation.values.unit_id || ""}
                          >
                            <option value="">Select Unit</option>
                            {units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.name}
                              </option>
                            ))}
                          </Input>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>People</Label>
                          <Input
                            name="people_id"
                            type="select"
                            onChange={validation.handleChange}
                            value={validation.values.people_id || ""}
                          >
                            <option value="">Select People</option>
                            {people.map((person) => (
                              <option key={person.id} value={person.id}>
                                {person.name}
                              </option>
                            ))}
                          </Input>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Total Amount</Label>
                          <Input
                            name="amount"
                            type="number"
                            step="0.01"
                            readOnly
                            value={validation.values.amount || 0}
                          />
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="mb-3">
                          <Label>Description</Label>
                          <Input
                            name="description"
                            type="textarea"
                            rows="3"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.description || ""}
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
                          <Button type="button" color="secondary" onClick={() => navigate(`/building/${buildingId}/bills`)}>
                            Cancel
                          </Button>
                          <Button type="submit" color="primary" disabled={isSubmitting}>
                            <i className="bx bx-save me-1"></i> {isSubmitting ? (billId ? "Updating..." : "Creating...") : (billId ? "Update Bill" : "Create Bill")}
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

      <ToastContainer />
      {isLoading && <Spinners setLoading={setLoading} />}
    </React.Fragment>
  );
};

export default CreateBill;
