import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { branchService } from '../../services/branchService';
import { UserRole } from '../../types/auth';
import { Branch } from '../../types/branch';
import { Button } from '../../components/common/Button';
import { User, Mail, Lock, Building, Store, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('CAFE_OWNER');
  const [tenantName, setTenantName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    branchService
      .getPublicBranches()
      .then((branches) => {
        if (Array.isArray(branches)) {
          setAvailableBranches(branches);
          if (branches.length > 0) {
            setBranchId(branches[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn('Public branches load notice:', err);
        setAvailableBranches([]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await authService.register({
        email,
        password,
        full_name: fullName,
        role,
        tenant_name: role === 'CAFE_OWNER' ? tenantName : undefined,
        branch_id: role === 'BRANCH_STAFF' ? branchId : undefined,
      });

      setSuccess('Account registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-stone-900">Create Account</h2>
        <p className="text-xs text-stone-500 mt-1">Register a new café enterprise or user account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@cafe.com"
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1 uppercase tracking-wider">
            Account Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white transition-all font-medium"
          >
            <option value="CAFE_OWNER">Café Owner (Creates Enterprise Tenant)</option>
            <option value="BRANCH_STAFF">Branch Staff (Kitchen / Cashier / Barista)</option>
            <option value="CUSTOMER">Customer Account</option>
            <option value="SUPER_ADMIN">Platform Super Admin</option>
          </select>
        </div>

        {role === 'CAFE_OWNER' && (
          <div className="animate-fade-in">
            <label className="block text-xs font-bold text-amber-800 mb-1 uppercase tracking-wider">
              Café Enterprise Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-amber-600 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Brewly Franchise Group"
                className="w-full pl-10 pr-4 py-2 bg-amber-50/50 border border-amber-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-semibold"
              />
            </div>
          </div>
        )}

        {role === 'BRANCH_STAFF' && (
          <div className="animate-fade-in">
            <label className="block text-xs font-bold text-blue-800 mb-1 uppercase tracking-wider">
              Assigned Physical Branch
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-blue-600 absolute left-3.5 top-3" />
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-blue-50/50 border border-blue-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
              >
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
                {availableBranches.length === 0 && (
                  <option value="">No branches created yet</option>
                )}
              </select>
            </div>
          </div>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full mt-3">
          Register Account
        </Button>
      </form>

      <div className="mt-5 pt-3 border-t border-stone-100 text-center">
        <p className="text-xs text-stone-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-amber-700 hover:underline">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
};
