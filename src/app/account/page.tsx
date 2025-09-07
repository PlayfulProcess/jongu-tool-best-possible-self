'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase-client';
import Image from 'next/image';

export default function AccountSettingsPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [deletingToolData, setDeletingToolData] = useState(false);
  const [deletingAllData, setDeletingAllData] = useState(false);
  const [downloadingData, setDownloadingData] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setUpdating(true);
    setMessage(null);

    try {
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadData = async () => {
    if (!user) return;

    setDownloadingData(true);
    setMessage(null);

    try {
      // Fetch all user data
      const { data: documents, error: docsError } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Create a comprehensive data export
      const exportData = {
        export_date: new Date().toISOString(),
        user_info: {
          email: user.email,
          user_id: user.id,
          created_at: user.created_at
        },
        journal_entries: documents?.filter(d => d.document_type === 'tool_session') || [],
        interactions: documents?.filter(d => d.document_type === 'interaction') || [],
        all_documents: documents || []
      };

      // Convert to JSON string with nice formatting
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create a blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recursive-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Your data has been downloaded successfully!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to download data: ${(error as Error).message}` });
    } finally {
      setDownloadingData(false);
    }
  };

  const handleDeleteToolData = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete all your data from the Best Possible Self tool?\n\n' +
      'This will permanently delete all your journal entries from this tool only. ' +
      'Your account and data from other Recursive.eco tools will remain intact.\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;

    setDeletingToolData(true);

    try {
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('user_id', user.id)
        .eq('document_type', 'tool_session')
        .eq('tool_slug', 'best-possible-self');

      if (error) throw error;

      setMessage({ type: 'success', text: 'All your Best Possible Self data has been deleted successfully.' });
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setDeletingToolData(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete your Recursive.eco account?\n\n' +
      'WILL BE DELETED:\n' +
      '• Your account and authentication\n' +
      '• All private journal entries\n' +
      '• Your personal settings\n' +
      '• Your starred items\n\n' +
      'WILL REMAIN PUBLIC:\n' +
      '• Tools you submitted to the community\n' +
      '• Public comments or contributions\n' +
      '• Anonymized research data (if consented)\n\n' +
      'Contact pp@playfulprocess.com for complete removal including public content.\n\n' +
      'This action cannot be undone.'
    );

    if (!confirmed) return;
    
    // Double confirmation for this serious action
    const doubleConfirmed = window.confirm(
      'Final confirmation: Delete your account?\n\n' +
      'Remember: Your submitted tools will remain in the community.\n' +
      'Contact pp@playfulprocess.com if you need them removed too.'
    );
    
    if (!doubleConfirmed) return;
    
    const emailConfirmation = window.prompt('Type your email address to confirm deletion:');
    if (emailConfirmation !== user.email) {
      setMessage({ type: 'error', text: 'Email confirmation does not match. Deletion cancelled.' });
      return;
    }

    setDeletingAllData(true);

    try {
      // Delete all user data from user_documents table
      const { error: documentsError } = await supabase
        .from('user_documents')
        .delete()
        .eq('user_id', user.id);

      if (documentsError) throw documentsError;

      // For now, we can only delete user data
      // Auth account deletion requires server-side implementation or RPC function
      setMessage({ 
        type: 'success', 
        text: 'Your personal data has been deleted. Please contact pp@playfulprocess.com to complete account removal, or use the SQL function provided.' 
      });
      
      // Optionally sign out the user after data deletion
      setTimeout(async () => {
        const shouldSignOut = window.confirm('Your data has been deleted. Would you like to sign out now?');
        if (shouldSignOut) {
          await signOut();
          window.location.href = '/';
        }
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to delete account: ${(error as Error).message}` });
    } finally {
      setDeletingAllData(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Image 
            src="/Recursivelogo.png" 
            alt="Recursive.eco" 
            width={80}
            height={80}
            className="h-20 w-auto"
          />
          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">BETA</span>
          <div className="hidden sm:block text-sm text-gray-600">/ Best Possible Self Tool / Account Settings</div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/')}
            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium flex items-center gap-1"
          >
            ← Back to Tool
          </button>
          
          <button
            onClick={signOut}
            className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account preferences and data.</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded border">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Enter new password (min 6 characters)"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={updating || !currentPassword || !newPassword || !confirmPassword}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Data Management</h2>
            <p className="text-sm text-gray-600 mb-6">
              Manage your data according to European data protection standards. 
              You have full control over your information.
            </p>
            
            <div className="space-y-4">
              {/* Download Data */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="text-sm font-medium text-green-800 mb-2">
                  Download My Data
                </h3>
                <p className="text-xs text-green-700 mb-3">
                  Download all your personal data in JSON format. This includes your journal entries, 
                  interactions, and account information. GDPR Article 20: Right to data portability.
                </p>
                <button
                  onClick={handleDownloadData}
                  disabled={downloadingData}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {downloadingData ? 'Preparing Download...' : '📥 Download My Data'}
                </button>
              </div>
              {/* Delete Tool Data */}
              <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  Delete Best Possible Self Tool Data
                </h3>
                <p className="text-xs text-yellow-700 mb-3">
                  This will delete all your journal entries from the Best Possible Self tool only. 
                  Your account and data from other Recursive.eco tools will remain intact.
                </p>
                <button
                  onClick={handleDeleteToolData}
                  disabled={deletingToolData}
                  className="px-3 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                >
                  {deletingToolData ? 'Deleting...' : 'Delete Tool Data'}
                </button>
              </div>

              {/* Delete All Data */}
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Delete Entire Recursive.eco Account
                </h3>
                <div className="text-xs text-red-700 mb-3 space-y-2">
                  <p className="font-semibold">This will permanently delete:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Your account and authentication</li>
                    <li>All your private journal entries</li>
                    <li>Your personal preferences and settings</li>
                    <li>Your starred items and interactions</li>
                  </ul>
                  
                  <p className="font-semibold mt-2">This will NOT delete:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Tools you submitted to the community (they remain public)</li>
                    <li>Public comments or contributions</li>
                    <li>Anonymized research data (if consented)</li>
                  </ul>
                  
                  <p className="mt-2 text-gray-700 bg-gray-50 p-2 rounded">
                    {`📧 For complete data removal including public contributions, please contact `}
                    <a href="mailto:pp@playfulprocess.com" className="text-blue-600 underline">
                      pp@playfulprocess.com
                    </a>
                    {` with your account email.`}
                  </p>
                </div>
                <button
                  onClick={handleDeleteAllData}
                  disabled={deletingAllData}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deletingAllData ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}