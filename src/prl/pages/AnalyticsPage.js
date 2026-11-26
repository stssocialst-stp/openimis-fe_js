import React from "react";
import { Helmet } from "@stssocialst-stp/fe-core";

function AnalyticsPage() {
  return (
    <div style={{ width: "100%", height: "calc(100vh - 64px)", overflow: "hidden" }}>
      <Helmet title="Analytics" />
      <iframe
        src="/superset"
        title="Superset Analytics"
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </div>
  );
}

export default AnalyticsPage;
