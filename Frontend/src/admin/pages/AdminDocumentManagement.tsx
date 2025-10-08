import React, { useEffect, useMemo, useState } from 'react';
import { DataTable, Button } from '../common';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Filter,
  Search,
  FileText,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import type { PDFTool } from '../../types';
import { mockPDFTools } from '../../data/pdfMockData';
import { useNavigate } from 'react-router-dom';

const AdminDocumentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [toolStatusMap, setToolStatusMap] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  // Build list of PDF tools from mockPDFTools and routes
  const allTools: Array<PDFTool & { categoryKey: string; routeResolved?: string }> = useMemo(() => {
    // @ts-ignore iterate categories
    const entries = Object.entries(mockPDFTools) as Array<[string, { tools: PDFTool[] }]>;
    const flat = entries.flatMap(([categoryKey, cat]) =>
      (cat?.tools || []).map(t => ({ ...t, categoryKey, routeResolved: t.route || `/pdf-tools/${t.id}` }))
    );
    return flat;
  }, []);

  // Load persisted tool status
  useEffect(() => {
    const raw = localStorage.getItem('admin_pdf_tool_status');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setToolStatusMap(parsed || {});
      } catch {}
    }
  }, []);

  // Persist tool status
  useEffect(() => {
    localStorage.setItem('admin_pdf_tool_status', JSON.stringify(toolStatusMap));
  }, [toolStatusMap]);

  const toggleToolActive = (toolId: string) => {
    setToolStatusMap(prev => ({ ...prev, [toolId]: !prev[toolId] }));
  };

  const getActiveBadge = (active: boolean) => {
    const color = active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    const Icon = active ? CheckCircle : XCircle;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {active ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const columns = [
    {
      key: 'name',
      label: 'Tool',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center">
          <FileText className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true
    },
    {
      key: 'route',
      label: 'Route',
      sortable: true,
      render: (val: string) => (
        <div className="flex items-center text-gray-700">
          <LinkIcon className="w-4 h-4 mr-1" />
          <span className="text-xs">{val}</span>
        </div>
      )
    },
    {
      key: 'active',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => getActiveBadge(value)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex space-x-2">
         
          <Button
            size="sm"
            variant={row.active ? 'outline' : 'primary'}
            onClick={() => toggleToolActive(row.id)}
            icon={row.active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
          >
            {row.active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      )
    }
  ];

  // Optional: open details modal (currently not used)
  // const handleView = (id: string) => {
  //   const tool = tableData.find(d => d.id === id) || null;
  //   setSelectedDocument(tool);
  //   setIsViewOpen(true);
  // };

  // const handleApprove = (id: string) => {
  //   console.log('Approve document:', id);
  //   // Implement approve functionality
  // };

  // const handleReject = (id: string) => {
  //   console.log('Reject document:', id);
  //   // Implement reject functionality
  // };

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
    // Implement sorting logic
  };

  const tableData = useMemo(() => {
    const rows = allTools.map(t => ({
      id: t.id as string,
      name: t.name || t.id || 'Unknown',
      category: t.category || t.categoryKey,
      route: t.routeResolved,
      active: toolStatusMap[t.id as string] ?? true
    }));

    const filtered = rows.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.route?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? r.active : !r.active);
      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered];
    if (sortColumn) {
      sorted.sort((a: any, b: any) => {
        const av = a[sortColumn];
        const bv = b[sortColumn];
        if (av === bv) return 0;
        if (sortDirection === 'asc') return av > bv ? 1 : -1;
        return av < bv ? 1 : -1;
      });
    }
    return sorted;
  }, [allTools, searchTerm, statusFilter, sortColumn, sortDirection, toolStatusMap]);

  return (
    <>
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">PDF Tools Management</h1>
        <p className="text-gray-600">View all PDF tools and set Active/Inactive</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tools by name, category or route..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button
                variant="outline"
                icon={<Filter className="w-4 h-4" />}
              >
                More Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={tableData}
          columns={columns}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          emptyMessage="No tools found"
        />
      </div>

     
    </div>
   </>
  );
};

export default AdminDocumentManagement;
