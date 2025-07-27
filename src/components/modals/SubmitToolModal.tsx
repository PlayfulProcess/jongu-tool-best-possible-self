'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';

interface SubmitToolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubmitToolModal({ isOpen, onClose }: SubmitToolModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    claude_url: '',
    category: '',
    description: '',
    creator_name: '',
    creator_link: '',
    creator_background: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const supabase = createClient();

  const categories = [
    { value: 'mindfulness', label: '🧘 Mindfulness & Creativity' },
    { value: 'distress-tolerance', label: '🛡️ Distress Tolerance' },
    { value: 'emotion-regulation', label: '❤️ Emotion Regulation' },
    { value: 'interpersonal-effectiveness', label: '🤝 Interpersonal Effectiveness' }
  ];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.claude_url.trim()) newErrors.claude_url = 'Claude URL is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.creator_name.trim()) newErrors.creator_name = 'Creator name is required';
    
    // Basic URL validation (allow any URL, not just Claude.ai)
    if (formData.claude_url && !formData.claude_url.startsWith('http')) {
      newErrors.claude_url = 'Please provide a valid URL starting with http:// or https://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(fileName);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      let thumbnailUrl = '';
      
      // Upload thumbnail if provided
      if (thumbnailFile) {
        const uploadedUrl = await handleImageUpload(thumbnailFile);
        if (uploadedUrl) {
          thumbnailUrl = uploadedUrl;
        }
      }
      
      // Submit tool
      const response = await fetch('/api/community/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          thumbnail_url: thumbnailUrl
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit tool');
      }
      
      // Reset form and close modal
      setFormData({
        title: '',
        claude_url: '',
        category: '',
        description: '',
        creator_name: '',
        creator_link: '',
        creator_background: ''
      });
      setThumbnailFile(null);
      setErrors({});
      
      alert('🎉 Tool submitted successfully! We\'ll review it and add it to the community garden soon.');
      onClose();
      
    } catch (error) {
      console.error('Error submitting tool:', error);
      alert('❌ Failed to submit tool. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Share a Tool</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mindful Breathing Exercise"
              />
              {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Tool URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tool URL *
              </label>
              <input
                type="url"
                value={formData.claude_url}
                onChange={(e) => setFormData({ ...formData, claude_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://your-tool-url.com"
              />
              {errors.claude_url && <p className="text-red-600 text-sm mt-1">{errors.claude_url}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what your tool does and how it helps people..."
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Creator Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Creator Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.creator_name}
                  onChange={(e) => setFormData({ ...formData, creator_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name or professional title"
                />
                {errors.creator_name && <p className="text-red-600 text-sm mt-1">{errors.creator_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Website/Link (optional)
                </label>
                <input
                  type="url"
                  value={formData.creator_link}
                  onChange={(e) => setFormData({ ...formData, creator_link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Background (optional)
                </label>
                <textarea
                  value={formData.creator_background}
                  onChange={(e) => setFormData({ ...formData, creator_background: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of your expertise or background..."
                />
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thumbnail Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload an image to represent your tool (PNG, JPG, or GIF). Recommended size: 400x300px or 4:3 aspect ratio for best display.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? '⏳ Submitting...' : '🌱 Submit Tool'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}