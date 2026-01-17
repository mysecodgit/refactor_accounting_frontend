import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Spinners from "../../components/Common/Spinner";
import TableContainer from "../../components/Common/TableContainer";
import {
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Modal,
  ModalHeader,
  ModalBody,
  Button,
  Badge,
  Label,
  Input,
} from "reactstrap";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";
import * as XLSX from "xlsx";

const Readings = () => {
  document.title = "Readings";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [readings, setReadings] = useState([]);
  const [filteredReadings, setFilteredReadings] = useState([]);
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [leases, setLeases] = useState([]);
  const [viewingReading, setViewingReading] = useState(null);
  const [showReadingDetailsModal, setShowReadingDetailsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  
  // Filter states
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterItemId, setFilterItemId] = useState("");
  const [filterUnitId, setFilterUnitId] = useState("");
  const [filterStatus, setFilterStatus] = useState("1"); // Default to active only

  const fetchItems = async () => {
    try {
      const { data } = await axiosInstance.get(`v1/buildings/${buildingId}/items`);
      setItems(data.data || []);
    } catch (error) {
      console.log("Error fetching items", error);
    }
  };

  const fetchUnits = async () => {
    try {
      const { data } = await axiosInstance.get(`v1/buildings/${buildingId}/units`);
      setUnits(data.data || []);
    } catch (error) {
      console.log("Error fetching units", error);
    }
  };

  const fetchLeases = async () => {
    try {
      const { data } = await axiosInstance.get(`v1/buildings/${buildingId}/leases`);
      setLeases(data.data || []);
    } catch (error) {
      console.log("Error fetching leases", error);
    }
  };

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) {
        params.status = filterStatus;
      }
      const { data } = await axiosInstance.get(`v1/buildings/${buildingId}/readings`, { params });
      const readingsList = data.data || [];
      setReadings(readingsList);
      applyFilters(readingsList);
    } catch (error) {
      console.log("Error fetching readings", error);
      toast.error("Failed to fetch readings");
      setReadings([]);
      setFilteredReadings([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (readingsList) => {
    let filtered = [...readingsList];

    // Filter by date range
    if (filterStartDate) {
      filtered = filtered.filter((r) => {
        const readingDate = moment(r.reading_date);
        return readingDate.isSameOrAfter(moment(filterStartDate), "day");
      });
    }
    if (filterEndDate) {
      filtered = filtered.filter((r) => {
        const readingDate = moment(r.reading_date);
        return readingDate.isSameOrBefore(moment(filterEndDate), "day");
      });
    }

    // Filter by item
    if (filterItemId) {
      filtered = filtered.filter((r) => r.item_id === parseInt(filterItemId));
    }

    // Filter by unit
    if (filterUnitId) {
      filtered = filtered.filter((r) => r.unit_id === parseInt(filterUnitId));
    }

    setFilteredReadings(filtered);
  };

  // Calculate summary
  const summary = useMemo(() => {
    let totalConsumption = 0;
    let totalAmount = 0;

    filteredReadings.forEach((r) => {
      const current = r.current_value || 0;
      const previous = r.previous_value || 0;
      const consumption = current - previous;
      totalConsumption += consumption;
      
      const amount = r.total_amount || 0;
      totalAmount += amount;
    });

    return {
      totalConsumption: totalConsumption.toFixed(3),
      totalAmount: totalAmount.toFixed(2),
    };
  }, [filteredReadings]);

  const fetchReadingDetails = async (readingId) => {
    try {
      setLoading(true);
      const { data: readingResponse } = await axiosInstance.get(`v1/buildings/${buildingId}/readings/${readingId}`);
      setViewingReading(readingResponse.data);
      setShowReadingDetailsModal(true);
    } catch (error) {
      console.log("Error fetching reading details", error);
      toast.error("Failed to fetch reading details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchUnits();
    fetchLeases();
    fetchReadings();
  }, [buildingId, filterStatus]);

  useEffect(() => {
    applyFilters(readings);
  }, [filterStartDate, filterEndDate, filterItemId, filterUnitId, readings]);

  const handleViewClick = (reading) => {
    fetchReadingDetails(reading.id);
  };

  const handleEditClick = (reading) => {
    console.log("handleEditClick called with:", reading);
    console.log("Full reading object:", JSON.stringify(reading, null, 2));
    const readingId = reading?.id || reading?.ID;
    console.log("Reading ID:", readingId);
    console.log("Building ID:", buildingId);
    if (readingId && buildingId) {
      const path = `/building/${buildingId}/readings/${readingId}/edit`;
      console.log("Navigating to:", path);
      try {
        navigate(path, { replace: false });
        console.log("Navigation called successfully");
      } catch (error) {
        console.error("Navigation error:", error);
        toast.error("Failed to navigate to edit page");
      }
    } else {
      console.error("Reading ID or Building ID not found:", { readingId, buildingId, reading });
      toast.error("Unable to edit: Reading ID or Building ID not found");
    }
  };

  const handleDeleteClick = async (reading) => {
    if (window.confirm("Are you sure you want to delete this reading?")) {
      try {
        setLoading(true);
        await axiosInstance.delete(`buildings/${buildingId}/readings/${reading.id}`);
        toast.success("Reading deleted successfully");
        fetchReadings();
      } catch (error) {
        console.log("Error deleting reading", error);
        toast.error("Failed to delete reading");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          toast.error("Excel file must have at least a header row and one data row");
          return;
        }

        // Parse header row (first row)
        const headers = jsonData[0].map((h) => String(h).toLowerCase().trim());
        
        // Find column indices
        const itemIdIdx = headers.findIndex((h) => h === "item_id");
        const unitIdIdx = headers.findIndex((h) => h === "unit_id");
        const leaseIdIdx = headers.findIndex((h) => h === "lease_id");
        const readingMonthIdx = headers.findIndex((h) => h === "reading_month");
        const readingYearIdx = headers.findIndex((h) => h === "reading_year");
        const readingDateIdx = headers.findIndex((h) => h === "reading_date");
        const previousValueIdx = headers.findIndex((h) => h === "previous_current_value" || h === "previous_value");
        const currentValueIdx = headers.findIndex((h) => h === "current_value");
        const unitPriceIdx = headers.findIndex((h) => h === "unit_price");
        const totalAmountIdx = headers.findIndex((h) => h === "total_amount");
        const notesIdx = headers.findIndex((h) => h === "notes");
        const statusIdx = headers.findIndex((h) => h === "status");

        if (itemIdIdx === -1 || unitIdIdx === -1 || readingDateIdx === -1) {
          toast.error("Excel file must contain item_id, unit_id, and reading_date columns");
          return;
        }

        // Parse data rows
        const readingsToImport = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const getValue = (idx) => {
            if (idx === -1 || !row[idx]) return null;
            const val = row[idx];
            return val !== null && val !== undefined && val !== "" ? val : null;
          };

          const getInt = (idx) => {
            const val = getValue(idx);
            if (val === null) return null;
            const num = typeof val === "number" ? val : parseInt(String(val));
            return isNaN(num) ? null : num;
          };

          const getFloat = (idx) => {
            const val = getValue(idx);
            if (val === null) return null;
            const num = typeof val === "number" ? val : parseFloat(String(val));
            return isNaN(num) ? null : num;
          };

          const getString = (idx) => {
            const val = getValue(idx);
            return val !== null ? String(val).trim() : null;
          };

          const getDate = (idx) => {
            const val = getValue(idx);
            if (val === null) return null;
            // Handle Excel date serial number or date string
            if (typeof val === "number") {
              // Excel date serial number
              const excelEpoch = new Date(1899, 11, 30);
              const date = new Date(excelEpoch.getTime() + val * 24 * 60 * 60 * 1000);
              return moment(date).format("YYYY-MM-DD");
            }
            // Try to parse as date string
            const date = moment(val);
            return date.isValid() ? date.format("YYYY-MM-DD") : String(val).trim();
          };

          const reading = {
            item_id: getInt(itemIdIdx),
            unit_id: getInt(unitIdIdx),
            lease_id: leaseIdIdx !== -1 ? getInt(leaseIdIdx) : null,
            reading_month: readingMonthIdx !== -1 ? getString(readingMonthIdx) : null,
            reading_year: readingYearIdx !== -1 ? getString(readingYearIdx) : null,
            reading_date: getDate(readingDateIdx),
            previous_value: previousValueIdx !== -1 ? getFloat(previousValueIdx) : null,
            current_value: currentValueIdx !== -1 ? getFloat(currentValueIdx) : null,
            unit_price: unitPriceIdx !== -1 ? getFloat(unitPriceIdx) : null,
            total_amount: totalAmountIdx !== -1 ? getFloat(totalAmountIdx) : null,
            notes: notesIdx !== -1 ? getString(notesIdx) : null,
            status: statusIdx !== -1 ? (getString(statusIdx) || "1") : "1",
          };

          // Validate required fields
          if (!reading.item_id || !reading.unit_id || !reading.reading_date) {
            continue; // Skip invalid rows
          }

          readingsToImport.push(reading);
        }

        if (readingsToImport.length === 0) {
          toast.error("No valid readings found in the Excel file");
          return;
        }

        // Import readings
        handleImportReadings(readingsToImport);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        toast.error("Failed to parse Excel file: " + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportReadings = async (readings) => {
    try {
      setImporting(true);
      const response = await axiosInstance.post(
        `v1/buildings/${buildingId}/readings/import`,
        { readings }
      );

      if (response.data.data.failed_count > 0) {
        toast.error(
          `Import failed: ${response.data.data.failed_count} rows failed. ${response.data.data.success_count} rows imported.`
        );
        if (response.data.data.errors && response.data.data.errors.length > 0) {
          console.error("Import errors:", response.data.data.errors);
          // Show first few errors
          const errorMsg = response.data.data.errors.slice(0, 5).join("; ");
          toast.error(`Errors: ${errorMsg}`);
        }
      } else {
        toast.success(`Successfully imported ${response.data.success_count} readings`);
        fetchReadings();
        setShowImportModal(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to import readings";
      toast.error(errorMsg);
      if (error.response?.data?.result) {
        const result = error.response.data.result;
        if (result.errors && result.errors.length > 0) {
          console.error("Import errors:", result.errors);
          const errorMsg = result.errors.slice(0, 5).join("; ");
          toast.error(`Errors: ${errorMsg}`);
        }
      }
    } finally {
      setImporting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        header: "Reading Date",
        id: "reading_date",
        accessorKey: "reading_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const reading = cell.row.original;
          return <>{reading.reading_date ? moment(reading.reading_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Reading Month",
        id: "reading_month",
        accessorKey: "reading_month",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const reading = cell.row.original;
          const month = reading.reading_month || "";
          const year = reading.reading_year || "";
          return <>{month || year ? `${month} ${year}`.trim() : "N/A"}</>;
        },
      },
      {
        header: "Item",
        id: "item",
        accessorKey: "item.name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.item?.name || "N/A"}</>;
        },
      },
      {
        header: "Unit",
        id: "unit",
        accessorKey: "unit.name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.unit?.name || "N/A"}</>;
        },
      },
      {
        header: "Lease",
        id: "lease",
        accessorKey: "people_name",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const peopleName = cell.row.original.people_name;
          return <>{peopleName || "N/A"}</>;
        },
      },
      {
        header: "Previous Value",
        id: "previous_value",
        accessorKey: "previous_value",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const value = cell.row.original.previous_value;
          return <>{value !== null && value !== undefined ? parseFloat(value).toFixed(3) : "N/A"}</>;
        },
      },
      {
        header: "Current Value",
        id: "current_value",
        accessorKey: "current_value",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const value = cell.row.original.current_value;
          return <>{value !== null && value !== undefined ? parseFloat(value).toFixed(3) : "N/A"}</>;
        },
      },
      {
        header: "Unit Price",
        id: "unit_price",
        accessorKey: "unit_price",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const value = cell.row.original.unit_price;
          return <>{value !== null && value !== undefined ? parseFloat(value).toFixed(2) : "N/A"}</>;
        },
      },
      {
        header: "Consumption",
        id: "consumption",
        accessorKey: "consumption",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const current = cell.row.original.current_value || 0;
          const previous = cell.row.original.previous_value || 0;
          const consumption = current - previous;
          return <>{consumption.toFixed(3)}</>;
        },
      },
      {
        header: "Total Amount",
        id: "total_amount",
        accessorKey: "total_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const value = cell.row.original.total_amount;
          return <>{value !== null && value !== undefined ? parseFloat(value).toFixed(2) : "N/A"}</>;
        },
      },
      {
        header: "Notes",
        id: "notes",
        accessorKey: "notes",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.notes || "N/A"}</>;
        },
      },
      {
        header: "Status",
        id: "status",
        accessorKey: "status",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const status = cell.row.original.status;
          return (
            <Badge color={status === "1" ? "success" : "danger"}>
              {status === "1" ? "Active" : "Inactive"}
            </Badge>
          );
        },
      },
      {
        header: "Action",
        id: "actions",
        accessorKey: "actions",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (cell) => {
          const reading = cell.row.original;
          const readingId = reading?.id || reading?.ID;
          return (
            <>
              <Button
                color="primary"
                size="sm"
                type="button"
                onClick={(e) => {
                  console.log("Edit button clicked!");
                  e.preventDefault();
                  e.stopPropagation();
                  const readingData = cell.row.original;
                  console.log("Reading data:", readingData);
                  console.log("Calling handleEditClick with:", readingData);
                  handleEditClick(readingData);
                }}
              >
                Edit
              </Button>
            </>
          );
        },
      },
    ],
    []
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Readings" breadcrumbItem="Readings" />
          
          {/* Summary Cards */}
          <Row className="mb-3">
            <Col md={6}>
              <Card>
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <p className="text-muted mb-1">Total Consumption</p>
                      <h4 className="mb-0">{summary.totalConsumption}</h4>
                    </div>
                    <div className="avatar-sm">
                      <span className="avatar-title bg-primary-subtle rounded-circle fs-3">
                        <i className="bx bx-tachometer text-primary"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <CardBody>
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <p className="text-muted mb-1">Total Amount</p>
                      <h4 className="mb-0">${summary.totalAmount}</h4>
                    </div>
                    <div className="avatar-sm">
                      <span className="avatar-title bg-success-subtle rounded-circle fs-3">
                        <i className="bx bx-dollar text-success"></i>
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Row className="mb-3">
            <Col xs={12}>
              <Card>
                <CardBody>
                  <h5 className="card-title mb-3">Filters</h5>
                  <Row>
                    <Col md={3}>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                      />
                    </Col>
                    <Col md={3}>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                      />
                    </Col>
                    <Col md={2}>
                      <Label>Item</Label>
                      <Input
                        type="select"
                        value={filterItemId}
                        onChange={(e) => setFilterItemId(e.target.value)}
                      >
                        <option value="">All Items</option>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={2}>
                      <Label>Unit</Label>
                      <Input
                        type="select"
                        value={filterUnitId}
                        onChange={(e) => setFilterUnitId(e.target.value)}
                      >
                        <option value="">All Units</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.name}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={2}>
                      <Label>Status</Label>
                      <Input
                        type="select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </Input>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Readings Table */}
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="card-title mb-0">Readings</h4>
                    <div className="d-flex gap-2">
                      <Button
                        color="success"
                        onClick={() => setShowImportModal(true)}
                      >
                        <i className="mdi mdi-file-excel me-1"></i> Import Excel
                      </Button>
                      <Button
                        color="primary"
                        onClick={() => navigate(`/building/${buildingId}/readings/create`)}
                      >
                        <i className="mdi mdi-plus me-1"></i> Add Reading
                      </Button>
                    </div>
                  </div>
                  {isLoading ? (
                    <Spinners />
                  ) : (
                    <TableContainer
                      columns={columns}
                      data={filteredReadings}
                      isGlobalFilter={true}
                      isPagination={false}
                      paginationDiv="col-sm-12 col-md-7"
                      pagination="pagination justify-content-end pagination-rounded"
                      isCustomPageSize={false}
                      
                    />
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* View Reading Details Modal */}
      <Modal
        isOpen={showReadingDetailsModal}
        toggle={() => setShowReadingDetailsModal(false)}
        size="lg"
      >
        <ModalHeader toggle={() => setShowReadingDetailsModal(false)}>
          Reading Details
        </ModalHeader>
        <ModalBody>
          {viewingReading && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>ID:</strong> {viewingReading.id}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong>{" "}
                  <Badge color={viewingReading.status === "1" ? "success" : "danger"}>
                    {viewingReading.status === "1" ? "Active" : "Inactive"}
                  </Badge>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Item:</strong> {viewingReading.item?.name || "N/A"}
                </Col>
                <Col md={6}>
                  <strong>Unit:</strong> {viewingReading.unit?.name || "N/A"}
                </Col>
              </Row>
              {viewingReading.people_name && (
                <Row className="mb-3">
                  <Col md={12}>
                    <strong>People Name:</strong> {viewingReading.people_name}
                  </Col>
                </Row>
              )}
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Reading Date:</strong>{" "}
                  {viewingReading.reading_date
                    ? moment(viewingReading.reading_date).format("YYYY-MM-DD")
                    : "N/A"}
                </Col>
                <Col md={6}>
                  <strong>Month/Year:</strong>{" "}
                  {viewingReading.reading_month || viewingReading.reading_year
                    ? `${viewingReading.reading_month || ""} ${viewingReading.reading_year || ""}`.trim()
                    : "N/A"}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Previous Value:</strong>{" "}
                  {viewingReading.previous_value !== null && viewingReading.previous_value !== undefined
                    ? parseFloat(viewingReading.previous_value).toFixed(3)
                    : "N/A"}
                </Col>
                <Col md={6}>
                  <strong>Current Value:</strong>{" "}
                  {viewingReading.current_value !== null && viewingReading.current_value !== undefined
                    ? parseFloat(viewingReading.current_value).toFixed(3)
                    : "N/A"}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Unit Price:</strong>{" "}
                  {viewingReading.unit_price !== null && viewingReading.unit_price !== undefined
                    ? parseFloat(viewingReading.unit_price).toFixed(2)
                    : "N/A"}
                </Col>
                <Col md={6}>
                  <strong>Total Amount:</strong>{" "}
                  {viewingReading.total_amount !== null && viewingReading.total_amount !== undefined
                    ? parseFloat(viewingReading.total_amount).toFixed(2)
                    : "N/A"}
                </Col>
              </Row>
              {viewingReading.notes && (
                <Row className="mb-3">
                  <Col md={12}>
                    <strong>Notes:</strong>
                    <p>{viewingReading.notes}</p>
                  </Col>
                </Row>
              )}
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Created At:</strong>{" "}
                  {viewingReading.created_at
                    ? moment(viewingReading.created_at).format("YYYY-MM-DD HH:mm:ss")
                    : "N/A"}
                </Col>
                <Col md={6}>
                  <strong>Updated At:</strong>{" "}
                  {viewingReading.updated_at
                    ? moment(viewingReading.updated_at).format("YYYY-MM-DD HH:mm:ss")
                    : "N/A"}
                </Col>
              </Row>
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Import Excel Modal */}
      <Modal
        isOpen={showImportModal}
        toggle={() => {
          setShowImportModal(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
        size="lg"
      >
        <ModalHeader toggle={() => {
          setShowImportModal(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}>
          Import Readings from Excel
        </ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <Label>Select Excel File</Label>
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              ref={fileInputRef}
              disabled={importing}
            />
            <small className="text-muted d-block mt-2">
              Excel file should contain columns: item_id, unit_id, lease_id (optional), reading_month (optional), reading_year (optional), reading_date, previous_current_value or previous_value, current_value, unit_price (optional), total_amount (optional), notes (optional), status (optional, defaults to "1")
            </small>
          </div>
          {importing && (
            <div className="text-center">
              <Spinners />
              <p>Importing readings...</p>
            </div>
          )}
        </ModalBody>
      </Modal>

      <ToastContainer />
    </React.Fragment>
  );
};

export default Readings;

