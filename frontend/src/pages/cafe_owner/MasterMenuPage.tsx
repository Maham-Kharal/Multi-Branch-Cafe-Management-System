import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { menuService } from '../../services/menuService';
import { MasterMenuItem } from '../../types/menu';
import { UtensilsCrossed, Plus, Search, Edit, Trash2, AlertCircle, ToggleLeft, ToggleRight, X } from 'lucide-react';

const DEFAULT_CATEGORIES = ['ALL', 'Hot Coffee', 'Cold Brew', 'Bakery', 'Snacks', 'Desserts'];

export const MasterMenuPage: React.FC = () => {
  const [items, setItems] = useState<MasterMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Custom user-managed categories
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Add Item Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hot Coffee');
  const [basePrice, setBasePrice] = useState('');
  const [description, setDescription] = useState('');

  // Edit Item Modal State
  const [editingItem, setEditingItem] = useState<MasterMenuItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editBasePrice, setEditBasePrice] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMasterMenu = async () => {
    setIsLoading(true);
    try {
      const data = await menuService.getMasterMenu();
      setItems(data);

      // Merge backend item categories into categoriesList
      const fetchedCategories = data.map((i) => i.category);
      setCategoriesList((prev) => Array.from(new Set([...prev, ...fetchedCategories])));
    } catch (err) {
      console.error('Error loading master menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterMenu();
  }, []);

  const handleCreateMasterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await menuService.createMasterMenuItem({
        name,
        category,
        base_price: parseFloat(basePrice),
        description,
      });
      setIsModalOpen(false);
      setName('');
      setCategory('Hot Coffee');
      setBasePrice('');
      setDescription('');
      fetchMasterMenu();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to add master catalog item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: MasterMenuItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditBasePrice(item.base_price.toString());
    setEditDescription(item.description || '');
  };

  const handleUpdateMasterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      await menuService.updateMasterMenuItem(editingItem.id, {
        name: editName,
        category: editCategory,
        base_price: parseFloat(editBasePrice),
        description: editDescription,
      });
      setEditingItem(null);
      fetchMasterMenu();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to update catalog item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item: MasterMenuItem) => {
    try {
      await menuService.updateMasterMenuItem(item.id, {
        is_active: !item.is_active,
      });
      fetchMasterMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this master catalog item?')) return;
    try {
      await menuService.deleteMasterMenuItem(id);
      fetchMasterMenu();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to delete master item.');
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const cat = newCategoryName.trim();
    if (!categoriesList.includes(cat)) {
      setCategoriesList((prev) => [...prev, cat]);
    }
    setSelectedCategory(cat);
    setNewCategoryName('');
    setIsAddCategoryModalOpen(false);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (catToDelete === 'ALL') return;
    setCategoriesList((prev) => prev.filter((c) => c !== catToDelete));
    if (selectedCategory === catToDelete) {
      setSelectedCategory('ALL');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Master Menu Catalog</h1>
          <p className="text-xs text-stone-500 mt-1">
            Define global enterprise catalog items inherited by all physical branches.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Add Master Item
        </Button>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200/80">
        <div className="flex items-center gap-3 w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog by name..."
            className="bg-transparent text-sm w-full focus:outline-none text-stone-800 placeholder-stone-400"
          />
        </div>

        {/* Dynamic Functional Category Bar with + Add Button */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categoriesList.map((cat) => (
            <div key={cat} className="relative group flex items-center">
              <button
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-amber-500 text-stone-950 shadow-xs border border-amber-400'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70 border border-transparent'
                }`}
              >
                <span>{cat}</span>
              </button>
              {cat !== 'ALL' && (
                <button
                  onClick={() => handleDeleteCategory(cat)}
                  title="Delete category"
                  className="hidden group-hover:flex items-center justify-center p-0.5 ml-1 text-stone-400 hover:text-rose-600 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* Small + Add Category Button */}
          <button
            onClick={() => setIsAddCategoryModalOpen(true)}
            title="Add Custom Category"
            className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl transition-colors shrink-0 flex items-center gap-1 text-xs font-bold px-2.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Category</span>
          </button>
        </div>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-stone-400">Loading catalog items...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="amber">{item.category}</Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-stone-900 bg-amber-100/80 px-2.5 py-0.5 rounded-lg border border-amber-200">
                      ${item.base_price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      title={item.is_active ? 'Available (Click to Disable)' : 'Disabled (Click to Enable)'}
                      className="cursor-pointer"
                    >
                      {item.is_active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-stone-300" />
                      )}
                    </button>
                  </div>
                </div>
                <h3 className="text-base font-extrabold text-stone-900 tracking-tight mt-1">{item.name}</h3>
                <p className="text-xs text-stone-500 mt-1.5 line-clamp-2">
                  {item.description || 'No description provided for this catalog item.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 text-xs font-medium text-stone-400 flex items-center justify-between">
                <Badge variant={item.is_active ? 'emerald' : 'rose'}>
                  {item.is_active ? 'Available' : 'Not Available'}
                </Badge>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-stone-200">
              <UtensilsCrossed className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-700">No master menu items found</p>
              <p className="text-xs text-stone-400 mt-1">
                {selectedCategory !== 'ALL'
                  ? `No items match category "${selectedCategory}".`
                  : 'Add items to your enterprise catalog to populate branch menus.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Master Item Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Master Catalog Item">
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateMasterItem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Item Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Caramel Macchiato"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-medium"
            >
              {categoriesList.filter((c) => c !== 'ALL').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Base Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="4.50"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Freshly steamed milk with vanilla syrup, marked with espresso and caramel drizzle."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Add Catalog Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Master Catalog Item">
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateMasterItem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Item Name
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Category
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-medium"
            >
              {categoriesList.filter((c) => c !== 'ALL').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Base Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={editBasePrice}
              onChange={(e) => setEditBasePrice(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Custom Category Modal */}
      <Modal isOpen={isAddCategoryModalOpen} onClose={() => setIsAddCategoryModalOpen(false)} title="Add New Category">
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Category Name
            </label>
            <input
              type="text"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Smoothies & Juices"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-medium"
            />
          </div>
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setIsAddCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
