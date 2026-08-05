import { authFetch } from '../ultil/auth';
import type { VoucherCreatePayload } from '../type/voucher';
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const fetchShopVouchers = async (shopId: string) => {
  const response = await authFetch(`${BASE_URL}/api/shops/${shopId}/vouchers?page=1&pageSize=100`, { headers: { Accept: 'application/json' } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Khong the tai voucher shop');
  return data?.items ?? data?.data?.items ?? [];
};
export const createShopVoucher = async (shopId: string, payload: VoucherCreatePayload) => {
  const response = await authFetch(`${BASE_URL}/api/shops/${shopId}/vouchers`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Khong the tao voucher shop');
  return data?.data ?? data;
};
