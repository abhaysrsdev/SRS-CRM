import { useRoleStore } from '../store/roleStore';

export function usePermissions() {
  return useRoleStore((s) => s.permissions);
}

export function useCurrentRole() {
  return useRoleStore((s) => s.currentRole);
}
