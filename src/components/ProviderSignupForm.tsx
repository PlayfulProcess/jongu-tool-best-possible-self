'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';

export function ProviderSignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    providerType: '',
    toolComments: '',
    willingToCollaborate: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const providerTypes = [
    { value: 'mental_health', label: 'Mental Health Professional' },
    { value: 'spiritual_teacher', label: 'Spiritual Teacher' },
    { value: 'yoga_teacher', label: 'Yoga Instructor' },
    { value: 'nvc_mentor', label: 'NVC Mentor' },
    { value: 'coach', label: 'Life/Wellness Coach' },
    { value: 'other', label: 'Other Healing Practitioner' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error } = await supabase
        .from('provider_signups')
        .insert({
          name: formData.name,
          email: formData.email,
          provider_type: formData.providerType,
          tool_comments: formData.toolComments,
          willing_to_collaborate: formData.willingToCollaborate
        });

      if (error) throw error;

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🙏</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank You!</h3>
          <p className="text-gray-600 text-sm">
            We&apos;ve received your information and will be in touch soon to explore collaboration opportunities.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>

        <div>
          <label htmlFor="providerType" className="block text-sm font-medium text-gray-700 mb-1">
            Your Practice *
          </label>
          <select
            id="providerType"
            required
            value={formData.providerType}
            onChange={(e) => setFormData(prev => ({ ...prev, providerType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          >
            <option value="">Select your practice area</option>
            {providerTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="toolComments" className="block text-sm font-medium text-gray-700 mb-1">
            Tool Ideas or Experience
          </label>
          <textarea
            id="toolComments"
            rows={3}
            value={formData.toolComments}
            onChange={(e) => setFormData(prev => ({ ...prev, toolComments: e.target.value }))}
            placeholder="What tools or practices would you like to share? Any experience with wellness tool development?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="collaborate"
            checked={formData.willingToCollaborate}
            onChange={(e) => setFormData(prev => ({ ...prev, willingToCollaborate: e.target.checked }))}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="collaborate" className="ml-2 block text-sm text-gray-700">
            I&apos;m interested in collaborating on new tool development
          </label>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Join Our Community'}
        </button>
      </form>
    </div>
  );
}