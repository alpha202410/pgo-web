import { z } from 'zod'

export const LoginFormSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }).trim(),
  password: z
    .string()
    .min(1, { message: 'Password field must not be empty.' })
    .trim(),
})

export type FormState =
  | {
    errors?: {
      username?: string[]
      password?: string[]
    }
    message?: string
  }
  | undefined

export interface SessionPayload {
  userId: string
  uid: string
  token: string
  refreshToken?: string
  username: string
  name: string
  email: string
  roles: string[]
  userType?: string
  requirePasswordChange?: boolean
  expiresAt: number // Store as timestamp for JWT compatibility
}

export const TransactionSchema = z.object({
  id: z.string(),
  uid: z.string(),
  internalTransactionId: z.string(),
  externalTransactionId: z.string(),
  merchantTransactionId: z.string(),
  pspTransactionId: z.string(),
  amount: z.string(),
  currency: z.string(),
  customerIdentifier: z.string(),
  paymentMethod: z.string(),
  customerName: z.string(),
  status: z.string(),
  colorCode: z.string(),
  errorCode: z.string(),
  errorMessage: z.string(),
  description: z.string(),
  pgoId: z.string(),
  pgoName: z.string(),
  merchantId: z.string(),
  merchantName: z.string(),
  submerchantId: z.string(),
  submerchantUid: z.string(),
  submerchantName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Transaction = z.infer<typeof TransactionSchema>

export const DisbursementSchema = z.object({
  id: z.string(),
  uid: z.string(),
  internalTransactionId: z.string().optional().default(''),
  externalTransactionId: z.string().optional().default(''),
  merchantTransactionId: z.string().optional().default(''),
  pspTransactionId: z.string().optional().default(''),
  amount: z.string(),
  currency: z.string(),
  customerIdentifier: z.string().optional().default(''),
  paymentMethod: z.string().optional().default(''),
  customerName: z.string().optional().default(''),
  status: z.string(),
  colorCode: z.string(),
  errorCode: z.string().optional().default(''),
  errorMessage: z.string().optional().default(''),
  description: z.string().optional().default(''),
  pgoId: z.string(),
  pgoName: z.string(),
  merchantId: z.string(),
  merchantName: z.string().optional().default(''),
  submerchantId: z.string().optional().default(''),
  submerchantUid: z.string().optional().default(''),
  submerchantName: z.string().optional().default(''),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Disbursement = z.infer<typeof DisbursementSchema>

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  role: z.string(),
  is_active: z.boolean(),
  is_locked: z.boolean(),
  associated_merchant_id: z.string().nullable(),
  last_login_at: z.string().nullable(),
  created_at: z.string().nullable(),
})

export type User = z.infer<typeof UserSchema>

export const MerchantSchema = z.object({
  id: z.string(),
  uid: z.string(),
  code: z.string(),
  name: z.string(),
  type: z.string().optional(),
  status: z.string(), // active/inactive
  kyc_verified: z.boolean(),
  email: z.string().nullable().optional(),
  contact_info: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
})

export const AuditLogSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable(),
  username: z.string().nullable(),
  action: z.string(), // e.g., 'USER_CREATED', 'PGO_UPDATED' - required field from API
  description: z.string(),
  ip_address: z.string(),
  old_values: z.record(z.string(), z.unknown()).nullable(),
  new_values: z.record(z.string(), z.unknown()).nullable(),
  timestamp: z.string(), // datetime
})

export type AuditLog = z.infer<typeof AuditLogSchema>

export type Merchant = z.infer<typeof MerchantSchema>

// Breakdown item schema for reports (count and value)
const BreakdownItemSchema = z.object({
  count: z.number(),
  value: z.number(),
})

export type BreakdownItem = z.infer<typeof BreakdownItemSchema>

// Monthly Transaction Summary Report Schema (FR-REP-001)
export const MonthlyTransactionSummarySchema = z.object({
  report_period: z.string(), // Format: "YYYY-MM"
  total_transactions: z.number(),
  total_value: z.number(),
  currency: z.string(),
  status_breakdown: z.record(z.string(), BreakdownItemSchema),
  pgo_breakdown: z.record(z.string(), BreakdownItemSchema),
  method_breakdown: z.record(z.string(), BreakdownItemSchema),
})

export type MonthlyTransactionSummary = z.infer<typeof MonthlyTransactionSummarySchema>

// Query params for monthly transaction summary
export interface MonthlyTransactionSummaryParams {
  year: number
  month?: number
  merchant_id?: string
  pgo_id?: string
}

// Monthly Disbursement Summary Report Schema (FR-REP-001)
export const MonthlyDisbursementSummarySchema = z.object({
  report_period: z.string(), // Format: "YYYY-MM"
  total_disbursements: z.number(),
  total_value: z.number(),
  currency: z.string(),
  status_breakdown: z.record(z.string(), BreakdownItemSchema),
  pgo_breakdown: z.record(z.string(), BreakdownItemSchema),
  method_breakdown: z.record(z.string(), BreakdownItemSchema),
})

export type MonthlyDisbursementSummary = z.infer<typeof MonthlyDisbursementSummarySchema>

// Query params for monthly disbursement summary
export interface MonthlyDisbursementSummaryParams {
  year: number
  month?: number
  merchant_id?: string
  pgo_id?: string
}

import type { PaginatedApiResponse } from '@/lib/types'

export type PaginatedDisbursementResponse = PaginatedApiResponse<Disbursement>
export type PaginatedUserResponse = PaginatedApiResponse<User>
export type PaginatedMerchantResponse = PaginatedApiResponse<Merchant>