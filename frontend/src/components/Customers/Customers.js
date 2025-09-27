import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Search, User, Phone, Mail } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Customers = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const { data: customers = [], isLoading } = useQuery(
    ['customers'],
    () => axios.get('/api/customers').then(res => res.data)
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCustomerTypeColor = (type) => {
    switch (type) {
      case 'Wholesale': return 'bg-blue-100 text-blue-800';
      case 'Credit': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6" data-testid="customers-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('customers')}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          data-testid="add-customer-button"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('addCustomer')}
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('search') + ' customers...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
            data-testid="customer-search"
          />
        </div>
      </div>

      {/* Customers List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner w-8 h-8"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="card p-6" data-testid={`customer-card-${customer.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    <span className={`badge ${getCustomerTypeColor(customer.type)}`}>
                      {customer.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditingCustomer(customer)}
                  className="text-gray-400 hover:text-gray-600"
                  data-testid={`edit-customer-${customer.id}`}
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {customer.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    {customer.phone}
                  </div>
                )}
                
                {customer.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {customer.email}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-gray-500">Language:</span>
                  <span className="font-medium">
                    {customer.preferred_language === 'si' ? 'සිංහල' : 
                     customer.preferred_language === 'ta' ? 'தமிழ்' : 'English'}
                  </span>
                </div>
                
                {customer.type === 'Credit' && (
                  <div className="space-y-1 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Credit Limit:</span>
                      <span className="font-medium">${customer.credit_limit.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Current Balance:</span>
                      <span className={`font-medium ${customer.current_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${customer.current_balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-gray-500">Loyalty Points:</span>
                  <span className="font-medium text-primary-600">{customer.loyalty_points}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {(showAddModal || editingCustomer) && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setShowAddModal(false);
            setEditingCustomer(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries(['customers']);
            setShowAddModal(false);
            setEditingCustomer(null);
          }}
          t={t}
        />
      )}
    </div>
  );
};

// Customer Modal Component
const CustomerModal = ({ customer, onClose, onSave, t }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    type: customer?.type || 'Normal',
    preferred_language: customer?.preferred_language || 'en',
    credit_limit: customer?.credit_limit || 0,
    loyalty_points: customer?.loyalty_points || 0
  });

  const mutation = useMutation(
    (data) => customer 
      ? axios.put(`/api/customers/${customer.id}`, data)
      : axios.post('/api/customers', data),
    {
      onSuccess: () => {
        toast.success(customer ? 'Customer updated successfully' : 'Customer created successfully');
        onSave();
      },
      onError: (error) => {
        toast.error(error.response?.data?.detail || 'Failed to save customer');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="customer-modal">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">
          {customer ? 'Edit Customer' : t('addCustomer')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('customerName')} *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input w-full"
              required
              data-testid="customer-name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('phone')}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input w-full"
                data-testid="customer-phone"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('email')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input w-full"
                data-testid="customer-email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('customerType')}
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input w-full"
                data-testid="customer-type"
              >
                <option value="Normal">{t('normal')}</option>
                <option value="Wholesale">{t('wholesale')}</option>
                <option value="Credit">{t('credit')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Language
              </label>
              <select
                name="preferred_language"
                value={formData.preferred_language}
                onChange={handleChange}
                className="input w-full"
                data-testid="customer-language"
              >
                <option value="en">English</option>
                <option value="si">සිංහල</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>
          </div>

          {formData.type === 'Credit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit Limit
              </label>
              <input
                type="number"
                name="credit_limit"
                value={formData.credit_limit}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="input w-full"
                data-testid="customer-credit-limit"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              data-testid="cancel-customer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="btn btn-primary"
              data-testid="save-customer"
            >
              {mutation.isLoading ? 'Saving...' : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Customers;