import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Search, 
  FileText, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Purchasing = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('purchase-orders');
  const [showCreatePO, setShowCreatePO] = useState(false);

  const { data: purchaseOrders = [], isLoading } = useQuery(
    ['purchase-orders'],
    () => axios.get('/purchase-orders').then(res => res.data)
  );

  const { data: suppliers = [] } = useQuery(
    ['suppliers'],
    () => axios.get('/suppliers').then(res => res.data)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-yellow-100 text-yellow-800';
      case 'partially_received': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return Clock;
      case 'sent': return FileText;
      case 'confirmed': return CheckCircle;
      case 'partially_received': return Package;
      case 'completed': return CheckCircle;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  const tabs = [
    { id: 'purchase-orders', name: 'Purchase Orders', icon: FileText },
    { id: 'receiving', name: 'Goods Receipt', icon: Package },
    { id: 'grn-history', name: 'GRN History', icon: Truck }
  ];

  return (
    <div className="space-y-6" data-testid="purchasing-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Purchasing</h1>
        <button
          onClick={() => setShowCreatePO(true)}
          className="btn btn-primary"
          data-testid="create-po-button"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Purchase Order
        </button>
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

      {/* Tab Content */}
      {activeTab === 'purchase-orders' && (
        <div className="space-y-4">
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Purchase Orders</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" data-testid="po-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PO Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expected Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrders.map((po) => {
                    const StatusIcon = getStatusIcon(po.status);
                    const supplier = suppliers.find(s => s.id === po.supplier_id);
                    
                    return (
                      <tr key={po.id} className="hover:bg-gray-50" data-testid={`po-row-${po.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="font-medium text-gray-900">{po.po_number}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {supplier?.name || 'Unknown Supplier'}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(po.order_date).toLocaleDateString()}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '-'}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          ${po.total_amount.toFixed(2)}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(po.status)}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {po.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-primary-600 hover:text-primary-900" data-testid={`view-po-${po.id}`}>
                              View
                            </button>
                            {(po.status === 'confirmed' || po.status === 'partially_received') && (
                              <button className="text-green-600 hover:text-green-900" data-testid={`receive-po-${po.id}`}>
                                Receive
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {purchaseOrders.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders found</h3>
                  <p className="text-gray-500">Create your first purchase order to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'receiving' && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Goods Receiving</h3>
              <p className="text-gray-500">Receive goods from confirmed purchase orders</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'grn-history' && (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">GRN History</h3>
              <p className="text-gray-500">View history of goods received notes</p>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showCreatePO && (
        <CreatePOModal
          suppliers={suppliers}
          onClose={() => setShowCreatePO(false)}
          onSave={() => {
            queryClient.invalidateQueries(['purchase-orders']);
            setShowCreatePO(false);
          }}
        />
      )}
    </div>
  );
};

// Create PO Modal Component
const CreatePOModal = ({ suppliers, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_date: '',
    items: [],
    notes: ''
  });

  const mutation = useMutation(
    (data) => axios.post('/purchase-orders', data),
    {
      onSuccess: () => {
        toast.success('Purchase order created successfully');
        onSave();
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to create purchase order');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate totals
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    const tax_amount = subtotal * 0.1; // 10% tax
    const total_amount = subtotal + tax_amount;

    mutation.mutate({
      ...formData,
      subtotal,
      tax_amount,
      total_amount
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="create-po-modal">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-90vh overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create Purchase Order</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                className="input w-full"
                required
                data-testid="po-supplier"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Date *
              </label>
              <input
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                className="input w-full"
                required
                data-testid="po-order-date"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Date
              </label>
              <input
                type="date"
                value={formData.expected_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_date: e.target.value }))}
                className="input w-full"
                data-testid="po-expected-date"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows="3"
              className="input w-full"
              data-testid="po-notes"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Items</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-500 text-center">Item selection will be implemented in the next iteration</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              data-testid="cancel-po"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading || !formData.supplier_id}
              className="btn btn-primary"
              data-testid="save-po"
            >
              {mutation.isLoading ? 'Creating...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Purchasing;