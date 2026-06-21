import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppRole } from '../lib/roles';
import { getPermissions, type Permission } from '../lib/roles';

interface RoleState {
  currentRole: AppRole;
  permissions: Permission;
  setRole: (role: AppRole) => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      currentRole: 'Admin',
      permissions: getPermissions('Admin'),
      setRole: (role: AppRole) =>
        set({ currentRole: role, permissions: getPermissions(role) }),
    }),
    { name: 'sr-studio-role' }
  )
);
