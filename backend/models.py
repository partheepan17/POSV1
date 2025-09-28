# Advanced Models for Phase 2
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# Enums
class TransferStatus(str, Enum):
    PENDING = "pending"
    IN_TRANSIT = "in_transit"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PurchaseOrderStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    CONFIRMED = "confirmed"
    PARTIALLY_RECEIVED = "partially_received"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PromotionType(str, Enum):
    BOGO = "bogo"
    MIX_MATCH = "mix_match"
    BUNDLE = "bundle"
    TIERED = "tiered"
    HAPPY_HOUR = "happy_hour"
    EXPIRY_MARKDOWN = "expiry_markdown"

# Batch/Lot Models
class Batch(BaseModel):
    id: Optional[str] = None
    product_id: str
    batch_number: str
    manufacture_date: Optional[date] = None
    expiry_date: Optional[date] = None
    initial_quantity: float
    current_quantity: float
    cost_price: float
    supplier_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = None

class StockAdjustment(BaseModel):
    id: Optional[str] = None
    product_id: str
    batch_id: Optional[str] = None
    adjustment_type: str  # "in", "out", "transfer", "wastage", "damage"
    quantity: float
    reason: str
    reference_id: Optional[str] = None  # PO, Sale, Transfer ID
    performed_by: str
    notes: Optional[str] = None
    created_at: datetime = None

# Supplier Models
class Supplier(BaseModel):
    id: Optional[str] = None
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    payment_terms: int = 30  # days
    credit_limit: float = 0.0
    current_balance: float = 0.0
    is_active: bool = True
    created_at: datetime = None

class PurchaseOrderItem(BaseModel):
    product_id: str
    quantity: float
    unit_cost: float
    received_quantity: float = 0.0
    total_amount: float

class PurchaseOrder(BaseModel):
    id: Optional[str] = None
    po_number: str
    supplier_id: str
    status: PurchaseOrderStatus = PurchaseOrderStatus.DRAFT
    order_date: date
    expected_date: Optional[date] = None
    items: List[PurchaseOrderItem]
    subtotal: float
    tax_amount: float = 0.0
    total_amount: float
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = None

class GoodsReceivedNote(BaseModel):
    id: Optional[str] = None
    grn_number: str
    po_id: str
    supplier_id: str
    received_date: date
    received_by: str
    items: List[Dict[str, Any]]  # Product details with batches
    notes: Optional[str] = None
    created_at: datetime = None

# Advanced Promotion Models
class PromotionCondition(BaseModel):
    type: str  # "quantity", "amount", "product", "time", "customer_type"
    operator: str  # ">=", "<=", "==", "in"
    value: Any
    products: List[str] = []

class PromotionAction(BaseModel):
    type: str  # "discount_percent", "discount_fixed", "free_item", "bundle_price"
    value: float
    free_product_id: Optional[str] = None
    max_applications: Optional[int] = None

class AdvancedPromotion(BaseModel):
    id: Optional[str] = None
    name: str
    name_si: Optional[str] = None
    name_ta: Optional[str] = None
    description: str
    promotion_type: PromotionType
    conditions: List[PromotionCondition]
    actions: List[PromotionAction]
    priority: int = 0
    is_stackable: bool = False
    customer_types: List[str] = ["Normal", "Wholesale", "Credit"]
    stores: List[str] = []  # Empty = all stores
    usage_limit: Optional[int] = None
    usage_count: int = 0
    start_date: datetime
    end_date: Optional[datetime] = None
    start_time: Optional[str] = None  # "HH:MM" for happy hour
    end_time: Optional[str] = None
    is_active: bool = True
    created_at: datetime = None

# Store Models
class Store(BaseModel):
    id: Optional[str] = None
    name: str
    code: str  # Short code like "ST01"
    address: str
    phone: Optional[str] = None
    manager_id: Optional[str] = None
    tax_number: Optional[str] = None
    is_active: bool = True
    settings: Dict[str, Any] = {}
    created_at: datetime = None

class StoreTransfer(BaseModel):
    id: Optional[str] = None
    transfer_number: str
    from_store_id: str
    to_store_id: str
    status: TransferStatus = TransferStatus.PENDING
    items: List[Dict[str, Any]]  # Product transfers with quantities
    requested_by: str
    approved_by: Optional[str] = None
    shipped_date: Optional[date] = None
    received_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime = None

# Analytics Models
class SalesAnalytics(BaseModel):
    period: str  # "daily", "weekly", "monthly"
    start_date: date
    end_date: date
    store_id: Optional[str] = None
    total_sales: float
    total_transactions: int
    average_transaction: float
    profit_margin: float
    top_products: List[Dict[str, Any]]
    hourly_breakdown: List[Dict[str, Any]]

class InventoryAnalytics(BaseModel):
    store_id: Optional[str] = None
    total_value: float
    low_stock_count: int
    out_of_stock_count: int
    near_expiry_count: int
    wastage_value: float
    turnover_ratio: float

# Wastage Tracking
class WastageRecord(BaseModel):
    id: Optional[str] = None
    product_id: str
    batch_id: Optional[str] = None
    quantity: float
    reason: str  # "expired", "damaged", "theft", "other"
    cost_impact: float
    recorded_by: str
    notes: Optional[str] = None
    created_at: datetime = None

# Barcode Generation
class BarcodeRequest(BaseModel):
    product_ids: List[str]
    format: str = "CODE128"  # "CODE128", "EAN13", "CODE39"
    size: str = "medium"  # "small", "medium", "large"
    include_text: bool = True

# Import/Export Models
class ImportRequest(BaseModel):
    file_type: str  # "products", "customers", "suppliers"
    data: List[Dict[str, Any]]
    options: Dict[str, Any] = {}

class ExportRequest(BaseModel):
    entity_type: str
    filters: Dict[str, Any] = {}
    format: str = "csv"  # "csv", "xlsx", "pdf"
    columns: List[str] = []