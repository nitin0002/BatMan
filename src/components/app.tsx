// Example usage of the data from the main process
import React, { useEffect, useState } from "react";

function App() {
  const [batteryData, setBatteryData] = useState<any>(null);

  useEffect(() => {
    // @ts-ignore: if you haven't created a type for window.batteryAPI
    window.batteryAPI.getBatteryData().then((data: any) => {
      setBatteryData(data);
    });
  }, []);

  if (!batteryData) {
    return <div>Loading battery info...</div>;
  }

  return (
    <div>
      <h2>Computer Name: {batteryData?.basicInfo?.computerName}</h2>
      <p>BIOS: {batteryData?.basicInfo?.bios}</p>
      <p>ReportTime: {batteryData?.basicInfo?.reportTime}</p>
      <p>System: {batteryData?.basicInfo?.systemProductName}</p>
      {/* Render whatever else you want from batteryData */}
    </div>
  );
}

export default App;
