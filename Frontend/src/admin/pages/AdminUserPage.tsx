import React, { useEffect, useMemo, useState } from 'react';
import { DataTable, Button } from '../common';
import {  CheckCircle, XCircle, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {adminApi} from '../../services/apiHelper';
import type { UserType } from '../../types'; // Define your user type

const AdminUserList: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const navigate = useNavigate();

  // Fetch users from auth-service
  const fetchUsers = async () => {
    try {
      setLoading(true); 
      const res = await adminApi.get('/admin/user-list');
      setUsers(res.data.data || []);
    } catch (err) { 
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Compute filtered and sorted users
  const tableData = useMemo(() => {
    const filtered = users.filter(user => {
      const matchesSearch =
        user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? user.status : !user.status);

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
  }, [users, searchTerm, statusFilter, sortColumn, sortDirection]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // Optionally call backend to update status
      await adminApi.patch(`/admin/user-status/toggle/${userId}`,{
        status : !currentStatus
      });

      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: !currentStatus } : u));
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const getStatusBadge = (active: boolean) => {
    const color = active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
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
      key: 'fullname',
      label: 'Full Name',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center">
          <User className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_: any, row: UserType) => getStatusBadge(row.status)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: UserType) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={row.status ? 'outline' : 'primary'}
            onClick={() => toggleUserStatus(row._id, row.status)}
          >
            {row.status ? 'Deactivate' : 'Activate'}
          </Button>
          <Button size="sm" onClick={() => navigate(`/admin/users/${row._id}`)}>View</Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600">View all users and set Active/Inactive</p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow mb-6 p-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
          More Filters
        </Button> */}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={tableData}
          columns={columns}
          onSort={(col, dir) => { setSortColumn(col); setSortDirection(dir); }}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          emptyMessage={loading ? 'Loading...' : 'No users found'}
        />
      </div>
    </div>
  );
};

export default AdminUserList;
