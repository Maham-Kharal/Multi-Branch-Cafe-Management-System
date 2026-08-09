import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { branchService } from '../../services/branchService';
import { Branch } from '../../types/branch';
import { Store, Plus, Search, MapPin, Phone, Edit, Trash2, AlertCircle } from 'lucide-react';

export const BranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  // Edit Modal state
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Delete State
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBranches = async () => {
    try {
      const data = await branchService.getBranches();
      setBranches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await branchService.createBranch({ name, address, city, phone });
      setIsAddModalOpen(false);
      setName('');
      setAddress('');
      setCity('');
      setPhone('');
      fetchBranches();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to create branch. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (b: Branch) => {
    setEditingBranch(b);
    setEditName(b.name);
    setEditAddress(b.address);
    setEditCity(b.city);
    setEditPhone(b.phone || '');
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      await branchService.updateBranch(editingBranch.id, {
        name: editName,
        address: editAddress,
        city: editCity,
        phone: editPhone,
      });
      setEditingBranch(null);
      fetchBranches();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Failed to update branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    try {
      await branchService.deleteBranch(id);
      setDeletingBranchId(null);
      fetchBranches();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to delete branch.');
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Branch Setup & Management</h1>
          <p className="text-xs text-stone-500 mt-1">Configure and manage physical café branches for your enterprise network.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Add New Branch
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-stone-200/80">
        <Search className="w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter branches by name, city, or address..."
          className="bg-transparent text-sm w-full focus:outline-none text-stone-800 placeholder-stone-400"
        />
      </div>

      {/* Branch Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-stone-400">Loading enterprise branches...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map((b) => (
            <Card key={b.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="amber">{b.city}</Badge>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={b.is_active ? 'emerald' : 'rose'}>
                      {b.is_active ? 'Active Branch' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-stone-900 tracking-tight">{b.name}</h3>
                <div className="mt-3 space-y-1.5 text-xs text-stone-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{b.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{b.phone || 'No contact phone provided'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md text-[10px] font-mono">
                  ID: {b.id.substring(0, 8)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(b)}
                    className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => setDeletingBranchId(b.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {filteredBranches.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-stone-200">
              <Store className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-700">No branches match your search</p>
              <p className="text-xs text-stone-400 mt-1">Try clearing your search query or add a new branch.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Branch Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Set Up New Physical Branch">
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateBranch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Branch Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown Mall Branch"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              City
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Lahore"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Street Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 45 Commercial Area, Block C"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 03001234567"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Branch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Branch Modal */}
      <Modal isOpen={!!editingBranch} onClose={() => setEditingBranch(null)} title="Edit Physical Branch">
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateBranch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Branch Name
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
              City
            </label>
            <input
              type="text"
              required
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Street Address
            </label>
            <input
              type="text"
              required
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
              Contact Phone
            </label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="e.g. 03001234567"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-semibold"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="outline" onClick={() => setEditingBranch(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingBranchId} onClose={() => setDeletingBranchId(null)} title="Delete Branch Confirmation">
        <div className="space-y-4">
          <p className="text-xs text-stone-600">
            Are you sure you want to delete this physical branch? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <Button variant="outline" onClick={() => setDeletingBranchId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => deletingBranchId && handleDeleteBranch(deletingBranchId)}>
              Delete Branch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
