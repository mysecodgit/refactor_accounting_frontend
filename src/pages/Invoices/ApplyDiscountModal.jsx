import React from "react";
import { Modal, ModalHeader, ModalBody, Button, Table, Row, Col, Label, Input } from "reactstrap";
import moment from "moment/moment";

const ApplyDiscountModal = ({
  isOpen,
  toggle,
  appliedDiscounts,
  accounts,
  discountAmount,
  discountDescription,
  discountDate,
  discountARAccount,
  discountIncomeAccount,
  discountReference,
  isLoading,
  onAmountChange,
  onDescriptionChange,
  onDateChange,
  onARAccountChange,
  onIncomeAccountChange,
  onReferenceChange,
  onDeleteAppliedDiscount,
  onPreviewSplits,
  onApplyDiscount,
  onClose,
}) => {
  const handleToggle = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} toggle={handleToggle} size="lg">
      <ModalHeader toggle={handleToggle}>Apply Discount to Invoice</ModalHeader>
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
                          onClick={() => onDeleteAppliedDiscount(appliedDiscount.id)}
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
                onChange={(e) => onARAccountChange(e.target.value)}
              >
                <option value="">Select A/R Account</option>
                {accounts
                  .filter((account) => {
                    const typeName = account.type?.typeName || "";
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
                onChange={(e) => onIncomeAccountChange(e.target.value)}
              >
                <option value="">Select Income Account</option>
                {accounts
                  .filter((account) => {
                    const typeName = account.type?.typeName || "";
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
                onChange={(e) => onDateChange(e.target.value)}
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
                  onAmountChange(Math.round(value * 100) / 100);
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
                onChange={(e) => onDescriptionChange(e.target.value)}
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
                onChange={(e) => onReferenceChange(e.target.value)}
                placeholder="Enter reference number"
              />
            </Col>
          </Row>
          <div className="text-end">
            <Button
              color="info"
              className="me-2"
              onClick={onPreviewSplits}
              disabled={isLoading || discountAmount <= 0 || !discountDescription || !discountARAccount || !discountIncomeAccount}
            >
              Preview Splits
            </Button>
            <Button
              color="secondary"
              className="me-2"
              onClick={handleToggle}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={onApplyDiscount}
              disabled={isLoading || discountAmount <= 0 || !discountDescription || !discountARAccount || !discountIncomeAccount}
            >
              Apply Discount
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

export default ApplyDiscountModal;
