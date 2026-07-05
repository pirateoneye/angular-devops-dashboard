export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  categoryId: number;
  categoryName: string;
  basePrice: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  gender?: string;
  material?: string;
  careInstructions?: string;
  imageUrl?: string;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  productName: string;
  size: string;
  color: string;
  colorHex?: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  weightGrams?: number;
  isActive: boolean;
  warehouseStock: Record<string, number>;
  createdAt: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplier: { id: number; name: string };
  warehouse: { id: number; name: string };
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  totalAmount: number;
  notes?: string;
  items: POItem[];
  createdAt: string;
}

export interface POItem {
  id: number;
  variantId: number;
  variantSku: string;
  variantSize: string;
  variantColor: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  totalCost: number;
}

export interface StockMovement {
  id: number;
  variantId: number;
  variantSku: string;
  variantSize: string;
  variantColor: string;
  productName: string;
  warehouseName: string;
  type: string;
  quantity: number;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  createdAt: string;
}

export interface Alert {
  id: number;
  variantId: number;
  variantSku: string;
  productName: string;
  size: string;
  color: string;
  type: string;
  message: string;
  currentStock: number;
  threshold: number;
  acknowledged: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalVariants: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingPurchaseOrders: number;
  recentMovements: StockMovement[];
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  subcategories?: Category[];
  productCount: number;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  isActive: boolean;
}
