'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { getPermissions, createPermission, updatePermission, deletePermission, Permission } from '@/services/roles';

import { toast } from 'react-hot-toast';

export default function AdminPermissionsPage() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchPermissions = async () => {
    try {
      setIsLoading(true);
      const response = await getPermissions();
      setPermissions(response.data);
    } catch (error) {
      console.error('Failed to fetch permissions', error);
      toast.error('فشل تحميل الصلاحيات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (editingPermission) {
        await updatePermission(editingPermission.id, formData);
        toast.success('تم تحديث الصلاحية بنجاح');
      } else {
        await createPermission(formData);
        toast.success('تم إنشاء الصلاحية بنجاح');
      }
      await fetchPermissions();
      setIsModalOpen(false);
      setEditingPermission(null);
      setFormData({ name: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل حفظ الصلاحية');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (permission: Permission) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الصلاحية؟')) {
      try {
        await deletePermission(permission.id);
        toast.success('تم حذف الصلاحية بنجاح');
        fetchPermissions();
      } catch (err: any) {
        toast.error('فشل حذف الصلاحية');
      }
    }
  };

  const tableColumns = [
    {
      key: 'id',
      label: '#',
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      key: 'name',
      label: 'اسم الصلاحية',
      sortable: true,
    },
    {
      key: 'created_at',
      label: 'تاريخ الإنشاء',
      render: (date: string) => new Date(date).toLocaleDateString('ar-EG')
    }
  ];

  const tableActions = [
    {
      label: 'تعديل',
      icon: 'fas fa-edit',
      onClick: (row: Permission) => openEditModal(row),
    },
    {
      label: 'حذف',
      icon: 'fas fa-trash',
      variant: 'danger' as const,
      onClick: (row: Permission) => handleDelete(row),
    },
  ];

  return (
    <DashboardLayout
      role="admin"
      user={user || undefined}
    >
      <div className="bg-[#1e1e2d] rounded-xl shadow-lg border border-white/5">
        <div className="dashboard-card-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="dashboard-card-title">
            <i className="fas fa-key"></i>
            <h2>إدارة الصلاحيات</h2>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingPermission(null);
              setFormData({ name: '' });
              setIsModalOpen(true);
            }}
          >
            <i className="fas fa-plus"></i>
            <span>إضافة صلاحية جديدة</span>
          </button>
        </div>
        {isLoading ? (
          <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {tableColumns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    {tableColumns.map((_, index) => (
                      <td key={index}>
                        <div className="skeleton-item" style={{ width: index === 0 ? '40px' : index === 1 ? '150px' : '100px' }}></div>
                      </td>
                    ))}
                    <td>
                      <div className="skeleton-item" style={{ width: '80px' }}></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <DataTable
            columns={tableColumns}
            data={permissions}
            actions={tableActions}
            searchable={true}
            pagination={true}
            itemsPerPage={10}
            isLoading={false}
          />
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f37] p-8 rounded-2xl w-full max-w-md border border-white/10">
            <h2 className="text-2xl text-white mb-6 font-bold">
              {editingPermission ? 'تعديل الصلاحية' : 'إضافة صلاحية جديدة'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">اسم الصلاحية</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <button
                  type="button"
                  className="px-6 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 transition-all"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitLoading}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2"
                  disabled={submitLoading}
                >
                  {submitLoading}
                  {editingPermission ? 'حفظ التغييرات' : 'إنشاء الصلاحية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
