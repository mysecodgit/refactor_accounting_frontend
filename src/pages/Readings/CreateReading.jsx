import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
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

const CreateReading = () => {
  document.title = "Create Reading";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [allLeases, setAllLeases] = useState([]);
  const [rows, setRows] = useState([
    {
      id: 1,
      unit_id: "",
      lease_id: "",
      previous_value: "",
      current_value: "",
      unit_price: "",
      total_amount: "",
      filteredLeases: [],
    },
  ]);

  // Get last day of previous month
  const getLastDayOfPreviousMonth = () => {
    return moment().subtract(1, "month").endOf("month").format("YYYY-MM-DD");
  };

  // Get previous month name
  const getPreviousMonthName = () => {
    return moment().subtract(1, "month").format("MMMM");
  };

  // Get current year
  const getCurrentYear = () => {
    return moment().format("YYYY");
  };

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      item_id: "",
      reading_month: getPreviousMonthName(),
      reading_year: getCurrentYear(),
      reading_date: getLastDayOfPreviousMonth(),
      notes: "",
      status: "1",
    },
    validationSchema: Yup.object({
      item_id: Yup.number().required("Item is required").min(1, "Please select an item"),
      reading_month: Yup.string().max(10, "Reading month must be 10 characters or less"),
      reading_year: Yup.string().max(5, "Reading year must be 5 characters or less"),
      reading_date: Yup.date().required("Reading date is required"),
      notes: Yup.string().nullable(),
      status: Yup.string().required("Status is required"),
    }),
    onSubmit: async (values) => {
      // Validate rows
      const validRows = rows.filter(
        (row) => row.unit_id && row.current_value !== "" && row.current_value !== null
      );

      if (validRows.length === 0) {
        toast.error("Please add at least one valid reading row with unit and current value");
        return;
      }

      try {
        setLoading(true);
        const readingsToCreate = validRows.map((row) => {
          const currentValue = parseFloat(row.current_value) || 0;
          const previousValue = parseFloat(row.previous_value) || 0;
          const unitPrice = parseFloat(row.unit_price) || 0;
          const consumption = currentValue - previousValue;
          const totalAmount = consumption * unitPrice;

          return {
            item_id: parseInt(values.item_id),
            unit_id: parseInt(row.unit_id),
            lease_id: row.lease_id ? parseInt(row.lease_id) : null,
            reading_month: values.reading_month || null,
            reading_year: values.reading_year || null,
            reading_date: values.reading_date,
            previous_value:
              row.previous_value !== "" && row.previous_value !== null && row.previous_value !== undefined
                ? parseFloat(row.previous_value)
                : row.previous_value === "0" || row.previous_value === 0
                ? 0
                : null,
            current_value: currentValue || null,
            unit_price: unitPrice || null,
            total_amount: totalAmount || null,
            notes: values.notes || null,
            status: values.status,
          };
        });

        const response = await axiosInstance.post(`buildings/${buildingId}/readings/import`, {
          readings: readingsToCreate,
        });

        const successCount = response.data.success_count || 0;
        const failedCount = response.data.failed_count || 0;

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} reading(s)`);
        }
        if (failedCount > 0) {
          toast.warning(`${failedCount} reading(s) failed to create`);
        }
        if (response.data.errors && response.data.errors.length > 0) {
          response.data.errors.forEach((error) => toast.error(error));
        }

        navigate(`/building/${buildingId}/readings`);
      } catch (error) {
        const errorMsg = error.response?.data?.error || "Failed to create readings";
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchItems = async () => {
    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}/items`);
      setItems(data || []);
    } catch (error) {
      console.log("Error fetching items", error);
      toast.error("Failed to fetch items");
    }
  };

  const fetchUnits = async () => {
    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}/units`);
      setUnits(data || []);
    } catch (error) {
      console.log("Error fetching units", error);
      toast.error("Failed to fetch units");
    }
  };

  const fetchLeases = async () => {
    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}/leases`);
      setAllLeases(data || []);
    } catch (error) {
      console.log("Error fetching leases", error);
      toast.error("Failed to fetch leases");
    }
  };

  // Fetch leases for a specific unit
  const fetchLeasesByUnit = async (unitId, rowId) => {
    if (!unitId) {
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === rowId ? { ...row, filteredLeases: [], lease_id: "" } : row
        )
      );
      return;
    }

    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}/leases/unit/${unitId}`);
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                filteredLeases: data || [],
                lease_id: "", // Clear lease when unit changes
              }
            : row
        )
      );
    } catch (error) {
      console.log("Error fetching leases by unit", error);
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === rowId ? { ...row, filteredLeases: [], lease_id: "" } : row
        )
      );
    }
  };

  // Fetch latest reading when item or unit changes for a specific row
  const fetchLatestReading = async (itemId, unitId, rowId) => {
    if (!itemId || !unitId) {
      setRows((prevRows) =>
        prevRows.map((row) => (row.id === rowId ? { ...row, previous_value: "" } : row))
      );
      return;
    }

    try {
      const { data } = await axiosInstance.get(`buildings/${buildingId}/readings/latest`, {
        params: {
          item_id: itemId,
          unit_id: unitId,
        },
      });

      if (data.reading && data.reading.current_value !== null && data.reading.current_value !== undefined) {
        const currentValue = data.reading.current_value;
        setRows((prevRows) =>
          prevRows.map((row) =>
            row.id === rowId
              ? { ...row, previous_value: currentValue === 0 ? "0" : currentValue.toString() }
              : row
          )
        );
      } else {
        setRows((prevRows) =>
          prevRows.map((row) => (row.id === rowId ? { ...row, previous_value: "" } : row))
        );
      }
    } catch (error) {
      console.log("Error fetching latest reading", error);
      setRows((prevRows) =>
        prevRows.map((row) => (row.id === rowId ? { ...row, previous_value: "" } : row))
      );
    }
  };

  useEffect(() => {
    fetchItems();
    fetchUnits();
    fetchLeases();
  }, [buildingId]);

  // Calculate total amount for a row when current_value, previous_value, or unit_price changes
  const calculateTotalAmount = (row) => {
    const currentValue = parseFloat(row.current_value) || 0;
    const previousValue = parseFloat(row.previous_value) || 0;
    const unitPrice = parseFloat(row.unit_price) || 0;
    const consumption = currentValue - previousValue;
    const total = consumption * unitPrice;
    return total > 0 || (currentValue > 0 && unitPrice > 0) ? total.toFixed(2) : "";
  };


  const addRow = () => {
    const newId = Math.max(...rows.map((r) => r.id), 0) + 1;
    setRows([
      ...rows,
      {
        id: newId,
        unit_id: "",
        lease_id: "",
        previous_value: "",
        current_value: "",
        unit_price: "",
        total_amount: "",
        filteredLeases: [],
      },
    ]);
  };

  const removeRow = (rowId) => {
    if (rows.length === 1) {
      toast.warning("At least one row is required");
      return;
    }
    setRows(rows.filter((row) => row.id !== rowId));
  };

  const updateRow = (rowId, field, value) => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.id === rowId) {
          const updatedRow = { ...row, [field]: value };
          
          // Calculate total amount when relevant fields change
          if (field === "current_value" || field === "previous_value" || field === "unit_price") {
            updatedRow.total_amount = calculateTotalAmount(updatedRow);
          }

          // When unit changes, fetch leases for that unit
          if (field === "unit_id") {
            fetchLeasesByUnit(value, rowId);
            // Also fetch latest reading if item is selected
            if (validation.values.item_id) {
              fetchLatestReading(validation.values.item_id, value, rowId);
            }
          }

          return updatedRow;
        }
        return row;
      })
    );
  };

  // Fetch latest reading when item_id changes for all rows with units
  useEffect(() => {
    const itemId = validation.values.item_id;
    if (itemId) {
      rows.forEach((row) => {
        if (row.unit_id) {
          fetchLatestReading(itemId, row.unit_id, row.id);
        }
      });
    } else {
      setRows((prevRows) =>
        prevRows.map((row) => ({ ...row, previous_value: "" }))
      );
    }
  }, [validation.values.item_id]);

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Create Reading" breadcrumbItem="Create Reading" />
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
                    {/* Shared Inputs Section */}
                    <h5 className="mb-3">Shared Information</h5>
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>
                            Item <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="item_id"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.item_id || ""}
                            invalid={validation.touched.item_id && validation.errors.item_id ? true : false}
                          >
                            <option value="">Select Item</option>
                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </Input>
                          {validation.touched.item_id && validation.errors.item_id ? (
                            <FormFeedback type="invalid">{validation.errors.item_id}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>
                            Reading Date <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="reading_date"
                            type="date"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.reading_date || ""}
                            invalid={validation.touched.reading_date && validation.errors.reading_date ? true : false}
                          />
                          {validation.touched.reading_date && validation.errors.reading_date ? (
                            <FormFeedback type="invalid">{validation.errors.reading_date}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Reading Month</Label>
                          <Input
                            name="reading_month"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.reading_month || ""}
                            placeholder="e.g., January"
                            invalid={validation.touched.reading_month && validation.errors.reading_month ? true : false}
                          />
                          {validation.touched.reading_month && validation.errors.reading_month ? (
                            <FormFeedback type="invalid">{validation.errors.reading_month}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Reading Year</Label>
                          <Input
                            name="reading_year"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.reading_year || ""}
                            placeholder="e.g., 2024"
                            invalid={validation.touched.reading_year && validation.errors.reading_year ? true : false}
                          />
                          {validation.touched.reading_year && validation.errors.reading_year ? (
                            <FormFeedback type="invalid">{validation.errors.reading_year}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={12}>
                        <div className="mb-3">
                          <Label>Notes</Label>
                          <Input
                            name="notes"
                            type="textarea"
                            rows="3"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.notes || ""}
                            placeholder="Additional notes..."
                            invalid={validation.touched.notes && validation.errors.notes ? true : false}
                          />
                          {validation.touched.notes && validation.errors.notes ? (
                            <FormFeedback type="invalid">{validation.errors.notes}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>
                            Status <span className="text-danger">*</span>
                          </Label>
                          <Input
                            name="status"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.status || "1"}
                            invalid={validation.touched.status && validation.errors.status ? true : false}
                          >
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                          </Input>
                          {validation.touched.status && validation.errors.status ? (
                            <FormFeedback type="invalid">{validation.errors.status}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    {/* Reading Rows Section */}
                    <hr className="my-4" />
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Reading Rows</h5>
                      <Button type="button" color="success" size="sm" onClick={addRow}>
                        + Add Row
                      </Button>
                    </div>

                    <div className="table-responsive">
                      <Table bordered hover>
                        <thead>
                          <tr>
                            <th>Unit <span className="text-danger">*</span></th>
                            <th>Lease</th>
                            <th>Previous Value</th>
                            <th>Current Value</th>
                            <th>Unit Price</th>
                            <th>Total Amount</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr key={row.id}>
                              <td>
                                <Input
                                  type="select"
                                  value={row.unit_id || ""}
                                  onChange={(e) => updateRow(row.id, "unit_id", e.target.value)}
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
                                  value={row.lease_id || ""}
                                  onChange={(e) => updateRow(row.id, "lease_id", e.target.value)}
                                >
                                  <option value="">Select Lease (Optional)</option>
                                  {row.filteredLeases.map((leaseItem) => {
                                    const lease = leaseItem.lease || leaseItem;
                                    const peopleName = leaseItem.people?.name || "";
                                    return (
                                      <option key={lease.id} value={lease.id}>
                                        {peopleName ? `${peopleName} - ` : ""}Lease #{lease.id}
                                        {lease.lease_terms ? ` - ${lease.lease_terms}` : ""}
                                      </option>
                                    );
                                  })}
                                </Input>
                              </td>
                              <td>
                                <Input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={row.previous_value || ""}
                                  onChange={(e) => updateRow(row.id, "previous_value", e.target.value)}
                                  placeholder="0.000"
                                />
                              </td>
                              <td>
                                <Input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={row.current_value || ""}
                                  onChange={(e) => updateRow(row.id, "current_value", e.target.value)}
                                  placeholder="0.000"
                                />
                              </td>
                              <td>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={row.unit_price || ""}
                                  onChange={(e) => updateRow(row.id, "unit_price", e.target.value)}
                                  placeholder="0.00"
                                />
                              </td>
                              <td>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={row.total_amount || ""}
                                  readOnly
                                  style={{ backgroundColor: "#e9ecef" }}
                                  placeholder="0.00"
                                />
                              </td>
                              <td>
                                <Button
                                  type="button"
                                  color="danger"
                                  size="sm"
                                  onClick={() => removeRow(row.id)}
                                  disabled={rows.length === 1}
                                >
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <Button
                        type="button"
                        color="secondary"
                        onClick={() => navigate(`/building/${buildingId}/readings`)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" color="primary" disabled={isLoading}>
                        {isLoading ? "Creating..." : `Create ${rows.length} Reading(s)`}
                      </Button>
                    </div>
                  </Form>
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

export default CreateReading;
