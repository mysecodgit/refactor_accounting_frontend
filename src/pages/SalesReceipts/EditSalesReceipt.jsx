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

const EditSalesReceipt = () => {
  document.title = "Edit Sales Receipt";
  const { id: buildingId, receiptId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevent double submissions
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [assetAccounts, setAssetAccounts] = useState([]);
  const [receiptItems, setReceiptItems] = useState([]);
  const [splitsPreview, setSplitsPreview] = useState([]);
  const [showSplitsModal, setShowSplitsModal] = useState(false);
  const [nextReceiptNo, setNextReceiptNo] = useState("1");
  const [userId, setUserId] = useState(1); // TODO: Get from auth context

  const validation = useFormik({
    enableReinitialize: true,
    initialValues: {
      receipt_no: nextReceiptNo,
      receipt_date: moment().format("YYYY-MM-DD"),
      unit_id: "",
      people_id: "",
      account_id: "",
      amount: 0,
      description: "",
      status: 1,
      building_id: buildingId ? parseInt(buildingId) : "",
    },
    validationSchema: Yup.object({
      receipt_no: Yup.string().required("Receipt number is required"),
      receipt_date: Yup.date().required("Receipt date is required"),
      unit_id: Yup.number().required("Unit is required").min(1, "Please select a unit"),
      people_id: Yup.number().required("People/Customer is required").min(1, "Please select a people/customer"),
      account_id: Yup.number().required("Asset Account is required").min(1, "Please select an asset account"),
      amount: Yup.number().required("Amount is required"),
      description: Yup.string().required("Description is required"),
      status: Yup.number().oneOf([0, 1]),
      building_id: Yup.number().required("Building ID is required"),
    }),
    onSubmit: async (values) => {
      // Prevent double submission
      if (isSubmitting) {
        return;
      }
      
      setIsSubmitting(true);
      try {
        const payload = {
          id: parseInt(receiptId),
          receipt_no: values.receipt_no,
          receipt_date: values.receipt_date,
          unit_id: values.unit_id ? parseInt(values.unit_id) : null,
          people_id: values.people_id ? parseInt(values.people_id) : null,
          account_id: values.account_id ? parseInt(values.account_id) : null,
          amount: parseFloat(values.amount),
          description: values.description,
          status: parseInt(values.status),
          building_id: parseInt(values.building_id),
          items: receiptItems.map((item) => ({
            item_id: parseInt(item.item_id),
            qty: item.qty !== null && item.qty !== undefined ? item.qty : null, // Send qty as-is without rounding
            rate: item.rate ? item.rate.toString() : null,
            total: item.total !== null && item.total !== undefined ? item.total : null, // Send manually edited total
            previous_value: item.previous_value !== null && item.previous_value !== undefined ? item.previous_value : null,
            current_value: item.current_value !== null && item.current_value !== undefined ? item.current_value : null,
          })),
        };

        let url = `sales-receipts/${receiptId}`;
        if (buildingId) {
          url = `buildings/${buildingId}/sales-receipts/${receiptId}`;
        }

        const config = {
          headers: {
            "User-ID": userId.toString(),
          },
        };

        const { data } = await axiosInstance.put(url, payload, config);
        toast.success("Sales receipt updated successfully");
        navigate(`/building/${buildingId}/sales-receipts`);
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.errors || "Something went wrong";
        toast.error(typeof errorMsg === "object" ? JSON.stringify(errorMsg) : errorMsg);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  const fetchItems = async () => {
    try {
      let url = "items";
      if (buildingId) {
        url = `buildings/${buildingId}/items`;
      }
      const { data } = await axiosInstance.get(url);
      setItems(data || []);
    } catch (error) {
      console.log("Error fetching items", error);
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

  const fetchAccounts = async () => {
    try {
      let url = "accounts";
      if (buildingId) {
        url = `buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data || []);
      
      const assetAccountsList = (data || []).filter((account) => {
        const typeName = account.account_type?.typeName || "";
        return typeName.toLowerCase().includes("asset") || 
               typeName.toLowerCase().includes("cash") ||
               typeName.toLowerCase().includes("bank");
      });
      setAssetAccounts(assetAccountsList);
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const fetchReceiptForEdit = async () => {
    try {
      setLoading(true);
      let url = `sales-receipts/${receiptId}`;
      if (buildingId) {
        url = `buildings/${buildingId}/sales-receipts/${receiptId}`;
      }
      const { data: receiptResponse } = await axiosInstance.get(url);
      
      const receiptData = receiptResponse.receipt || receiptResponse;
      const itemsData = receiptResponse.items || [];
      
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateStr;
        }
        return moment(dateStr).format("YYYY-MM-DD");
      };
      
      validation.setValues({
        receipt_no: receiptData.receipt_no ? receiptData.receipt_no.toString() : nextReceiptNo,
        receipt_date: formatDate(receiptData.receipt_date),
        unit_id: receiptData.unit_id ? receiptData.unit_id.toString() : "",
        people_id: receiptData.people_id ? receiptData.people_id.toString() : "",
        account_id: receiptData.account_id ? receiptData.account_id.toString() : "",
        amount: receiptData.amount || 0,
        description: receiptData.description || "",
        status: receiptData.status !== undefined ? receiptData.status : 1,
        building_id: receiptData.building_id || (buildingId ? parseInt(buildingId) : ""),
      });

      const activeItems = (itemsData || []).filter(item => item.status === "1" || item.status === 1).map(item => ({
        item_id: item.item_id ? item.item_id.toString() : "",
        qty: item.qty,
        rate: item.rate ? item.rate.toString() : "",
        previous_value: item.previous_value,
        current_value: item.current_value,
        item_name: item.item_name,
        total: item.total,
      }));
      setReceiptItems(activeItems);
      
      calculateTotal(activeItems);
      calculateSplits(activeItems, receiptData.account_id?.toString(), receiptData.people_id?.toString());
    } catch (error) {
      console.log("Error fetching sales receipt for edit", error);
      toast.error("Failed to fetch sales receipt for editing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchPeople();
    fetchAccounts();
    if (receiptId) {
      fetchReceiptForEdit();
    }
  }, [buildingId, receiptId]);

  // Fetch units when people_id changes
  useEffect(() => {
    if (validation.values.people_id) {
      fetchUnitsForPeople(validation.values.people_id);
    } else {
      setUnits([]);
    }
  }, [validation.values.people_id]);

  const addReceiptItem = () => {
    setReceiptItems([
      ...receiptItems,
      {
        item_id: "",
        qty: 1,
        rate: "",
        previous_value: null,
        current_value: null,
        item_name: "",
        total: 0,
      },
    ]);
  };

  const removeReceiptItem = (index) => {
    const newItems = receiptItems.filter((_, i) => i !== index);
    setReceiptItems(newItems);
    calculateTotal(newItems);
    calculateSplits(newItems);
  };

  const updateReceiptItem = (index, field, value) => {
    const newItems = [...receiptItems];
    newItems[index][field] = value;

    if (field === "item_id") {
      const item = items.find((i) => i.id === parseInt(value));
      if (item) {
        newItems[index].item_name = item.name;
        newItems[index].rate = item.avg_cost.toString();
        if ((newItems[index].current_value === null || newItems[index].current_value === undefined) && item.avg_cost) {
          newItems[index].current_value = item.avg_cost;
        }
        if (item.type === "discount" || item.type === "payment") {
          newItems[index].qty = 1;
          const rateValue = parseFloat(item.avg_cost);
          newItems[index].rate = rateValue < 0 ? rateValue.toString() : (-Math.abs(rateValue)).toString();
        }
      }
    }

    if (field === "rate") {
      const item = items.find((i) => i.id === parseInt(newItems[index].item_id));
      if (item && (item.type === "discount" || item.type === "payment")) {
        const rateValue = parseFloat(value) || 0;
        newItems[index].rate = (-Math.abs(rateValue)).toString();
      }
    }

    if (field === "qty" || field === "rate" || field === "item_id") {
      const item = items.find((i) => i.id === parseInt(newItems[index].item_id));
      if (item) {
        if (item.type === "discount" || item.type === "payment") {
          const rateValue = parseFloat(newItems[index].rate) || 0;
          newItems[index].total = Math.abs(rateValue);
          newItems[index].qty = 1;
        } else {
          if (newItems[index].item_id && newItems[index].qty && newItems[index].rate) {
            newItems[index].total = parseFloat(newItems[index].qty) * parseFloat(newItems[index].rate);
          } else {
            newItems[index].total = 0;
          }
        }
      } else {
        newItems[index].total = 0;
      }
    }
    
    // If total is manually edited, don't recalculate from qty/rate
    if (field === "total") {
      // Total was manually edited, keep it as is
      newItems[index].total = value;
    }

    setReceiptItems(newItems);
    calculateTotal(newItems);
    calculateSplits(newItems);
  };

  const calculateSplits = (itemsList, accountIdOverride = null, peopleIdOverride = null) => {
    const accountId = accountIdOverride || validation.values.account_id;
    const peopleId = peopleIdOverride || validation.values.people_id;
    const unitId = validation.values.unit_id ? parseInt(validation.values.unit_id) : null;
    
    if (itemsList.length === 0 || accounts.length === 0 || !accountId) {
      setSplitsPreview({ splits: [], total_debit: 0, total_credit: 0, is_balanced: true });
      return;
    }

    const splits = [];
    let discountTotal = 0;
    let paymentTotal = 0;
    let serviceTotalAmount = 0;
    
    const assetAccount = accounts.find((a) => a.id === parseInt(accountId));
    if (!assetAccount) {
      setSplitsPreview({ splits: [], total_debit: 0, total_credit: 0, is_balanced: true });
      return;
    }

    const serviceIncomeByAccount = {};
    const serviceDebitByAccount = {};
    let discountIncomeAccount = null;
    let paymentAssetAccount = null;

    itemsList.forEach((receiptItem) => {
      if (!receiptItem.item_id) return;

      const item = items.find((i) => i.id === parseInt(receiptItem.item_id));
      if (!item) return;

      const itemTotal = receiptItem.total || 0;

      if (item.type === "discount") {
        const discountAmount = Math.abs(itemTotal);
        discountTotal += discountAmount;
        if (item.income_account?.id) {
          discountIncomeAccount = item.income_account;
        }
      } else if (item.type === "payment") {
        const paymentAmount = Math.abs(itemTotal);
        paymentTotal += paymentAmount;
        if (item.asset_account?.id) {
          paymentAssetAccount = item.asset_account;
        }
      } else if (item.type === "service") {
        serviceTotalAmount += itemTotal;
        if (item.income_account?.id) {
          if (itemTotal >= 0) {
            if (!serviceIncomeByAccount[item.income_account.id]) {
              serviceIncomeByAccount[item.income_account.id] = 0;
            }
            serviceIncomeByAccount[item.income_account.id] += itemTotal;
          } else {
            if (!serviceDebitByAccount[item.income_account.id]) {
              serviceDebitByAccount[item.income_account.id] = 0;
            }
            serviceDebitByAccount[item.income_account.id] += Math.abs(itemTotal);
          }
        }
      }
    });

    const selectedPeopleId = peopleId ? parseInt(peopleId) : null;
    const selectedPeople = selectedPeopleId ? people.find((p) => p.id === selectedPeopleId) : null;
    const peopleName = selectedPeople ? selectedPeople.name : null;

    const assetAmount = serviceTotalAmount - discountTotal - paymentTotal;

    if (assetAmount > 0) {
      splits.push({
        account_id: assetAccount.id,
        account_name: assetAccount.account_name,
        people_id: selectedPeopleId,
        people_name: peopleName,
        unit_id: unitId, // Include unit_id from form
        debit: assetAmount,
        credit: null,
        status: "active",
      });
    } else if (assetAmount < 0) {
      splits.push({
        account_id: assetAccount.id,
        account_name: assetAccount.account_name,
        people_id: selectedPeopleId,
        people_name: peopleName,
        unit_id: unitId, // Include unit_id from form
        debit: null,
        credit: Math.abs(assetAmount),
        status: "active",
      });
    }

    if (discountTotal > 0 && discountIncomeAccount) {
      splits.push({
        account_id: discountIncomeAccount.id,
        account_name: discountIncomeAccount.account_name || "Discount Income",
        people_id: selectedPeopleId,
        people_name: peopleName,
        unit_id: unitId, // Include unit_id from form
        debit: discountTotal,
        credit: null,
        status: "active",
      });
    }

    if (paymentTotal > 0 && paymentAssetAccount) {
      splits.push({
        account_id: paymentAssetAccount.id,
        account_name: paymentAssetAccount.account_name || "Payment Asset",
        people_id: selectedPeopleId,
        people_name: peopleName,
        unit_id: unitId, // Include unit_id from form
        debit: paymentTotal,
        credit: null,
        status: "active",
      });
    }

    Object.keys(serviceIncomeByAccount).forEach((accountId) => {
      const account = accounts.find((a) => a.id === parseInt(accountId));
      if (account) {
        splits.push({
          account_id: parseInt(accountId),
          account_name: account.account_name,
          people_id: selectedPeopleId,
          people_name: peopleName,
          unit_id: unitId, // Include unit_id from form
          debit: null,
          credit: serviceIncomeByAccount[accountId],
          status: "active",
        });
      }
    });

    Object.keys(serviceDebitByAccount).forEach((accountId) => {
      const account = accounts.find((a) => a.id === parseInt(accountId));
      if (account) {
        splits.push({
          account_id: parseInt(accountId),
          account_name: account.account_name,
          people_id: selectedPeopleId,
          people_name: peopleName,
          unit_id: unitId, // Include unit_id from form
          debit: serviceDebitByAccount[accountId],
          credit: null,
          status: "active",
        });
      }
    });

    let totalDebit = 0;
    let totalCredit = 0;
    splits.forEach((split) => {
      if (split.debit) totalDebit += split.debit;
      if (split.credit) totalCredit += split.credit;
    });

    if (totalDebit !== totalCredit && splits.length > 0) {
      const firstServiceIncomeSplit = splits.find((s) => s.credit && !s.debit);
      if (firstServiceIncomeSplit) {
        const diff = totalDebit - totalCredit;
        firstServiceIncomeSplit.credit += diff;
        totalCredit += diff;
      }
    }

    setSplitsPreview({
      splits,
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_balanced: totalDebit === totalCredit,
    });
  };

  const calculateTotal = (receiptItemsList) => {
    let total = 0;
    receiptItemsList.forEach((receiptItem) => {
      if (!receiptItem.item_id) {
        total += receiptItem.total || 0;
        return;
      }
      const item = items.find((i) => i.id === parseInt(receiptItem.item_id));
      if (!item) {
        total += receiptItem.total || 0;
        return;
      }
      
      if (item.type === "discount" || item.type === "payment") {
        total -= Math.abs(receiptItem.total || 0);
      } else {
        total += receiptItem.total || 0;
      }
    });
    validation.setFieldValue("amount", Math.max(0, total).toFixed(2));
    calculateSplits(receiptItemsList);
  };

  const previewSplits = () => {
    if (receiptItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    setShowSplitsModal(true);
  };

  if (isLoading) {
    return <Spinners setLoading={setLoading} />;
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Edit Sales Receipt" breadcrumbItem="Edit Sales Receipt" />
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
                          <Label>Receipt Number</Label>
                          <Input
                            name="receipt_no"
                            type="text"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.receipt_no || ""}
                            invalid={validation.touched.receipt_no && validation.errors.receipt_no ? true : false}
                          />
                          {validation.touched.receipt_no && validation.errors.receipt_no ? (
                            <FormFeedback type="invalid">{validation.errors.receipt_no}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Receipt Date</Label>
                          <Input
                            name="receipt_date"
                            type="date"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.receipt_date || ""}
                            invalid={validation.touched.receipt_date && validation.errors.receipt_date ? true : false}
                          />
                          {validation.touched.receipt_date && validation.errors.receipt_date ? (
                            <FormFeedback type="invalid">{validation.errors.receipt_date}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Unit <span className="text-danger">*</span></Label>
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
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>People/Customer <span className="text-danger">*</span></Label>
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
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Asset Account <span className="text-danger">*</span></Label>
                          <Input
                            name="account_id"
                            type="select"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.account_id || ""}
                            invalid={validation.touched.account_id && validation.errors.account_id ? true : false}
                          >
                            <option value="">Select Asset Account</option>
                            {assetAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.account_name} ({account.account_number})
                              </option>
                            ))}
                          </Input>
                          {validation.touched.account_id && validation.errors.account_id ? (
                            <FormFeedback type="invalid">{validation.errors.account_id}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <Label>Amount</Label>
                          <Input
                            name="amount"
                            type="number"
                            step="0.01"
                            onChange={validation.handleChange}
                            onBlur={validation.handleBlur}
                            value={validation.values.amount || 0}
                            invalid={validation.touched.amount && validation.errors.amount ? true : false}
                            readOnly
                          />
                          {validation.touched.amount && validation.errors.amount ? (
                            <FormFeedback type="invalid">{validation.errors.amount}</FormFeedback>
                          ) : null}
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
                            invalid={validation.touched.description && validation.errors.description ? true : false}
                          />
                          {validation.touched.description && validation.errors.description ? (
                            <FormFeedback type="invalid">{validation.errors.description}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Label>Receipt Items</Label>
                            <Button type="button" color="primary" size="sm" onClick={addReceiptItem}>
                              Add Item
                            </Button>
                          </div>
                          <Table responsive>
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th>Previous Value</th>
                                <th>Current Value</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>Total</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {receiptItems.map((item, index) => {
                                const selectedItem = items.find((i) => i.id === parseInt(item.item_id));
                                const isDiscountOrPayment = selectedItem && (selectedItem.type === "discount" || selectedItem.type === "payment");
                                
                                return (
                                  <tr key={index}>
                                    <td>
                                      <Input
                                        type="select"
                                        value={item.item_id || ""}
                                        onChange={(e) => updateReceiptItem(index, "item_id", e.target.value)}
                                      >
                                        <option value="">Select Item</option>
                                        {items.map((i) => (
                                          <option key={i.id} value={i.id}>
                                            {i.name}
                                          </option>
                                        ))}
                                      </Input>
                                    </td>
                                    <td>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={item.previous_value !== null && item.previous_value !== undefined ? item.previous_value : ""}
                                        onChange={(e) => updateReceiptItem(index, "previous_value", e.target.value ? parseFloat(e.target.value) : null)}
                                        placeholder="Optional"
                                      />
                                    </td>
                                    <td>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={item.current_value !== null && item.current_value !== undefined ? item.current_value : ""}
                                        onChange={(e) => {
                                          const value = e.target.value.trim();
                                          updateReceiptItem(index, "current_value", value === "" ? null : parseFloat(value));
                                        }}
                                        placeholder="Optional"
                                      />
                                    </td>
                                    <td>
                                      {isDiscountOrPayment ? (
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value="1"
                                          readOnly
                                          disabled
                                          style={{ backgroundColor: "#f8f9fa" }}
                                        />
                                      ) : (
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={item.qty || ""}
                                          onChange={(e) => updateReceiptItem(index, "qty", parseFloat(e.target.value) || 0)}
                                        />
                                      )}
                                    </td>
                                    <td>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={item.rate || ""}
                                        onChange={(e) => updateReceiptItem(index, "rate", e.target.value)}
                                        onBlur={(e) => {
                                          if (isDiscountOrPayment) {
                                            const rateValue = parseFloat(e.target.value) || 0;
                                            updateReceiptItem(index, "rate", (-Math.abs(rateValue)).toString());
                                          }
                                        }}
                                        placeholder={isDiscountOrPayment ? "Enter amount (will be negative)" : ""}
                                      />
                                    </td>
                                    <td>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.total ? parseFloat(item.total).toFixed(2) : "0.00"}
                                        onChange={(e) => {
                                          const inputValue = e.target.value;
                                          // Allow empty input during typing
                                          if (inputValue === "" || inputValue === "-") {
                                            return;
                                          }
                                          const newTotal = parseFloat(inputValue) || 0;
                                          // Round to 2 decimal places
                                          const roundedTotal = Math.round(newTotal * 100) / 100;
                                          updateReceiptItem(index, "total", roundedTotal);
                                        }}
                                        onBlur={(e) => {
                                          // Ensure 2 decimal places on blur
                                          const value = parseFloat(e.target.value) || 0;
                                          const roundedValue = Math.round(value * 100) / 100;
                                          updateReceiptItem(index, "total", roundedValue);
                                        }}
                                        style={{ width: "100px" }}
                                      />
                                    </td>
                                    <td>
                                      <Button
                                        type="button"
                                        color="danger"
                                        size="sm"
                                        onClick={() => removeReceiptItem(index)}
                                      >
                                        Remove
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {receiptItems.length === 0 && (
                                <tr>
                                  <td colSpan="7" className="text-center">
                                    No items added. Click "Add Item" to add items.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>
                      </Col>
                    </Row>

                    <Row>
                      <Col>
                        <div className="text-end">
                          <Button
                            type="button"
                            color="info"
                            className="me-2"
                            onClick={previewSplits}
                            disabled={receiptItems.length === 0 || !splitsPreview || !splitsPreview.splits || splitsPreview.splits.length === 0}
                          >
                            Preview Splits
                          </Button>
                          <Button type="submit" color="success" disabled={isSubmitting}>
                            {isSubmitting ? "Updating..." : "Update Sales Receipt"}
                          </Button>
                          <Button type="button" color="secondary" className="ms-2" onClick={() => navigate(`/building/${buildingId}/sales-receipts`)}>
                            Cancel
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Splits Preview Modal */}
          <Modal isOpen={showSplitsModal} toggle={() => setShowSplitsModal(false)} size="lg">
            <ModalHeader toggle={() => setShowSplitsModal(false)}>Double-Entry Accounting Splits Preview</ModalHeader>
            <ModalBody>
              {splitsPreview && splitsPreview.splits && splitsPreview.splits.length > 0 ? (
                <div>
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Account</th>
                        <th>People</th>
                        <th>Unit</th>
                        <th>Debit</th>
                        <th>Credit</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {splitsPreview.splits.map((split, index) => {
                        const unit = split.unit_id ? units.find((u) => u.id === split.unit_id) : null;
                        return (
                          <tr key={index}>
                            <td>{split.account_name}</td>
                            <td>{split.people_name || "N/A"}</td>
                            <td>{unit ? unit.name : split.unit_id ? `ID: ${split.unit_id}` : "N/A"}</td>
                            <td>{split.debit ? split.debit.toFixed(2) : "-"}</td>
                            <td>{split.credit ? split.credit.toFixed(2) : "-"}</td>
                            <td>{split.status}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ fontWeight: "bold", backgroundColor: "#f8f9fa" }}>
                        <td colSpan="3">Total</td>
                        <td>{splitsPreview.total_debit?.toFixed(2) || "0.00"}</td>
                        <td>{splitsPreview.total_credit?.toFixed(2) || "0.00"}</td>
                        <td>
                          <span className={splitsPreview.is_balanced ? "text-success" : "text-danger"}>
                            {splitsPreview.is_balanced ? "Yes ✓" : "No ✗"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                  <div className="text-end mt-3">
                    <Button color="secondary" onClick={() => setShowSplitsModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p>No splits to display. Please add items to the sales receipt.</p>
                  <Button color="secondary" onClick={() => setShowSplitsModal(false)}>
                    Close
                  </Button>
                </div>
              )}
            </ModalBody>
          </Modal>
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default EditSalesReceipt;

