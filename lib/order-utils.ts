import type { HttpTypes } from "@medusajs/types";

export type UnifiedOrderStatus =
  | "Canceled"
  | "Refunded"
  | "Delivered"
  | "Shipped"
  | "Processing"
  | "Pending Payment"
  | "Pending";

export function getUnifiedOrderStatus(
  order: HttpTypes.StoreOrder,
): UnifiedOrderStatus {
  if (order.status === "canceled") return "Canceled";
  if (order.payment_status === "refunded") return "Refunded";
  switch (order.fulfillment_status) {
    case "delivered":
      return "Delivered";
    case "shipped":
    case "partially_delivered":
      return "Shipped";
    case "fulfilled":
    case "partially_fulfilled":
    case "partially_shipped":
      return "Processing";
  }
  switch (order.payment_status) {
    case "captured":
    case "authorized":
    case "partially_captured":
    case "partially_authorized":
      return "Processing";
    case "not_paid":
    case "awaiting":
    case "requires_action":
      return "Pending Payment";
  }
  return "Pending";
}

export function getOrderStatusTheme(status: UnifiedOrderStatus): string {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "Shipped":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Processing":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Pending Payment":
      return "bg-red-100 text-red-800 border-red-200";
    case "Canceled":
    case "Refunded":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export function getUnifiedOrderNumber(order: HttpTypes.StoreOrder): string {
  const displayId = order.display_id || "";
  const rawId = order.id || (order as any).cart_id || "";
  const cleanId = rawId.replace(/^(order_|cart_)/, "");
  const unifiedNumber = displayId ? `${displayId}-${cleanId}` : cleanId;
  return unifiedNumber;
}
