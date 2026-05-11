export type TenantSettings = {
  emailNotifications: boolean;
};

export type UpdateSettingsInput = Partial<TenantSettings>;
