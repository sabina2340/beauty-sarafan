import { Advertisement } from "@/lib/types";
import { buildApiUrl } from "@/lib/api-base";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

async function parseArrayResponse<T>(response: Response): Promise<T[]> {
  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || `Request failed: ${response.status}`);
  }

  const payload = await response.json().catch(() => null);
  return Array.isArray(payload) ? (payload as T[]) : [];
}

export type Tariff = {
  ID?: number;
  Name?: string;
  Price?: number;
  DurationDays?: number;
  IsActive?: boolean;
  id?: number;
  name?: string;
  description?: string;
  price?: number;
  duration_days?: number;
  is_active?: boolean;
  sort_order?: number;
};

export type ActiveAdCard = {
  id: number;
  user_id?: number;
  type: string;
  title: string;
  description: string;
  city: string;
  image_url: string;
};

export type PopupAdCard = ActiveAdCard & {
  route: string;
  short_description?: string;
};

export type MyAdItem = Advertisement & {
  tariff_id?: number;
  expires_at?: string;
  activated_at?: string;
  has_pending_payment?: boolean;
  last_payment_id?: number;
  last_payment_status?: string;
  last_bank_status?: string;
  is_paid?: boolean;
  can_select_tariff?: boolean;
};

export type PaymentEntity = {
  id?: number;
  ID?: number;
  amount?: number;
  Amount?: number;
  status?: string;
  Status?: string;
  bank_status?: string;
  BankStatus?: string;
  payment_link?: string;
  PaymentLink?: string;
  operation_id?: string;
  OperationID?: string;
  paid_at?: string;
  PaidAt?: string;
  expires_at?: string;
  ExpiresAt?: string;
  created_at?: string;
  CreatedAt?: string;
};

export type PaymentPayload = {
  advertisement?: { id?: number; ID?: number; title?: string; Title?: string; status?: string; Status?: string; expires_at?: string; ExpiresAt?: string; activated_at?: string; ActivatedAt?: string };
  payment?: PaymentEntity;
  tariff?: { id?: number; ID?: number; name?: string; Name?: string; price?: number; Price?: number };
  payment_url?: string;
  operation_id?: string;
  bank_status?: string;
  status?: string;
};

export async function createAd(payload: {
  type: string;
  title: string;
  description: string;
  city: string;
  category_id?: number;
  image_urls?: string[];
  images?: File[];
}) {
  const formData = new FormData();
  formData.append("type", payload.type);
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("city", payload.city);
  if (payload.category_id) {
    formData.append("category_id", String(payload.category_id));
  }
  for (const imageUrl of payload.image_urls || []) {
    formData.append("image_urls[]", imageUrl);
  }
  for (const file of payload.images || []) {
    formData.append("images[]", file);
  }

  const response = await fetch(buildApiUrl("/advertisements"), {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  return parseResponse<{ message: string; advertisement: Advertisement }>(
    response,
  );
}

export async function getMyAds() {
  const response = await fetch(buildApiUrl("/advertisements/my"), {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<MyAdItem[]>(response);
}

export async function getTariffs() {
  const response = await fetch(buildApiUrl("/tariffs"), { cache: "no-store" });
  return parseResponse<Tariff[]>(response);
}

export async function selectTariff(adId: number, tariffId: number) {
  const response = await fetch(
    buildApiUrl(`/advertisements/${adId}/select-tariff`),
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tariff_id: tariffId }),
    },
  );
  return parseResponse<{
    payment_id: number;
    operation_id?: string;
    payment_url?: string;
    status: string;
    redirect: string;
  }>(response);
}

export async function getAdPayment(adId: number) {
  const response = await fetch(buildApiUrl(`/advertisements/${adId}/payment`), {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<PaymentPayload>(response);
}

export async function getPaymentStatus(paymentId: number) {
  const response = await fetch(buildApiUrl(`/payments/${paymentId}/status`), {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<PaymentPayload>(response);
}

export async function markPaid(paymentId: number, comment: string) {
  const response = await fetch(buildApiUrl(`/payments/${paymentId}/mark-paid`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment }),
  });
  return parseResponse<{ message: string }>(response);
}

export async function getHotOffers() {
  const response = await fetch(buildApiUrl("/hot-offers"), {
    cache: "no-store",
  });
  return parseArrayResponse<ActiveAdCard>(response);
}

export async function getActiveAds(limit = 10) {
  const response = await fetch(buildApiUrl(`/ads/active?limit=${limit}`), {
    cache: "no-store",
  });
  return parseArrayResponse<ActiveAdCard>(response);
}

export async function getPopupAds(limit = 12) {
  const response = await fetch(buildApiUrl(`/ads/popup-active?limit=${limit}`), {
    cache: "no-store",
  });
  return parseArrayResponse<PopupAdCard>(response);
}

export async function getAdminPendingPayments() {
  const response = await fetch(buildApiUrl("/admin/payments/pending"), {
    credentials: "include",
    cache: "no-store",
  });
  return parseResponse<any[]>(response);
}

export async function confirmPayment(paymentId: number) {
  const response = await fetch(buildApiUrl(`/admin/payments/${paymentId}/confirm`), {
    method: "POST",
    credentials: "include",
  });
  return parseResponse<{ message: string }>(response);
}

export async function rejectPayment(paymentId: number) {
  const response = await fetch(buildApiUrl(`/admin/payments/${paymentId}/reject`), {
    method: "POST",
    credentials: "include",
  });
  return parseResponse<{ message: string }>(response);
}
