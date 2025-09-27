import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Common
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      loading: 'Loading...',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      tax: 'Tax',
      quantity: 'Quantity',
      price: 'Price',
      amount: 'Amount',
      
      // Navigation
      dashboard: 'Dashboard',
      pos: 'Point of Sale',
      products: 'Products',
      customers: 'Customers',
      sales: 'Sales',
      inventory: 'Inventory',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout',
      
      // POS
      checkout: 'Checkout',
      addToCart: 'Add to Cart',
      cart: 'Cart',
      payment: 'Payment',
      cash: 'Cash',
      card: 'Card',
      paymentMethod: 'Payment Method',
      receivedAmount: 'Received Amount',
      changeAmount: 'Change Amount',
      completeSale: 'Complete Sale',
      printReceipt: 'Print Receipt',
      newSale: 'New Sale',
      scanBarcode: 'Scan Barcode',
      
      // Products
      productName: 'Product Name',
      barcode: 'Barcode',
      category: 'Category',
      brand: 'Brand',
      costPrice: 'Cost Price',
      sellPrice: 'Sell Price',
      stock: 'Stock',
      addProduct: 'Add Product',
      editProduct: 'Edit Product',
      
      // Customers
      customerName: 'Customer Name',
      phone: 'Phone',
      email: 'Email',
      customerType: 'Customer Type',
      normal: 'Normal',
      wholesale: 'Wholesale',
      credit: 'Credit',
      addCustomer: 'Add Customer',
      selectCustomer: 'Select Customer',
      
      // Receipt
      receipt: 'Receipt',
      date: 'Date',
      time: 'Time',
      cashier: 'Cashier',
      customer: 'Customer',
      items: 'Items',
      thankyou: 'Thank you for your business!',
      
      // Auth
      login: 'Login',
      username: 'Username',
      password: 'Password',
      welcome: 'Welcome to POS System',
      
      // Messages
      saleCompleted: 'Sale completed successfully',
      productAdded: 'Product added to cart',
      productNotFound: 'Product not found',
      insufficientStock: 'Insufficient stock',
      invalidBarcode: 'Invalid barcode',
    }
  },
  si: {
    translation: {
      // Common
      save: 'සුරකින්න',
      cancel: 'අවලංගු කරන්න',
      delete: 'මකන්න',
      edit: 'සංස්කරණය',
      add: 'එකතු කරන්න',
      search: 'සොයන්න',
      loading: 'පූරණය වෙමින්...',
      total: 'මුළු එකතුව',
      subtotal: 'උප එකතුව',
      discount: 'වට්ටම',
      tax: 'බදු',
      quantity: 'ප්‍රමාණය',
      price: 'මිල',
      amount: 'මුදල',
      
      // Navigation
      dashboard: 'මුල් පිටුව',
      pos: 'විකුණුම් ස්ථානය',
      products: 'නිෂ්පාදන',
      customers: 'ගනුදෙනුකරුවන්',
      sales: 'විකුණුම්',
      inventory: 'ඉන්වෙන්ටරිය',
      reports: 'වාර්තා',
      settings: 'සැකසුම්',
      logout: 'පිටවීම',
      
      // POS
      checkout: 'ගෙවීම',
      addToCart: 'කරත්තයට එකතු කරන්න',
      cart: 'කරත්තය',
      payment: 'ගෙවීම',
      cash: 'මුදල්',
      card: 'කාඩ්පත',
      paymentMethod: 'ගෙවීම් ක්‍රමය',
      receivedAmount: 'ලැබුණු මුදල',
      changeAmount: 'ඉතිරි මුදල',
      completeSale: 'විකුණුම සම්පූර්ණ කරන්න',
      printReceipt: 'රිසිට් එක මුද්‍රණය කරන්න',
      newSale: 'නව විකුණුමක්',
      scanBarcode: 'බාර්කෝඩ් ස්කෑන් කරන්න',
      
      // Products
      productName: 'නිෂ්පාදන නම',
      barcode: 'බාර්කෝඩ්',
      category: 'වර්ගය',
      brand: 'වෙළඳ නාමය',
      costPrice: 'පිරිවැය මිල',
      sellPrice: 'විකුණුම් මිල',
      stock: 'ගබඩාව',
      addProduct: 'නිෂ්පාදන එකතු කරන්න',
      editProduct: 'නිෂ්පාදන සංස්කරණය',
      
      // Customers
      customerName: 'ගනුදෙනුකරු නම',
      phone: 'දුරකථන අංකය',
      email: 'ඊමේල්',
      customerType: 'ගනුදෙනුකරු වර්ගය',
      normal: 'සාමාන්‍ය',
      wholesale: 'තොග',
      credit: 'ණය',
      addCustomer: 'ගනුදෙනුකරු එකතු කරන්න',
      selectCustomer: 'ගනුදෙනුකරු තෝරන්න',
      
      // Receipt
      receipt: 'රිසිට් එක',
      date: 'දිනය',
      time: 'වේලාව',
      cashier: 'අයකැමි',
      customer: 'ගනුදෙනුකරු',
      items: 'අයිතම',
      thankyou: 'ඔබගේ ගනුදෙනුවට ස්තූතියි!',
      
      // Auth
      login: 'ඇතුළු වීම',
      username: 'පරිශීලක නම',
      password: 'මුර පදය',
      welcome: 'POS පද්ධතියට සාදරයෙන් පිළිගනිමු',
      
      // Messages
      saleCompleted: 'විකුණුම සාර්ථකව සම්පූර්ණ විය',
      productAdded: 'නිෂ්පාදන කරත්තයට එකතු කරන ලදී',
      productNotFound: 'නිෂ්පාදන හමු නොවීය',
      insufficientStock: 'ප්‍රමාණවත් ගබඩාවක් නොමැත',
      invalidBarcode: 'වලංගු නොවන බාර්කෝඩ්',
    }
  },
  ta: {
    translation: {
      // Common
      save: 'சேமி',
      cancel: 'ரத்து செய்',
      delete: 'நீக்கு',
      edit: 'திருத்து',
      add: 'சேர்',
      search: 'தேடு',
      loading: 'ஏற்றுகிறது...',
      total: 'மொத்தம்',
      subtotal: 'துணை மொத்தம்',
      discount: 'தள்ளுபடி',
      tax: 'வரி',
      quantity: 'அளவு',
      price: 'விலை',
      amount: 'தொகை',
      
      // Navigation
      dashboard: 'முகப்பு',
      pos: 'விற்பனை புள்ளி',
      products: 'பொருட்கள்',
      customers: 'வாடிக்கையாளர்கள்',
      sales: 'விற்பனை',
      inventory: 'சரக்கு',
      reports: 'அறிக்கைகள்',
      settings: 'அமைப்புகள்',
      logout: 'வெளியேறு',
      
      // POS
      checkout: 'பணம் செலுத்து',
      addToCart: 'கார்டில் சேர்',
      cart: 'கார்ட்',
      payment: 'பணம்',
      cash: 'பணம்',
      card: 'அட்டை',
      paymentMethod: 'பணம் செலுத்தும் முறை',
      receivedAmount: 'பெற்ற தொகை',
      changeAmount: 'மாற்றுத் தொகை',
      completeSale: 'விற்பனை முடிக்க',
      printReceipt: 'ரசீது அச்சிடு',
      newSale: 'புதிய விற்பனை',
      scanBarcode: 'பார்கோடு ஸ்கேன்',
      
      // Products
      productName: 'பொருள் பெயர்',
      barcode: 'பார்கோட்',
      category: 'வகை',
      brand: 'பிராண்ட்',
      costPrice: 'விலை',
      sellPrice: 'விற்பனை விலை',
      stock: 'சரக்கு',
      addProduct: 'பொருள் சேர்',
      editProduct: 'பொருள் திருத்து',
      
      // Customers
      customerName: 'வாடிக்கையாளர் பெயர்',
      phone: 'தொலைபேசி',
      email: 'மின்னஞ்சல்',
      customerType: 'வாடிக்கையாளர் வகை',
      normal: 'சாதாரண',
      wholesale: 'மொத்த விற்பனை',
      credit: 'கடன்',
      addCustomer: 'வாடிக்கையாளர் சேர்',
      selectCustomer: 'வாடிக்கையாளர் தேர்வு',
      
      // Receipt
      receipt: 'ரசீது',
      date: 'தேதி',
      time: 'நேரம்',
      cashier: 'பணியாளர்',
      customer: 'வாடிக்கையாளர்',
      items: 'பொருட்கள்',
      thankyou: 'உங்கள் வணிகத்திற்கு நன்றி!',
      
      // Auth
      login: 'உள்நுழை',
      username: 'பயனர் பெயர்',
      password: 'கடவுச்சொல்',
      welcome: 'POS அமைப்புக்கு வரவேற்கிறோம்',
      
      // Messages
      saleCompleted: 'விற்பனை வெற்றிகரமாக முடிந்தது',
      productAdded: 'பொருள் கார்ட்டில் சேர்க்கப்பட்டது',
      productNotFound: 'பொருள் கிடைக்கவில்லை',
      insufficientStock: 'போதுமான சரக்கு இல்லை',
      invalidBarcode: 'தவறான பார்கோட்',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: 'en',
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;