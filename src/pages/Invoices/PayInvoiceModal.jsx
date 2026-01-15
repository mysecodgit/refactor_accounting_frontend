import React from "react";
import { Modal, ModalHeader, ModalBody, Button, Table, Row, Col, Label, Input, Card, CardBody } from "reactstrap";
import moment from "moment/moment";

const PayInvoiceModal = ({
  isOpen,
  toggle,
  selectedInvoiceForPayment,
  previousPayments,
  accounts,
  units,
  buildingId,
  paymentReference,
  paymentDate,
  paymentAccountId,
  paymentAmount,
  isPaymentSubmitting,
  isLoading,
  onReferenceChange,
  onDateChange,
  onAccountChange,
  onAmountChange,
  onPreviewSplits,
  onCreatePayment,
}) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} size="xl">
      <ModalHeader toggle={toggle}>
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
                      onChange={(e) => onReferenceChange(e.target.value)}
                    />
                  </Col>
                  <Col md={6}>
                    <Label>Date <span className="text-danger">*</span></Label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        onDateChange(newDate, selectedInvoiceForPayment, units, buildingId);
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
                      onChange={(e) => onAccountChange(e.target.value)}
                    >
                      <option value="">Select Account</option>
                      {accounts
                        .filter((account) => {
                          const typeName = account.type?.typeName || "";
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
                      onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
                    />
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={12}>
                    <Button
                      color="info"
                      className="me-2"
                      onClick={onPreviewSplits}
                      disabled={isPaymentSubmitting || isLoading || !paymentReference || !paymentAccountId || paymentAmount <= 0}
                    >
                      <i className="bx bx-show"></i> Preview Splits
                    </Button>
                    <Button
                      color="success"
                      onClick={onCreatePayment}
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
  );
};

export default PayInvoiceModal;
