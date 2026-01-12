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

const CreateJournal = () => {
  document.title = "Create Journal";
  const { id: buildingId, journalId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submissions
  const [accounts, setAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [journalLines, setJournalLines] = useState([]);
  const [splitsPreview, setSplitsPreview] = useState(null);
  const [showSplitsModal, setShowSplitsModal] = useState(false);
  const [userId, setUserId] = useState(1); // TODO: Get from auth context

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      reference: "",
      journal_date: moment().format("YYYY-MM-DD"),
      memo: "",
      total_amount: 0,
      building_id: buildingId ? parseInt(buildingId) : "",
    },
    validationSchema: Yup.object({
      reference: Yup.string().required("Reference is required"),
      journal_date: Yup.date().required("Journal date is required"),
      total_amount: Yup.number().min(0, "Total amount cannot be negative"),
      building_id: Yup.number().required("Building ID is required"),
    }),
    onSubmit: async (values) => {
      // Prevent double submission
      if (isSubmitting) {
        return;
      }
      
      if (journalLines.length === 0) {
        toast.error("Please add at least one journal line");
        return;
      }
      
      setIsSubmitting(true);
      try {
        const payload = {
          reference: values.reference,
          journal_date: values.journal_date,
          memo: values.memo || null,
          total_amount: parseFloat(values.total_amount),
          building_id: parseInt(values.building_id),
          lines: journalLines.map((line) => ({
            account_id: parseInt(line.account_id),
            unit_id: line.unit_id ? parseInt(line.unit_id) : null,
            people_id: line.people_id ? parseInt(line.people_id) : null,
            description: line.description || null,
            debit: line.debit && parseFloat(line.debit) > 0 ? parseFloat(line.debit) : null,
            credit: line.credit && parseFloat(line.credit) > 0 ? parseFloat(line.credit) : null,
          })),
        };

        let url = journalId ? `journals/${journalId}` : "journals";
        if (buildingId) {
          url = journalId ? `buildings/${buildingId}/journals/${journalId}` : `buildings/${buildingId}/journals`;
        }

        const config = {
          headers: {
            "User-ID": userId.toString(),
          },
        };

        if (journalId) {
          const { data } = await axiosInstance.put(url, payload, config);
          toast.success("Journal updated successfully");
        } else {
          const { data } = await axiosInstance.post(url, payload, config);
          toast.success("Journal created successfully");
        }
        navigate(`/building/${buildingId}/journals`);
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

  const fetchPeople = async () => {
    try {
      let url = "people";
      if (buildingId) {
        url = `buildings/${buildingId}/people`;
      }
      const { data } = await axiosInstance.get(url);
      setPeople(data || []);
    } catch (error) {
      console.log("Error fetching people", error);
    }
  };

  const fetchJournalForEdit = async () => {
    if (!journalId) return;
    try {
      setLoading(true);
      let url = `journals/${journalId}`;
      if (buildingId) {
        url = `buildings/${buildingId}/journals/${journalId}`;
      }
      const { data: journalResponse } = await axiosInstance.get(url);
      const journal = journalResponse.journal || journalResponse;
      validation.setValues({
        reference: journal.reference || journal.Reference || "",
        journal_date: journal.journal_date ? moment(journal.journal_date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD"),
        memo: journal.memo || "",
        total_amount: journal.total_amount || 0,
        building_id: buildingId ? parseInt(buildingId) : "",
      });
      
      // Set journal lines
      const lines = (journalResponse.lines || []).map((line) => ({
        account_id: line.account_id || "",
        unit_id: line.unit_id || "",
        people_id: line.people_id || "",
        description: line.description || "",
        debit: line.debit || "",
        credit: line.credit || "",
      }));
      setJournalLines(lines);
      calculateTotal(lines);
    } catch (error) {
      console.log("Error fetching journal for edit", error);
      toast.error("Failed to fetch journal details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchUnits();
    fetchPeople();
    if (journalId) {
      fetchJournalForEdit();
    }
  }, [buildingId, journalId]);

  const addJournalLine = () => {
    setJournalLines([
      ...journalLines,
      {
        account_id: "",
        unit_id: "",
        people_id: "",
        description: "",
        debit: "",
        credit: "",
      },
    ]);
  };

  const removeJournalLine = (index) => {
    const newLines = journalLines.filter((_, i) => i !== index);
    setJournalLines(newLines);
    calculateTotal(newLines);
  };

  const updateJournalLine = (index, field, value) => {
    const newLines = [...journalLines];
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
    
    // If debit is entered, clear credit and vice versa
    if (field === "debit" && value && parseFloat(value) > 0) {
      newLines[index].credit = "";
    }
    if (field === "credit" && value && parseFloat(value) > 0) {
      newLines[index].debit = "";
    }
    
    setJournalLines(newLines);
    if (field === "debit" || field === "credit") {
      calculateTotal(newLines);
    }
  };

  const calculateTotal = (journalLinesList) => {
    let totalDebit = 0;
    let totalCredit = 0;
    journalLinesList.forEach((line) => {
      totalDebit += parseFloat(line.debit || 0);
      totalCredit += parseFloat(line.credit || 0);
    });
    // Total amount is the larger of debit or credit (they should be equal when balanced)
    const total = Math.max(totalDebit, totalCredit);
    validation.setFieldValue("total_amount", total.toFixed(2));
  };

  const previewSplits = async () => {
    if (journalLines.length === 0) {
      toast.error("Please add at least one journal line");
      return;
    }

    // Validate journal lines
    for (const line of journalLines) {
      if (!line.account_id) {
        toast.error("Please select an account for all journal lines");
        return;
      }
      const hasDebit = line.debit && parseFloat(line.debit) > 0;
      const hasCredit = line.credit && parseFloat(line.credit) > 0;
      if (!hasDebit && !hasCredit) {
        toast.error("Each journal line must have either a debit or credit amount");
        return;
      }
      if (hasDebit && hasCredit) {
        toast.error("Journal line cannot have both debit and credit");
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
        journal_date: validation.values.journal_date,
        memo: validation.values.memo || null,
        total_amount: parseFloat(validation.values.total_amount),
        building_id: parseInt(validation.values.building_id),
        lines: journalLines.map((line) => ({
          account_id: parseInt(line.account_id),
          unit_id: line.unit_id ? parseInt(line.unit_id) : null,
          people_id: line.people_id ? parseInt(line.people_id) : null,
          description: line.description || null,
          debit: line.debit && parseFloat(line.debit) > 0 ? parseFloat(line.debit) : null,
          credit: line.credit && parseFloat(line.credit) > 0 ? parseFloat(line.credit) : null,
        })),
      };

      let url = "journals/preview";
      if (buildingId) {
        url = `buildings/${buildingId}/journals/preview`;
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
          <Breadcrumbs title={journalId ? "Edit Journal" : "Create Journal"} breadcrumbItem={journalId ? "Edit Journal" : "Create Journal"} />
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
                          <Label>Reference <span className="text-danger">*</span></Label>
                          <Input
                            name="reference"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.reference || ""}
                            invalid={validation.touched.reference && validation.errors.reference ? true : false}
                          />
                          {validation.touched.reference && validation.errors.reference ? (
                            <FormFeedback type="invalid">{validation.errors.reference}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Journal Date <span className="text-danger">*</span></Label>
                          <Input
                            name="journal_date"
                            type="date"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.journal_date || ""}
                            invalid={validation.touched.journal_date && validation.errors.journal_date ? true : false}
                          />
                          {validation.touched.journal_date && validation.errors.journal_date ? (
                            <FormFeedback type="invalid">{validation.errors.journal_date}</FormFeedback>
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
                            <Label>Journal Lines</Label>
                            <Button type="button" color="primary" size="sm" onClick={addJournalLine}>
                              <i className="bx bx-plus me-1"></i> Add Journal Line
                            </Button>
                          </div>
                          <Table bordered responsive>
                            <thead>
                              <tr>
                                <th>Account</th>
                                <th>Unit</th>
                                <th>People</th>
                                <th>Description</th>
                                <th>Debit</th>
                                <th>Credit</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {journalLines.map((line, index) => {
                                const account = accounts.find((a) => a.id === parseInt(line.account_id));
                                const requiresPeople = account && (account.account_type?.typeName?.toLowerCase().includes("receivable") || account.account_type?.typeName?.toLowerCase().includes("payable"));
                                return (
                                  <tr key={index}>
                                    <td>
                                      <Input
                                        type="select"
                                        value={line.account_id || ""}
                                        onChange={(e) => updateJournalLine(index, "account_id", e.target.value)}
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
                                        onChange={(e) => updateJournalLine(index, "unit_id", e.target.value)}
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
                                        onChange={(e) => updateJournalLine(index, "people_id", e.target.value)}
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
                                        onChange={(e) => updateJournalLine(index, "description", e.target.value)}
                                      />
                                    </td>
                                    <td>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={line.debit || ""}
                                        onChange={(e) => updateJournalLine(index, "debit", e.target.value)}
                                        placeholder="0.00"
                                      />
                                    </td>
                                    <td>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={line.credit || ""}
                                        onChange={(e) => updateJournalLine(index, "credit", e.target.value)}
                                        placeholder="0.00"
                                      />
                                    </td>
                                    <td>
                                      <Button
                                        type="button"
                                        color="danger"
                                        size="sm"
                                        onClick={() => removeJournalLine(index)}
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
                          <Button type="button" color="info" onClick={previewSplits} disabled={journalLines.length === 0 || isLoading}>
                            <i className="bx bx-show me-1"></i> Preview Splits
                          </Button>
                          <Button type="button" color="secondary" onClick={() => navigate(`/building/${buildingId}/journals`)}>
                            Cancel
                          </Button>
                          <Button type="submit" color="primary" disabled={isSubmitting}>
                            <i className="bx bx-save me-1"></i> {isSubmitting ? (journalId ? "Updating..." : "Creating...") : (journalId ? "Update Journal" : "Create Journal")}
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

export default CreateJournal;

