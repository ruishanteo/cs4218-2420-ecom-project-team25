import React from "react";

const Spinner = () => {
  return (
    <>
      <div
        className="d-flex flex-column justify-content-center align-items-center"
        data-testid="spinner"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </>
  );
};

export default Spinner;
