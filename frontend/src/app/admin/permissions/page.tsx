'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { getPermissions, createPermission, updatePermission, deletePermission, Permission } from '@/services/roles';

import { toast } from 'react-hot-toast';

export default function AdminPermissionsPage() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPermission, setViewingPermission] = useState<Permission | null>(null);
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
      className: 'hidden sm:table-cell',
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      key: 'name',
      label: 'اسم الصلاحية',
      sortable: true,
      render: (value: string, row: Permission) => (
        <button 
          onClick={() => setViewingPermission(row)}
          className="text-white hover:text-primary transition-colors font-medium text-right"
        >
          {value}
        </button>
      )
    },
    {
      key: 'created_at',
      label: 'تاريخ الإنشاء',
      className: 'hidden lg:table-cell',
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
      <DashboardCard
        title="إدارة الصلاحيات"
        icon="fas fa-key"
        action={
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
        }
      >
        {isLoading ? (
          <div className="data-table-wrapper overflow-x-auto">
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
                        <div className={`skeleton-item ${index === 0 ? 'w-10' : 'w-[150px]'}`}></div>
                      </td>
                    ))}
                    <td>
                      <div className="skeleton-item w-20"></div>
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
      </DashboardCard>

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

      {/* View Permission Details Modal */}
      {viewingPermission && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f37] p-5 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl transform transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{viewingPermission.name}</h2>
                <p className="text-gray-400 text-xs">
                  تاريخ الإنشاء: {new Date(viewingPermission.created_at).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <button 
                onClick={() => setViewingPermission(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                className="px-4 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all text-sm"
                onClick={() => setViewingPermission(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
