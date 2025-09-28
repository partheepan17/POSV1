# Advanced Routes for Phase 2
from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from models import *
import uuid
from bson import ObjectId
import csv
import io
import json

# Create router
router = APIRouter(prefix="/api", tags=["Phase 2"])

# Dependency functions - will be replaced with actual imports in production
def get_db():
    # This will be injected by the main app
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "pos_system")
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DATABASE_NAME]

def get_current_user_dependency():
    # Import here to avoid circular import
    from server import get_current_user
    return get_current_user

# Get database instance
db = get_db()

# Batch Management Routes
@router.get("/batches")
async def get_batches(
    product_id: Optional[str] = None,
    expiring_soon: Optional[bool] = None,
    current_user = Depends(get_current_user_dependency())
):
    filter_query = {"is_active": True}
    
    if product_id:
        filter_query["product_id"] = product_id
    
    if expiring_soon:
        # Items expiring in next 30 days
        future_date = datetime.utcnow() + timedelta(days=30)
        filter_query["expiry_date"] = {"$lte": future_date.date().isoformat()}
    
    cursor = db.batches.find(filter_query).sort("expiry_date", 1)
    batches = []
    async for batch in cursor:
        batch["id"] = str(batch["_id"])
        del batch["_id"]
        batches.append(batch)
    
    return batches

@router.post("/batches")
async def create_batch(batch: Batch, current_user: User = Depends(get_current_user)):
    batch_dict = batch.dict()
    if batch_dict.get("id"):
        del batch_dict["id"]
    batch_dict["_id"] = str(uuid.uuid4())
    batch_dict["created_at"] = datetime.utcnow()
    
    await db.batches.insert_one(batch_dict)
    return {"message": "Batch created successfully", "batch_id": batch_dict["_id"]}

@router.get("/batches/expiry-alerts")
async def get_expiry_alerts(days: int = 7, current_user: User = Depends(get_current_user)):
    """Get products expiring within specified days"""
    future_date = datetime.utcnow() + timedelta(days=days)
    
    pipeline = [
        {
            "$match": {
                "expiry_date": {"$lte": future_date.date().isoformat()},
                "current_quantity": {"$gt": 0},
                "is_active": True
            }
        },
        {
            "$lookup": {
                "from": "products",
                "localField": "product_id",
                "foreignField": "_id",
                "as": "product"
            }
        },
        {"$unwind": "$product"},
        {
            "$project": {
                "product_name": "$product.name_en",
                "batch_number": 1,
                "expiry_date": 1,
                "current_quantity": 1,
                "days_to_expiry": {
                    "$divide": [
                        {"$subtract": ["$expiry_date", datetime.utcnow().date().isoformat()]},
                        86400000  # milliseconds in a day
                    ]
                }
            }
        },
        {"$sort": {"expiry_date": 1}}
    ]
    
    alerts = []
    async for alert in db.batches.aggregate(pipeline):
        alert["id"] = str(alert["_id"])
        del alert["_id"]
        alerts.append(alert)
    
    return alerts

# Supplier Management Routes
@router.get("/suppliers")
async def get_suppliers(current_user: User = Depends(get_current_user)):
    cursor = db.suppliers.find({"is_active": True})
    suppliers = []
    async for supplier in cursor:
        supplier["id"] = str(supplier["_id"])
        del supplier["_id"]
        suppliers.append(supplier)
    return suppliers

@router.post("/suppliers")
async def create_supplier(supplier: Supplier, current_user: User = Depends(get_current_user)):
    supplier_dict = supplier.dict()
    if supplier_dict.get("id"):
        del supplier_dict["id"]
    supplier_dict["_id"] = str(uuid.uuid4())
    supplier_dict["created_at"] = datetime.utcnow()
    
    await db.suppliers.insert_one(supplier_dict)
    return {"message": "Supplier created successfully", "supplier_id": supplier_dict["_id"]}

@router.put("/suppliers/{supplier_id}")
async def update_supplier(
    supplier_id: str, 
    supplier: Supplier, 
    current_user: User = Depends(get_current_user)
):
    supplier_dict = supplier.dict()
    if "id" in supplier_dict:
        del supplier_dict["id"]
    
    result = await db.suppliers.update_one(
        {"_id": supplier_id},
        {"$set": supplier_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    return {"message": "Supplier updated successfully"}

# Purchase Order Routes
@router.get("/purchase-orders")
async def get_purchase_orders(
    status: Optional[PurchaseOrderStatus] = None,
    current_user: User = Depends(get_current_user)
):
    filter_query = {}
    if status:
        filter_query["status"] = status
    
    cursor = db.purchase_orders.find(filter_query).sort("created_at", -1)
    pos = []
    async for po in cursor:
        po["id"] = str(po["_id"])
        del po["_id"]
        pos.append(po)
    return pos

@router.post("/purchase-orders")
async def create_purchase_order(po: PurchaseOrder, current_user: User = Depends(get_current_user)):
    po_dict = po.dict()
    if po_dict.get("id"):
        del po_dict["id"]
    
    # Generate PO number
    count = await db.purchase_orders.count_documents({})
    po_dict["po_number"] = f"PO{count + 1:06d}"
    po_dict["_id"] = str(uuid.uuid4())
    po_dict["created_by"] = current_user.id
    po_dict["created_at"] = datetime.utcnow()
    
    await db.purchase_orders.insert_one(po_dict)
    return {"message": "Purchase order created successfully", "po_id": po_dict["_id"], "po_number": po_dict["po_number"]}

@router.post("/purchase-orders/{po_id}/receive")
async def receive_goods(
    po_id: str,
    grn_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Create GRN and update inventory"""
    po = await db.purchase_orders.find_one({"_id": po_id})
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    # Create GRN
    grn_count = await db.grn.count_documents({})
    grn = {
        "_id": str(uuid.uuid4()),
        "grn_number": f"GRN{grn_count + 1:06d}",
        "po_id": po_id,
        "supplier_id": po["supplier_id"],
        "received_date": datetime.utcnow().date(),
        "received_by": current_user.id,
        "items": grn_data["items"],
        "notes": grn_data.get("notes"),
        "created_at": datetime.utcnow()
    }
    
    await db.grn.insert_one(grn)
    
    # Update inventory and batches
    for item in grn_data["items"]:
        product_id = item["product_id"]
        quantity = item["quantity"]
        batch_info = item.get("batch_info")
        
        # Update product stock
        await db.products.update_one(
            {"_id": product_id},
            {"$inc": {"stock_quantity": quantity}}
        )
        
        # Create batch if provided
        if batch_info:
            batch = {
                "_id": str(uuid.uuid4()),
                "product_id": product_id,
                "batch_number": batch_info["batch_number"],
                "manufacture_date": batch_info.get("manufacture_date"),
                "expiry_date": batch_info.get("expiry_date"),
                "initial_quantity": quantity,
                "current_quantity": quantity,
                "cost_price": item["unit_cost"],
                "supplier_id": po["supplier_id"],
                "is_active": True,
                "created_at": datetime.utcnow()
            }
            await db.batches.insert_one(batch)
    
    # Update PO status
    total_received = sum(item["quantity"] for item in grn_data["items"])
    total_ordered = sum(item["quantity"] for item in po["items"])
    
    if total_received >= total_ordered:
        status = PurchaseOrderStatus.COMPLETED
    else:
        status = PurchaseOrderStatus.PARTIALLY_RECEIVED
    
    await db.purchase_orders.update_one(
        {"_id": po_id},
        {"$set": {"status": status}}
    )
    
    return {"message": "Goods received successfully", "grn_id": grn["_id"]}

# Advanced Promotion Routes
@router.get("/advanced-promotions")
async def get_advanced_promotions(current_user: User = Depends(get_current_user)):
    cursor = db.advanced_promotions.find({"is_active": True})
    promotions = []
    async for promo in cursor:
        promo["id"] = str(promo["_id"])
        del promo["_id"]
        promotions.append(promo)
    return promotions

@router.post("/advanced-promotions")
async def create_advanced_promotion(
    promotion: AdvancedPromotion, 
    current_user: User = Depends(get_current_user)
):
    promo_dict = promotion.dict()
    if promo_dict.get("id"):
        del promo_dict["id"]
    promo_dict["_id"] = str(uuid.uuid4())
    promo_dict["created_at"] = datetime.utcnow()
    
    await db.advanced_promotions.insert_one(promo_dict)
    return {"message": "Promotion created successfully", "promotion_id": promo_dict["_id"]}

# Store Management Routes
@router.get("/stores")
async def get_stores(current_user: User = Depends(get_current_user)):
    cursor = db.stores.find({"is_active": True})
    stores = []
    async for store in cursor:
        store["id"] = str(store["_id"])
        del store["_id"]
        stores.append(store)
    return stores

@router.post("/stores")
async def create_store(store: Store, current_user: User = Depends(get_current_user)):
    store_dict = store.dict()
    if store_dict.get("id"):
        del store_dict["id"]
    store_dict["_id"] = str(uuid.uuid4())
    store_dict["created_at"] = datetime.utcnow()
    
    await db.stores.insert_one(store_dict)
    return {"message": "Store created successfully", "store_id": store_dict["_id"]}

# Transfer Routes
@router.get("/transfers")
async def get_transfers(current_user: User = Depends(get_current_user)):
    cursor = db.transfers.find({}).sort("created_at", -1)
    transfers = []
    async for transfer in cursor:
        transfer["id"] = str(transfer["_id"])
        del transfer["_id"]
        transfers.append(transfer)
    return transfers

@router.post("/transfers")
async def create_transfer(transfer: StoreTransfer, current_user: User = Depends(get_current_user)):
    transfer_dict = transfer.dict()
    if transfer_dict.get("id"):
        del transfer_dict["id"]
    
    # Generate transfer number
    count = await db.transfers.count_documents({})
    transfer_dict["transfer_number"] = f"TRN{count + 1:06d}"
    transfer_dict["_id"] = str(uuid.uuid4())
    transfer_dict["requested_by"] = current_user.id
    transfer_dict["created_at"] = datetime.utcnow()
    
    await db.transfers.insert_one(transfer_dict)
    return {"message": "Transfer created successfully", "transfer_id": transfer_dict["_id"]}

# Analytics Routes
@router.get("/analytics/sales")
async def get_sales_analytics(
    start_date: date,
    end_date: date,
    store_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive sales analytics"""
    match_filter = {
        "created_at": {
            "$gte": datetime.combine(start_date, datetime.min.time()),
            "$lte": datetime.combine(end_date, datetime.max.time())
        }
    }
    
    if store_id:
        match_filter["store_id"] = store_id
    
    # Sales summary pipeline
    pipeline = [
        {"$match": match_filter},
        {
            "$group": {
                "_id": None,
                "total_sales": {"$sum": "$total_amount"},
                "total_transactions": {"$sum": 1},
                "average_transaction": {"$avg": "$total_amount"}
            }
        }
    ]
    
    summary = await db.sales.aggregate(pipeline).to_list(1)
    if not summary:
        summary = [{"total_sales": 0, "total_transactions": 0, "average_transaction": 0}]
    
    # Top products pipeline
    top_products_pipeline = [
        {"$match": match_filter},
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.product_id",
                "quantity_sold": {"$sum": "$items.quantity"},
                "revenue": {"$sum": "$items.total_amount"}
            }
        },
        {"$sort": {"revenue": -1}},
        {"$limit": 10}
    ]
    
    top_products = await db.sales.aggregate(top_products_pipeline).to_list(10)
    
    # Hourly breakdown
    hourly_pipeline = [
        {"$match": match_filter},
        {
            "$group": {
                "_id": {"$hour": "$created_at"},
                "sales": {"$sum": "$total_amount"},
                "transactions": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    hourly_data = await db.sales.aggregate(hourly_pipeline).to_list(24)
    
    return {
        "period": f"{start_date} to {end_date}",
        "total_sales": summary[0]["total_sales"],
        "total_transactions": summary[0]["total_transactions"],
        "average_transaction": summary[0]["average_transaction"],
        "profit_margin": 25.5,  # Would calculate from cost data
        "top_products": top_products,
        "hourly_breakdown": hourly_data
    }

@router.get("/analytics/inventory")
async def get_inventory_analytics(
    store_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get inventory analytics"""
    match_filter = {"is_active": True}
    if store_id:
        match_filter["store_id"] = store_id
    
    # Total inventory value
    pipeline = [
        {"$match": match_filter},
        {
            "$group": {
                "_id": None,
                "total_value": {"$sum": {"$multiply": ["$stock_quantity", "$cost_price"]}},
                "low_stock_count": {
                    "$sum": {
                        "$cond": [{"$lte": ["$stock_quantity", "$reorder_point"]}, 1, 0]
                    }
                },
                "out_of_stock_count": {
                    "$sum": {"$cond": [{"$eq": ["$stock_quantity", 0]}, 1, 0]}
                }
            }
        }
    ]
    
    result = await db.products.aggregate(pipeline).to_list(1)
    if not result:
        result = [{"total_value": 0, "low_stock_count": 0, "out_of_stock_count": 0}]
    
    # Near expiry count from batches
    future_date = datetime.utcnow() + timedelta(days=30)
    near_expiry_count = await db.batches.count_documents({
        "expiry_date": {"$lte": future_date.date().isoformat()},
        "current_quantity": {"$gt": 0},
        "is_active": True
    })
    
    return {
        "total_value": result[0]["total_value"],
        "low_stock_count": result[0]["low_stock_count"],
        "out_of_stock_count": result[0]["out_of_stock_count"],
        "near_expiry_count": near_expiry_count,
        "wastage_value": 0,  # Would calculate from wastage records
        "turnover_ratio": 2.5  # Would calculate from sales data
    }

# Wastage Management
@router.get("/wastage")
async def get_wastage_records(current_user: User = Depends(get_current_user)):
    cursor = db.wastage.find({}).sort("created_at", -1).limit(50)
    records = []
    async for record in cursor:
        record["id"] = str(record["_id"])
        del record["_id"]
        records.append(record)
    return records

@router.post("/wastage")
async def record_wastage(wastage: WastageRecord, current_user: User = Depends(get_current_user)):
    wastage_dict = wastage.dict()
    if wastage_dict.get("id"):
        del wastage_dict["id"]
    wastage_dict["_id"] = str(uuid.uuid4())
    wastage_dict["recorded_by"] = current_user.id
    wastage_dict["created_at"] = datetime.utcnow()
    
    # Update inventory
    await db.products.update_one(
        {"_id": wastage.product_id},
        {"$inc": {"stock_quantity": -wastage.quantity}}
    )
    
    # Update batch if specified
    if wastage.batch_id:
        await db.batches.update_one(
            {"_id": wastage.batch_id},
            {"$inc": {"current_quantity": -wastage.quantity}}
        )
    
    await db.wastage.insert_one(wastage_dict)
    return {"message": "Wastage recorded successfully", "record_id": wastage_dict["_id"]}

# Import/Export Routes
@router.post("/import/products")
async def import_products(request: ImportRequest, current_user: User = Depends(get_current_user)):
    """Import products from CSV data"""
    success_count = 0
    error_count = 0
    errors = []
    
    for row_data in request.data:
        try:
            # Validate and create product
            product_data = {
                "_id": str(uuid.uuid4()),
                "sku": row_data["sku"],
                "barcode": row_data["barcode"],
                "name_en": row_data["name_en"],
                "name_si": row_data.get("name_si", ""),
                "name_ta": row_data.get("name_ta", ""),
                "category_id": row_data["category_id"],
                "brand": row_data.get("brand", ""),
                "cost_price": float(row_data["cost_price"]),
                "price_normal": float(row_data["price_normal"]),
                "price_wholesale": float(row_data.get("price_wholesale", row_data["price_normal"])),
                "price_credit": float(row_data.get("price_credit", row_data["price_normal"])),
                "tax_rate": float(row_data.get("tax_rate", 0)),
                "unit": row_data.get("unit", "pcs"),
                "stock_quantity": int(row_data.get("stock_quantity", 0)),
                "reorder_point": int(row_data.get("reorder_point", 10)),
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await db.products.insert_one(product_data)
            success_count += 1
            
        except Exception as e:
            error_count += 1
            errors.append(f"Row {success_count + error_count}: {str(e)}")
    
    return {
        "message": f"Import completed: {success_count} successful, {error_count} errors",
        "success_count": success_count,
        "error_count": error_count,
        "errors": errors[:10]  # Limit error messages
    }

@router.get("/export/products")
async def export_products(format: str = "csv", current_user: User = Depends(get_current_user)):
    """Export products to CSV"""
    cursor = db.products.find({"is_active": True})
    products = []
    async for product in cursor:
        del product["_id"]
        products.append(product)
    
    if format == "csv":
        # Convert to CSV format
        output = io.StringIO()
        if products:
            writer = csv.DictWriter(output, fieldnames=products[0].keys())
            writer.writeheader()
            writer.writerows(products)
        
        return {"content": output.getvalue(), "filename": "products_export.csv"}
    
    return {"data": products, "count": len(products)}