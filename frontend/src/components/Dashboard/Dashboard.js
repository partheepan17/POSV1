import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign,
  AlertCircle,
  Calendar,
  BarChart3
} from 'lucide-react';

const Dashboard = () => {
  const { t } = useTranslation();

  // Mock data - in real app, this would come from API
  const stats = {
    todaySales: 15420.50,
    todayTransactions: 87,
    lowStockItems: 12,
    totalCustomers: 456,
    thisMonthSales: 234567.89,
    lastMonthSales: 198765.43
  };

  const salesGrowth = ((stats.thisMonthSales - stats.lastMonthSales) / stats.lastMonthSales * 100).toFixed(1);

  const cards = [
    {
      title: "Today's Sales",
      value: `$${stats.todaySales.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500",
      change: "+12.5%",
      changeColor: "text-green-600"
    },
    {
      title: "Transactions",
      value: stats.todayTransactions.toString(),
      icon: ShoppingCart,
      color: "bg-blue-500",
      change: "+8.2%",
      changeColor: "text-green-600"
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems.toString(),
      icon: AlertCircle,
      color: "bg-red-500",
      change: "-3 items",
      changeColor: "text-red-600"
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(),
      icon: Users,
      color: "bg-purple-500",
      change: "+15 new",
      changeColor: "text-green-600"
    }
  ];

  const recentSales = [
    { id: 1, customer: "John Doe", amount: 45.99, time: "10:30 AM", items: 3 },
    { id: 2, customer: "Jane Smith", amount: 123.50, time: "10:25 AM", items: 7 },
    { id: 3, customer: "Walk-in Customer", amount: 67.25, time: "10:15 AM", items: 4 },
    { id: 4, customer: "ABC Company", amount: 890.00, time: "09:45 AM", items: 15 },
    { id: 5, customer: "Mary Johnson", amount: 234.75, time: "09:30 AM", items: 9 }
  ];

  const lowStockProducts = [
    { id: 1, name: "Samsung Galaxy S21", stock: 2, threshold: 10 },
    { id: 2, name: "Apple iPhone 13", stock: 1, threshold: 5 },
    { id: 3, name: "Sony Headphones", stock: 3, threshold: 15 },
    { id: 4, name: "Dell Laptop", stock: 0, threshold: 5 },
    { id: 5, name: "HP Printer", stock: 1, threshold: 8 }
  ];

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard')}</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="card p-6" data-testid={`stats-card-${index}`}>
              <div className="flex items-center">
                <div className={`${card.color} p-3 rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className={`text-xs ${card.changeColor} flex items-center mt-1`}>
                    <span>{card.change}</span>
                    <span className="ml-1">vs yesterday</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Sales Chart */}
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Monthly Sales Overview</h3>
          </div>
          <div className="card-content">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Sales Chart Placeholder</p>
                <p className="text-sm text-gray-400">Chart will be implemented with a charting library</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <div>
                <p className="text-gray-500">This Month</p>
                <p className="font-semibold">${stats.thisMonthSales.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Month</p>
                <p className="font-semibold">${stats.lastMonthSales.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Growth</p>
                <p className={`font-semibold ${salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {salesGrowth >= 0 ? '+' : ''}{salesGrowth}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Low Stock Alert</h3>
          </div>
          <div className="card-content">
            <div className="space-y-3" data-testid="low-stock-list">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Threshold: {product.threshold}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.stock === 0 
                        ? 'bg-red-100 text-red-800' 
                        : product.stock <= 3 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.stock} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Sales</h3>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" data-testid="recent-sales-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sale.customer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${sale.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.items}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sale.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;