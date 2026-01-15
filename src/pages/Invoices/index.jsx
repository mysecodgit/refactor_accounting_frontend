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
import InvoiceDetailsModal from "./InvoiceDetailsModal";
import ApplyCreditModal from "./ApplyCreditModal";
import SplitsPreviewModal from "./SplitsPreviewModal";
import ApplyDiscountModal from "./ApplyDiscountModal";
import DiscountSplitsPreviewModal from "./DiscountSplitsPreviewModal";
import PayInvoiceModal from "./PayInvoiceModal";
import PaymentSplitsPreviewModal from "./PaymentSplitsPreviewModal";
import PrintInvoiceModal from "./PrintInvoiceModal";

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
  
  // Get customers only for the dropdown filter
  const customers = useMemo(() => {
    return (people || []).filter(person => 
      person.type?.title?.toLowerCase() === "customer" || 
      person.type?.Title?.toLowerCase() === "customer"
    );
  }, [people]);


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

      await axiosInstance.post(url, payload);
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
    const editUrl = `/building/${buildingId}/invoices/${invoiceId}/edit`;
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
  }, [buildingId, units]);

  // Helper functions for modals
  const handleCloseApplyCredit = () => {
    setShowApplyCreditModal(false);
    setSelectedInvoiceId(null);
    setSelectedCreditMemo(null);
    setApplyAmount(0);
    setApplyDescription("");
    setApplyDate(moment().format("YYYY-MM-DD"));
  };

  const handleCreditMemoChange = (credit) => {
    setSelectedCreditMemo(credit);
    const roundedAmount = Math.round(credit.available_amount * 100) / 100;
    setApplyAmount(roundedAmount);
  };

  const handlePaymentDateChange = useCallback((newDate, invoice, unitsList, buildingIdParam) => {
    setPaymentDate(newDate);
    // Save to localStorage to share with Create Invoice Payment page
    localStorage.setItem(`create_invoice_payment_date_${buildingIdParam}`, newDate);
    // Update payment reference if unit is available
    if (invoice?.unit_id) {
      const unit = unitsList.find((u) => u.id === invoice.unit_id);
      if (unit && newDate) {
        const month = moment(newDate).format("MMM").toUpperCase();
        setPaymentReference(`${unit.name}-${month}-PMT`);
      }
    }
  }, []);

  const handleCloseApplyDiscount = () => {
    setShowApplyDiscountModal(false);
    setSelectedInvoiceIdForDiscount(null);
    setDiscountAmount(0);
    setDiscountDescription("");
    setDiscountDate(moment().format("YYYY-MM-DD"));
    setDiscountARAccount("");
    setDiscountIncomeAccount("");
    setDiscountReference("");
  };

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

      await axiosInstance.post(url, payload);
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
          const people = cell.row.original.people;
          if (!people) {
            return <>N/A</>;
          }
          return <>{people.name}</>;
        },
      },
      {
        header: "Unit",
        accessorKey: "unit_id",
        enableColumnFilter: false,
        enableSorting: true,
        cell: (cell) => {
          const unit =cell.row.original.unit;
          if (!unit) {
            return <>N/A</>;
          }
          return <>{unit.name}</>;
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
          <InvoiceDetailsModal
            isOpen={showInvoiceDetailsModal}
            toggle={() => setShowInvoiceDetailsModal(false)}
            viewingInvoice={viewingInvoice}
            units={units}
            people={people}
            accounts={accounts}
            onPrintClick={async () => {
              const invoiceId = viewingInvoice?.invoice?.id || viewingInvoice?.id;
              if (invoiceId) {
                await fetchPrintInvoiceData(invoiceId);
              }
            }}
          />

          {/* Apply Credit Modal */}
          <ApplyCreditModal
            isOpen={showApplyCreditModal}
            toggle={handleCloseApplyCredit}
            availableCredits={availableCredits}
            appliedCredits={appliedCredits}
            selectedCreditMemo={selectedCreditMemo}
            applyAmount={applyAmount}
            applyDescription={applyDescription}
            applyDate={applyDate}
            isLoading={isLoading}
            onCreditMemoChange={handleCreditMemoChange}
            onAmountChange={setApplyAmount}
            onDescriptionChange={setApplyDescription}
            onDateChange={setApplyDate}
            onDeleteAppliedCredit={handleDeleteAppliedCredit}
            onPreviewSplits={previewSplits}
            onApplyCredit={handleApplyCredit}
            onClose={handleCloseApplyCredit}
          />

          {/* Preview Splits Modal */}
          <SplitsPreviewModal
            isOpen={showSplitsPreviewModal}
            toggle={() => setShowSplitsPreviewModal(false)}
            splitsPreview={splitsPreview}
            units={units}
            people={people}
          />

          {/* Apply Discount Modal */}
          <ApplyDiscountModal
            isOpen={showApplyDiscountModal}
            toggle={handleCloseApplyDiscount}
            appliedDiscounts={appliedDiscounts}
            accounts={accounts}
            discountAmount={discountAmount}
            discountDescription={discountDescription}
            discountDate={discountDate}
            discountARAccount={discountARAccount}
            discountIncomeAccount={discountIncomeAccount}
            discountReference={discountReference}
            isLoading={isLoading}
            onAmountChange={(value) => setDiscountAmount(value)}
            onDescriptionChange={setDiscountDescription}
            onDateChange={setDiscountDate}
            onARAccountChange={setDiscountARAccount}
            onIncomeAccountChange={setDiscountIncomeAccount}
            onReferenceChange={setDiscountReference}
            onDeleteAppliedDiscount={handleDeleteAppliedDiscount}
            onPreviewSplits={previewDiscountSplits}
            onApplyDiscount={handleApplyDiscount}
            onClose={handleCloseApplyDiscount}
          />

          {/* Preview Discount Splits Modal */}
          <DiscountSplitsPreviewModal
            isOpen={showDiscountSplitsPreviewModal}
            toggle={() => setShowDiscountSplitsPreviewModal(false)}
            discountSplitsPreview={discountSplitsPreview}
            units={units}
            people={people}
          />

          {/* Pay Invoice Modal */}
          <PayInvoiceModal
            isOpen={showPayModal}
            toggle={() => setShowPayModal(false)}
            selectedInvoiceForPayment={selectedInvoiceForPayment}
            previousPayments={previousPayments}
            accounts={accounts}
            units={units}
            buildingId={buildingId}
            paymentReference={paymentReference}
            paymentDate={paymentDate}
            paymentAccountId={paymentAccountId}
            paymentAmount={paymentAmount}
            isPaymentSubmitting={isPaymentSubmitting}
            isLoading={isLoading}
            onReferenceChange={setPaymentReference}
            onDateChange={handlePaymentDateChange}
            onAccountChange={setPaymentAccountId}
            onAmountChange={setPaymentAmount}
            onPreviewSplits={previewPaymentSplits}
            onCreatePayment={handleCreatePayment}
          />

          {/* Payment Splits Preview Modal */}
          <PaymentSplitsPreviewModal
            isOpen={showPaymentSplitsModal}
            toggle={() => setShowPaymentSplitsModal(false)}
            paymentSplitsPreview={paymentSplitsPreview}
            units={units}
            people={people}
            onConfirm={() => {
              setShowPaymentSplitsModal(false);
              handleCreatePayment();
            }}
            isPaymentSubmitting={isPaymentSubmitting}
            isLoading={isLoading}
          />

          {/* Print Invoice Modal */}
          <PrintInvoiceModal
            isOpen={showPrintModal}
            toggle={() => setShowPrintModal(false)}
            printInvoiceData={printInvoiceData}
            units={units}
            people={people}
          />
        </Container>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
};

export default Invoices;
