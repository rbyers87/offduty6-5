import React, { useState } from 'react';
    import { useNavigate, useParams } from 'react-router-dom';
    import { supabase } from '../lib/supabase';
    import { User } from '../types';
    import toast from 'react-hot-toast';
    import { Loader2 } from 'lucide-react';

    export function UserForm() {
      const { id } = useParams<{ id: string }>();
      const [isLoading, setIsLoading] = useState(false);
      const [isEditing, setIsEditing] = useState(false);
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [fullName, setFullName] = useState('');
      const [role, setRole] = useState<'admin' | 'employee'>('employee');
      const [badgeNumber, setBadgeNumber] = useState('');
      const navigate = useNavigate();

      React.useEffect(() => {
        if (id) {
          setIsEditing(true);
          loadUser(id);
        }
      }, [id]);

      const loadUser = async (id: string) => {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, email, role, full_name, badge_number')
            .eq('id', id)
            .single();

          if (error) throw error;
          if (data) {
            setEmail(data.email);
            setFullName(data.full_name);
            setRole(data.role);
            setBadgeNumber(data.badge_number || '');
          }
        } catch (error: any) {
          toast.error(error.message);
          navigate('/users');
        } finally {
          setIsLoading(false);
        }
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
          if (isEditing) {
            const { error } = await supabase
              .from('profiles')
              .update({
                full_name: fullName,
                role,
                badge_number: badgeNumber,
              })
              .eq('id', id);

            if (error) throw error;
            toast.success('User updated successfully');
          } else {
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
            });
            if (error) throw error;

            // Create profile immediately after signup
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: data.user?.id,
                  full_name: fullName,
                  role,
                  badge_number: badgeNumber,
                  email: email,
                },
              ]);

            if (profileError) throw profileError;
            toast.success('User created successfully');
          }
          navigate('/users');
        } catch (error: any) {
          toast.error(error.message);
        } finally {
          setIsLoading(false);
        }
      };

      if (isLoading) {
        return (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        );
      }

      return (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">
            {isEditing ? 'Edit User' : 'Create New User'}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                disabled={isEditing}
              />
            </div>
            {!isEditing && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'employee')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label htmlFor="badgeNumber" className="block text-sm font-medium text-gray-700">
                Badge Number
              </label>
              <input
                type="text"
                id="badgeNumber"
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : isEditing ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      );
    }
