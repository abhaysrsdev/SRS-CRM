// ─── Role-Based Access Control ───────────────────────────────────────────────

export type AppRole =
  | 'Admin'
  | 'Sales Manager'
  | 'Sales Executive'
  | 'Inventory Manager'
  | 'Account Manager';

export interface Permission {
  // Navigation
  canViewDashboard: boolean;
  canViewCRMLists: boolean;
  canViewInventory: boolean;
  canViewDataHub: boolean;
  canViewInteractions: boolean;
  canViewReminders: boolean;
  canViewMap: boolean;
  canViewCatalogBuilder: boolean;
  canViewForecasting: boolean;
  canViewSystemGuide: boolean;

  // Actions
  canAddLead: boolean;
  canUploadExcel: boolean;
  canExportData: boolean;
  canSendWhatsApp: boolean;
  canBuildCatalog: boolean;
  canLogInteraction: boolean;
  canMarkFollowUpDone: boolean;
  canManageSegmentRules: boolean;
  canViewAIInsights: boolean;
  canManageRoles: boolean;

  // Data sensitivity
  canViewRevenue: boolean;
  canViewPartyScores: boolean;
  canViewContactInfo: boolean;
}

// ─── Permission Matrix ────────────────────────────────────────────────────────
const PERMISSIONS: Record<AppRole, Permission> = {
  Admin: {
    canViewDashboard: true, canViewCRMLists: true, canViewInventory: true,
    canViewDataHub: true, canViewInteractions: true, canViewReminders: true,
    canViewMap: true, canViewCatalogBuilder: true, canViewForecasting: true,
    canViewSystemGuide: true,
    canAddLead: true, canUploadExcel: true, canExportData: true,
    canSendWhatsApp: true, canBuildCatalog: true, canLogInteraction: true,
    canMarkFollowUpDone: true, canManageSegmentRules: true, canViewAIInsights: true,
    canManageRoles: true,
    canViewRevenue: true, canViewPartyScores: true, canViewContactInfo: true,
  },

  'Sales Manager': {
    canViewDashboard: true, canViewCRMLists: true, canViewInventory: true,
    canViewDataHub: true, canViewInteractions: true, canViewReminders: true,
    canViewMap: true, canViewCatalogBuilder: true, canViewForecasting: true,
    canViewSystemGuide: true,
    canAddLead: true, canUploadExcel: true, canExportData: true,
    canSendWhatsApp: true, canBuildCatalog: true, canLogInteraction: true,
    canMarkFollowUpDone: true, canManageSegmentRules: true, canViewAIInsights: true,
    canManageRoles: false,
    canViewRevenue: true, canViewPartyScores: true, canViewContactInfo: true,
  },

  'Sales Executive': {
    canViewDashboard: true, canViewCRMLists: true, canViewInventory: true,
    canViewDataHub: true, canViewInteractions: true, canViewReminders: true,
    canViewMap: true, canViewCatalogBuilder: true, canViewForecasting: true,
    canViewSystemGuide: true,
    canAddLead: true, canUploadExcel: true, canExportData: true,
    canSendWhatsApp: true, canBuildCatalog: true, canLogInteraction: true,
    canMarkFollowUpDone: true, canManageSegmentRules: true, canViewAIInsights: true,
    canManageRoles: false,
    canViewRevenue: true, canViewPartyScores: true, canViewContactInfo: true,
  },

  'Inventory Manager': {
    canViewDashboard: true, canViewCRMLists: true, canViewInventory: true,
    canViewDataHub: true, canViewInteractions: true, canViewReminders: true,
    canViewMap: true, canViewCatalogBuilder: true, canViewForecasting: true,
    canViewSystemGuide: true,
    canAddLead: true, canUploadExcel: true, canExportData: true,
    canSendWhatsApp: true, canBuildCatalog: true, canLogInteraction: true,
    canMarkFollowUpDone: true, canManageSegmentRules: true, canViewAIInsights: true,
    canManageRoles: false,
    canViewRevenue: true, canViewPartyScores: true, canViewContactInfo: true,
  },

  'Account Manager': {
    canViewDashboard: true, canViewCRMLists: true, canViewInventory: true,
    canViewDataHub: true, canViewInteractions: true, canViewReminders: true,
    canViewMap: true, canViewCatalogBuilder: true, canViewForecasting: true,
    canViewSystemGuide: true,
    canAddLead: true, canUploadExcel: true, canExportData: true,
    canSendWhatsApp: true, canBuildCatalog: true, canLogInteraction: true,
    canMarkFollowUpDone: true, canManageSegmentRules: true, canViewAIInsights: true,
    canManageRoles: false,
    canViewRevenue: true, canViewPartyScores: true, canViewContactInfo: true,
  },
};

export function getPermissions(role: AppRole): Permission {
  return PERMISSIONS[role];
}

export const ALL_ROLES: AppRole[] = [
  'Admin',
];

export const ROLE_COLORS: Record<AppRole, string> = {
  'Admin': 'bg-purple-100 text-purple-700 border-purple-200',
  'Sales Manager': 'bg-blue-100 text-blue-700 border-blue-200',
  'Sales Executive': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Inventory Manager': 'bg-amber-100 text-amber-700 border-amber-200',
  'Account Manager': 'bg-rose-100 text-rose-700 border-rose-200',
};

export const ROLE_ICONS: Record<AppRole, string> = {
  'Admin': '👑',
  'Sales Manager': '📊',
  'Sales Executive': '💼',
  'Inventory Manager': '📦',
  'Account Manager': '🤝',
};
