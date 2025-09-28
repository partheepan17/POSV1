import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Package, 
  AlertTriangle, 
  Calendar, 
  Trash2, 
  Plus, 
  BarChart3,
  FileDown,
  FileUp,
  Search
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdvancedInventory = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('batches');
  const [showWastageModal, setShowWastageModal] = useState(false);

  const { data: batches = [], isLoading: batchesLoading } = useQuery(
    ['batches'],
    () => axios.get('/batches').then(res => res.data)
  );

  const { data: expiryAlerts = [] } = useQuery(
    ['expiry-alerts'],
    () => axios.get('/batches/expiry-alerts?days=30').then(res => res.data)
  );

  const { data: wastageRecords = [] } = useQuery(
    ['wastage'],
    () => axios.get('/wastage').then(res => res.data)
  );

  const tabs = [
    { id: 'batches', name: 'Batch Tracking', icon: Package },
    { id: 'expiry', name: 'Expiry Alerts', icon: AlertTriangle },
    { id: 'wastage', name: 'Wastage Management', icon: Trash2 },
    { id: 'analytics', name: 'Inventory Analytics', icon: BarChart3 }
  ];

  const getDaysToExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryColor = (daysToExpiry) => {
    if (daysToExpiry < 0) return 'text-red-600 bg-red-100';
    if (daysToExpiry <= 7) return 'text-orange-600 bg-orange-100';
    if (daysToExpiry <= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="space-y-6" data-testid="advanced-inventory-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Inventory</h1>
        <div className="flex space-x-2">
          <button className="btn btn-secondary" data-testid="import-inventory">
            <FileUp className="w-4 h-4 mr-2" />
            Import
          </button>
          <button className="btn btn-secondary" data-testid="export-inventory">
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </button>
          <button 
            onClick={() => setShowWastageModal(true)}
            className="btn btn-primary"
            data-testid="record-wastage"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Wastage
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Batch Tracking Tab */}
      {activeTab === 'batches' && (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Batch Tracking</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search batches..."
                    className="input pl-10 pr-4 py-2"
                    data-testid="batch-search"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" data-testid="batches-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manufacture Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {batches.map((batch) => {
                  const daysToExpiry = batch.expiry_date ? getDaysToExpiry(batch.expiry_date) : null;
                  
                  return (
                    <tr key={batch.id} className="hover:bg-gray-50" data-testid={`batch-row-${batch.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Product ID: {batch.product_id}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{batch.batch_number}</span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {batch.manufacture_date ? new Date(batch.manufacture_date).toLocaleDateString() : '-'}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : '-'}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {batch.current_quantity}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {daysToExpiry !== null && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExpiryColor(daysToExpiry)}`}>
                            {daysToExpiry < 0 ? 'Expired' : 
                             daysToExpiry <= 7 ? 'Expires Soon' :
                             daysToExpiry <= 30 ? 'Near Expiry' : 'Good'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expiry Alerts Tab */}
      {activeTab === 'expiry' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="flex items-center">
                <div className="bg-red-500 p-2 rounded-full mr-3">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expired Items</p>
                  <p className="text-2xl font-bold text-red-600">
                    {expiryAlerts.filter(alert => getDaysToExpiry(alert.expiry_date) < 0).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center">
                <div className="bg-orange-500 p-2 rounded-full mr-3">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiring This Week</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {expiryAlerts.filter(alert => {
                      const days = getDaysToExpiry(alert.expiry_date);
                      return days >= 0 && days <= 7;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center">
                <div className="bg-yellow-500 p-2 rounded-full mr-3">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiring This Month</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {expiryAlerts.filter(alert => {
                      const days = getDaysToExpiry(alert.expiry_date);
                      return days > 7 && days <= 30;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Expiry Alerts (Next 30 Days)</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" data-testid="expiry-alerts-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days to Expiry
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expiryAlerts.map((alert, index) => {
                    const daysToExpiry = getDaysToExpiry(alert.expiry_date);
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50" data-testid={`expiry-alert-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {alert.product_name}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {alert.batch_number}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(alert.expiry_date).toLocaleDateString()}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExpiryColor(daysToExpiry)}`}>
                            {daysToExpiry < 0 ? `Expired ${Math.abs(daysToExpiry)} days ago` : `${daysToExpiry} days`}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {alert.current_quantity}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-orange-600 hover:text-orange-900 mr-3">
                            Mark Down
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            Record Wastage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {expiryAlerts.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No expiry alerts</h3>
                  <p className="text-gray-500">All products are within safe expiry dates</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wastage Management Tab */}
      {activeTab === 'wastage' && (
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Wastage Records</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" data-testid="wastage-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost Impact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorded By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wastageRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50" data-testid={`wastage-record-${record.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Product ID: {record.product_id}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {record.quantity}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {record.reason}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      ${record.cost_impact.toFixed(2)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.recorded_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center">
                <div className="bg-blue-500 p-2 rounded-full mr-3">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center">
                <div className="bg-green-500 p-2 rounded-full mr-3">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Inventory Value</p>
                  <p className="text-2xl font-bold text-gray-900">$45,230</p>
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center">
                <div className="bg-yellow-500 p-2 rounded-full mr-3">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Low Stock Items</p>
                  <p className="text-2xl font-bold text-yellow-600">12</p>
                </div>
              </div>
            </div>
            
            <div className="card p-4">
              <div className="flex items-center">
                <div className="bg-red-500 p-2 rounded-full mr-3">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Wastage</p>
                  <p className="text-2xl font-bold text-red-600">$1,245</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Trends</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Analytics charts will be implemented with Chart.js</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wastage Recording Modal */}
      {showWastageModal && (
        <WastageModal
          onClose={() => setShowWastageModal(false)}
          onSave={() => {
            queryClient.invalidateQueries(['wastage']);
            setShowWastageModal(false);
          }}
        />
      )}
    </div>
  );
};

// Wastage Recording Modal
const WastageModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    batch_id: '',
    quantity: 0,
    reason: 'expired',
    cost_impact: 0,
    notes: ''
  });

  const mutation = useMutation(
    (data) => axios.post('/wastage', data),
    {
      onSuccess: () => {
        toast.success('Wastage recorded successfully');
        onSave();
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to record wastage');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="wastage-modal">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Record Wastage</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product ID *
            </label>
            <input
              type="text"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              className="input w-full"
              required
              data-testid="wastage-product-id"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input w-full"
                required
                data-testid="wastage-quantity"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Impact
              </label>
              <input
                type="number"
                name="cost_impact"
                value={formData.cost_impact}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input w-full"
                data-testid="wastage-cost"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason *
            </label>
            <select
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="input w-full"
              required
              data-testid="wastage-reason"
            >
              <option value="expired">Expired</option>
              <option value="damaged">Damaged</option>
              <option value="theft">Theft</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="input w-full"
              data-testid="wastage-notes"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              data-testid="cancel-wastage"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="btn btn-primary"
              data-testid="save-wastage"
            >
              {mutation.isLoading ? 'Recording...' : 'Record Wastage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvancedInventory;