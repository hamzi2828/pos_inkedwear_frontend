'use client';

import { useState, useEffect } from 'react';
import { SettingsData, TaxType } from '../services/settingsService';
import { Receipt, Plus, Pencil, Trash2, Check, X, Percent } from 'lucide-react';

interface TaxSettingsProps {
  settings: SettingsData;
  onUpdate: (data: Partial<SettingsData>) => Promise<void>;
  isLoading: boolean;
}

const defaultTax: TaxType = {
  name: '',
  rate: 0,
  description: '',
  isActive: true,
  isDefault: false,
};

export default function TaxSettings({ settings, onUpdate, isLoading }: TaxSettingsProps) {
  const [taxes, setTaxes] = useState<TaxType[]>(settings.taxes || []);
  const [editingTax, setEditingTax] = useState<TaxType | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newTax, setNewTax] = useState<TaxType>(defaultTax);

  useEffect(() => {
    setTaxes(settings.taxes || []);
  }, [settings.taxes]);

  const handleAddTax = async () => {
    if (!newTax.name.trim()) {
      alert('Please enter a tax name');
      return;
    }

    const taxToAdd: TaxType = {
      ...newTax,
      taxId: `tax-${Date.now()}`,
    };

    // If this is set as default, unset other defaults
    let updatedTaxes = [...taxes];
    if (taxToAdd.isDefault) {
      updatedTaxes = updatedTaxes.map(t => ({ ...t, isDefault: false }));
    }

    updatedTaxes.push(taxToAdd);

    await onUpdate({ taxes: updatedTaxes });
    setTaxes(updatedTaxes);
    setNewTax(defaultTax);
    setIsAdding(false);
  };

  const handleUpdateTax = async () => {
    if (!editingTax || !editingTax.name.trim()) {
      alert('Please enter a tax name');
      return;
    }

    let updatedTaxes = taxes.map(t => {
      if (t.taxId === editingTax.taxId) {
        return editingTax;
      }
      // If editing tax is set as default, unset others
      if (editingTax.isDefault && t.taxId !== editingTax.taxId) {
        return { ...t, isDefault: false };
      }
      return t;
    });

    await onUpdate({ taxes: updatedTaxes });
    setTaxes(updatedTaxes);
    setEditingTax(null);
  };

  const handleDeleteTax = async (taxId: string) => {
    if (!confirm('Are you sure you want to delete this tax?')) return;

    const updatedTaxes = taxes.filter(t => t.taxId !== taxId);
    await onUpdate({ taxes: updatedTaxes });
    setTaxes(updatedTaxes);
  };

  const handleToggleActive = async (taxId: string) => {
    const updatedTaxes = taxes.map(t =>
      t.taxId === taxId ? { ...t, isActive: !t.isActive } : t
    );
    await onUpdate({ taxes: updatedTaxes });
    setTaxes(updatedTaxes);
  };

  const handleSetDefault = async (taxId: string) => {
    const updatedTaxes = taxes.map(t => ({
      ...t,
      isDefault: t.taxId === taxId,
    }));
    await onUpdate({ taxes: updatedTaxes });
    setTaxes(updatedTaxes);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Tax Configuration</h3>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Tax
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Configure tax types for your POS system. You can create multiple taxes and set one as default.
        </p>
      </div>

      {/* Add New Tax Form */}
      {isAdding && (
        <div className="bg-white rounded-lg border p-6">
          <h4 className="text-md font-semibold mb-4">Add New Tax</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Name *
              </label>
              <input
                type="text"
                value={newTax.name}
                onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Sales Tax, VAT, GST"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Percent className="h-4 w-4 inline mr-1" />
                Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={newTax.rate}
                onChange={(e) => setNewTax({ ...newTax, rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., 8"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newTax.description}
                onChange={(e) => setNewTax({ ...newTax, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Brief description of this tax"
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTax.isActive}
                  onChange={(e) => setNewTax({ ...newTax, isActive: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTax.isDefault}
                  onChange={(e) => setNewTax({ ...newTax, isDefault: e.target.checked })}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Set as Default</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddTax}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Save Tax
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewTax(defaultTax);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tax List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            {taxes.length} Tax{taxes.length !== 1 ? 'es' : ''} Configured
          </span>
        </div>

        {taxes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No taxes configured yet</p>
            <p className="text-sm">Click "Add Tax" to create your first tax type</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {taxes.map((tax) => (
              <div
                key={tax.taxId}
                className={`p-4 ${!tax.isActive ? 'bg-gray-50 opacity-60' : ''}`}
              >
                {editingTax && editingTax.taxId === tax.taxId ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tax Name *
                        </label>
                        <input
                          type="text"
                          value={editingTax.name}
                          onChange={(e) => setEditingTax({ ...editingTax, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={editingTax.rate}
                          onChange={(e) => setEditingTax({ ...editingTax, rate: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={editingTax.description || ''}
                          onChange={(e) => setEditingTax({ ...editingTax, description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingTax.isActive}
                            onChange={(e) => setEditingTax({ ...editingTax, isActive: e.target.checked })}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingTax.isDefault}
                            onChange={(e) => setEditingTax({ ...editingTax, isDefault: e.target.checked })}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Default</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateTax}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTax(null)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{tax.name}</span>
                          {tax.isDefault && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              Default
                            </span>
                          )}
                          {!tax.isActive && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        {tax.description && (
                          <p className="text-sm text-gray-500 mt-0.5">{tax.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-900">
                        {tax.rate}%
                      </span>
                      <div className="flex items-center gap-1">
                        {!tax.isDefault && tax.isActive && (
                          <button
                            onClick={() => handleSetDefault(tax.taxId!)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Set as Default"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleActive(tax.taxId!)}
                          className={`p-2 rounded-lg transition-colors ${
                            tax.isActive
                              ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                              : 'text-orange-600 hover:bg-orange-50'
                          }`}
                          title={tax.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {tax.isActive ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingTax(tax)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTax(tax.taxId!)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-1">How Taxes Work</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• The <strong>default tax</strong> is automatically applied to new POS sales</li>
          <li>• You can have multiple active taxes for different scenarios</li>
          <li>• Inactive taxes won&apos;t appear in the POS tax selection</li>
          <li>• Tax rate is stored as a percentage (e.g., 8 means 8%)</li>
        </ul>
      </div>
    </div>
  );
}
