import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
import uuid

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "pos_system")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_sample_data():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    print("Creating sample data for POS system...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.categories.delete_many({})
    await db.products.delete_many({})
    await db.customers.delete_many({})
    await db.discounts.delete_many({})
    
    # Create sample users
    users = [
        {
            "username": "admin",
            "email": "admin@pos.com",
            "full_name": "System Administrator",
            "hashed_password": pwd_context.hash("admin123"),
            "role": "Admin",
            "is_active": True,
            "store_id": "main",
            "permissions": ["all"],
            "created_at": datetime.utcnow()
        },
        {
            "username": "cashier",
            "email": "cashier@pos.com",
            "full_name": "John Cashier",
            "hashed_password": pwd_context.hash("cashier123"),
            "role": "Cashier",
            "is_active": True,
            "store_id": "main",
            "permissions": ["pos", "sales"],
            "created_at": datetime.utcnow()
        },
        {
            "username": "manager",
            "email": "manager@pos.com",
            "full_name": "Jane Manager",
            "hashed_password": pwd_context.hash("manager123"),
            "role": "Manager",
            "is_active": True,
            "store_id": "main",
            "permissions": ["pos", "sales", "products", "customers", "reports"],
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.users.insert_many(users)
    print("✓ Created sample users")
    
    # Create sample categories
    categories = [
        {
            "_id": "cat1",
            "name_en": "Electronics",
            "name_si": "ඉලෙක්ට්‍රොනික්ස්",
            "name_ta": "எலக்ட்ரானிக்ஸ்",
            "is_active": True
        },
        {
            "_id": "cat2",
            "name_en": "Groceries",
            "name_si": "ගෘහස්ථ භාණඩ",
            "name_ta": "மளிகை",
            "is_active": True
        },
        {
            "_id": "cat3",
            "name_en": "Beverages",
            "name_si": "බීම වර්ග",
            "name_ta": "பானங்கள்",
            "is_active": True
        },
        {
            "_id": "cat4",
            "name_en": "Clothing",
            "name_si": "ඇඳුම්",
            "name_ta": "உடைகள்",
            "is_active": True
        },
        {
            "_id": "cat5",
            "name_en": "Health & Beauty",
            "name_si": "සෞඛ්‍ය සහ සුන්දරත්වය",
            "name_ta": "ஆரோக்கியம் மற்றும் அழகு",
            "is_active": True
        }
    ]
    
    await db.categories.insert_many(categories)
    print("✓ Created sample categories")
    
    # Create sample products
    products = [
        # Electronics
        {
            "_id": "prod1",
            "sku": "ELE001",
            "barcode": "1234567890123",
            "name_en": "Samsung Galaxy S21",
            "name_si": "Samsung Galaxy S21",
            "name_ta": "Samsung Galaxy S21",
            "category_id": "cat1",
            "brand": "Samsung",
            "cost_price": 450.00,
            "price_normal": 699.99,
            "price_wholesale": 629.99,
            "price_credit": 719.99,
            "tax_rate": 8.25,
            "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400",
            "unit": "pcs",
            "stock_quantity": 15,
            "reorder_point": 5,
            "has_batch": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": "prod2",
            "sku": "ELE002",
            "barcode": "1234567890124",
            "name_en": "Apple iPhone 13",
            "name_si": "Apple iPhone 13",
            "name_ta": "Apple iPhone 13",
            "category_id": "cat1",
            "brand": "Apple",
            "cost_price": 550.00,
            "price_normal": 899.99,
            "price_wholesale": 849.99,
            "price_credit": 919.99,
            "tax_rate": 8.25,
            "image_url": "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=400",
            "unit": "pcs",
            "stock_quantity": 8,
            "reorder_point": 3,
            "has_batch": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": "prod3",
            "sku": "ELE003",
            "barcode": "1234567890125",
            "name_en": "Sony Wireless Headphones",
            "name_si": "Sony රැහැන් රහිත හෙඩ්ෆෝන්",
            "name_ta": "Sony வயர்லெஸ் ஹெட்ஃபோன்கள்",
            "category_id": "cat1",
            "brand": "Sony",
            "cost_price": 85.00,
            "price_normal": 149.99,
            "price_wholesale": 129.99,
            "price_credit": 154.99,
            "tax_rate": 8.25,
            "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
            "unit": "pcs",
            "stock_quantity": 25,
            "reorder_point": 10,
            "has_batch": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        
        # Groceries
        {
            "_id": "prod4",
            "sku": "GRO001",
            "barcode": "1234567890126",
            "name_en": "Basmati Rice",
            "name_si": "බාස්මතී සහල්",
            "name_ta": "பாஸ்மதி அரிசி",
            "category_id": "cat2",
            "brand": "Premium",
            "cost_price": 3.50,
            "price_normal": 5.99,
            "price_wholesale": 5.49,
            "price_credit": 6.19,
            "tax_rate": 0.00,
            "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
            "unit": "kg",
            "stock_quantity": 150,
            "reorder_point": 50,
            "has_batch": True,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": "prod5",
            "sku": "GRO002",
            "barcode": "1234567890127",
            "name_en": "Organic Bananas",
            "name_si": "කාබනික කෙසෙල්",
            "name_ta": "கரிம வாழைப்பழங்கள்",
            "category_id": "cat2",
            "brand": "Fresh Farm",
            "cost_price": 0.80,
            "price_normal": 1.49,
            "price_wholesale": 1.29,
            "price_credit": 1.59,
            "tax_rate": 0.00,
            "image_url": "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
            "unit": "kg",
            "stock_quantity": 45,
            "reorder_point": 20,
            "has_batch": True,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        
        # Beverages
        {
            "_id": "prod6",
            "sku": "BEV001",
            "barcode": "1234567890128",
            "name_en": "Coca Cola",
            "name_si": "කෝකා කෝලා",
            "name_ta": "கோகா கோலா",
            "category_id": "cat3",
            "brand": "Coca Cola",
            "cost_price": 0.80,
            "price_normal": 1.99,
            "price_wholesale": 1.79,
            "price_credit": 2.09,
            "tax_rate": 5.00,
            "image_url": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400",
            "unit": "pcs",
            "stock_quantity": 120,
            "reorder_point": 50,
            "has_batch": True,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": "prod7",
            "sku": "BEV002",
            "barcode": "1234567890129",
            "name_en": "Orange Juice",
            "name_si": "දොඩම් ජුස්",
            "name_ta": "ஆரஞ்சு ஜூஸ்",
            "category_id": "cat3",
            "brand": "Fresh Juice",
            "cost_price": 1.50,
            "price_normal": 3.49,
            "price_wholesale": 3.19,
            "price_credit": 3.69,
            "tax_rate": 0.00,
            "image_url": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400",
            "unit": "L",
            "stock_quantity": 35,
            "reorder_point": 15,
            "has_batch": True,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        
        # Low stock items for testing
        {
            "_id": "prod8",
            "sku": "ELE004",
            "barcode": "1234567890130",
            "name_en": "Bluetooth Speaker",
            "name_si": "බ්ලුටූත් ස්පීකර්",
            "name_ta": "புளூடூத் ஸ்பீக்கர்",
            "category_id": "cat1",
            "brand": "JBL",
            "cost_price": 35.00,
            "price_normal": 79.99,
            "price_wholesale": 69.99,
            "price_credit": 84.99,
            "tax_rate": 8.25,
            "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",
            "unit": "pcs",
            "stock_quantity": 2,  # Low stock
            "reorder_point": 10,
            "has_batch": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": "prod9",
            "sku": "GRO003",
            "barcode": "1234567890131",
            "name_en": "Milk",
            "name_si": "කිරි",
            "name_ta": "பால்",
            "category_id": "cat2",
            "brand": "Fresh Dairy",
            "cost_price": 1.20,
            "price_normal": 2.99,
            "price_wholesale": 2.79,
            "price_credit": 3.19,
            "tax_rate": 0.00,
            "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
            "unit": "L",
            "stock_quantity": 0,  # Out of stock
            "reorder_point": 20,
            "has_batch": True,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "_id": "prod10",
            "sku": "CLO001",
            "barcode": "1234567890132",
            "name_en": "Cotton T-Shirt",
            "name_si": "කපු ටී ෂර්ට්",
            "name_ta": "காட்டன் டி-ஷர்ட்",
            "category_id": "cat4",
            "brand": "Comfort Wear",
            "cost_price": 8.00,
            "price_normal": 19.99,
            "price_wholesale": 17.99,
            "price_credit": 21.99,
            "tax_rate": 6.50,
            "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
            "unit": "pcs",
            "stock_quantity": 30,
            "reorder_point": 15,
            "has_batch": False,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    await db.products.insert_many(products)
    print("✓ Created sample products")
    
    # Create sample customers
    customers = [
        {
            "_id": "cust1",
            "name": "John Smith",
            "phone": "+1-555-0101",
            "email": "john.smith@email.com",
            "type": "Normal",
            "preferred_language": "en",
            "credit_limit": 0.0,
            "current_balance": 0.0,
            "loyalty_points": 125,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "cust2",
            "name": "ABC Electronics Store",
            "phone": "+1-555-0102",
            "email": "orders@abcelectronics.com",
            "type": "Wholesale",
            "preferred_language": "en",
            "credit_limit": 0.0,
            "current_balance": 0.0,
            "loyalty_points": 580,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "cust3",
            "name": "කුමාර පෙරේරා",
            "phone": "+94-77-1234567",
            "email": "kumar.p@email.com",
            "type": "Credit",
            "preferred_language": "si",
            "credit_limit": 1000.0,
            "current_balance": 150.75,
            "loyalty_points": 89,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "cust4",
            "name": "முருகன் சுப்ரமணியன்",
            "phone": "+94-75-9876543",
            "email": "murugan.s@email.com",
            "type": "Normal",
            "preferred_language": "ta",
            "credit_limit": 0.0,
            "current_balance": 0.0,
            "loyalty_points": 42,
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": "cust5",
            "name": "SuperMart Wholesale",
            "phone": "+1-555-0199",
            "email": "procurement@supermart.com",
            "type": "Wholesale",
            "preferred_language": "en",
            "credit_limit": 0.0,
            "current_balance": 0.0,
            "loyalty_points": 1250,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.customers.insert_many(customers)
    print("✓ Created sample customers")
    
    # Create sample discounts
    discounts = [
        {
            "_id": "disc1",
            "name": "Bulk Electronics Discount",
            "type": "quantity",
            "value": 10.0,  # 10% off
            "min_quantity": 5,
            "applicable_products": ["prod1", "prod2", "prod3", "prod8"],
            "customer_types": ["Normal", "Wholesale", "Credit"],
            "is_active": True,
            "start_date": datetime.utcnow(),
            "end_date": None
        },
        {
            "_id": "disc2",
            "name": "Wholesale Customer Discount",
            "type": "percentage",
            "value": 15.0,  # 15% off
            "min_quantity": None,
            "applicable_products": [],  # Applies to all products
            "customer_types": ["Wholesale"],
            "is_active": True,
            "start_date": datetime.utcnow(),
            "end_date": None
        },
        {
            "_id": "disc3",
            "name": "Buy 10+ Beverages Get 5% Off",
            "type": "quantity",
            "value": 5.0,
            "min_quantity": 10,
            "applicable_products": ["prod6", "prod7"],
            "customer_types": ["Normal", "Wholesale", "Credit"],
            "is_active": True,
            "start_date": datetime.utcnow(),
            "end_date": None
        }
    ]
    
    await db.discounts.insert_many(discounts)
    print("✓ Created sample discounts")
    
    print("\n🎉 Sample data creation completed!")
    print("\n📋 Login credentials:")
    print("👑 Admin: username=admin, password=admin123")
    print("💰 Cashier: username=cashier, password=cashier123")
    print("📊 Manager: username=manager, password=manager123")
    
    print("\n📦 Sample data includes:")
    print(f"• {len(users)} users with different roles")
    print(f"• {len(categories)} product categories")
    print(f"• {len(products)} products with multi-language names")
    print(f"• {len(customers)} customers with different types")
    print(f"• {len(discounts)} discount rules")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_sample_data())