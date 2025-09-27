import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings as SettingsIcon, Store, Users, Bell, Globe } from 'lucide-react';

const Settings = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-testid="settings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t('settings')}</h1>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Settings */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Store className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Store Settings</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Configure your store information, tax rates, and business details.
          </p>
          <button className="btn btn-primary">
            Configure Store
          </button>
        </div>

        {/* User Management */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Manage user accounts, roles, and permissions for your POS system.
          </p>
          <button className="btn btn-primary">
            Manage Users
          </button>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Bell className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Set up alerts for low stock, sales targets, and system notifications.
          </p>
          <button className="btn btn-primary">
            Configure Alerts
          </button>
        </div>

        {/* Language & Localization */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Globe className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Language & Localization</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Configure multi-language support and regional settings.
          </p>
          <button className="btn btn-primary">
            Language Settings
          </button>
        </div>
      </div>

      {/* Coming Soon Message */}
      <div className="card p-8 text-center bg-gray-50">
        <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Settings</h3>
        <p className="text-gray-600">
          More configuration options will be available in future updates, including:
        </p>
        <ul className="mt-4 text-sm text-gray-500 space-y-1">
          <li>• Payment gateway configuration</li>
          <li>• Receipt templates and printing options</li>
          <li>• Backup and data export settings</li>
          <li>• Integration with external services</li>
          <li>• Hardware device configuration</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;