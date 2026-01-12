import React, { useEffect, useState, useMemo, useCallback } from "react";
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
  Table,
  Label,
  Input,
} from "reactstrap";
import Breadcrumbs from "/src/components/Common/Breadcrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../services/axiosService";
import moment from "moment/moment";

const Invoices = () => {
  document.title = "Invoices";
  const { id: buildingId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [units, setUnits] = useState([]);
  const [people, setPeople] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Filter states with defaults - load from localStorage if available
  const [filterStartDate, setFilterStartDate] = useState(() => {
    const saved = localStorage.getItem(`invoice_filter_start_date_${buildingId}`);
    return saved || moment().startOf('month').format("YYYY-MM-DD");
  });
  const [filterEndDate, setFilterEndDate] = useState(() => {
    const saved = localStorage.getItem(`invoice_filter_end_date_${buildingId}`);
    return saved || moment().endOf('month').format("YYYY-MM-DD");
  });
  const [filterPeopleId, setFilterPeopleId] = useState(() => {
    const saved = localStorage.getItem(`invoice_filter_people_id_${buildingId}`);
    return saved || "";
  });
  const [filterStatus, setFilterStatus] = useState(() => {
    const saved = localStorage.getItem(`invoice_filter_status_${buildingId}`);
    return saved || "1"; // Default to active
  });
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState(false);
  const [availableCredits, setAvailableCredits] = useState([]);
  const [appliedCredits, setAppliedCredits] = useState([]);
  const [showApplyCreditModal, setShowApplyCreditModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedCreditMemo, setSelectedCreditMemo] = useState(null);
  const [applyAmount, setApplyAmount] = useState(0);
  const [applyDescription, setApplyDescription] = useState("");
  const [applyDate, setApplyDate] = useState(moment().format("YYYY-MM-DD"));
  const [splitsPreview, setSplitsPreview] = useState(null);
  const [showSplitsPreviewModal, setShowSplitsPreviewModal] = useState(false);
  // Discount states
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const [showApplyDiscountModal, setShowApplyDiscountModal] = useState(false);
  const [selectedInvoiceIdForDiscount, setSelectedInvoiceIdForDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountDescription, setDiscountDescription] = useState("");
  const [discountDate, setDiscountDate] = useState(moment().format("YYYY-MM-DD"));
  const [discountARAccount, setDiscountARAccount] = useState("");
  const [discountIncomeAccount, setDiscountIncomeAccount] = useState("");
  const [discountReference, setDiscountReference] = useState("");
  const [discountSplitsPreview, setDiscountSplitsPreview] = useState(null);
  const [showDiscountSplitsPreviewModal, setShowDiscountSplitsPreviewModal] = useState(false);
  const [userId] = useState(1); // TODO: Get from auth context
  const [showPayModal, setShowPayModal] = useState(false);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false); // Prevent duplicate payment recording
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [previousPayments, setPreviousPayments] = useState([]);
  const [paymentReference, setPaymentReference] = useState("");
  // Load payment date from localStorage if available
  const getInitialPaymentDate = () => {
    const saved = localStorage.getItem(`create_invoice_payment_date_${buildingId}`);
    return saved || moment().format("YYYY-MM-DD");
  };

  const [paymentDate, setPaymentDate] = useState(getInitialPaymentDate());
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentSplitsPreview, setPaymentSplitsPreview] = useState(null);
  const [showPaymentSplitsModal, setShowPaymentSplitsModal] = useState(false);
  const [printInvoiceData, setPrintInvoiceData] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

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
      // Store all people for mapping people_id to names in the table
      setPeople(data.data || []);
    } catch (error) {
      console.log("Error fetching people", error);
    }
  };
  
  // Get customers only for the dropdown filter
  const customers = useMemo(() => {
    return (people || []).filter(person => 
      person.people_type?.title?.toLowerCase() === "customer" || 
      person.people_type?.Title?.toLowerCase() === "customer"
    );
  }, [people]);

  const fetchAccounts = async () => {
    try {
      let url = "accounts";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/accounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAccounts(data.data || []);
    } catch (error) {
      console.log("Error fetching accounts", error);
    }
  };

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      let url = "invoices";
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices`;
      } else {
        url = `invoices?building_id=${buildingId || ""}`;
      }
      
      // Add filter parameters
      const params = {};
      if (filterStartDate) {
        params.start_date = filterStartDate;
      }
      if (filterEndDate) {
        params.end_date = filterEndDate;
      }
      if (filterPeopleId) {
        params.people_id = filterPeopleId;
      }
      if (filterStatus) {
        params.status = filterStatus;
      }
      
      const { data } = await axiosInstance.get(url, { params });
      setInvoices(data.data || []);
    } catch (error) {
      console.log("Error fetching invoices", error);
      toast.error("Failed to fetch invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [buildingId, filterStartDate, filterEndDate, filterPeopleId, filterStatus]);

  const fetchInvoiceDetails = useCallback(async (invoiceId) => {
    try {
      console.log("fetchInvoiceDetails called with invoiceId:", invoiceId);
      setLoading(true);
      let url = `invoices/${invoiceId}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices/${invoiceId}`;
      }
      console.log("Fetching invoice from URL:", url);
      const { data: invoiceResponse } = await axiosInstance.get(url);
      console.log("Invoice response received:", invoiceResponse);
      setViewingInvoice(invoiceResponse.data);
      console.log("Setting viewingInvoice state");
      setShowInvoiceDetailsModal(true);
      console.log("Setting showInvoiceDetailsModal to true");
    } catch (error) {
      console.error("Error fetching invoice details", error);
      toast.error("Failed to fetch invoice details");
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  const fetchPrintInvoiceData = useCallback(async (invoiceId) => {
    try {
      setLoading(true);
      let invoiceUrl = `invoices/${invoiceId}`;
      if (buildingId) {
        invoiceUrl = `v1/buildings/${buildingId}/invoices/${invoiceId}`;
      }
      
      // Fetch invoice details
      const [invoiceResponse, appliedCreditsResponse, appliedDiscountsResponse, paymentsResponse] = await Promise.all([
        axiosInstance.get(invoiceUrl),
        axiosInstance.get(buildingId ? `v1/buildings/${buildingId}/invoices/${invoiceId}/applied-credits` : `invoices/${invoiceId}/applied-credits`),
        axiosInstance.get(buildingId ? `v1/buildings/${buildingId}/invoices/${invoiceId}/applied-discounts` : `invoices/${invoiceId}/applied-discounts`),
        axiosInstance.get(buildingId ? `v1/buildings/${buildingId}/invoices/${invoiceId}/payments` : `invoices/${invoiceId}/payments`),
      ]);

      const invoice = invoiceResponse.data.invoice || invoiceResponse.data;
      const appliedCredits = appliedCreditsResponse.data || [];
      const appliedDiscounts = appliedDiscountsResponse.data || [];
      const payments = paymentsResponse.data || [];

      // Calculate totals
      const paidAmount = payments
        .filter(p => p.status === 1 || p.status === "1")
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      
      const appliedCreditsTotal = appliedCredits
        .filter(c => c.status === 1 || c.status === "1")
        .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
      
      const appliedDiscountsTotal = appliedDiscounts
        .filter(d => d.status === 1 || d.status === "1")
        .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

      // Fetch previous invoices balance (all invoices for this unit before this invoice)
      let previousBalance = 0;
      try {
        const unitId = invoice.unit_id;
        if (unitId) {
          const invoicesUrl = buildingId ? `v1/buildings/${buildingId}/invoices` : "invoices";
          const allInvoicesResponse = await axiosInstance.get(invoicesUrl, {
            params: { status: "1" }
          });
          const allInvoices = allInvoicesResponse.data || [];
          
          // Get invoices for the same unit created before this invoice (or with earlier sales_date)
          const previousInvoices = allInvoices.filter((inv) => {
            if (inv.id === invoice.id) return false;
            if (inv.unit_id !== unitId) return false; // Filter by unit_id
            const invDate = moment(inv.sales_date || inv.created_at);
            const currentDate = moment(invoice.sales_date || invoice.created_at);
            return invDate.isBefore(currentDate) || (invDate.isSame(currentDate) && inv.id < invoice.id);
          });

          // Calculate balance for previous invoices
          // Note: Applied discounts on previous invoices are not included here as they may not be available in the list response
          // If needed, we would need to fetch applied discounts for each previous invoice separately
          previousBalance = previousInvoices.reduce((sum, inv) => {
            const amount = parseFloat(inv.amount || 0);
            const paid = parseFloat(inv.paid_amount || 0);
            const credits = parseFloat(inv.applied_credits_total || 0);
            const discounts = parseFloat(inv.applied_discounts_total || 0); // Include if available
            const balance = amount - paid - credits - discounts;
            return sum + Math.max(0, balance); // Only positive balances
          }, 0);
        }
      } catch (error) {
        console.error("Error fetching previous invoices balance", error);
      }

      const invoiceAmount = parseFloat(invoice.amount || 0);
      const totalAmount = invoiceAmount + previousBalance;
      const dueAmount = Math.max(0, totalAmount - paidAmount - appliedCreditsTotal - appliedDiscountsTotal);

      setPrintInvoiceData({
        invoice: invoiceResponse.data,
        paidAmount,
        appliedCreditsTotal,
        appliedDiscountsTotal,
        previousBalance,
        dueAmount,
        invoiceAmount,
      });


      setShowPrintModal(true);
    } catch (error) {
      console.error("Error fetching print invoice data", error);
      toast.error("Failed to fetch invoice data for printing");
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  const fetchAvailableCreditsForApply = useCallback(async (invoiceId) => {
    try {
      console.log("fetchAvailableCreditsForApply called with invoiceId:", invoiceId);
      let url = `invoices/${invoiceId}/available-credits`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices/${invoiceId}/available-credits`;
      }
      console.log("Fetching available credits from URL:", url);
      const { data } = await axiosInstance.get(url);
      console.log("Available credits response:", data);
      const credits = data.data?.credits || [];
      // Round available amounts to 2 decimal places to fix floating-point precision issues
      const roundedCredits = credits.map(credit => ({
        ...credit,
        available_amount: Math.round(credit.available_amount * 100) / 100,
        applied_amount: Math.round(credit.applied_amount * 100) / 100,
        amount: Math.round(credit.amount * 100) / 100,
      }));
      setAvailableCredits(roundedCredits);
      if (roundedCredits.length > 0) {
        setSelectedCreditMemo(roundedCredits[0]);
        const roundedAmount = Math.round(roundedCredits[0].available_amount * 100) / 100;
        setApplyAmount(roundedAmount);
        console.log("Selected credit memo:", roundedCredits[0]);
      } else {
        setSelectedCreditMemo(null);
        setApplyAmount(0);
        toast.info("No available credits for this invoice");
      }
    } catch (error) {
      console.error("Error fetching available credits", error);
      toast.error("Failed to fetch available credits");
      setAvailableCredits([]);
      setSelectedCreditMemo(null);
    }
  }, [buildingId]);

  const previewSplits = async () => {
    if (!selectedCreditMemo || !selectedInvoiceId || applyAmount <= 0 || !applyDescription) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      let url = `invoices/${selectedInvoiceId}/preview-apply-credit`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices/${selectedInvoiceId}/preview-apply-credit`;
      }

      const payload = {
        credit_memo_id: selectedCreditMemo.id,
        amount: parseFloat(applyAmount),
        description: applyDescription,
        date: applyDate,
      };

      const { data } = await axiosInstance.post(url, payload);
      setSplitsPreview(data.data);
      setShowSplitsPreviewModal(true);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to preview splits";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCredit = async () => {
    if (!selectedCreditMemo || !selectedInvoiceId || applyAmount <= 0 || !applyDescription) {
      toast.error("Please fill all required fields");
      return;
    }

    if (applyAmount > selectedCreditMemo.available_amount) {
      toast.error(`Amount cannot exceed available credit of ${Math.round(selectedCreditMemo.available_amount * 100) / 100}`);
      return;
    }

    try {
      setLoading(true);
      let url = `invoices/${selectedInvoiceId}/apply-credit`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices/${selectedInvoiceId}/apply-credit`;
      }

      const payload = {
        credit_memo_id: selectedCreditMemo.id,
        amount: parseFloat(applyAmount),
        description: applyDescription,
        date: applyDate,
      };

      const config = {
        headers: {
          "User-ID": userId.toString(),
        },
      };

      await axiosInstance.post(url, payload, config);
      toast.success("Credit applied successfully");
      
      // Refresh applied credits and available credits
      if (selectedInvoiceId) {
        await fetchAppliedCreditsForModal(selectedInvoiceId);
        await fetchAvailableCreditsForApply(selectedInvoiceId);
      }
      
      // Reset form
      setApplyAmount(0);
      setApplyDescription("");
      setApplyDate(moment().format("YYYY-MM-DD"));
      
      // Refresh invoices list
      await fetchInvoices();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to apply credit";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (filterStartDate) {
      localStorage.setItem(`invoice_filter_start_date_${buildingId}`, filterStartDate);
    }
  }, [filterStartDate, buildingId]);

  useEffect(() => {
    if (filterEndDate) {
      localStorage.setItem(`invoice_filter_end_date_${buildingId}`, filterEndDate);
    }
  }, [filterEndDate, buildingId]);

  useEffect(() => {
    localStorage.setItem(`invoice_filter_people_id_${buildingId}`, filterPeopleId);
  }, [filterPeopleId, buildingId]);

  useEffect(() => {
    if (filterStatus) {
      localStorage.setItem(`invoice_filter_status_${buildingId}`, filterStatus);
    }
  }, [filterStatus, buildingId]);

  useEffect(() => {
    fetchUnits();
    fetchPeople();
    fetchAccounts();
  }, [buildingId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Handler functions
  const handleViewClick = useCallback((invoiceId) => {
    console.log("handleViewClick called with:", invoiceId);
    fetchInvoiceDetails(invoiceId);
  }, [fetchInvoiceDetails]);

  const fetchAppliedCreditsForModal = useCallback(async (invoiceId) => {
    try {
      let url = `invoices/${invoiceId}/applied-credits`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices/${invoiceId}/applied-credits`;
      }
      const { data } = await axiosInstance.get(url);
      setAppliedCredits(data.data || []);
    } catch (error) {
      console.error("Error fetching applied credits", error);
      setAppliedCredits([]);
    }
  }, [buildingId]);

  const handleDeleteAppliedCredit = async (appliedCreditId) => {
    if (!window.confirm("Are you sure you want to delete this applied credit? This will also soft delete the related transaction and splits.")) {
      return;
    }

    try {
      setLoading(true);
      let url = `invoice-applied-credits/${appliedCreditId}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoice-applied-credits/${appliedCreditId}`;
      }
      await axiosInstance.delete(url);
      toast.success("Applied credit deleted successfully");
      
      // Refresh applied credits and available credits
      if (selectedInvoiceId) {
        await fetchAppliedCreditsForModal(selectedInvoiceId);
        await fetchAvailableCreditsForApply(selectedInvoiceId);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to delete applied credit";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCreditClick = useCallback(async (invoiceId) => {
    console.log("handleApplyCreditClick called with:", invoiceId);
    setSelectedInvoiceId(invoiceId);
    try {
      await fetchAvailableCreditsForApply(invoiceId);
      await fetchAppliedCreditsForModal(invoiceId);
      setShowApplyCreditModal(true);
      console.log("Modal state set to true, showApplyCreditModal:", true);
    } catch (error) {
      console.error("Error in Apply Credit:", error);
    }
  }, [fetchAvailableCreditsForApply, fetchAppliedCreditsForModal]);

  // Discount functions
  const fetchAppliedDiscountsForModal = useCallback(async (invoiceId) => {
    try {
      let url = `invoices/${invoiceId}/applied-discounts`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices/${invoiceId}/applied-discounts`;
      }
      const { data } = await axiosInstance.get(url);
      setAppliedDiscounts(data.data || []);
    } catch (error) {
      console.error("Error fetching applied discounts", error);
      setAppliedDiscounts([]);
    }
  }, [buildingId]);

  const handleDeleteAppliedDiscount = async (appliedDiscountId) => {
    if (!window.confirm("Are you sure you want to delete this applied discount? This will also soft delete the related transaction and splits.")) {
      return;
    }

    try {
      setLoading(true);
      let url = `invoice-applied-discounts/${appliedDiscountId}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoice-applied-discounts/${appliedDiscountId}`;
      }
      await axiosInstance.delete(url);
      toast.success("Applied discount deleted successfully");
      
      // Refresh applied discounts
      if (selectedInvoiceIdForDiscount) {
        await fetchAppliedDiscountsForModal(selectedInvoiceIdForDiscount);
      }
      
      // Refresh invoices list
      await fetchInvoices();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to delete applied discount";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscountClick = useCallback(async (invoiceId) => {
    console.log("handleApplyDiscountClick called with:", invoiceId);
    setSelectedInvoiceIdForDiscount(invoiceId);
    try {
      await fetchAppliedDiscountsForModal(invoiceId);
      // Get invoice to prefill A/R account
      let url = `invoices/${invoiceId}`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices/${invoiceId}`;
      }
      const { data: invoice } = await axiosInstance.get(url);
      if (invoice && invoice.ar_account_id) {
        setDiscountARAccount(invoice.ar_account_id.toString());
      }
      setShowApplyDiscountModal(true);
    } catch (error) {
      console.error("Error in Apply Discount:", error);
      toast.error("Failed to load invoice details");
    }
  }, [fetchAppliedDiscountsForModal, buildingId]);

  const previewDiscountSplits = async () => {
    if (!selectedInvoiceIdForDiscount || discountAmount <= 0 || !discountDescription || !discountARAccount || !discountIncomeAccount) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      let url = `invoices/${selectedInvoiceIdForDiscount}/preview-apply-discount`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices/${selectedInvoiceIdForDiscount}/preview-apply-discount`;
      }

      const payload = {
        ar_account: parseInt(discountARAccount),
        income_account: parseInt(discountIncomeAccount),
        amount: parseFloat(discountAmount),
        description: discountDescription,
        date: discountDate,
        reference: discountReference,
      };

      const { data } = await axiosInstance.post(url, payload);
      setDiscountSplitsPreview(data.data);
      setShowDiscountSplitsPreviewModal(true);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to preview splits";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!selectedInvoiceIdForDiscount || discountAmount <= 0 || !discountDescription || !discountARAccount || !discountIncomeAccount) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      let url = `invoices/${selectedInvoiceIdForDiscount}/apply-discount`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices/${selectedInvoiceIdForDiscount}/apply-discount`;
      }

      const payload = {
        ar_account: parseInt(discountARAccount),
        income_account: parseInt(discountIncomeAccount),
        amount: parseFloat(discountAmount),
        description: discountDescription,
        date: discountDate,
        reference: discountReference,
      };

      const config = {
        headers: {
          "User-ID": userId.toString(),
        },
      };

      await axiosInstance.post(url, payload, config);
      toast.success("Discount applied successfully");
      
      // Refresh applied discounts
      if (selectedInvoiceIdForDiscount) {
        await fetchAppliedDiscountsForModal(selectedInvoiceIdForDiscount);
      }
      
      // Reset form
      setDiscountAmount(0);
      setDiscountDescription("");
      setDiscountDate(moment().format("YYYY-MM-DD"));
      setDiscountARAccount("");
      setDiscountIncomeAccount("");
      setDiscountReference("");
      
      // Refresh invoices list
      await fetchInvoices();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to apply discount";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = useCallback((invoiceId) => {
    console.log("handleEditClick called with:", invoiceId);
    const editUrl = `/v1/buildings/${buildingId}/invoices/${invoiceId}/edit`;
    console.log("Navigating to:", editUrl);
    navigate(editUrl);
  }, [buildingId, navigate]);

  const handlePayClick = useCallback(async (invoice) => {
    setSelectedInvoiceForPayment(invoice);
    
    // Prefill payment reference with format: UNITNAME-MONTH-PMT
    let paymentRef = "";
    if (invoice.unit_id) {
      const unit = units.find((u) => u.id === invoice.unit_id);
      if (unit) {
        const savedDate = localStorage.getItem(`create_invoice_payment_date_${buildingId}`);
        const dateToUse = savedDate || moment().format("YYYY-MM-DD");
        const month = moment(dateToUse).format("MMM").toUpperCase();
        paymentRef = `${unit.name}-${month}-PMT`;
      }
    }
    setPaymentReference(paymentRef);
    
    // Load date from localStorage or use current date
    const savedDate = localStorage.getItem(`create_invoice_payment_date_${buildingId}`);
    setPaymentDate(savedDate || moment().format("YYYY-MM-DD"));
    setPaymentAccountId("");
    
    // Calculate balance to prefill payment amount
    const amount = parseFloat(invoice.amount || 0);
    const paidAmount = parseFloat(invoice.paid_amount || 0);
    const appliedCredits = parseFloat(invoice.applied_credits_total || 0);
    const balance = Math.round((amount - paidAmount - appliedCredits) * 100) / 100;
    setPaymentAmount(balance > 0 ? balance : 0);
    
    // Fetch previous payments for this invoice
    try {
      let url = `invoices/${invoice.id}/payments`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices/${invoice.id}/payments`;
      }
      const { data } = await axiosInstance.get(url);
      setPreviousPayments(data.data || []);
    } catch (error) {
      console.error("Error fetching previous payments", error);
      setPreviousPayments([]);
    }
    
    setShowPayModal(true);
  }, [buildingId]);

  const fetchPreviousPayments = useCallback(async (invoiceId) => {
    try {
      let url = `invoices/${invoiceId}/payments`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoices/${invoiceId}/payments`;
      }
      const { data } = await axiosInstance.get(url);
      setPreviousPayments(data.data || []);
    } catch (error) {
      console.error("Error fetching previous payments", error);
      setPreviousPayments([]);
    }
  }, [buildingId]);

  const previewPaymentSplits = async () => {
    if (isPaymentSubmitting) {
      return;
    }
    if (!selectedInvoiceForPayment || !paymentAccountId || paymentAmount <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      let url = `invoice-payments/preview`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoice-payments/preview`;
      }

      const payload = {
        invoice_id: selectedInvoiceForPayment.id,
        account_id: parseInt(paymentAccountId),
        amount: parseFloat(paymentAmount),
        date: paymentDate,
        building_id: parseInt(buildingId),
      };

      const { data } = await axiosInstance.post(url, payload);
      setPaymentSplitsPreview(data.data);
      setShowPaymentSplitsModal(true);
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to preview splits";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    if (isPaymentSubmitting) {
      return;
    }
    if (!selectedInvoiceForPayment || !paymentAccountId || paymentAmount <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setIsPaymentSubmitting(true);
      setLoading(true);
      let url = `invoice-payments`;
      if (buildingId) {
        url = `v1/buildings/${buildingId}/invoice-payments`;
      }

      const payload = {
        reference: paymentReference,
        invoice_id: selectedInvoiceForPayment.id,
        account_id: parseInt(paymentAccountId),
        amount: parseFloat(paymentAmount),
        date: paymentDate,
        status: 1,
        building_id: parseInt(buildingId),
      };

      const config = {
        headers: {
          "User-ID": userId.toString(),
        },
      };

      await axiosInstance.post(url, payload, config);
      toast.success("Payment recorded successfully");
      
      // Refresh previous payments
      await fetchPreviousPayments(selectedInvoiceForPayment.id);
      
      // Reset form (but keep date from localStorage)
      setPaymentReference("");
      setPaymentAmount(0);
      setPaymentAccountId("");
      const savedDate = localStorage.getItem(`create_invoice_payment_date_${buildingId}`);
      setPaymentDate(savedDate || moment().format("YYYY-MM-DD"));
      
      // Refresh invoices list
      await fetchInvoices();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to create payment";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setIsPaymentSubmitting(false);
    }
  };

  // Table columns definition
  const columns = useMemo(
    () => [
      {
        header: "Invoice #",
        accessorKey: "invoice_no",
        enableColumnFilter: false,
        enableSorting: true,
      },
      {
        header: "Sales Date",
        accessorKey: "sales_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.sales_date ? moment(cell.row.original.sales_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Due Date",
        accessorKey: "due_date",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.due_date ? moment(cell.row.original.due_date).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Customer",
        accessorKey: "people_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const peopleId = cell.row.original.people_id;
          if (!peopleId) {
            return <>N/A</>;
          }
          const person = people.find((p) => p.id === peopleId || p.id === parseInt(peopleId) || parseInt(p.id) === peopleId);
          return <>{person ? person.name : `ID: ${peopleId}`}</>;
        },
      },
      {
        header: "Unit",
        accessorKey: "unit_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const unit = units.find((u) => u.id === cell.row.original.unit_id);
          return <>{unit ? unit.unit_number || unit.name : `ID: ${cell.row.original.unit_id || "N/A"}`}</>;
        },
      },
      {
        header: "Amount",
        accessorKey: "amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{parseFloat(cell.row.original.amount || 0).toFixed(2)}</>;
        },
      },
      {
        header: "Paid Amount",
        accessorKey: "paid_amount",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{parseFloat(cell.row.original.paid_amount || 0).toFixed(2)}</>;
        },
      },
      {
        header: "Applied Credits",
        accessorKey: "applied_credits_total",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{parseFloat(cell.row.original.applied_credits_total || 0).toFixed(2)}</>;
        },
      },
      {
        header: "Balance",
        accessorKey: "balance",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const amount = parseFloat(cell.row.original.amount || 0);
          const paidAmount = parseFloat(cell.row.original.paid_amount || 0);
          const appliedCredits = parseFloat(cell.row.original.applied_credits_total || 0);
          const balance = Math.round((amount - paidAmount - appliedCredits) * 100) / 100;
          return <>{balance.toFixed(2)}</>;
        },
      },
      {
        header: "Payment Status",
        accessorKey: "payment_status",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const amount = parseFloat(cell.row.original.amount || 0);
          const paidAmount = parseFloat(cell.row.original.paid_amount || 0);
          const appliedCredits = parseFloat(cell.row.original.applied_credits_total || 0);
          const balance = Math.round((amount - paidAmount - appliedCredits) * 100) / 100;
          
          let status = "Unpaid";
          let badgeClass = "bg-danger";
          
          if (Math.abs(balance) < 0.01) {
            status = "Paid";
            badgeClass = "bg-success";
          } else if (balance < amount) {
            status = "Half Paid";
            badgeClass = "bg-warning";
          }
          
          return (
            <span className={`badge ${badgeClass}`}>
              {status}
            </span>
          );
        },
      },
      {
        header: "Description",
        accessorKey: "description",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.description || "N/A"}</>;
        },
      },
      {
        header: "Status",
        accessorKey: "status",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const status = cell.row.original.status;
          return (
            <span className={`badge ${(status === 1 || status === "1") ? "bg-success" : "bg-secondary"}`}>
              {(status === 1 || status === "1") ? "Active" : "Inactive"}
            </span>
          );
        },
      },
      {
        header: "Created",
        accessorKey: "created_at",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          return <>{cell.row.original.created_at ? moment(cell.row.original.created_at).format("YYYY-MM-DD") : "N/A"}</>;
        },
      },
      {
        header: "Actions",
        accessorKey: "actions",
        enableColumnFilter: false,
        enableSorting: false,
        cell: (cell) => {
          const invoice = cell.row.original;
          const invoiceId = invoice.id;
          const amount = parseFloat(invoice.amount || 0);
          const paidAmount = parseFloat(invoice.paid_amount || 0);
          const appliedCredits = parseFloat(invoice.applied_credits_total || 0);
          const balance = Math.round((amount - paidAmount - appliedCredits) * 100) / 100;
          const isFullyPaid = Math.abs(balance) < 0.01;
          
          return (
            <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                color="info"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleViewClick(invoiceId);
                }}
              >
                <i className="bx bx-show"></i> View
              </Button>
              {!isFullyPaid && (
                <Button
                  type="button"
                  color="warning"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePayClick(invoice);
                  }}
                >
                  <i className="bx bx-money"></i> Pay
                </Button>
              )}
              {balance > 0 && (
                <Button
                  type="button"
                  color="success"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleApplyCreditClick(invoiceId);
                  }}
                >
                  <i className="bx bx-check"></i> Apply Credit
                </Button>
              )}
              {balance > 0 && (
                <Button
                  type="button"
                  color="info"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleApplyDiscountClick(invoiceId);
                  }}
                >
                  <i className="bx bx-discount"></i> Apply Discount
                </Button>
              )}
              <Button
                type="button"
                color="primary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditClick(invoiceId);
                }}
              >
                <i className="bx bx-edit"></i> Edit
              </Button>
            </div>
          );
        },
      },
    ],
    [people, units, buildingId, navigate, handleViewClick, handleApplyCreditClick, handleEditClick, handlePayClick]
  );

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Invoices" breadcrumbItem="Invoices" />
          <Row className="mb-3">
            <Col>
              <Button
                color="primary"
                onClick={() => navigate(`/building/${buildingId}/invoices/create`)}
              >
                <i className="bx bx-plus-circle me-1"></i> Create Invoice
              </Button>
            </Col>
          </Row>
          
          {/* Filters */}
          <Row className="mb-3">
            <Col lg={12}>
              <Card>
                <CardBody>
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
                    <Col md={3}>
                      <Label>Customer</Label>
                      <Input
                        type="select"
                        value={filterPeopleId}
                        onChange={(e) => setFilterPeopleId(e.target.value)}
                      >
                        <option value="">All Customers</option>
                        {customers.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </Input>
                    </Col>
                    <Col md={3}>
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
          
          {isLoading ? (
            <Spinners setLoading={setLoading} />
          ) : (
            <Row>
              <Col lg="12">
                <Card>
                  <CardBody>
                    <TableContainer
                      columns={columns}
                      data={invoices || []}
                      isGlobalFilter={true}
                      isPagination={false}
                      SearchPlaceholder="Search..."
                      isCustomPageSize={false}
                      tableClass="align-middle table-nowrap table-hover dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                      theadClass="table-light"
                      paginationWrapper="dataTables_paginate paging_simple_numbers pagination-rounded"
                      pagination="pagination"
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}

          {/* Invoice Details Modal */}
          <Modal isOpen={showInvoiceDetailsModal} toggle={() => setShowInvoiceDetailsModal(false)} size="xl">
            <ModalHeader toggle={() => setShowInvoiceDetailsModal(false)}>Invoice Details</ModalHeader>
            <ModalBody>
              {viewingInvoice ? (
                <div>
                  {/* Invoice Information */}
                  <Row className="mb-4">
                    <Col md={6}>
                      <h5>Invoice Information</h5>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td><strong>Invoice Number:</strong></td>
                            <td>{viewingInvoice.invoice?.invoice_no || viewingInvoice.invoice_no}</td>
                          </tr>
                          <tr>
                            <td><strong>Sales Date:</strong></td>
                            <td>{viewingInvoice.invoice?.sales_date ? moment(viewingInvoice.invoice.sales_date).format("YYYY-MM-DD") : moment(viewingInvoice.sales_date).format("YYYY-MM-DD")}</td>
                          </tr>
                          <tr>
                            <td><strong>Due Date:</strong></td>
                            <td>{viewingInvoice.invoice?.due_date ? moment(viewingInvoice.invoice.due_date).format("YYYY-MM-DD") : moment(viewingInvoice.due_date).format("YYYY-MM-DD")}</td>
                          </tr>
                          <tr>
                            <td><strong>Unit:</strong></td>
                            <td>
                              {(() => {
                                const unitId = viewingInvoice.invoice?.unit_id || viewingInvoice.unit_id;
                                const unit = units.find((u) => u.id === unitId);
                                return unit ? unit.name : `ID: ${unitId || "N/A"}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Customer:</strong></td>
                            <td>
                              {(() => {
                                const peopleId = viewingInvoice.invoice?.people_id || viewingInvoice.people_id;
                                const person = people.find((p) => p.id === peopleId);
                                return person ? person.name : `ID: ${peopleId || "N/A"}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>A/R Account:</strong></td>
                            <td>
                              {(() => {
                                const arAccountId = viewingInvoice.invoice?.ar_account_id || viewingInvoice.ar_account_id;
                                const account = accounts.find((a) => a.id === arAccountId);
                                return account ? `${account.account_name} (${account.account_number})` : `ID: ${arAccountId || "N/A"}`;
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Amount:</strong></td>
                            <td>{parseFloat(viewingInvoice.invoice?.amount || viewingInvoice.amount || 0).toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td><strong>Description:</strong></td>
                            <td>{viewingInvoice.invoice?.description || viewingInvoice.description || "N/A"}</td>
                          </tr>
                          <tr>
                            <td><strong>Status:</strong></td>
                            <td>
                              <span className={`badge ${(viewingInvoice.invoice?.status || viewingInvoice.status) === 1 ? "bg-success" : "bg-secondary"}`}>
                                {(viewingInvoice.invoice?.status || viewingInvoice.status) === 1 ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>

                  {/* Invoice Items */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Invoice Items</h5>
                      {/* Active Items */}
                      {(viewingInvoice.items || []).filter(item => item.status === "1" || item.status === 1).length > 0 && (
                        <Table bordered responsive className="mb-3">
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th>Previous Value</th>
                              <th>Current Value</th>
                              <th>Qty</th>
                              <th>Rate</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(viewingInvoice.items || []).filter(item => item.status === "1" || item.status === 1).map((item, index) => (
                              <tr key={index}>
                                <td>{item.item_name}</td>
                                <td>{item.previous_value !== null && item.previous_value !== undefined ? parseFloat(item.previous_value).toFixed(3) : "N/A"}</td>
                                <td>{item.current_value !== null && item.current_value !== undefined ? parseFloat(item.current_value).toFixed(3) : "N/A"}</td>
                                <td>{item.qty !== null && item.qty !== undefined ? parseFloat(item.qty).toFixed(3) : "N/A"}</td>
                                <td>{item.rate || "N/A"}</td>
                                <td>{parseFloat(item.total || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}

                      {/* Previous Invoice Items (Inactive) */}
                      {(viewingInvoice.items || []).filter(item => item.status !== "1" && item.status !== 1).length > 0 && (
                        <div>
                          <h6 className="text-muted mt-3 mb-2">Previous Invoice Items</h6>
                          <Table bordered responsive>
                            <thead>
                              <tr>
                                <th>Item Name</th>
                                <th>Previous Value</th>
                                <th>Current Value</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>Total</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(viewingInvoice.items || []).filter(item => item.status !== "1" && item.status !== 1).map((item, index) => (
                                <tr key={index} style={{ backgroundColor: "#f8f9fa" }}>
                                  <td>{item.item_name}</td>
                                  <td>{item.previous_value !== null && item.previous_value !== undefined ? parseFloat(item.previous_value).toFixed(3) : "N/A"}</td>
                                  <td>{item.current_value !== null && item.current_value !== undefined ? parseFloat(item.current_value).toFixed(3) : "N/A"}</td>
                                  <td>{item.qty !== null && item.qty !== undefined ? parseFloat(item.qty).toFixed(2) : "N/A"}</td>
                                  <td>{item.rate || "N/A"}</td>
                                  <td>{parseFloat(item.total || 0).toFixed(2)}</td>
                                  <td>
                                    <span className="badge bg-secondary">Inactive</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Col>
                  </Row>

                  {/* Splits - Active and Inactive */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <h5>Double-Entry Accounting Splits</h5>
                      <Table bordered responsive>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Customer/Vendor</th>
                            <th>Unit</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewingInvoice.splits || []).map((split, index) => {
                            const account = accounts.find((a) => a.id === split.account_id);
                            const person = split.people_id ? people.find((p) => p.id === split.people_id) : null;
                            const unit = split.unit_id ? units.find((u) => u.id === split.unit_id) : null;
                            return (
                              <tr key={index} style={{ backgroundColor: split.status === "1" ? "transparent" : "#f8f9fa" }}>
                                <td>{account ? `${account.account_name} (${account.account_number})` : `ID: ${split.account_id}`}</td>
                                <td>{person ? person.name : split.people_id ? `ID: ${split.people_id}` : "N/A"}</td>
                                <td>{unit ? unit.name : split.unit_id ? `ID: ${split.unit_id}` : "N/A"}</td>
                                <td>{split.debit ? parseFloat(split.debit).toFixed(2) : "-"}</td>
                                <td>{split.credit ? parseFloat(split.credit).toFixed(2) : "-"}</td>
                                <td>
                                  <span className={`badge ${split.status === "1" ? "bg-success" : "bg-secondary"}`}>
                                    {split.status === "1" ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ fontWeight: "bold", backgroundColor: "#f8f9fa" }}>
                            <td colSpan="3">Total (Active Only)</td>
                            <td>
                              {(viewingInvoice.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.debit) || 0), 0).toFixed(2)}
                            </td>
                            <td>
                              {(viewingInvoice.splits || []).filter(split => split.status === "1").reduce((sum, split) => sum + (parseFloat(split.credit) || 0), 0).toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </Table>
                    </Col>
                  </Row>

                  <div className="text-end mt-3">
                    <Button 
                      color="primary" 
                      className="me-2"
                      onClick={async () => {
                        const invoiceId = viewingInvoice.invoice?.id || viewingInvoice.id;
                        if (invoiceId) {
                          await fetchPrintInvoiceData(invoiceId);
                        }
                      }}
                    >
                      <i className="bx bx-printer"></i> Print
                    </Button>
                    <Button color="secondary" onClick={() => setShowInvoiceDetailsModal(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p>Loading invoice details...</p>
                </div>
              )}
            </ModalBody>
          </Modal>

          {/* Apply Credit Modal */}
          <Modal isOpen={showApplyCreditModal} toggle={() => {
            setShowApplyCreditModal(false);
            setSelectedInvoiceId(null);
            setSelectedCreditMemo(null);
            setApplyAmount(0);
            setApplyDescription("");
            setApplyDate(moment().format("YYYY-MM-DD"));
          }} size="lg">
            <ModalHeader toggle={() => {
              setShowApplyCreditModal(false);
              setSelectedInvoiceId(null);
              setSelectedCreditMemo(null);
              setApplyAmount(0);
              setApplyDescription("");
              setApplyDate(moment().format("YYYY-MM-DD"));
            }}>Apply Credit to Invoice</ModalHeader>
            <ModalBody>
              {/* Previously Applied Credits Section */}
              <div className="mb-4">
                <h5>Previously Applied Credits</h5>
                {appliedCredits.length > 0 ? (
                  <Table bordered responsive size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Credit Memo ID</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appliedCredits.map((appliedCredit) => (
                        <tr key={appliedCredit.id}>
                          <td>{moment(appliedCredit.date).format("YYYY-MM-DD")}</td>
                          <td>{appliedCredit.credit_memo_id}</td>
                          <td>{parseFloat(appliedCredit.amount).toFixed(2)}</td>
                          <td>{appliedCredit.description}</td>
                          <td>
                            <span className={`badge ${appliedCredit.status === "1" ? "bg-success" : "bg-secondary"}`}>
                              {appliedCredit.status === "1" ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            {appliedCredit.status === "1" && (
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => handleDeleteAppliedCredit(appliedCredit.id)}
                                disabled={isLoading}
                              >
                                <i className="bx bx-trash"></i> Delete
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted">No previously applied credits for this invoice.</p>
                )}
              </div>
              
              {appliedCredits.length > 0 && <hr />}
              
              {availableCredits.length === 0 ? (
                <div className="text-center">
                  <p>No available credits for this invoice.</p>
                  <Button
                    color="secondary"
                    onClick={() => {
                      setShowApplyCreditModal(false);
                      setSelectedInvoiceId(null);
                      setSelectedCreditMemo(null);
                      setApplyAmount(0);
                      setApplyDescription("");
                      setApplyDate(moment().format("YYYY-MM-DD"));
                    }}
                  >
                    Close
                  </Button>
                </div>
              ) : selectedCreditMemo ? (
                <div>
                  <Row className="mb-3">
                    <Col md={12}>
                      <Label>Credit Memo <span className="text-danger">*</span></Label>
                      <Input
                        type="select"
                        value={selectedCreditMemo.id}
                        onChange={(e) => {
                          const credit = availableCredits.find(c => c.id === parseInt(e.target.value));
                          if (credit) {
                            setSelectedCreditMemo(credit);
                            const roundedAmount = Math.round(credit.available_amount * 100) / 100;
                            setApplyAmount(roundedAmount);
                          }
                        }}
                      >
                        {availableCredits.map((credit) => (
                          <option key={credit.id} value={credit.id}>
                            {credit.description} - Available: {Math.round(credit.available_amount * 100) / 100}
                          </option>
                        ))}
                      </Input>
                      <small className="text-muted">Available Amount: {Math.round(selectedCreditMemo.available_amount * 100) / 100}</small>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Label>Date <span className="text-danger">*</span></Label>
                      <Input
                        type="date"
                        value={applyDate}
                        onChange={(e) => setApplyDate(e.target.value)}
                      />
                    </Col>
                    <Col md={6}>
                      <Label>Amount <span className="text-danger">*</span></Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedCreditMemo.available_amount}
                        value={applyAmount}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setApplyAmount(Math.round(value * 100) / 100);
                        }}
                      />
                      <small className="text-muted">Max: {Math.round(selectedCreditMemo.available_amount * 100) / 100}</small>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={12}>
                      <Label>Description <span className="text-danger">*</span></Label>
                      <Input
                        type="textarea"
                        rows="3"
                        value={applyDescription}
                        onChange={(e) => setApplyDescription(e.target.value)}
                        placeholder="Enter description for this credit application"
                      />
                    </Col>
                  </Row>
                  <div className="text-end">
                    <Button
                      color="info"
                      className="me-2"
                      onClick={previewSplits}
                      disabled={isLoading || applyAmount <= 0 || !applyDescription}
                    >
                      Preview Splits
                    </Button>
                    <Button
                      color="secondary"
                      className="me-2"
                      onClick={() => {
                        setShowApplyCreditModal(false);
                        setSelectedInvoiceId(null);
                        setSelectedCreditMemo(null);
                        setApplyAmount(0);
                        setApplyDescription("");
                        setApplyDate(moment().format("YYYY-MM-DD"));
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      onClick={handleApplyCredit}
                      disabled={isLoading || applyAmount <= 0 || !applyDescription}
                    >
                      Apply Credit
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p>Loading...</p>
                </div>
              )}
            </ModalBody>
          </Modal>

          {/* Preview Splits Modal */}
          <Modal isOpen={showSplitsPreviewModal} toggle={() => setShowSplitsPreviewModal(false)} size="lg">
            <ModalHeader toggle={() => setShowSplitsPreviewModal(false)}>Preview Splits</ModalHeader>
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
                              <td>{split.people_id ? (people.find(p => p.id === split.people_id)?.name || "N/A") : "N/A"}</td>
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

          {/* Apply Discount Modal */}
          <Modal isOpen={showApplyDiscountModal} toggle={() => {
            setShowApplyDiscountModal(false);
            setSelectedInvoiceIdForDiscount(null);
            setDiscountAmount(0);
            setDiscountDescription("");
            setDiscountDate(moment().format("YYYY-MM-DD"));
            setDiscountARAccount("");
            setDiscountIncomeAccount("");
            setDiscountReference("");
          }} size="lg">
            <ModalHeader toggle={() => {
              setShowApplyDiscountModal(false);
              setSelectedInvoiceIdForDiscount(null);
              setDiscountAmount(0);
              setDiscountDescription("");
              setDiscountDate(moment().format("YYYY-MM-DD"));
              setDiscountARAccount("");
              setDiscountIncomeAccount("");
              setDiscountReference("");
            }}>Apply Discount to Invoice</ModalHeader>
            <ModalBody>
              {/* Previously Applied Discounts Section */}
              <div className="mb-4">
                <h5>Previously Applied Discounts</h5>
                {appliedDiscounts.length > 0 ? (
                  <Table bordered responsive size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reference</th>
                        <th>Amount</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appliedDiscounts.map((appliedDiscount) => (
                        <tr key={appliedDiscount.id}>
                          <td>{moment(appliedDiscount.date).format("YYYY-MM-DD")}</td>
                          <td>{appliedDiscount.reference || "N/A"}</td>
                          <td>{parseFloat(appliedDiscount.amount).toFixed(2)}</td>
                          <td>{appliedDiscount.description}</td>
                          <td>
                            <span className={`badge ${appliedDiscount.status === "1" ? "bg-success" : "bg-secondary"}`}>
                              {appliedDiscount.status === "1" ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            {appliedDiscount.status === "1" && (
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => handleDeleteAppliedDiscount(appliedDiscount.id)}
                                disabled={isLoading}
                              >
                                <i className="bx bx-trash"></i> Delete
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted">No previously applied discounts for this invoice.</p>
                )}
              </div>
              
              {appliedDiscounts.length > 0 && <hr />}
              
              <div>
                <Row className="mb-3">
                  <Col md={6}>
                    <Label>A/R Account <span className="text-danger">*</span></Label>
                    <Input
                      type="select"
                      value={discountARAccount}
                      onChange={(e) => setDiscountARAccount(e.target.value)}
                    >
                      <option value="">Select A/R Account</option>
                      {accounts
                        .filter((account) => {
                          const typeName = account.account_type?.typeName || "";
                          return typeName.toLowerCase().includes("receivable") || 
                                 typeName.toLowerCase().includes("account receivable") ||
                                 typeName.toLowerCase().includes("ar");
                        })
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name}
                          </option>
                        ))}
                    </Input>
                  </Col>
                  <Col md={6}>
                    <Label>Income Account <span className="text-danger">*</span></Label>
                    <Input
                      type="select"
                      value={discountIncomeAccount}
                      onChange={(e) => setDiscountIncomeAccount(e.target.value)}
                    >
                      <option value="">Select Income Account</option>
                      {accounts
                        .filter((account) => {
                          const typeName = account.account_type?.typeName || "";
                          return typeName.toLowerCase().includes("income") || 
                                 typeName.toLowerCase().includes("revenue");
                        })
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.account_name}
                          </option>
                        ))}
                    </Input>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <Label>Date <span className="text-danger">*</span></Label>
                    <Input
                      type="date"
                      value={discountDate}
                      onChange={(e) => setDiscountDate(e.target.value)}
                    />
                  </Col>
                  <Col md={6}>
                    <Label>Amount <span className="text-danger">*</span></Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={discountAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setDiscountAmount(Math.round(value * 100) / 100);
                      }}
                    />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={12}>
                    <Label>Description <span className="text-danger">*</span></Label>
                    <Input
                      type="textarea"
                      rows="3"
                      value={discountDescription}
                      onChange={(e) => setDiscountDescription(e.target.value)}
                      placeholder="Enter description for this discount"
                    />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={12}>
                    <Label>Reference</Label>
                    <Input
                      type="text"
                      value={discountReference}
                      onChange={(e) => setDiscountReference(e.target.value)}
                      placeholder="Enter reference number"
                    />
                  </Col>
                </Row>
                <div className="text-end">
                  <Button
                    color="info"
                    className="me-2"
                    onClick={previewDiscountSplits}
                    disabled={isLoading || discountAmount <= 0 || !discountDescription || !discountARAccount || !discountIncomeAccount}
                  >
                    Preview Splits
                  </Button>
                  <Button
                    color="secondary"
                    className="me-2"
                    onClick={() => {
                      setShowApplyDiscountModal(false);
                      setSelectedInvoiceIdForDiscount(null);
                      setDiscountAmount(0);
                      setDiscountDescription("");
                      setDiscountDate(moment().format("YYYY-MM-DD"));
                      setDiscountARAccount("");
                      setDiscountIncomeAccount("");
                      setDiscountReference("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    onClick={handleApplyDiscount}
                    disabled={isLoading || discountAmount <= 0 || !discountDescription || !discountARAccount || !discountIncomeAccount}
                  >
                    Apply Discount
                  </Button>
                </div>
              </div>
            </ModalBody>
          </Modal>

          {/* Preview Discount Splits Modal */}
          <Modal isOpen={showDiscountSplitsPreviewModal} toggle={() => setShowDiscountSplitsPreviewModal(false)} size="lg">
            <ModalHeader toggle={() => setShowDiscountSplitsPreviewModal(false)}>Preview Splits</ModalHeader>
            <ModalBody>
              {discountSplitsPreview && (
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
                        {discountSplitsPreview.splits.map((split, index) => {
                          const unit = split.unit_id ? units.find((u) => u.id === split.unit_id) : null;
                          return (
                            <tr key={index}>
                              <td>{split.account_name}</td>
                              <td>{split.people_id ? (people.find(p => p.id === split.people_id)?.name || "N/A") : "N/A"}</td>
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
                          <td className="text-end">{parseFloat(discountSplitsPreview.total_debit || 0).toFixed(2)}</td>
                          <td className="text-end">{parseFloat(discountSplitsPreview.total_credit || 0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                  <div className="mt-3">
                    <p>
                      <strong>Balanced:</strong> {discountSplitsPreview.is_balanced ? "Yes ✓" : "No ✗"}
                    </p>
                  </div>
                </>
              )}
            </ModalBody>
          </Modal>

          {/* Pay Invoice Modal */}
          <Modal isOpen={showPayModal} toggle={() => setShowPayModal(false)} size="xl">
            <ModalHeader toggle={() => setShowPayModal(false)}>
              Record Payment - Invoice #{selectedInvoiceForPayment?.invoice_no}
            </ModalHeader>
            <ModalBody>
              {selectedInvoiceForPayment && (
                <div>
                  {/* Invoice Summary */}
                  <Row className="mb-4">
                    <Col md={12}>
                      <Card>
                        <CardBody>
                          <h6>Invoice Summary</h6>
                          <Table bordered size="sm">
                            <tbody>
                              <tr>
                                <td><strong>Invoice Amount:</strong></td>
                                <td>{parseFloat(selectedInvoiceForPayment.amount || 0).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td><strong>Paid Amount:</strong></td>
                                <td>{parseFloat(selectedInvoiceForPayment.paid_amount || 0).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td><strong>Applied Credits:</strong></td>
                                <td>{parseFloat(selectedInvoiceForPayment.applied_credits_total || 0).toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td><strong>Balance:</strong></td>
                                <td>
                                  {(() => {
                                    const amount = parseFloat(selectedInvoiceForPayment.amount || 0);
                                    const paidAmount = parseFloat(selectedInvoiceForPayment.paid_amount || 0);
                                    const appliedCredits = parseFloat(selectedInvoiceForPayment.applied_credits_total || 0);
                                    const balance = Math.round((amount - paidAmount - appliedCredits) * 100) / 100;
                                    return <strong>{balance.toFixed(2)}</strong>;
                                  })()}
                                </td>
                              </tr>
                            </tbody>
                          </Table>
                        </CardBody>
                      </Card>
                    </Col>
                  </Row>

                  {/* Previous Payments */}
                  {previousPayments.length > 0 && (
                    <Row className="mb-4">
                      <Col md={12}>
                        <h6>Previous Payments</h6>
                        <Table bordered striped responsive>
                          <thead className="table-light">
                            <tr>
                              <th>Date</th>
                              <th>Account</th>
                              <th className="text-end">Amount</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previousPayments.map((payment) => {
                              const account = accounts.find((a) => a.id === payment.account_id);
                              return (
                                <tr key={payment.id}>
                                  <td>{moment(payment.date).format("YYYY-MM-DD")}</td>
                                  <td>{account ? `${account.account_name} (${account.account_number})` : `ID: ${payment.account_id}`}</td>
                                  <td className="text-end">{parseFloat(payment.amount || 0).toFixed(2)}</td>
                                  <td>
                                    <span className={`badge ${(payment.status === 1 || payment.status === "1") ? "bg-success" : "bg-secondary"}`}>
                                      {(payment.status === 1 || payment.status === "1") ? "Active" : "Inactive"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                              <td colSpan="2" className="text-end">Total Paid:</td>
                              <td className="text-end">
                                {previousPayments
                                  .filter(p => p.status === 1 || p.status === "1")
                                  .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                                  .toFixed(2)}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </Table>
                      </Col>
                    </Row>
                  )}

                  {/* Payment Form */}
                  <Row>
                    <Col md={12}>
                      <h6>Record New Payment</h6>
                      <Row className="mb-3">
                        <Col md={6}>
                          <Label>Reference <span className="text-danger">*</span></Label>
                          <Input
                            type="text"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                          />
                        </Col>
                        <Col md={6}>
                          <Label>Date <span className="text-danger">*</span></Label>
                          <Input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              setPaymentDate(newDate);
                              // Save to localStorage to share with Create Invoice Payment page
                              localStorage.setItem(`create_invoice_payment_date_${buildingId}`, newDate);
                              // Update payment reference if unit is available
                              if (selectedInvoiceForPayment?.unit_id) {
                                const unit = units.find((u) => u.id === selectedInvoiceForPayment.unit_id);
                                if (unit && newDate) {
                                  const month = moment(newDate).format("MMM").toUpperCase();
                                  setPaymentReference(`${unit.name}-${month}-PMT`);
                                }
                              }
                            }}
                          />
                        </Col>
                      </Row>
                      <Row className="mb-3">
                        <Col md={6}>
                          <Label>Asset Account (Cash/Bank) <span className="text-danger">*</span></Label>
                          <Input
                            type="select"
                            value={paymentAccountId}
                            onChange={(e) => setPaymentAccountId(e.target.value)}
                          >
                            <option value="">Select Account</option>
                            {accounts
                              .filter((account) => {
                                const typeName = account.account_type?.typeName || "";
                                return typeName.toLowerCase().includes("asset") || 
                                       typeName.toLowerCase().includes("cash") ||
                                       typeName.toLowerCase().includes("bank");
                              })
                              .map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.account_name} ({acc.account_number})
                                </option>
                              ))}
                          </Input>
                        </Col>
                      </Row>
                      <Row className="mb-3">
                        <Col md={6}>
                          <Label>Amount <span className="text-danger">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                          />
                        </Col>
                      </Row>
                      <Row className="mb-3">
                        <Col md={12}>
                          <Button
                            color="info"
                            className="me-2"
                            onClick={previewPaymentSplits}
                            disabled={isPaymentSubmitting || isLoading || !paymentReference || !paymentAccountId || paymentAmount <= 0}
                          >
                            <i className="bx bx-show"></i> Preview Splits
                          </Button>
                          <Button
                            color="success"
                            onClick={handleCreatePayment}
                            disabled={isPaymentSubmitting || isLoading || !paymentReference || !paymentAccountId || paymentAmount <= 0}
                          >
                            <i className="bx bx-check"></i> {isPaymentSubmitting ? "Recording..." : "Record Payment"}
                          </Button>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </div>
              )}
            </ModalBody>
          </Modal>

          {/* Payment Splits Preview Modal */}
          <Modal isOpen={showPaymentSplitsModal} toggle={() => setShowPaymentSplitsModal(false)} size="lg">
            <ModalHeader toggle={() => setShowPaymentSplitsModal(false)}>Payment Splits Preview</ModalHeader>
            <ModalBody>
              {paymentSplitsPreview && (
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
                        {paymentSplitsPreview.splits.map((split, index) => {
                          const unit = split.unit_id ? units.find((u) => u.id === split.unit_id) : null;
                          return (
                            <tr key={index}>
                              <td>{split.account_name}</td>
                              <td>{split.people_id ? (people.find(p => p.id === split.people_id)?.name || "N/A") : "N/A"}</td>
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
                          <td className="text-end">{parseFloat(paymentSplitsPreview.total_debit || 0).toFixed(2)}</td>
                          <td className="text-end">{parseFloat(paymentSplitsPreview.total_credit || 0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                  <div className="mt-3">
                    <p>
                      <strong>Balanced:</strong> {paymentSplitsPreview.is_balanced ? "Yes ✓" : "No ✗"}
                    </p>
                  </div>
                  <div className="mt-3">
                    <Button
                      color="success"
                      onClick={() => {
                        setShowPaymentSplitsModal(false);
                        handleCreatePayment();
                      }}
                      disabled={isPaymentSubmitting || loading}
                    >
                      <i className="bx bx-check"></i> {isPaymentSubmitting ? "Recording..." : "Confirm and Record Payment"}
                    </Button>
                  </div>
                </>
              )}
            </ModalBody>
          </Modal>

          {/* Print Invoice Modal */}
          <Modal isOpen={showPrintModal} toggle={() => setShowPrintModal(false)} size="xl">
            <ModalHeader toggle={() => setShowPrintModal(false)}>Print Invoice</ModalHeader>
            <ModalBody>
              {printInvoiceData && (
                <div id="invoice-print-content">
                  <div className="text-end mb-3 no-print">
                    <Button color="primary" onClick={() => window.print()}>
                      <i className="bx bx-printer"></i> Print
                    </Button>
                  </div>
                  
                  <style>{`
                   
                    @media print {
                      body * {
                        visibility: hidden;
                        
                      }
                      #invoice-print-content, #invoice-print-content * {
                        visibility: visible;
                        -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    
                      }
                      #invoice-print-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin-top: -50px !important;

                      }
                      .no-print {
                        display: none !important;
                      }
                      .print-break {
                        page-break-after: avoid;
    page-break-before: avoid;
    page-break-inside: avoid;
                      }
                      .invoice-print {
                        font-size: 14px;
                        line-height: 1.3;
                      }
                      .invoice-header {
                        margin-bottom: 20px;
                        padding-bottom: 15px;
                        border-bottom: 2px solid #000;
                      }
                      .invoice-title {
                        font-size: 24px;
                        font-weight: bold;
                        text-align: center;
                        margin-bottom: 12px;
                        letter-spacing: 2px;
                      }
                      .invoice-header-info {
                        display: flex;
                        justify-content: space-between;
                        font-size: 14px;
                      }
                      .invoice-header-left, .invoice-header-right {
                        flex: 1;
                      }
                      .invoice-header-item {
                        margin-bottom: 8px;
                        display: flex;
                      }
                      .invoice-header-label {
                        font-weight: bold;
                        min-width: 70px;
                        margin-right: 8px;
                      }
                      .invoice-header-value {
                        flex: 1;
                      }
                    }
                  `}</style>

                  <div className="invoice-print">
                    {/* Invoice Header */}
                    <div className="invoice-header">
                      <div className="invoice-title">INVOICE</div>
                      <div className="invoice-header-info">
                        <div className="invoice-header-left">
                          <div className="invoice-header-item">
                            <span className="invoice-header-label">Invoice #:</span>
                            <span className="invoice-header-value">{printInvoiceData.invoice.invoice?.invoice_no || printInvoiceData.invoice.invoice_no}</span>
                          </div>
                          <div className="invoice-header-item">
                            <span className="invoice-header-label">Sales Date:</span>
                            <span className="invoice-header-value">{printInvoiceData.invoice.invoice?.sales_date ? moment(printInvoiceData.invoice.invoice.sales_date).format("D MMM YYYY") : moment(printInvoiceData.invoice.sales_date).format("D MMM YYYY")}</span>
                          </div>
                          <div className="invoice-header-item">
                            <span className="invoice-header-label">Due Date:</span>
                            <span className="invoice-header-value">{printInvoiceData.invoice.invoice?.due_date ? moment(printInvoiceData.invoice.invoice.due_date).format("D MMM YYYY") : moment(printInvoiceData.invoice.due_date).format("D MMM YYYY")}</span>
                          </div>
                        </div>
                        <div className="invoice-header-right">
                          <div className="invoice-header-item">
                            <span className="invoice-header-label">Customer:</span>
                            <span className="invoice-header-value">
                              {(() => {
                                const peopleId = printInvoiceData.invoice.invoice?.people_id || printInvoiceData.invoice.people_id;
                                const person = people.find((p) => p.id === peopleId);
                                return person ? person.name : `ID: ${peopleId || "N/A"}`;
                              })()}
                            </span>
                          </div>
                          <div className="invoice-header-item">
                            <span className="invoice-header-label">Unit:</span>
                            <span className="invoice-header-value">
                              {(() => {
                                const unitId = printInvoiceData.invoice.invoice?.unit_id || printInvoiceData.invoice.unit_id;
                                const unit = units.find((u) => u.id === unitId);
                                document.title = unit ? unit.name : `ID: ${unitId || "N/A"}`;
                                return unit ? unit.name : `ID: ${unitId || "N/A"}`;
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Invoice Items */}
                    <div className="mb-4" style={{ marginTop: '15px' }}>
                      <h5 style={{ fontSize: '14px', marginBottom: '8px', fontWeight: 'bold',textTransform:'uppercase' }}>Invoice Items</h5>
                      <Table bordered>
                        <thead>
                          <tr>
                            <th>Item Name</th>
                            <th>Previous </th>
                            <th>Current</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(printInvoiceData.invoice.items || []).filter(item => item.status === "1" || item.status === 1).map((item, index) => (
                            <tr key={index}>
                              <td>{item.item_name}</td>
                              <td>{item.previous_value !== null && item.previous_value !== undefined ? parseFloat(item.previous_value).toFixed(3).replace(/\.?0+$/, '') : "-"}</td>
                              <td>{item.current_value !== null && item.current_value !== undefined ? parseFloat(item.current_value).toFixed(3).replace(/\.?0+$/, '') : "-"}</td>
                              <td>{item.qty !== null && item.qty !== undefined ? parseFloat(item.qty).toFixed(3).replace(/\.?0+$/, '') : "-"}</td>
                              <td>{item.rate || "N/A"}</td>
                              <td>{parseFloat(item.total || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {/* Summary */}
                    <div className="mb-4">
                      <Row>
                        <Col md={6}></Col>
                        <Col md={6}>
                          <Table bordered>
                            <tbody>
                              <tr>
                                <td><strong>Amount</strong></td>
                                <td className="text-end">{printInvoiceData.invoiceAmount.toFixed(2)}</td>
                              </tr>
                              {printInvoiceData.previousBalance > 0 && (
                                <tr>
                                  <td><strong>Previous Balance</strong></td>
                                  <td className="text-end">{printInvoiceData.previousBalance.toFixed(2)}</td>
                                </tr>
                              )}
                              {printInvoiceData.previousBalance > 0 && (
                                <tr>
                                  <td><strong>Total Amount</strong></td>
                                  <td className="text-end"><strong>{(printInvoiceData.invoiceAmount + printInvoiceData.previousBalance).toFixed(2)}</strong></td>
                                </tr>
                              )}
                              <tr>
                                <td><strong>Paid</strong></td>
                                <td className="text-end">{printInvoiceData.paidAmount.toFixed(2)}</td>
                              </tr>
                              {printInvoiceData.appliedCreditsTotal > 0 && (
                                <tr>
                                  <td><strong>Applied Credits</strong></td>
                                  <td className="text-end">{printInvoiceData.appliedCreditsTotal.toFixed(2)}</td>
                                </tr>
                              )}
                              {printInvoiceData.appliedDiscountsTotal > 0 && (
                                <tr>
                                  <td><strong>Applied Discount</strong></td>
                                  <td className="text-end">{printInvoiceData.appliedDiscountsTotal.toFixed(2)}</td>
                                </tr>
                              )}
                              <tr style={{ backgroundColor: "#f8f9fa", fontWeight: "bold" }}>
                                <td><strong>Due</strong></td>
                                <td className="text-end"><strong>{printInvoiceData.dueAmount.toFixed(2)}</strong></td>
                              </tr>
                            </tbody>
                          </Table>
                        </Col>
                      </Row>
                    </div>

                    {/* {printInvoiceData.invoice.invoice?.description || printInvoiceData.invoice.description ? (
                      <div className="mb-4">
                        <strong>Description:</strong>
                        <p>{printInvoiceData.invoice.invoice?.description || printInvoiceData.invoice.description}</p>
                      </div>
                    ) : null} */}
                  </div>

                  <div className="text-end mt-3 no-print">
                    <Button color="secondary" onClick={() => setShowPrintModal(false)}>
                      Close
                    </Button>
                  </div>
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

export default Invoices;
