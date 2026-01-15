import React from "react";
import { Modal, ModalHeader, ModalBody, Table } from "reactstrap";

const SplitsPreviewModal = ({
  isOpen,
  toggle,
  splitsPreview,
  units,
  people,
}) => {
  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>Preview Splits</ModalHeader>
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
  );
};

export default SplitsPreviewModal;
