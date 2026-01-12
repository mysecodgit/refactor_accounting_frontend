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

const CreateCreditMemo = () => {
  document.title = "Create Credit Memo";
  const { id: buildingId, creditMemoId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [depositAccounts, setDepositAccounts] = useState([]);
  const [liabilityAccounts, setLiabilityAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [splitsPreview, setSplitsPreview] = useState(null);
  const [showSplitsModal, setShowSplitsModal] = useState(false);
  const [userId, setUserId] = useState(1); // TODO: Get from auth context

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      reference: "",
      date: moment().format("YYYY-MM-DD"),
      deposit_to: "",
      liability_account: "",
      people_id: "",
      unit_id: "",
      amount: "",
      description: "",
      building_id: buildingId ? parseInt(buildingId) : "",
    },
    validationSchema: Yup.object({
      reference: Yup.string().required("Reference is required"),
      date: Yup.date().required("Date is required"),
      deposit_to: Yup.number().required("Deposit to account is required").min(1, "Please select a deposit account"),
      liability_account: Yup.number().required("Liability account is required").min(1, "Please select a liability account"),
      people_id: Yup.number().required("People is required").min(1, "Please select a people"),
      unit_id: Yup.number().required("Unit is required").min(1, "Please select a unit"),
      amount: Yup.number().required("Amount is required").min(0.01, "Amount must be greater than 0"),
      description: Yup.string().required("Description is required"),
      building_id: Yup.number().required("Building ID is required"),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          reference: values.reference,
          date: values.date,
          deposit_to: parseInt(values.deposit_to),
          liability_account: parseInt(values.liability_account),
          people_id: parseInt(values.people_id),
          unit_id: parseInt(values.unit_id),
          amount: parseFloat(values.amount),
          description: values.description,
          building_id: parseInt(values.building_id),
        };

        let url = creditMemoId ? `credit-memos/${creditMemoId}` : "credit-memos";
        if (buildingId) {
          url = creditMemoId ? `buildings/${buildingId}/credit-memos/${creditMemoId}` : `buildings/${buildingId}/credit-memos`;
        }

        const config = {
          headers: {
            "User-ID": userId.toString(),
          },
        };

        if (creditMemoId) {
          const { data } = await axiosInstance.put(url, { ...payload, id: parseInt(creditMemoId) }, config);
          toast.success("Credit memo updated successfully");
        } else {
          const { data } = await axiosInstance.post(url, payload, config);
          toast.success("Credit memo created successfully");
        }
        navigate(`/building/${buildingId}/credit-memos`);
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
      }
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
      
      // Filter deposit accounts (Bank, Cash, Asset, and Expense accounts)
      const depositAccountsList = (data || []).filter((account) => {
        const typeName = account.account_type?.typeName || "";
        return typeName.toLowerCase().includes("bank") || 
               typeName.toLowerCase().includes("cash") ||
               typeName.toLowerCase().includes("asset") ||
               typeName.toLowerCase().includes("expense");
      });
      setDepositAccounts(depositAccountsList);

      // Filter liability accounts to only Account Receivable accounts
      const liabilityAccountsList = (data || []).filter((account) => {
        const typeName = account.account_type?.typeName || "";
        return typeName.toLowerCase() === "account receivable";
      });
      setLiabilityAccounts(liabilityAccountsList);
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

  const fetchPeople = async () => {
    try {
      let url = "people";
      if (buildingId) {
        url = `buildings/${buildingId}/people`;
      }
      const { data } = await axiosInstance.get(url);
      const customers = (data || []).filter((person) => {
        const typeTitle = person.people_type?.title || person.type?.title || "";
        return typeTitle.toLowerCase() === "customer";
      });
      setPeople(customers);
    } catch (error) {
      console.log("Error fetching people", error);
    }
  };

  const fetchUnitsForPeople = async (peopleId) => {
    if (!peopleId || !buildingId) {
      setUnits([]);
      return;
    }
    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}/leases/units-by-people/${peopleId}`);
      setUnits(data || []);
    } catch (error) {
      console.log("Error fetching units for people", error);
      setUnits([]);
    }
  };

  const fetchCreditMemoForEdit = async () => {
    if (!creditMemoId) return;
    try {
      setLoading(true);
      let url = `credit-memos/${creditMemoId}`;
      if (buildingId) {
        url = `buildings/${buildingId}/credit-memos/${creditMemoId}`;
      }
      const { data: creditMemoResponse } = await axiosInstance.get(url);
      const creditMemo = creditMemoResponse.credit_memo || creditMemoResponse;
      validation.setValues({
        reference: creditMemo.reference || creditMemo.Reference || "",
        date: creditMemo.date ? moment(creditMemo.date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
        deposit_to: creditMemo.deposit_to || "",
        liability_account: creditMemo.liability_account || "",
        people_id: creditMemo.people_id || "",
        unit_id: creditMemo.unit_id || "",
        amount: creditMemo.amount || "",
        description: creditMemo.description || "",
        building_id: buildingId ? parseInt(buildingId) : "",
      });
    } catch (error) {
      console.log("Error fetching credit memo for edit", error);
      toast.error("Failed to fetch credit memo details");
    } finally {
      setLoading(false);
    }
  };

  const previewSplits = async () => {
    if (!validation.values.deposit_to || !validation.values.liability_account || !validation.values.amount || !validation.values.people_id || !validation.values.unit_id) {
      toast.error("Please fill in all required fields before previewing splits");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        date: validation.values.date,
        deposit_to: parseInt(validation.values.deposit_to),
        liability_account: parseInt(validation.values.liability_account),
        people_id: parseInt(validation.values.people_id),
        unit_id: parseInt(validation.values.unit_id),
        amount: parseFloat(validation.values.amount),
        description: validation.values.description,
        building_id: parseInt(validation.values.building_id),
      };

      let url = "credit-memos/preview";
      if (buildingId) {
        url = `buildings/${buildingId}/credit-memos/preview`;
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

  useEffect(() => {
    fetchAccounts();
    fetchPeople();
    if (creditMemoId) {
      fetchCreditMemoForEdit();
    }
  }, [buildingId, creditMemoId]);

  // Fetch units when people_id changes
  useEffect(() => {
    if (validation.values.people_id) {
      fetchUnitsForPeople(validation.values.people_id);
    } else {
      setUnits([]);
    }
  }, [validation.values.people_id]);

  const getAccountName = (accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? account.account_name : "N/A";
  };

  const getPeopleName = (peopleId) => {
    const person = people.find((p) => p.id === peopleId);
    return person ? person.name : "N/A";
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs
            title="Credit Memos"
            breadcrumbItem={creditMemoId ? "Edit Credit Memo" : "Create Credit Memo"}
          />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      validation.handleSubmit();
                      return false;
                    }}
                  >
                    <Row className="mb-3">
                      <Col md={6}>
                        <Label>
                          Reference <span className="text-danger">*</span>
                        </Label>
                        <Input
                          name="reference"
                          type="text"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.reference}
                          invalid={validation.touched.reference && validation.errors.reference ? true : false}
                        />
                        {validation.touched.reference && validation.errors.reference ? (
                          <FormFeedback type="invalid">{validation.errors.reference}</FormFeedback>
                        ) : null}
                      </Col>
                      <Col md={6}>
                        <Label>
                          Date <span className="text-danger">*</span>
                        </Label>
                        <Input
                          name="date"
                          type="date"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.date}
                          invalid={validation.touched.date && validation.errors.date ? true : false}
                        />
                        {validation.touched.date && validation.errors.date ? (
                          <FormFeedback type="invalid">{validation.errors.date}</FormFeedback>
                        ) : null}
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Label>
                          Amount <span className="text-danger">*</span>
                        </Label>
                        <Input
                          name="amount"
                          type="number"
                          step="0.01"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.amount}
                          invalid={validation.touched.amount && validation.errors.amount ? true : false}
                        />
                        {validation.touched.amount && validation.errors.amount ? (
                          <FormFeedback type="invalid">{validation.errors.amount}</FormFeedback>
                        ) : null}
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Label>
                          People <span className="text-danger">*</span>
                        </Label>
                        <Input
                          name="people_id"
                          type="select"
                            onChange={(e) => {
                              validation.handleChange(e);
                              validation.setFieldValue("unit_id", ""); // Clear unit when people changes
                            }}
                          onBlur={validation.handleBlur}
                          value={validation.values.people_id || ""}
                          invalid={validation.touched.people_id && validation.errors.people_id ? true : false}
                        >
                          <option value="">Select People</option>
                          {people.map((person) => (
                            <option key={person.id} value={person.id}>
                              {person.name}{person.unit_name ? ` - ${person.unit_name}` : ""}
                            </option>
                          ))}
                        </Input>
                        {validation.touched.people_id && validation.errors.people_id ? (
                          <FormFeedback type="invalid">{validation.errors.people_id}</FormFeedback>
                        ) : null}
                      </Col>
                      <Col md={6}>
                        <Label>
                          Unit <span className="text-danger">*</span>
                        </Label>
                        <Input
                          name="unit_id"
                          type="select"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.unit_id || ""}
                          invalid={validation.touched.unit_id && validation.errors.unit_id ? true : false}
                        >
                          <option value="">Select Unit</option>
                          {units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.name}
                            </option>
                          ))}
                        </Input>
                        {validation.touched.unit_id && validation.errors.unit_id ? (
                          <FormFeedback type="invalid">{validation.errors.unit_id}</FormFeedback>
                        ) : null}
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Label>
                          Deposit To Account <span className="text-danger">*</span>
                        </Label>
                        <Input
                          name="deposit_to"
                          type="select"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.deposit_to || ""}
                          invalid={validation.touched.deposit_to && validation.errors.deposit_to ? true : false}
                        >
                          <option value="">Select Deposit Account</option>
                          {depositAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.account_name} ({account.account_number})
                            </option>
                          ))}
                        </Input>
                        {validation.touched.deposit_to && validation.errors.deposit_to ? (
                          <FormFeedback type="invalid">{validation.errors.deposit_to}</FormFeedback>
                        ) : null}
                      </Col>
                      <Col md={6}>
                        <Label>
                          Liability Account <span className="text-danger">*</span>
                        </Label>
                        <Input
                          name="liability_account"
                          type="select"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.liability_account || ""}
                          invalid={validation.touched.liability_account && validation.errors.liability_account ? true : false}
                        >
                          <option value="">Select Liability Account</option>
                          {liabilityAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.account_name} ({account.account_number})
                            </option>
                          ))}
                        </Input>
                        {validation.touched.liability_account && validation.errors.liability_account ? (
                          <FormFeedback type="invalid">{validation.errors.liability_account}</FormFeedback>
                        ) : null}
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={12}>
                        <Label>
                          Description <span className="text-danger">*</span>
                        </Label>
                        <Input
                          name="description"
                          type="textarea"
                          rows="3"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.description}
                          invalid={validation.touched.description && validation.errors.description ? true : false}
                        />
                        {validation.touched.description && validation.errors.description ? (
                          <FormFeedback type="invalid">{validation.errors.description}</FormFeedback>
                        ) : null}
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={12} className="d-flex justify-content-end gap-2">
                        <Button
                          type="button"
                          color="info"
                          onClick={previewSplits}
                          disabled={!validation.values.deposit_to || !validation.values.liability_account || !validation.values.amount || !validation.values.people_id || !validation.values.unit_id}
                        >
                          Preview Splits
                        </Button>
                        <Button
                          type="button"
                          color="secondary"
                          onClick={() => navigate(`/building/${buildingId}/credit-memos`)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" color="primary" disabled={isLoading}>
                          {creditMemoId ? "Update" : "Create"} Credit Memo
                        </Button>
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
          {splitsPreview && (
            <>
              <div className="table-responsive">
                <Table bordered striped>
                  <thead className="table-light">
                    <tr>
                      <th>Account</th>
                      <th>People</th>
                      <th>Unit</th>
                      <th className="text-end">Debit</th>
                      <th className="text-end">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {splitsPreview.splits.map((split, index) => {
                      const unit = split.unit_id ? units.find((u) => u.id === split.unit_id) : null;
                      return (
                        <tr key={index}>
                          <td>{split.account_name}</td>
                          <td>{split.people_id ? getPeopleName(split.people_id) : "N/A"}</td>
                          <td>{unit ? unit.name : split.unit_id ? `ID: ${split.unit_id}` : "N/A"}</td>
                          <td className="text-end">
                            {split.debit ? parseFloat(split.debit).toFixed(2) : "-"}
                          </td>
                          <td className="text-end">
                            {split.credit ? parseFloat(split.credit).toFixed(2) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                    {/* Total Row */}
                    <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                      <td colSpan="3" className="text-end">TOTAL</td>
                      <td className="text-end">{parseFloat(splitsPreview.total_debit || 0).toFixed(2)}</td>
                      <td className="text-end">{parseFloat(splitsPreview.total_credit || 0).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>
              <div className="mt-3">
                <p>
                  <strong>Balanced:</strong> {splitsPreview.is_balanced ? "Yes ✓" : "No ✗"}
                </p>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>

      <ToastContainer />
      {isLoading && <Spinners setLoading={setLoading} />}
    </React.Fragment>
  );
};

export default CreateCreditMemo;

