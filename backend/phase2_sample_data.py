import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, date, timedelta
import uuid

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "pos_system")

async def create_phase2_sample_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    print("Creating Phase 2 sample data for POS system...")
    
    # Clear existing Phase 2 data
    await db.suppliers.delete_many({})
    await db.batches.delete_many({})
    await db.purchase_orders.delete_many({})
    await db.grn.delete_many({})
    await db.advanced_promotions.delete_many({})
    await db.stores.delete_many({})
    await db.transfers.delete_many({})
    await db.wastage.delete_many({})
    
    # Create sample suppliers
    suppliers = [
        {
            "_id": "sup1",
            "name": "TechnoElectronics Ltd",
            "contact_person": "David Chen",
            "phone": "+1-555-0201",
            "email": "orders@technoelectronics.com",
            "address": "123 Industrial Ave, Tech City, TC 12345",
            "tax_number": "TAX123456789",
            "payment_terms": 30,
            "credit_limit": 50000.0,
            "current_balance": 12500.75,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "sup2",
            "name": "Fresh Foods Wholesale",
            "contact_person": "Maria Rodriguez",
            "phone": "+1-555-0202",
            "email": "supply@freshfoods.com",
            "address": "456 Market Street, Fresh City, FC 67890",
            "tax_number": "TAX987654321",
            "payment_terms": 15,
            "credit_limit": 25000.0,
            "current_balance": 3456.25,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "sup3",
            "name": "Global Beverages Inc",
            "contact_person": "John Smith",
            "phone": "+1-555-0203",
            "email": "orders@globalbev.com",
            "address": "789 Beverage Blvd, Drink City, DC 11111",
            "tax_number": "TAX555444333",
            "payment_terms": 45,
            "credit_limit": 75000.0,
            "current_balance": 0.0,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "sup4",
            "name": "StyleWear Distributors",
            "contact_person": "Sarah Kim",
            "phone": "+1-555-0204",
            "email": "wholesale@stylewear.com",
            "address": "321 Fashion Ave, Style City, SC 22222",
            "tax_number": "TAX111222333",
            "payment_terms": 30,
            "credit_limit": 30000.0,
            "current_balance": 5678.90,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.suppliers.insert_many(suppliers)
    print("✓ Created sample suppliers")
    
    # Create sample batches with expiry dates
    today = date.today()
    batches = [
        {
            "_id": "batch1",
            "product_id": "prod4",  # Basmati Rice
            "batch_number": "BR2024-001",
            "manufacture_date": (today - timedelta(days=60)).isoformat(),
            "expiry_date": (today + timedelta(days=305)).isoformat(),  # ~10 months
            "initial_quantity": 100.0,
            "current_quantity": 87.5,
            "cost_price": 3.20,
            "supplier_id": "sup2",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "batch2",
            "product_id": "prod5",  # Organic Bananas
            "batch_number": "OB2024-012",
            "manufacture_date": (today - timedelta(days=2)).isoformat(),
            "expiry_date": (today + timedelta(days=5)).isoformat(),  # Expiring soon!
            "initial_quantity": 50.0,
            "current_quantity": 32.5,
            "cost_price": 0.75,
            "supplier_id": "sup2",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "batch3",
            "product_id": "prod6",  # Coca Cola
            "batch_number": "CC2024-087",
            "manufacture_date": (today - timedelta(days=30)).isoformat(),
            "expiry_date": (today + timedelta(days=335)).isoformat(),  # ~11 months
            "initial_quantity": 144.0,
            "current_quantity": 98.0,
            "cost_price": 0.75,
            "supplier_id": "sup3",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "batch4",
            "product_id": "prod7",  # Orange Juice
            "batch_number": "OJ2024-045",
            "manufacture_date": (today - timedelta(days=5)).isoformat(),
            "expiry_date": (today + timedelta(days=25)).isoformat(),  # Near expiry
            "initial_quantity": 40.0,
            "current_quantity": 28.5,
            "cost_price": 1.40,
            "supplier_id": "sup2",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "batch5",
            "product_id": "prod9",  # Milk (expired)
            "batch_number": "MK2024-123",
            "manufacture_date": (today - timedelta(days=10)).isoformat(),
            "expiry_date": (today - timedelta(days=2)).isoformat(),  # Already expired!
            "initial_quantity": 25.0,
            "current_quantity": 8.0,  # Some still in stock but expired
            "cost_price": 1.10,
            "supplier_id": "sup2",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.batches.insert_many(batches)
    print("✓ Created sample batches with expiry tracking")
    
    # Create sample purchase orders
    purchase_orders = [
        {
            "_id": "po1",
            "po_number": "PO000001",
            "supplier_id": "sup1",
            "status": "completed",
            "order_date": (today - timedelta(days=15)).isoformat(),
            "expected_date": (today - timedelta(days=5)).isoformat(),
            "items": [
                {"product_id": "prod1", "quantity": 10, "unit_cost": 450.00, "received_quantity": 10, "total_amount": 4500.00},
                {"product_id": "prod3", "quantity": 25, "unit_cost": 85.00, "received_quantity": 25, "total_amount": 2125.00}
            ],
            "subtotal": 6625.00,
            "tax_amount": 662.50,
            "total_amount": 7287.50,
            "notes": "Regular electronics restock order",
            "created_by": "admin",
            "created_at": datetime.utcnow() - timedelta(days=15)
        },
        {
            "_id": "po2",
            "po_number": "PO000002",
            "supplier_id": "sup2",
            "status": "confirmed",
            "order_date": today.isoformat(),
            "expected_date": (today + timedelta(days=7)).isoformat(),
            "items": [
                {"product_id": "prod4", "quantity": 50, "unit_cost": 3.50, "received_quantity": 0, "total_amount": 175.00},
                {"product_id": "prod5", "quantity": 30, "unit_cost": 0.80, "received_quantity": 0, "total_amount": 24.00}
            ],
            "subtotal": 199.00,
            "tax_amount": 0.00,  # Food items no tax
            "total_amount": 199.00,
            "notes": "Weekly fresh food order",
            "created_by": "manager",
            "created_at": datetime.utcnow()
        },
        {
            "_id": "po3",
            "po_number": "PO000003",
            "supplier_id": "sup3",
            "status": "partially_received",
            "order_date": (today - timedelta(days=5)).isoformat(),
            "expected_date": (today + timedelta(days=2)).isoformat(),
            "items": [
                {"product_id": "prod6", "quantity": 100, "unit_cost": 0.80, "received_quantity": 60, "total_amount": 80.00},
                {"product_id": "prod7", "quantity": 20, "unit_cost": 1.50, "received_quantity": 20, "total_amount": 30.00}
            ],
            "subtotal": 110.00,
            "tax_amount": 5.50,
            "total_amount": 115.50,
            "notes": "Beverage restock - partial delivery received",
            "created_by": "admin",
            "created_at": datetime.utcnow() - timedelta(days=5)
        }
    ]
    
    await db.purchase_orders.insert_many(purchase_orders)
    print("✓ Created sample purchase orders")
    
    # Create sample stores
    stores = [
        {
            "_id": "store1",
            "name": "Main Store",
            "code": "MAIN",
            "address": "123 Main Street, City Center",
            "phone": "+1-555-0101",
            "manager_id": "manager",
            "tax_number": "STORE-TAX-001",
            "is_active": True,
            "settings": {
                "allow_negative_stock": False,
                "auto_reorder": True,
                "receipt_footer": "Thank you for shopping with us!"
            },
            "created_at": datetime.utcnow()
        },
        {
            "_id": "store2",
            "name": "Downtown Branch",
            "code": "DT01",
            "address": "456 Downtown Ave, Business District",
            "phone": "+1-555-0102",
            "manager_id": None,
            "tax_number": "STORE-TAX-002",
            "is_active": True,
            "settings": {
                "allow_negative_stock": False,
                "auto_reorder": False,
                "receipt_footer": "Visit us again soon!"
            },
            "created_at": datetime.utcnow()
        },
        {
            "_id": "store3",
            "name": "Suburban Outlet",
            "code": "SUB1",
            "address": "789 Suburban Road, Residential Area",
            "phone": "+1-555-0103",
            "manager_id": None,
            "tax_number": "STORE-TAX-003",
            "is_active": True,
            "settings": {
                "allow_negative_stock": True,
                "auto_reorder": True,
                "receipt_footer": "Come back soon!"
            },
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.stores.insert_many(stores)
    print("✓ Created sample stores")
    
    # Create sample advanced promotions
    advanced_promotions = [
        {
            "_id": "promo1",
            "name": "Buy 2 Get 1 Free Electronics",
            "name_si": "ඉලෙක්ට්‍රොනික්ස් 2ක් මිලට ගෙන 1ක් නොමිලයේ",
            "name_ta": "எலக்ட்ரானிக்ஸ் 2 வாங்கி 1 இலவசம்",
            "description": "Buy any 2 electronics items and get the cheaper one free",
            "promotion_type": "bogo",
            "conditions": [
                {"type": "quantity", "operator": ">=", "value": 2, "products": ["prod1", "prod2", "prod3", "prod8"]}
            ],
            "actions": [
                {"type": "free_item", "value": 1, "free_product_id": None, "max_applications": 1}
            ],
            "priority": 10,
            "is_stackable": False,
            "customer_types": ["Normal", "Wholesale"],
            "stores": [],  # All stores
            "usage_limit": 100,
            "usage_count": 23,
            "start_date": datetime.utcnow() - timedelta(days=10),
            "end_date": datetime.utcnow() + timedelta(days=20),
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "promo2",
            "name": "Happy Hour 20% Off",
            "name_si": "සුභ වේලාවේ 20% වට්ටම",
            "name_ta": "மகிழ்ச்சி நேரத்தில் 20% தள்ளுபடி",
            "description": "20% discount on all items during happy hours (2-4 PM)",
            "promotion_type": "happy_hour",
            "conditions": [
                {"type": "time", "operator": "in", "value": "14:00-16:00", "products": []}
            ],
            "actions": [
                {"type": "discount_percent", "value": 20, "max_applications": None}
            ],
            "priority": 5,
            "is_stackable": True,
            "customer_types": ["Normal", "Wholesale", "Credit"],
            "stores": ["store1", "store2"],
            "usage_limit": None,
            "usage_count": 156,
            "start_date": datetime.utcnow() - timedelta(days=30),
            "end_date": datetime.utcnow() + timedelta(days=60),
            "start_time": "14:00",
            "end_time": "16:00",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "promo3",
            "name": "Expiry Markdown - 50% Off",
            "name_si": "කල් ඉකුත් වීමේ වට්ටම - 50%",
            "name_ta": "காலாவதி தள்ளுபடி - 50%",
            "description": "50% discount on items expiring within 7 days",
            "promotion_type": "expiry_markdown",
            "conditions": [
                {"type": "expiry_days", "operator": "<=", "value": 7, "products": []}
            ],
            "actions": [
                {"type": "discount_percent", "value": 50, "max_applications": None}
            ],
            "priority": 20,  # High priority
            "is_stackable": False,
            "customer_types": ["Normal", "Wholesale", "Credit"],
            "stores": [],  # All stores
            "usage_limit": None,
            "usage_count": 45,
            "start_date": datetime.utcnow() - timedelta(days=365),  # Always active
            "end_date": None,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "promo4",
            "name": "Mix & Match Bundle Deal",
            "name_si": "මිශ්‍ර සහ ගළපන්න බණ්ඩල් ගනුදෙනුව",
            "name_ta": "கலந்து பொருத்து பேக்கேஜ் டீல்",
            "description": "Buy any 5 grocery items for $20",
            "promotion_type": "mix_match",
            "conditions": [
                {"type": "quantity", "operator": ">=", "value": 5, "products": ["prod4", "prod5", "prod6", "prod7", "prod9"]}
            ],
            "actions": [
                {"type": "bundle_price", "value": 20.0, "max_applications": 1}
            ],
            "priority": 8,
            "is_stackable": False,
            "customer_types": ["Normal"],
            "stores": [],
            "usage_limit": 50,
            "usage_count": 12,
            "start_date": datetime.utcnow() - timedelta(days=5),
            "end_date": datetime.utcnow() + timedelta(days=25),
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.advanced_promotions.insert_many(advanced_promotions)
    print("✓ Created sample advanced promotions")
    
    # Create sample wastage records
    wastage_records = [
        {
            "_id": "waste1",
            "product_id": "prod9",  # Milk
            "batch_id": "batch5",
            "quantity": 3.0,
            "reason": "expired",
            "cost_impact": 3.30,  # 3 * 1.10
            "recorded_by": "cashier",
            "notes": "Found expired milk in refrigerator",
            "created_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "_id": "waste2",
            "product_id": "prod5",  # Bananas
            "batch_id": "batch2",
            "quantity": 2.5,
            "reason": "damaged",
            "cost_impact": 1.88,  # 2.5 * 0.75
            "recorded_by": "manager",
            "notes": "Damaged during transport",
            "created_at": datetime.utcnow() - timedelta(days=3)
        },
        {
            "_id": "waste3",
            "product_id": "prod8",  # Bluetooth Speaker
            "batch_id": None,
            "quantity": 1.0,
            "reason": "damaged",
            "cost_impact": 35.00,
            "recorded_by": "admin",
            "notes": "Customer return - water damage",
            "created_at": datetime.utcnow() - timedelta(days=7)
        },
        {
            "_id": "waste4",
            "product_id": "prod6",  # Coca Cola
            "batch_id": "batch3",
            "quantity": 12.0,
            "reason": "damaged",
            "cost_impact": 9.00,  # 12 * 0.75
            "recorded_by": "cashier",
            "notes": "Broken during shelf stocking",
            "created_at": datetime.utcnow() - timedelta(days=5)
        }
    ]
    
    await db.wastage.insert_many(wastage_records)
    print("✓ Created sample wastage records")
    
    # Create sample transfer
    transfers = [
        {
            "_id": "transfer1",
            "transfer_number": "TRN000001",
            "from_store_id": "store1",
            "to_store_id": "store2",
            "status": "completed",
            "items": [
                {"product_id": "prod1", "quantity": 2, "cost_price": 450.00},
                {"product_id": "prod3", "quantity": 5, "cost_price": 85.00}
            ],
            "requested_by": "manager",
            "approved_by": "admin",
            "shipped_date": (today - timedelta(days=3)).isoformat(),
            "received_date": (today - timedelta(days=2)).isoformat(),
            "notes": "Stock balancing between stores",
            "created_at": datetime.utcnow() - timedelta(days=4)
        },
        {
            "_id": "transfer2",
            "transfer_number": "TRN000002",
            "from_store_id": "store1",
            "to_store_id": "store3",
            "status": "in_transit",
            "items": [
                {"product_id": "prod4", "quantity": 10, "cost_price": 3.50},
                {"product_id": "prod6", "quantity": 24, "cost_price": 0.80}
            ],
            "requested_by": "cashier",
            "approved_by": "manager",
            "shipped_date": (today - timedelta(days=1)).isoformat(),
            "received_date": None,
            "notes": "New store stock allocation",
            "created_at": datetime.utcnow() - timedelta(days=2)
        }
    ]
    
    await db.transfers.insert_many(transfers)
    print("✓ Created sample transfers")
    
    print("\n🎉 Phase 2 sample data creation completed!")
    print("\n📋 Phase 2 Features Added:")
    print(f"• {len(suppliers)} suppliers with contact details and payment terms")
    print(f"• {len(batches)} product batches with expiry tracking")
    print(f"• {len(purchase_orders)} purchase orders (various statuses)")
    print(f"• {len(stores)} stores for multi-location management")
    print(f"• {len(advanced_promotions)} advanced promotions (BOGO, Happy Hour, etc.)")
    print(f"• {len(wastage_records)} wastage records for loss tracking")
    print(f"• {len(transfers)} inter-store transfers")
    
    print("\n🔍 Key Features to Explore:")
    print("• Expiry alerts: Products expiring soon or already expired")
    print("• Advanced promotions: BOGO, Happy Hour (2-4 PM), Expiry markdowns")
    print("• Batch tracking: Full traceability from supplier to sale")
    print("• Purchase management: Create POs, receive goods, track costs")
    print("• Multi-store operations: Transfer inventory between locations")
    print("• Wastage management: Track losses and their financial impact")
    print("• Advanced analytics: Sales trends, inventory insights, profit analysis")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_phase2_sample_data())