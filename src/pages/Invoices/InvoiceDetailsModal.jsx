import React from "react";
import { Modal, ModalHeader, ModalBody, Button, Table, Row, Col } from "reactstrap";
import moment from "moment/moment";

const InvoiceDetailsModal = ({
  isOpen,
  toggle,
  viewingInvoice,
  units, // TODO: try to remote it
  people, // TODO: try to remote it
  accounts, // TODO: try to remote it
  onPrintClick,
}) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl">
      <ModalHeader toggle={toggle}>Invoice Details</ModalHeader>
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
                          const unit = viewingInvoice.invoice?.unit;
                          return unit ? unit.name : `ID: ${"N/A"}`;
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
                          const account = viewingInvoice.invoice?.ar_account;
                          return account ? `${account.account_name}` : `ID: ${"N/A"}`;
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
                      const account = split.account;
                      const person = split.people;
                      const unit = split.unit;
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
                onClick={onPrintClick}
              >
                <i className="bx bx-printer"></i> Print
              </Button>
              <Button color="secondary" onClick={toggle}>
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
  );
};

export default InvoiceDetailsModal;
