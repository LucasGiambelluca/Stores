import { z } from 'zod';

export const CreateStoreDto = z.object({
  name: z.string().min(1),
  ownerEmail: z.string().email(),
  ownerName: z.string().optional(),
});

export type CreateStoreDto = z.infer<typeof CreateStoreDto>;

export const UpdateStoreDto = z.object({
  name: z.string().optional(),
  domain: z.string().optional(),
  status: z.enum(['active', 'suspended', 'pending']).optional(),
  plan: z.string().optional(),
});

export type UpdateStoreDto = z.infer<typeof UpdateStoreDto>;

export const AssignLicenseDto = z.object({
  licenseSerial: z.string().min(1),
});

export type AssignLicenseDto = z.infer<typeof AssignLicenseDto>;

export const ResetAdminPasswordDto = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
});

export type ResetAdminPasswordDto = z.infer<typeof ResetAdminPasswordDto>;

export const BulkDeleteStoresDto = z.object({
  ids: z.array(z.string().uuid()),
});

export type BulkDeleteStoresDto = z.infer<typeof BulkDeleteStoresDto>;
