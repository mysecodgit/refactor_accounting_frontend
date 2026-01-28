import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";

// //Import Scrollbar
import SimpleBar from "simplebar-react";

// MetisMenu
import MetisMenu from "metismenujs";
import { Link, useLocation, useParams } from "react-router-dom";
import withRouter from "../Common/withRouter";

//i18n
import { withTranslation } from "react-i18next";
import { useCallback } from "react";

const SidebarContent = (props) => {
  const ref = useRef();
  const path = useLocation();
  const { id: buildingId } = useParams();
  
  // Helper function to build routes with building context
  const buildRoute = (route) => {
    if (buildingId) {
      return `/building/${buildingId}${route}`;
    }
    return route;
  };

  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active");
    const parent = item.parentElement;
    const parent2El = parent.childNodes[1];
    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show");
    }

    if (parent) {
      parent.classList.add("mm-active");
      const parent2 = parent.parentElement;

      if (parent2) {
        parent2.classList.add("mm-show"); // ul tag

        const parent3 = parent2.parentElement; // li tag

        if (parent3) {
          parent3.classList.add("mm-active"); // li
          parent3.childNodes[0].classList.add("mm-active"); //a
          const parent4 = parent3.parentElement; // ul
          if (parent4) {
            parent4.classList.add("mm-show"); // ul
            const parent5 = parent4.parentElement;
            if (parent5) {
              parent5.classList.add("mm-show"); // li
              parent5.childNodes[0].classList.add("mm-active"); // a tag
            }
          }
        }
      }
      scrollElement(item);
      return false;
    }
    scrollElement(item);
    return false;
  }, []);

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;

      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        const parent2El =
          parent.childNodes && parent.childNodes.lenght && parent.childNodes[1]
            ? parent.childNodes[1]
            : null;
        if (parent2El && parent2El.id !== "side-menu") {
          parent2El.classList.remove("mm-show");
        }

        parent.classList.remove("mm-active");
        const parent2 = parent.parentElement;

        if (parent2) {
          parent2.classList.remove("mm-show");

          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.remove("mm-active"); // li
            parent3.childNodes[0].classList.remove("mm-active");

            const parent4 = parent3.parentElement; // ul
            if (parent4) {
              parent4.classList.remove("mm-show"); // ul
              const parent5 = parent4.parentElement;
              if (parent5) {
                parent5.classList.remove("mm-show"); // li
                parent5.childNodes[0].classList.remove("mm-active"); // a tag
              }
            }
          }
        }
      }
    }
  };

  const activeMenu = useCallback(() => {
    const pathName = path.pathname;
    let matchingMenuItem = null;
    const ul = document.getElementById("side-menu");
    const items = ul.getElementsByTagName("a");
    removeActivation(items);

    // First, try to find exact matches (skip dropdown parents with href="#")
    for (let i = 0; i < items.length; ++i) {
      const item = items[i];
      // Skip dropdown parent links (they have href="#" or has-arrow class)
      if (item.getAttribute("href") === "#" || item.classList.contains("has-arrow")) {
        continue;
      }
      // Match exact pathname
      if (pathName === item.pathname) {
        matchingMenuItem = item;
        break;
      }
    }

    // If no exact match found, try partial matches (for nested routes)
    if (!matchingMenuItem) {
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        // Skip dropdown parent links
        if (item.getAttribute("href") === "#" || item.classList.contains("has-arrow")) {
          continue;
        }
        // Check if current path starts with the item's pathname (for nested routes)
        if (item.pathname && item.pathname !== "#" && pathName.startsWith(item.pathname)) {
          matchingMenuItem = item;
          break;
        }
      }
    }

    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  }, [path.pathname, activateParentDropdown]);

  useEffect(() => {
    ref.current.recalculate();
  }, []);

  useEffect(() => {
    new MetisMenu("#side-menu");
    activeMenu();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    activeMenu();
  }, [activeMenu]);

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop;
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300;
      }
    }
  }

  return (
    <React.Fragment>
      <SimpleBar className="h-100" ref={ref}>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            {buildingId && (
              <>
                {/* Main */}
                <li>
                  <Link to={buildRoute("/dashboard")} className=" ">
                    <i className="bx bx-home-circle"></i>
                    <span>{props.t("Dashboard")}</span>
                  </Link>
                </li>

                {/* Setup */}
                <li>
                  <Link to="#" className="has-arrow">
                    <i className="bx bx-cog"></i>
                    <span>{props.t("Setup")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to={buildRoute("/units")}>
                        <i className="bx bx-home"></i>
                        <span>{props.t("Units")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/people")}>
                        <i className="bx bx-user"></i>
                        <span>{props.t("People")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/periods")}>
                        <i className="bx bx-calendar-check"></i>
                        <span>{props.t("Periods")}</span>
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Accounting */}
                <li>
                  <Link to="#" className="has-arrow">
                    <i className="bx bx-wallet"></i>
                    <span>{props.t("Accounting")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to={buildRoute("/accounts")}>
                        <i className="bx bx-wallet"></i>
                        <span>{props.t("Accounts")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/items")}>
                        <i className="bx bx-package"></i>
                        <span>{props.t("Items")}</span>
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Transactions */}
                <li>
                  <Link to="#" className="has-arrow">
                    <i className="bx bx-receipt"></i>
                    <span>{props.t("Transactions")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to={buildRoute("/invoices")}>
                        <i className="bx bx-file"></i>
                        <span>{props.t("Invoices")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/invoice-payments")}>
                        <i className="bx bx-credit-card"></i>
                        <span>{props.t("Invoice Payments")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/sales-receipts")}>
                        <i className="bx bx-money"></i>
                        <span>{props.t("Sales Receipts")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/checks")}>
                        <i className="bx bx-check-square"></i>
                        <span>{props.t("Checks")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/bills")}>
                        <i className="bx bx-receipt"></i>
                        <span>{props.t("Bills")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/bill-payments")}>
                        <i className="bx bx-money-withdraw"></i>
                        <span>{props.t("Bill Payments")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/journals")}>
                        <i className="bx bx-book"></i>
                        <span>{props.t("Journals")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/credit-memos")}>
                        <i className="bx bx-receipt"></i>
                        <span>{props.t("Credit Memos")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/leases")}>
                        <i className="bx bx-file-blank"></i>
                        <span>{props.t("Leases")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/readings")}>
                        <i className="bx bx-clipboard"></i>
                        <span>{props.t("Readings")}</span>
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Reports */}
                <li>
                  <Link to="#" className="has-arrow">
                    <i className="bx bx-bar-chart-alt-2"></i>
                    <span>{props.t("Reports")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to={buildRoute("/reports/balance-sheet")}>
                        <i className="bx bx-bar-chart-alt-2"></i>
                        <span>{props.t("Balance Sheet")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/reports/trial-balance")}>
                        <i className="bx bx-calculator"></i>
                        <span>{props.t("Trial Balance")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/reports/transaction-details-by-account")}>
                        <i className="bx bx-list-ul"></i>
                        <span>{props.t("Transaction Details by Account")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/reports/customer-balance-summary")}>
                        <i className="bx bx-user"></i>
                        <span>{props.t("Customer Balance Summary")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/reports/customer-balance-details")}>
                        <i className="bx bx-list-ul"></i>
                        <span>{props.t("Customer Balance Details")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/reports/vendor-balance-summary")}>
                        <i className="bx bx-user"></i>
                        <span>{props.t("Vendor Balance Summary")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/reports/vendor-balance-details")}>
                        <i className="bx bx-list-ul"></i>
                        <span>{props.t("Vendor Balance Details")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/reports/profit-and-loss-standard")}>
                        <i className="bx bx-line-chart"></i>
                        <span>{props.t("Profit and Loss (Standard)")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to={buildRoute("/reports/profit-and-loss-by-unit")}>
                        <i className="bx bx-bar-chart"></i>
                        <span>{props.t("Profit and Loss (By Unit)")}</span>
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Administration */}
                <li>
                  <Link to="/buildings-list" className=" ">
                    <i className="bx bx-building-house"></i>
                    <span>{props.t("Switch Building")}</span>
                  </Link>
                </li>
              </>
            )}

            {/* Global Settings - shown when no building is selected */}
            {!buildingId && (
              <>
                <li>
                  <Link to="/buildings-list" className=" ">
                    <i className="bx bx-building"></i>
                    <span>{props.t("Buildings")}</span>
                  </Link>
                </li>
                
                <li>
                  <Link to="#" className="has-arrow">
                    <i className="bx bx-cog"></i>
                    <span>{props.t("Settings")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to="/account-types">
                        <i className="bx bx-list-ul"></i>
                        <span>{props.t("Account Types")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/people-types">
                        <i className="bx bx-group"></i>
                        <span>{props.t("People Types")}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/users">
                        <i className="bx bx-user-circle"></i>
                        <span>{props.t("Users")}</span>
                      </Link>
                    </li>
                  </ul>
                </li>
              </>
            )}

            {/* Static sidebar content commented out */}
            {/* 
            <li className="menu-title">{props.t("Apps")}</li>

            <li>
              <Link to="#" className=" ">
                <i className="bx bx-calendar"></i>
                <span>{props.t("Calendar")}</span>
              </Link>
            </li>

            <li>
              <Link to="#" className="">
                <i className="bx bx-chat"></i>
                <span>{props.t("Chat")}</span>
              </Link>
            </li>
            <li>
              <Link to="#">
                <i className="bx bx-file"></i>
                <span>{props.t("File Manager")}</span>
              </Link>
            </li>

            <li>
              <Link to="/#" className="has-arrow">
                <i className="bx bx-store"></i>
                <span>{props.t("Ecommerce")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Products")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Product Detail")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Orders")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Customers")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Cart")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Checkout")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Shops")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Add Product")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-bitcoin"></i>
                <span>{props.t("Crypto")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Wallet")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Buy/Sell")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Exchange")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Lending")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Orders")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("KYC Application")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("ICO Landing")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow">
                <i className="bx bx-envelope"></i>
                <span>{props.t("Email")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Inbox")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Read Email")} </Link>
                </li>
                <li>
                  <Link to="/#" className="has-arrow">
                    <span key="#">{props.t("Templates")}</span>
                  </Link>
                  <ul className="sub-menu" aria-expanded="false">
                    <li>
                      <Link to="#">{props.t("Basic Action")}</Link>
                    </li>
                    <li>
                      <Link to="#">{props.t("Alert Email")} </Link>
                    </li>
                    <li>
                      <Link to="#">{props.t("Billing Email")} </Link>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-receipt"></i>
                <span>{props.t("Invoices")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Invoice List")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Invoice Detail")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-briefcase-alt-2"></i>
                <span>{props.t("Projects")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Projects Grid")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Projects List")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Project Overview")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Create New")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-task"></i>
                <span>{props.t("Tasks")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Task List")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Tasks Kanban")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Create Task")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bxs-user-detail"></i>
                <span>{props.t("Contacts")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("User Grid")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("User List")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Profile")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bxs-detail" />

                <span>{props.t("Blog")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Blog List")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Blog Grid")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Blog Details")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#">
                <i className="bx bx-briefcase-alt"></i>
                <span key="t-jobs">{props.t("Jobs")}</span>
              </Link>
              <ul className="sub-menu">
                <li>
                  <Link to="#">{props.t("Job List")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Job Grid")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Apply Job")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Job Details")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Jobs Categories")}</Link>
                </li>
                <li>
                  <Link to="/#" className="has-arrow">
                    Candidate
                  </Link>
                  <ul className="sub-menu" aria-expanded="true">
                    <li>
                      <Link to="#">{props.t("List")}</Link>
                    </li>
                    <li>
                      <Link to="#">{props.t("Overview")}</Link>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>

            <li className="menu-title">Pages</li>
            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-user-circle"></i>
                <span>{props.t("Authentication")}</span>
              </Link>
              <ul className="sub-menu">
                <li>
                  <Link to="#">{props.t("Login")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Login 2")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Register")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Register 2")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Recover Password")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Recover Password 2")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Lock Screen")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Lock Screen 2")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Confirm Mail")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Confirm Mail 2")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Email Verification")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Email Verification 2")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Two Step Verification")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Two Step Verification 2")}</Link>
                </li>
              </ul>
            </li>
            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-file"></i>
                <span>{props.t("Utility")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Starter Page")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Maintenance")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Coming Soon")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Timeline")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("FAQs")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Pricing")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Error 404")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Error 500")}</Link>
                </li>
              </ul>
            </li>

            <li className="menu-title">{props.t("Components")}</li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-tone"></i>
                <span>{props.t("UI Elements")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Alerts")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Buttons")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Cards")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Carousel")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Dropdowns")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Grid")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Images")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Lightbox")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Modals")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("OffCanvas")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Range Slider")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Session Timeout")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Progress Bars")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Placeholders")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Tabs & Accordions")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Typography")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Toasts")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Video")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("General")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Colors")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Rating")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Notifications")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Utilities")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="">
                <i className="bx bxs-eraser"></i>
                <span className="badge rounded-pill bg-danger float-end">
                  10
                </span>
                <span>{props.t("Forms")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Form Elements")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Form Layouts")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Form Validation")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Form Advanced")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Form Editors")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Form File Upload")} </Link>
                </li>
                <li>
                  <Link to="#">{props.t("Form Repeater")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Form Wizard")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Form Mask")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-list-ul"></i>
                <span>{props.t("Tables")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Basic Tables")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Responsive Table")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bxs-bar-chart-alt-2"></i>
                <span>{props.t("Charts")}</span>
              </Link>

              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Apex charts")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("E Chart")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Chartjs Chart")}</Link>
                </li>

                <li>
                  <Link to="#">{props.t("Knob Charts")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Sparkline Chart")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Re Chart")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-aperture"></i>
                <span>{props.t("Icons")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Boxicons")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Material Design")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Dripicons")}</Link>
                </li>
                <li>
                  <Link to="#">{props.t("Font awesome")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-map"></i>
                <span>{props.t("Maps")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="#">{props.t("Google Maps")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-share-alt"></i>
                <span>{props.t("Multi Level")}</span>
              </Link>
              <ul className="sub-menu" aria-expanded="true">
                <li>
                  <Link to="/#">{props.t("Level 1.1")}</Link>
                </li>
                <li>
                  <Link to="/#" className="has-arrow">
                    {props.t("Level 1.2")}
                  </Link>
                  <ul className="sub-menu" aria-expanded="true">
                    <li>
                      <Link to="/#">{props.t("Level 2.1")}</Link>
                    </li>
                    <li>
                      <Link to="/#">{props.t("Level 2.2")}</Link>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
            */}
          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  );
};

SidebarContent.propTypes = {
  location: PropTypes.object,
  t: PropTypes.any,
};

export default withRouter(withTranslation()(SidebarContent));
