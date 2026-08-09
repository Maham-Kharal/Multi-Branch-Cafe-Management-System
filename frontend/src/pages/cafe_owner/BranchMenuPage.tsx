import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { branchService } from '../../services/branchService';
import { menuService } from '../../services/menuService';
import { Branch } from '../../types/branch';
import { BranchMenuItem, MasterMenuItem } from '../../types/menu';
import { Plus, Store, Trash2, AlertCircle } from 'lucide-react';

export const BranchMenuPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branchMenuItems, setBranchMenuItems] = useState<BranchMenuItem[]>([]);
  const [masterItems, setMasterItems] = useState<MasterMenuItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuLoading, setIsMenuLoading] = useState(false);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemSource, setItemSource] = useState<'MASTER' | 'CUSTOM'>('MASTER');
  const [selectedMasterItemId, setSelectedMasterItemId] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Hot Coffee');
  const [priceOverride, setPriceOverride] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const [bData, mData] = await Promise.all([
          branchService.getBranches(),
          menuService.getMasterMenu(),
        ]);
        setBranches(bData);
        setMasterItems(mData);
        if (bData.length > 0) {
          setSelectedBranchId(bData[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);

  const fetchBranchMenu = async (branchId: string) => {
    if (!branchId) return;
    setIsMenuLoading(true);
    try {
      const data = await menuService.getBranchMenu(branchId);
      setBranchMenuItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsMenuLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBranchId) {
      fetchBranchMenu(selectedBranchId);
    }
  }, [selectedBranchId]);

  const handleToggleStock = async (item: BranchMenuItem) => {
    try {
      await menuService.updateBranchMenuItem(item.id, {
        is_available: !item.is_available,
      });
      fetchBranchMenu(selectedBranchId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBranchItem = async (itemId: string) => {
    if (!confirm('Remove this item from the branch menu?')) return;
    try {
      await menuService.deleteBranchMenuItem(itemId);
      fetchBranchMenu(selectedBranchId);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to remove branch item.');
    }
  };

  const handleAddItemToBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (itemSource === 'MASTER') {
        const masterItem = masterItems.find((m) => m.id === selectedMasterItemId);
        if (!masterItem) {
          throw new Error('Please select a master catalog item.');
        }

        await menuService.addBranchMenuItem({
          branch_id: selectedBranchId,
          master_menu_item_id: masterItem.id,
          name: masterItem.name,
          category: masterItem.category,
          price_override: priceOverride ? parseFloat(priceOverride) : undefined,
        });
      } else {
        if (!customName.trim()) {
          throw new Error('Please enter a name for the custom branch item.');
        }

        await menuService.addBranchMenuItem({
          branch_id: selectedBranchId,
          name: customName.trim(),
          category: customCategory,
          price_override: priceOverride ? parseFloat(priceOverride) : 4.0,
        });
      }

      setIsAddModalOpen(false);
      setSelectedMasterItemId('');
      setCustomName('');
      setPriceOverride('');
      fetchBranchMenu(selectedBranchId);
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || err.message || 'Failed to add item to branch menu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Location-Based Branch Pricing</h1>
          <p className="text-xs text-stone-500 mt-1">
            Assign catalog items to specific branches and configure custom location price overrides.
          </p>
        </div>
        {selectedBranchId && (
          <Button onClick={() => setIsAddModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            Add Item to Branch
          </Button>
        )}
      </div>

      {/* Branch Selector Cards */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80">
        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
          Select Physical Branch
        </label>
        {isLoading ? (
          <div className="text-xs text-stone-400">Loading branches...</div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                  selectedBranchId === b.id
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>{b.name}</span>
                <span className="opacity-60">({b.city})</span>
              </button>
            ))}

            {branches.length === 0 && (
              <p className="text-xs text-stone-400">No branches available. Please create a branch first.</p>
            )}
          </div>
        )}
      </div>

      {/* Branch Items List */}
      {isMenuLoading ? (
        <div className="py-12 text-center text-xs text-stone-400">Loading branch items...</div>
      ) : (
        <Card title="Active Branch Menu & Pricing Configuration">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 uppercase tracking-wider bg-stone-50/50">
                  <th className="py-3 px-4 font-bold">Item Name</th>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Effective Price</th>
                  <th className="py-3 px-4 font-bold">Price Override</th>
                  <th className="py-3 px-4 font-bold">Stock Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                {branchMenuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-stone-900">{item.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="amber">{item.category}</Badge>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-stone-900">
                      ${(item.effective_price || item.price_override || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {item.price_override !== null && item.price_override !== undefined ? (
                        <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          ${item.price_override.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">Inherited Base</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={item.is_available ? 'emerald' : 'rose'}>
                        {item.is_available ? 'In Stock' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant={item.is_available ? 'outline' : 'primary'}
                          onClick={() => handleToggleStock(item)}
                        >
                          {item.is_available ? 'Disable' : 'Enable Stock'}
                        </Button>
                        <button
                          onClick={() => handleDeleteBranchItem(item.id)}
                          title="Remove from branch menu"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {branchMenuItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      No menu items assigned to this branch yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Menu Item to Branch"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleAddItemToBranch} className="space-y-4">
          <div className="flex items-center gap-4 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setItemSource('MASTER')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                itemSource === 'MASTER' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              From Master Catalog
            </button>
            <button
              type="button"
              onClick={() => setItemSource('CUSTOM')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                itemSource === 'CUSTOM' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              Direct Branch Custom Item
            </button>
          </div>

          {itemSource === 'MASTER' ? (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                Select Master Catalog Item
              </label>
              <select
                required
                value={selectedMasterItemId}
                onChange={(e) => setSelectedMasterItemId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="">-- Choose Item from Master Catalog --</option>
                {masterItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.category}) - Base Price: ${m.base_price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Special Chicken Noodle Soup"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
                  Category
                </label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Soup & Snacks"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-amber-900 mb-1 uppercase tracking-wider">
              {itemSource === 'MASTER' ? 'Price Override ($) (Optional)' : 'Price ($)'}
            </label>
            <input
              type="number"
              step="0.01"
              required={itemSource === 'CUSTOM'}
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
              placeholder={itemSource === 'MASTER' ? 'e.g. 5.25 (Leave empty to inherit base price)' : '4.50'}
              className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-stone-900"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Assign to Branch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
