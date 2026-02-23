"use client";

import {
  adminCreateUser,
  changeUserRole,
  deleteUser,
} from "@/app/actions/user";
import { AdminUserData, UserRole } from "@/types";
import { useState } from "react";

interface AdminUserListProps {
  initialUsers: AdminUserData[];
  currentUserId: string;
}

export default function AdminUserList({
  initialUsers,
  currentUserId,
}: AdminUserListProps) {
  const [users, setUsers] = useState<AdminUserData[]>(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setLoadingId(userId);
      await changeUserRole(userId, newRole);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("Lỗi khi đổi quyền: " + error.message);
      } else {
        alert("Lỗi không xác định khi đổi quyền");
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa user này khỏi hệ thống vĩnh viễn không?",
      )
    )
      return;
    try {
      setLoadingId(userId);
      await deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("Lỗi khi xoá user: " + error.message);
      } else {
        alert("Lỗi không xác định khi xoá user");
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    try {
      await adminCreateUser(formData);
      alert("Tạo người dùng thành công! Họ có thể đăng nhập ngay bây giờ.");
      setIsCreateModalOpen(false);
      // Let Server Action revalidate and refresh the page next time,
      // or we can just reload the page to get the new list.
      window.location.reload();
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert("Lỗi khi tạo user: " + error.message);
      } else {
        alert("Lỗi không xác định khi tạo user");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-stone-800 text-white px-4 py-2 rounded-md hover:bg-stone-700 transition-colors font-medium text-sm shadow-sm cursor-pointer"
        >
          + Thêm người dùng
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b-2 border-stone-200 bg-stone-50">
              <tr>
                <th className="px-6 py-4 text-stone-500 font-medium">Email</th>
                <th className="px-6 py-4 text-stone-500 font-medium">
                  Vai trò
                </th>
                <th className="px-6 py-4 text-stone-500 font-medium">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-stone-500 font-medium text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-stone-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4 font-medium text-stone-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-stone-100 text-stone-600 border border-stone-200"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-stone-500">
                    {new Date(user.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    {user.id !== currentUserId && (
                      <>
                        {user.role === "admin" ? (
                          <button
                            disabled={loadingId === user.id}
                            onClick={() => handleRoleChange(user.id, "member")}
                            className="text-stone-600 hover:text-stone-900 font-medium disabled:opacity-50 cursor-pointer"
                          >
                            Hạ quyền
                          </button>
                        ) : (
                          <button
                            disabled={loadingId === user.id}
                            onClick={() => handleRoleChange(user.id, "admin")}
                            className="text-amber-600 hover:text-amber-800 font-medium disabled:opacity-50 cursor-pointer"
                          >
                            Lên Admin
                          </button>
                        )}

                        <button
                          disabled={loadingId === user.id}
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 cursor-pointer"
                        >
                          Xóa
                        </button>
                      </>
                    )}
                    {user.id === currentUserId && (
                      <span className="text-stone-400 italic text-xs">Bạn</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-stone-500"
                  >
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className="text-lg font-serif font-bold text-stone-800">
                Tạo Người Dùng Mới
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Ít nhất 6 ký tự"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Vai trò
                  </label>
                  <select
                    name="role"
                    className="w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                    defaultValue="member"
                  >
                    <option value="member">Thành viên (Member)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-md shadow-sm text-sm font-medium text-stone-700 bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-700 hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCreating ? "Đang tạo..." : "Tạo người dùng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
