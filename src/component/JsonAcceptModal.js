import React from "react";
import { Button, Modal } from "antd";

function JsonAcceptModal({
  open,
  setOpen,
  loading,
  handleSubmit,
  handleReject,
}) {
  return (
    <Modal
      title="Accept or Reject Changes?"
      open={open}
      confirmLoading={loading}
      footer={null}
      onCancel={() => {
        setOpen(false);
      }}
    >
      <div className="modal-btn">
        <Button type="primary" onClick={handleSubmit}>
          Accept
        </Button>
        <Button onClick={handleReject}>Reject</Button>
      </div>
    </Modal>
  );
}

export default JsonAcceptModal;
