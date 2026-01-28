import React from "react";
import { Modal, ModalHeader, ModalBody, Button, Table, Row, Col } from "reactstrap";
import moment from "moment/moment";

const PrintInvoiceModal = ({
  isOpen,
  toggle,
  printInvoiceData,
  units,
  people,
}) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl">
      <ModalHeader toggle={toggle}>Print Invoice</ModalHeader>
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
                    {(printInvoiceData.items || []).filter(item => item.status === "1" || item.status === 1).map((item, index) => (
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
            </div>

            <div className="text-end mt-3 no-print">
              <Button color="secondary" onClick={toggle}>
                Close
              </Button>
            </div>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default PrintInvoiceModal;
