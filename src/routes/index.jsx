import React from "react";
import { Navigate } from "react-router-dom";

// // Profile
import UserProfile from "../pages/Authentication/user-profile";

// // Authentication related pages
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";
import ForgetPwd from "../pages/Authentication/ForgetPassword";

// // Buildings List (after login)
import BuildingsList from "../pages/BuildingsList";

// // Dashboard
import Dashboard from "../pages/Dashboard/index";
import Vendors from "../pages/Vendors";
import Customers from "../pages/Customers";
import Buildings from "../pages/Buildings";
import Units from "../pages/Units";
import PeopleTypes from "../pages/PeopleTypes";
import People from "../pages/People";
import Periods from "../pages/Periods";
import AccountTypes from "../pages/AccountTypes";
import Accounts from "../pages/Accounts";
import Items from "../pages/Items";
import Invoices from "../pages/Invoices";
import InvoicePayments from "../pages/InvoicePayments";
import CreateInvoicePayment from "../pages/InvoicePayments/CreateInvoicePayment";
import EditInvoicePayment from "../pages/InvoicePayments/EditInvoicePayment";
import SalesReceipts from "../pages/SalesReceipts";
import Users from "../pages/Users";
import Permissions from "../pages/Permissions";
import Roles from "../pages/Roles";
import BalanceSheet from "../pages/Reports/BalanceSheet";
import TrialBalance from "../pages/Reports/TrialBalance";
import TransactionDetailsByAccount from "../pages/Reports/TransactionDetailsByAccount";
import CustomerBalanceSummary from "../pages/Reports/CustomerBalanceSummary";
import CustomerBalanceDetails from "../pages/Reports/CustomerBalanceDetails";
import VendorBalanceSummary from "../pages/Reports/VendorBalanceSummary";
import VendorBalanceDetails from "../pages/Reports/VendorBalanceDetails";
import ProfitAndLossStandard from "../pages/Reports/ProfitAndLossStandard";
import ProfitAndLossByUnit from "../pages/Reports/ProfitAndLossByUnit";
import CreateInvoice from "../pages/Invoices/CreateInvoice";
import EditInvoice from "../pages/Invoices/EditInvoice";
import CreateSalesReceipt from "../pages/SalesReceipts/CreateSalesReceipt";
import EditSalesReceipt from "../pages/SalesReceipts/EditSalesReceipt";
import Checks from "../pages/Checks";
import CreateCheck from "../pages/Checks/CreateCheck";
import Bills from "../pages/Bills";
import CreateBill from "../pages/Bills/CreateBill";
import BillPayments from "../pages/BillPayments";
import CreateBillPayment from "../pages/BillPayments/CreateBillPayment";
import EditBillPayment from "../pages/BillPayments/EditBillPayment";
import CreditMemos from "../pages/CreditMemos";
import CreateCreditMemo from "../pages/CreditMemos/CreateCreditMemo";
import Journals from "../pages/Journals";
import CreateJournal from "../pages/Journals/CreateJournal";
import Leases from "../pages/Leases";
import CreateLease from "../pages/Leases/CreateLease";
import EditLease from "../pages/Leases/EditLease";
import Readings from "../pages/Readings";
import CreateReading from "../pages/Readings/CreateReading";
import EditReading from "../pages/Readings/EditReading";

const authProtectedRoutes = [
  // Buildings list page (first page after login)
  { path: "/buildings-list", component: <BuildingsList /> },

  // Building-scoped routes
  { path: "/building/:id/dashboard", component: <Dashboard /> },
  { path: "/building/:id/units", component: <Units /> },
  { path: "/building/:id/people-types", component: <PeopleTypes /> },
  { path: "/building/:id/people", component: <People /> },
  { path: "/building/:id/periods", component: <Periods /> },
  { path: "/building/:id/account-types", component: <AccountTypes /> },
  { path: "/building/:id/accounts", component: <Accounts /> },
  { path: "/building/:id/items", component: <Items /> },
  { path: "/building/:id/invoices", component: <Invoices /> },
  { path: "/building/:id/invoices/create", component: <CreateInvoice /> },
  { path: "/building/:id/invoices/:invoiceId/edit", component: <EditInvoice /> },
  { path: "/building/:id/invoice-payments", component: <InvoicePayments /> },
  { path: "/building/:id/invoice-payments/create", component: <CreateInvoicePayment /> },
  { path: "/building/:id/invoice-payments/:paymentId/edit", component: <EditInvoicePayment /> },
  { path: "/building/:id/sales-receipts", component: <SalesReceipts /> },
  { path: "/building/:id/sales-receipts/create", component: <CreateSalesReceipt /> },
  { path: "/building/:id/sales-receipts/:receiptId/edit", component: <EditSalesReceipt /> },
    { path: "/building/:id/checks", component: <Checks /> },
    { path: "/building/:id/checks/create", component: <CreateCheck /> },
    { path: "/building/:id/checks/:checkId/edit", component: <CreateCheck /> },
    { path: "/building/:id/bills", component: <Bills /> },
    { path: "/building/:id/bills/create", component: <CreateBill /> },
    { path: "/building/:id/bills/:billId/edit", component: <CreateBill /> },
    { path: "/building/:id/bill-payments", component: <BillPayments /> },
    { path: "/building/:id/bill-payments/create", component: <CreateBillPayment /> },
    { path: "/building/:id/bill-payments/:paymentId/edit", component: <EditBillPayment /> },
    { path: "/building/:id/credit-memos", component: <CreditMemos /> },
    { path: "/building/:id/credit-memos/create", component: <CreateCreditMemo /> },
    { path: "/building/:id/credit-memos/:creditMemoId/edit", component: <CreateCreditMemo /> },
  { path: "/building/:id/journals", component: <Journals /> },
  { path: "/building/:id/journals/create", component: <CreateJournal /> },
  { path: "/building/:id/journals/:journalId/edit", component: <CreateJournal /> },
  { path: "/building/:id/leases", component: <Leases /> },
  { path: "/building/:id/leases/create", component: <CreateLease /> },
  { path: "/building/:id/leases/:leaseId/edit", component: <EditLease /> },
  { path: "/building/:id/readings", component: <Readings /> },
  { path: "/building/:id/readings/create", component: <CreateReading /> },
  { path: "/building/:id/readings/:readingId/edit", component: <EditReading /> },
  { path: "/building/:id/reports/balance-sheet", component: <BalanceSheet /> },
  { path: "/building/:id/reports/trial-balance", component: <TrialBalance /> },
  { path: "/building/:id/reports/transaction-details-by-account", component: <TransactionDetailsByAccount /> },
  { path: "/building/:id/reports/customer-balance-summary", component: <CustomerBalanceSummary /> },
  { path: "/building/:id/reports/customer-balance-details", component: <CustomerBalanceDetails /> },
  { path: "/building/:id/reports/vendor-balance-summary", component: <VendorBalanceSummary /> },
  { path: "/building/:id/reports/vendor-balance-details", component: <VendorBalanceDetails /> },
  { path: "/building/:id/reports/profit-and-loss-standard", component: <ProfitAndLossStandard /> },
  { path: "/building/:id/reports/profit-and-loss-by-unit", component: <ProfitAndLossByUnit /> },
  { path: "/building/:id/buildings", component: <Buildings /> },

  //profile
  { path: "/profile", component: <UserProfile /> },
  
  // Legacy routes (keeping for backward compatibility)
  { path: "/dashboard", component: <Dashboard /> },
  { path: "/buildings", component: <Buildings /> },
  { path: "/units", component: <Units /> },
  { path: "/people-types", component: <PeopleTypes /> },
  { path: "/people", component: <People /> },
  { path: "/periods", component: <Periods /> },
  { path: "/account-types", component: <AccountTypes /> },
  { path: "/accounts", component: <Accounts /> },
  { path: "/items", component: <Items /> },
  { path: "/invoices", component: <Invoices /> },
  { path: "/invoice-payments", component: <InvoicePayments /> },
  { path: "/sales-receipts", component: <SalesReceipts /> },
  { path: "/users", component: <Users /> },
  { path: "/permissions", component: <Permissions /> },
  { path: "/roles", component: <Roles /> },
  
  // Legacy routes
  { path: "/vendors", component: <Vendors /> },
  { path: "/customers", component: <Customers /> },

  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  { path: "/", exact: true, component: <Navigate to="/buildings-list" /> },
];

const publicRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },
];

export { authProtectedRoutes, publicRoutes };
