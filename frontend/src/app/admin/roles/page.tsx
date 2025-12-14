'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { getRoles, createRole, updateRole, deleteRole, Role, Permission, getPermissions } from '@/services/roles';

import { toast } from 'react-hot-toast';

export default function AdminRolesPage() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[]
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const [rolesResponse, permissionsResponse] = await Promise.all([
        getRoles(),
        getPermissions()
      ]);
      setRoles(rolesResponse.data);
      setPermissions(permissionsResponse.data);
    } catch (error) {
      console.error('Failed to fetch roles', error);
      toast.error('فشل تحميل الأدوار');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePermissionChange = (permissionName: string) => {
    const currentPermissions = [...formData.permissions];
    if (currentPermissions.includes(permissionName)) {
      setFormData({
        ...formData,
        permissions: currentPermissions.filter(p => p !== permissionName)
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...currentPermissions, permissionName]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
        toast.success('تم تحديث الدور بنجاح');
      } else {
        await createRole(formData);
        toast.success('تم إنشاء الدور بنجاح');
      }
      await fetchRoles();
      setIsModalOpen(false);
      setEditingRole(null);
      setFormData({ name: '', permissions: [] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل حفظ الدور');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      permissions: role.permissions.map(p => p.name)
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (role: Role) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدور؟')) {
      try {
        await deleteRole(role.id);
        toast.success('تم حذف الدور بنجاح');
        fetchRoles();
      } catch (err: any) {
        toast.error('فشل حذف الدور');
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
      label: 'اسم الدور',
      sortable: true,
    },
    {
      key: 'permissions',
      label: 'الصلاحيات',
      render: (rolePermissions: Permission[]) => (
        <div className="flex flex-wrap gap-1">
          {rolePermissions.slice(0, 3).map(p => (
            <span key={p.id} className="badge badge-primary text-xs">
              {p.name}
            </span>
          ))}
          {rolePermissions.length > 3 && (
            <span className="badge badge-secondary text-xs">
              +{rolePermissions.length - 3}
            </span>
          )}
        </div>
      )
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
      onClick: (row: Role) => openEditModal(row),
    },
    {
      label: 'حذف',
      icon: 'fas fa-trash',
      variant: 'danger' as const,
      onClick: (row: Role) => handleDelete(row),
    },
  ];

  return (
    <DashboardLayout role="admin" user={user || undefined}>
      <DashboardCard
        title="إدارة الأدوار"
        icon="fas fa-user-shield"
        action={
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingRole(null);
              setFormData({ name: '', permissions: [] });
              setIsModalOpen(true);
            }}
          >
            <i className="fas fa-plus"></i>
            <span>إضافة دور جديد</span>
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
                        <div className={`skeleton-item ${index === 0 ? 'w-10' : index === 1 ? 'w-[120px]' : 'w-[200px]'}`}></div>
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
            data={roles}
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
          <div className="bg-[#1a1f37] p-8 rounded-2xl w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl text-white mb-6 font-bold">
              {editingRole ? 'تعديل الدور' : 'إضافة دور جديد'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">اسم الدور</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  required
                />
              </div>

              <div className="mb-8">
                <label className="block text-gray-300 mb-4">الصلاحيات</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {permissions.map(permission => (
                    <label 
                      key={permission.id} 
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        formData.permissions.includes(permission.name)
                          ? 'bg-primary/20 border-primary'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.name)}
                        onChange={() => handlePermissionChange(permission.name)}
                        className="hidden"
                      />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                        formData.permissions.includes(permission.name)
                          ? 'bg-primary border-primary'
                          : 'border-gray-500'
                      }`}>
                        {formData.permissions.includes(permission.name) && (
                          <i className="fas fa-check text-white text-xs"></i>
                        )}
                      </div>
                      <span className="text-gray-300 text-sm">{permission.name}</span>
                    </label>
                  ))}
                </div>
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
                  {editingRole ? 'حفظ التغييرات' : 'إنشاء الدور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
