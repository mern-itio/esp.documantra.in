import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from "lucide-react";

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}
import FirstSection from "./FirstSection";
import SecondSection from "./SecondSection";
import { useEffect, useState } from "react";
import { apiServiceApi } from "../../../services/apiHelper";
import LoadingSpinner from "../../../components/ApiServices/Spinner";


const Main = () => {
   const [stats, setStats] = useState({ totalRequests: 0, errorRate: 0, avgLatency: 0, apiUptime: 0 });
   const [selectedDate, setSelectedDate] = useState('');
    const [loading, setLoading] = useState(true);

   // Fetch on mount
useEffect(() => {
  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await apiServiceApi.get('/api/api-service/total-requests');
      if (response.status === 200 && response.data) {
        setStats({
          totalRequests: response.data.totalRequests,
          errorRate: response.data.errorRate,
          avgLatency: response.data.avgLatency,
          apiUptime: response.data.apiUptime
        });
      }
    } catch (err) {
      console.error("Error fetching analytics stats:", err);
    }finally {
      setLoading(false);
    }
  };
  fetchStats();
}, []);

  const handleExport = async () => {
    if (!selectedDate) {
      alert("Please select Date");
      return;
    }
    try {
      const response = await apiServiceApi.get(`/api/api-service/analytics/day?date=${selectedDate}`);
      const data = response.data;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("API Analytics Report", 14, 20);
      doc.setFontSize(12);
      // doc.text(`Date: ${data.date}`, 14, 30);

      // --- Summary Table (First Stat) ---
      const summary = data.getAnalyticsStats && data.getAnalyticsStats;
      if (summary) {
        doc.text(`Summary Data for date ${data.date}.`, 14, 40);
      } else {
        doc.text("No summary data available.", 14, 40);
      }

      let currentY = 65; // vertical position for each next table

      // --- RequestVolumeData Table ---
      if (data.RequestVolumeData && data.RequestVolumeData.length > 0) {
        // @ts-ignore
        autoTable(doc,{
          startY: currentY,
          head: [["Date", "Total Requests", "Error Rate", "Avg Latency", "API Uptime"]],
          body: data.RequestVolumeData.map((row:any) =>
            [row.date, row.totalRequests, row.errorRate, row.avgLatency, row.apiUptime]
          ),
          theme: "grid",
          styles: { fontSize: 10 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // --- ErrorTypesData Table ---
      if (data.ErrorTypesData && data.ErrorTypesData.length > 0) {
        // @ts-ignore
        autoTable(doc,{
          startY: currentY,
          head: [["Type", "Count"]],
          body: data.ErrorTypesData.map((row:any) => [row.type, row.count]),
          theme: "grid",
          styles: { fontSize: 10 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // --- HourlyLatencyData Table ---
      if (data.HourlyLatencyData && data.HourlyLatencyData.length > 0) {
        // @ts-ignore
        autoTable(doc,{
          startY: currentY,
          head: [["Time", "p50", "p95", "p99"]],
          body: data.HourlyLatencyData.map((row:any) => [row.time, row.p50, row.p95, row.p99]),
          theme: "grid",
          styles: { fontSize: 10 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // --- RecentErrorsData Table ---
      if (data.RecentErrorsData && data.RecentErrorsData.length > 0) {
        // @ts-ignore
        autoTable(doc,{
          startY: currentY,
          head: [["User ID", "Endpoint"]],
          body: data.RecentErrorsData.map((row:any) => [row.userId, row.endpoint]),
          theme: "grid",
          styles: { fontSize: 10 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // --- TopApiEndpointsData Table ---
      if (data.TopApiEndpointsData && data.TopApiEndpointsData.length > 0) {
        // @ts-ignore
        autoTable(doc,{
          startY: currentY,
          head: [["Endpoint", "Count"]],
          body: data.TopApiEndpointsData.map((row:any) => [row.endpoint, row.count]),
          theme: "grid",
          styles: { fontSize: 10 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // --- getStatusCodesData Table ---
      if (data.getStatusCodesData && data.getStatusCodesData.length > 0) {
        // @ts-ignore
        autoTable(doc,{
          startY: currentY,
          head: [["Status Code", "Count"]],
          body: data.getStatusCodesData.map((row: any) => [row.status, row.count]),
          theme: "grid",
          styles: { fontSize: 10 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      doc.save(`api-analytics-${data.date}.pdf`);
    } catch (err) {
      console.error("Export API error:", err);
    }
  };

  return (
    <div className="p-6 space-y-8 bg-[#F5F2EE] min-h-screen">
      {/* Header */}
     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">API Analytics</h1>
      <p className="text-gray-600">
        Monitor your API usage, performance, and error patterns
      </p>
    </div>
  {/* Right Side Controls */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <input
        type="date"
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    <button
      className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm hover:bg-gray-100 transition-colors"
      onClick={handleExport}
    >
      <Download className="w-4 h-4" />
      Export
    </button>
    </div>
  </div>
      {loading ? <LoadingSpinner /> : <FirstSection {...stats} />}
      <SecondSection/>
    </div>
  );
};

export default Main;
