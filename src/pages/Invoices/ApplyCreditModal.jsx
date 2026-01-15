import React from "react";
import { Modal, ModalHeader, ModalBody, Button, Table, Row, Col, Label, Input } from "reactstrap";
import moment from "moment/moment";

const ApplyCreditModal = ({
  isOpen,
  toggle,
  availableCredits,
  appliedCredits,
  selectedCreditMemo,
  applyAmount,
  applyDescription,
  applyDate,
  isLoading,
  onCreditMemoChange,
  onAmountChange,
  onDescriptionChange,
  onDateChange,
  onDeleteAppliedCredit,
  onPreviewSplits,
  onApplyCredit,
  onClose,
}) => {
  const handleToggle = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} toggle={handleToggle} size="lg">
      <ModalHeader toggle={handleToggle}>Apply Credit to Invoice</ModalHeader>
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
                          onClick={() => onDeleteAppliedCredit(appliedCredit.id)}
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
              onClick={handleToggle}
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
                      onCreditMemoChange(credit);
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
                  onChange={(e) => onDateChange(e.target.value)}
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
                    onAmountChange(Math.round(value * 100) / 100);
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
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Enter description for this credit application"
                />
              </Col>
            </Row>
            <div className="text-end">
              <Button
                color="info"
                className="me-2"
                onClick={onPreviewSplits}
                disabled={isLoading || applyAmount <= 0 || !applyDescription}
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
                onClick={onApplyCredit}
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
  );
};

export default ApplyCreditModal;
