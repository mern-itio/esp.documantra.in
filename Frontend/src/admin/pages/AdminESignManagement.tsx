import React, { useState, useMemo, useEffect } from "react";
import { DataTable, Button } from "../common";
import {
  Eye,
  Download,
  Filter,
  Search,
  FileSignature,
  FileText,
  Users,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { adminApi } from "../../services/apiHelper";

const AdminESignManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<"normal" | "powerform">("normal");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [envelopes, setEnvelopes] = useState([]);
  const [loading, setLoading] = useState(false);

  // ==============================
  // 🔹 MOCK DATA (replace with API)
  // ==============================

  // Fetch All Envelopes
  useEffect(() => {
    fetchEnvelopes();
  },[]);
  const fetchEnvelopes = async () =>{
    setLoading(true);
    try{
      const response = await adminApi.get('admin/fetch/envelopes');
      if(response.status == 200){
        setEnvelopes(response.data.data);
      }
    } catch (err){
      console.error('Error fetching envelopes:',err);
    } finally {
      setLoading(false);
    }
  }
  // ==============================
  // FILTERED & SORTED DATA
  // ==============================
  const filteredData = useMemo(() => {
    const filtered = envelopes.filter((env) => {
      const matchesType =
        viewMode === "powerform" ? env?.isPowerForm : !env?.isPowerForm;
      const matchesSearch =
        env?.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env?.senderName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || env?.status === statusFilter;
      return matchesType && matchesSearch && matchesStatus;
    });

    if (sortColumn) {
      filtered.sort((a: any, b: any) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [viewMode, searchTerm, statusFilter, sortColumn, sortDirection]);

  // ==============================
  // 🔹 UTILS
  // ==============================
  const getStatusBadge = (status: string) => {
    const map: any = {
      "in-progress": { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      active: { color: "bg-blue-100 text-blue-800", icon: CheckCircle },
      draft: { color: "bg-gray-100 text-gray-800", icon: XCircle },
      inactive: { color: "bg-gray-200 text-gray-700", icon: XCircle },
      archived: { color: "bg-slate-100 text-slate-700", icon: XCircle },
    };
    const config = map[status] || map["draft"];
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getProgress = (recipients: any[]) => {
    if (!recipients?.length) return "0/0";
    const signed = recipients.filter((r) => r.status === "signed").length;
    return `${signed}/${recipients.length}`;
  };

  // ==============================
  // 🔹 ACTION HANDLERS
  // ==============================
  const handleView = (id: string) => console.log("View envelope", id);
  const handleDownload = (id: string) => console.log("Download", id);
  const handleSort = (col: string, dir: "asc" | "desc") => {
    setSortColumn(col);
    setSortDirection(dir);
  };

  // ==============================
  // 🔹 TABLE DEFINITIONS
  // ==============================
const normalColumns = [
  {
    key: "subject",
    label: "Subject",
    sortable: true,
    render: (value: string) => (
      <div className="flex items-center">
        <FileSignature className="w-4 h-4 text-gray-400 mr-2" />
        <span className="font-medium text-gray-900">{value}</span>
      </div>
    ),
  },
  {
    key: "sender.name",
    label: "Sender",
    render: (_: any, row: any) => (
      <div>
        <span className="font-medium text-gray-900">{row.sender?.name}</span>
        <p className="text-xs text-gray-500">{row.sender?.email}</p>
      </div>
    ),
  },
  {
    key: "createdAt",
    label: "Created At",
    sortable: true,
    render: (value: string) => (
      <span>{new Date(value).toLocaleDateString()}</span>
    ),
  },
  {
    key: "sentAt",
    label: "Sent At",
    sortable: true,
    render: (value: string) => (
      <span>{new Date(value).toLocaleDateString()}</span>
    ),
  },
  {
    key: "progress",
    label: "Progress",
    render: (_: any, row: any) => {
      const progress = getProgress(row.recipients);
      const [done, total] = progress.split("/").map(Number);
      const pct = total ? (done / total) * 100 : 0;
      return (
        <div className="flex items-center">
          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${pct}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-600">{progress}</span>
        </div>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    render: (value: string) => getStatusBadge(value),
  },
  {
    key: "actions",
    label: "Actions",
    render: (_: any, row: any) => (
      <div className="flex space-x-2">
        <Button size="sm" variant="outline" onClick={() => handleView(row.id)}>
          <Eye className="w-4 h-4" />
        </Button>
        {row.completionCertificate?.path && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(row.completionCertificate.path)}
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>
    ),
  },
];


  const powerFormColumns = [
    {
      key: "subject",
      label: "Envelope Name",
      render: (value: string) => (
        <div className="flex items-center">
          <FileText className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      ),
    },
    { key: "message", label: "Envelope Details" },
    { key: "senderName", label: "Sender Name" },
    {
      key: "status",
      label: "Status",
      render: (value: string) => getStatusBadge(value),
    },
    {
      key: "numberOfParties",
      label: "Number of Parties",
      render: (value: number) => (
        <div className="flex items-center text-gray-900">
          <Users className="w-4 h-4 mr-1 text-gray-400" /> {value}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: any) => (
        <Button size="sm" variant="outline" onClick={() => handleView(row.id)}>
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  // ==============================
  // 🔹 RENDER
  // ==============================
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            E-Sign Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage both Normal and PowerForm envelopes
          </p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Button
            variant={viewMode === "normal" ? "primary" : "outline"}
            onClick={() => {
              setViewMode("normal");
              setStatusFilter("all");
            }}
          >
            Normal Envelopes
          </Button>
          <Button
            variant={viewMode === "powerform" ? "primary" : "outline"}
            onClick={() => {
              setViewMode("powerform");
              setStatusFilter("all");
            }}
          >
            PowerForm Envelopes
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search envelopes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          {viewMode === "normal" ? (
            <>
              <option value="draft">Draft</option>
              <option value="in-progress">In-Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </>
          ) : (
            <>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </>
          )}
        </select>

        <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
          More Filters
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={filteredData}
          columns={viewMode === "powerform" ? powerFormColumns : normalColumns}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          emptyMessage="No envelopes found"
        />
      </div>
    </div>
  );
};

export default AdminESignManagement;
