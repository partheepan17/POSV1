from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import os
import uuid
from passlib.context import CryptContext
from jose import JWTError, jwt
import asyncio
from bson import ObjectId
import json

# Initialize FastAPI
app = FastAPI(title="POS System API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "pos_system")

# MongoDB client
client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]

# JWT and Auth setup
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

# Pydantic Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    id: Optional[str] = None
    username: str
    email: str
    full_name: str
    role: str  # Admin, Manager, Cashier, Stock, Accountant
    is_active: bool = True
    store_id: Optional[str] = None
    permissions: List[str] = []

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str
    store_id: Optional[str] = None

class Product(BaseModel):
    id: Optional[str] = None
    sku: str
    barcode: str
    name_en: str
    name_si: Optional[str] = None
    name_ta: Optional[str] = None
    category_id: str
    brand: Optional[str] = None
    cost_price: float
    price_normal: float
    price_wholesale: float
    price_credit: float
    tax_rate: float = 0.0
    image_url: Optional[str] = None
    unit: str = "pcs"  # pcs, kg, L, etc.
    stock_quantity: int = 0
    reorder_point: int = 10
    has_batch: bool = False
    is_active: bool = True
    created_at: datetime = None
    updated_at: datetime = None

class Customer(BaseModel):
    id: Optional[str] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    type: str = "Normal"  # Normal, Wholesale, Credit
    preferred_language: str = "en"  # en, si, ta
    credit_limit: float = 0.0
    current_balance: float = 0.0
    loyalty_points: int = 0
    is_active: bool = True
    created_at: datetime = None

class CartItem(BaseModel):
    product_id: str
    quantity: float
    unit_price: float
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    total_amount: float

class Sale(BaseModel):
    id: Optional[str] = None
    sale_number: str
    customer_id: Optional[str] = None
    cashier_id: str
    store_id: str
    items: List[CartItem]
    subtotal: float
    discount_total: float
    tax_total: float
    total_amount: float
    payment_method: str
    payment_status: str = "completed"
    created_at: datetime = None

class Category(BaseModel):
    id: Optional[str] = None
    name_en: str
    name_si: Optional[str] = None
    name_ta: Optional[str] = None
    is_active: bool = True

class Discount(BaseModel):
    id: Optional[str] = None
    name: str
    type: str  # percentage, fixed, quantity, bogo
    value: float
    min_quantity: Optional[int] = None
    applicable_products: List[str] = []
    customer_types: List[str] = ["Normal", "Wholesale", "Credit"]
    is_active: bool = True
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

# Auth functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(username: str):
    user_data = await db.users.find_one({"username": username})
    if user_data:
        user_data["id"] = str(user_data["_id"])
        del user_data["_id"]
        return UserInDB(**user_data)

async def authenticate_user(username: str, password: str):
    user = await get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = await get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# API Routes

@app.get("/")
async def root():
    return {"message": "POS System API", "version": "1.0.0"}

# Auth endpoints
@app.post("/api/auth/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/register")
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    del user_dict["password"]
    user_dict["hashed_password"] = hashed_password
    user_dict["created_at"] = datetime.utcnow()
    
    result = await db.users.insert_one(user_dict)
    return {"message": "User created successfully", "user_id": str(result.inserted_id)}

@app.get("/api/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# Product endpoints
@app.get("/api/products")
async def get_products(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user)):
    cursor = db.products.find({"is_active": True}).skip(skip).limit(limit)
    products = []
    async for product in cursor:
        product["id"] = str(product["_id"])
        del product["_id"]
        products.append(product)
    return products

@app.get("/api/products/{product_id}")
async def get_product(product_id: str, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["id"] = str(product["_id"])
    del product["_id"]
    return product

@app.get("/api/products/barcode/{barcode}")
async def get_product_by_barcode(barcode: str, current_user: User = Depends(get_current_user)):
    product = await db.products.find_one({"barcode": barcode, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["id"] = str(product["_id"])
    del product["_id"]
    return product

@app.get("/api/products/search/{query}")
async def search_products(query: str, current_user: User = Depends(get_current_user)):
    # Search by name, sku, or barcode
    search_filter = {
        "$and": [
            {"is_active": True},
            {
                "$or": [
                    {"name_en": {"$regex": query, "$options": "i"}},
                    {"name_si": {"$regex": query, "$options": "i"}},
                    {"name_ta": {"$regex": query, "$options": "i"}},
                    {"sku": {"$regex": query, "$options": "i"}},
                    {"barcode": {"$regex": query, "$options": "i"}}
                ]
            }
        ]
    }
    cursor = db.products.find(search_filter).limit(20)
    products = []
    async for product in cursor:
        product["id"] = str(product["_id"])
        del product["_id"]
        products.append(product)
    return products

@app.post("/api/products")
async def create_product(product: Product, current_user: User = Depends(get_current_user)):
    product_dict = product.dict()
    if product_dict.get("id"):
        del product_dict["id"]
    product_dict["created_at"] = datetime.utcnow()
    product_dict["updated_at"] = datetime.utcnow()
    
    result = await db.products.insert_one(product_dict)
    return {"message": "Product created successfully", "product_id": str(result.inserted_id)}

@app.put("/api/products/{product_id}")
async def update_product(product_id: str, product: Product, current_user: User = Depends(get_current_user)):
    product_dict = product.dict()
    if "id" in product_dict:
        del product_dict["id"]
    product_dict["updated_at"] = datetime.utcnow()
    
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": product_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated successfully"}

# Customer endpoints
@app.get("/api/customers")
async def get_customers(current_user: User = Depends(get_current_user)):
    cursor = db.customers.find({"is_active": True})
    customers = []
    async for customer in cursor:
        customer["id"] = str(customer["_id"])
        del customer["_id"]
        customers.append(customer)
    return customers

@app.post("/api/customers")
async def create_customer(customer: Customer, current_user: User = Depends(get_current_user)):
    customer_dict = customer.dict()
    if customer_dict.get("id"):
        del customer_dict["id"]
    customer_dict["created_at"] = datetime.utcnow()
    
    result = await db.customers.insert_one(customer_dict)
    return {"message": "Customer created successfully", "customer_id": str(result.inserted_id)}

@app.get("/api/customers/search/{query}")
async def search_customers(query: str, current_user: User = Depends(get_current_user)):
    search_filter = {
        "$and": [
            {"is_active": True},
            {
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"phone": {"$regex": query, "$options": "i"}},
                    {"email": {"$regex": query, "$options": "i"}}
                ]
            }
        ]
    }
    cursor = db.customers.find(search_filter).limit(20)
    customers = []
    async for customer in cursor:
        customer["id"] = str(customer["_id"])
        del customer["_id"]
        customers.append(customer)
    return customers

# Categories endpoints
@app.get("/api/categories")
async def get_categories(current_user: User = Depends(get_current_user)):
    cursor = db.categories.find({"is_active": True})
    categories = []
    async for category in cursor:
        category["id"] = str(category["_id"])
        del category["_id"]
        categories.append(category)
    return categories

@app.post("/api/categories")
async def create_category(category: Category, current_user: User = Depends(get_current_user)):
    category_dict = category.dict()
    if category_dict.get("id"):
        del category_dict["id"]
    
    result = await db.categories.insert_one(category_dict)
    return {"message": "Category created successfully", "category_id": str(result.inserted_id)}

# Sales endpoints
@app.post("/api/sales")
async def create_sale(sale: Sale, current_user: User = Depends(get_current_user)):
    sale_dict = sale.dict()
    if sale_dict.get("id"):
        del sale_dict["id"]
    sale_dict["created_at"] = datetime.utcnow()
    sale_dict["cashier_id"] = current_user.id
    sale_dict["store_id"] = current_user.store_id or "main"
    
    # Generate sale number
    count = await db.sales.count_documents({})
    sale_dict["sale_number"] = f"POS{count + 1:06d}"
    
    result = await db.sales.insert_one(sale_dict)
    
    # Update inventory
    for item in sale.items:
        await db.products.update_one(
            {"_id": ObjectId(item.product_id)},
            {"$inc": {"stock_quantity": -item.quantity}}
        )
    
    return {"message": "Sale completed successfully", "sale_id": str(result.inserted_id), "sale_number": sale_dict["sale_number"]}

@app.get("/api/sales")
async def get_sales(skip: int = 0, limit: int = 50, current_user: User = Depends(get_current_user)):
    cursor = db.sales.find().sort("created_at", -1).skip(skip).limit(limit)
    sales = []
    async for sale in cursor:
        sale["id"] = str(sale["_id"])
        del sale["_id"]
        sales.append(sale)
    return sales

# Discounts endpoints
@app.get("/api/discounts")
async def get_discounts(current_user: User = Depends(get_current_user)):
    cursor = db.discounts.find({"is_active": True})
    discounts = []
    async for discount in cursor:
        discount["id"] = str(discount["_id"])
        del discount["_id"]
        discounts.append(discount)
    return discounts

@app.post("/api/discounts")
async def create_discount(discount: Discount, current_user: User = Depends(get_current_user)):
    discount_dict = discount.dict()
    if discount_dict.get("id"):
        del discount_dict["id"]
    
    result = await db.discounts.insert_one(discount_dict)
    return {"message": "Discount created successfully", "discount_id": str(result.inserted_id)}

# Price calculation endpoint
@app.post("/api/calculate-price")
async def calculate_price(data: dict, current_user: User = Depends(get_current_user)):
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)
    customer_type = data.get("customer_type", "Normal")
    
    # Get product
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get base price based on customer type
    if customer_type == "Wholesale":
        base_price = product["price_wholesale"]
    elif customer_type == "Credit":
        base_price = product["price_credit"]
    else:
        base_price = product["price_normal"]
    
    # Calculate discounts
    applicable_discounts = []
    cursor = db.discounts.find({
        "is_active": True,
        "customer_types": {"$in": [customer_type]},
        "$or": [
            {"applicable_products": []},
            {"applicable_products": {"$in": [product_id]}}
        ]
    })
    
    async for discount in cursor:
        if discount["type"] == "quantity" and quantity >= discount.get("min_quantity", 0):
            applicable_discounts.append(discount)
        elif discount["type"] in ["percentage", "fixed"]:
            applicable_discounts.append(discount)
    
    # Apply best discount
    best_discount = 0
    discount_info = None
    
    for discount in applicable_discounts:
        if discount["type"] == "percentage":
            discount_amount = base_price * quantity * (discount["value"] / 100)
        elif discount["type"] == "fixed":
            discount_amount = discount["value"] * quantity
        elif discount["type"] == "quantity":
            discount_amount = base_price * quantity * (discount["value"] / 100)
        
        if discount_amount > best_discount:
            best_discount = discount_amount
            discount_info = discount
    
    # Calculate final amounts
    subtotal = base_price * quantity
    discount_amount = best_discount
    tax_amount = (subtotal - discount_amount) * (product["tax_rate"] / 100)
    total = subtotal - discount_amount + tax_amount
    
    return {
        "base_price": base_price,
        "quantity": quantity,
        "subtotal": subtotal,
        "discount_amount": discount_amount,
        "tax_amount": tax_amount,
        "total": total,
        "discount_info": discount_info
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)