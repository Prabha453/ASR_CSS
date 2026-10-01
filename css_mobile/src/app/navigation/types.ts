import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  CompanyTab: NavigatorScreenParams<EntitiesStackParamList>;
  MessagesTab: NavigatorScreenParams<MessagesStackParamList>;
  UsersTab: NavigatorScreenParams<UsersStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
  ProfileTab: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  RecentActivity: undefined;
};

export type EntitiesStackParamList = {
  EntitiesHub: undefined;
  IndividualList: undefined;
  IndividualView: {
    entityId: number;
    name?: string;
  };
  IndividualAdd: {
    entityId?: number;
  } | undefined;
  CompanyList: undefined;
  CompanyView: {
    entityId: number;
    name?: string;
  };
  CompanyAdd: {
    entityId?: number;
  } | undefined;
  EntityShareForm: {
    entityId: number;
    shareId?: number;
    isGuarantee?: boolean;
    isAuthorizedCapital?: boolean;
  };
  OfficialsDetail: {
    entityId?: number;
    name?: string;
  };
  ChargesList: undefined;
  ModulePlaceholder: {
    title: string;
    description?: string;
  };
};

/** @deprecated Use EntitiesStackParamList */
export type CompanyStackParamList = Pick<
  EntitiesStackParamList,
  'CompanyList' | 'CompanyView' | 'CompanyAdd'
>;

export type IndividualStackParamList = {
  IndividualList: undefined;
  IndividualView: {
    entityId: number;
    name?: string;
  };
  IndividualAdd: {
    entityId?: number;
  } | undefined;
};

export type OfficialsStackParamList = {
  OfficialsHub: undefined;
};

export type MessagesStackParamList = {
  MessagesList: undefined;
};

export type UsersStackParamList = {
  UsersHub: undefined;
  UserList: undefined;
  UserForm: { userId?: number } | undefined;
  UserPermissions: { userId: number; name?: string };
  UserGroupList: undefined;
  UserGroupForm: { userGroupId?: number } | undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  CompanyProfile: { tab?: 'company' | 'decimal' | 'contact' | 'email' } | undefined;
  SharesSettings: { tab?: 'certificate' | 'transfer' | 'authorized-capital' } | undefined;
  UserSettings: { tab?: 'profile' | 'preferences' } | undefined;
  MasterSettings: undefined;
  MasterDataList: {
    resourceId: string;
    title: string;
  };
  ChangePassword: undefined;
  AppPreferences: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
};

export type AppDrawerParamList = {
  MainTabs: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
