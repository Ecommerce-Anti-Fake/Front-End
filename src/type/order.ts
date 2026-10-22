export type Order = {
  id: string;
  orderCode: string;
  status: string;
  shopName: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus?: string;
  firstProduct: {
    name: string;
    variant: string;
    quantity: number;
    price: number;
    image: string;
  };
  otherProducts: number;
};


export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPING"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod =
  | "COD"
  | "PAYOS"
  | "WALLET"
  | "VNPay"
  | "Momo"
  | "ZaloPay"
  | "BankTransfer";

export interface OrderHistory {
  status: OrderStatus;
  description: string;
  createdAt: string;
}


export interface OrderItem {
  id: string;
  offerId?: string;
  productId: string;
  productName: string;
  thumbnailUrl: string;
  variantName?: string;
  variant?: {
    id: string;
    sku: string | null;
    price: number;
    availableQuantity: number;
    isActive: boolean;
  } | null;
  selectedOptions?: Array<{
    optionGroupId: string;
    optionValueId: string;
    optionGroupDisplayName: string;
    optionValueText: string;
    mediaAssetId: string | null;
    mediaUrl: string | null;
  }>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderShop {
  id?: string;
  name?: string;
  shopId?: string;
  shopName?: string;
  fulfillmentStatus?: string;
  items: OrderItem[];
}

export interface OrderDetail {
  id: string;
  orderCode: string;
  status: OrderStatus | string;
  createdAt: string;

  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;

  carrier?: string;
  trackingCode?: string;
  shippingMethod?: string;
  estimatedDelivery?: string;

  paymentMethod: PaymentMethod;
  paymentStatus?: string;

  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount: number;

  note?: string;

  histories: OrderHistory[];

  shops: OrderShop[];
}
