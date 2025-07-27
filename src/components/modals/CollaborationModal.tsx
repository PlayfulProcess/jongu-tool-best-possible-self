'use client';

import { useState } from 'react';

interface CollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollaborationModal({ isOpen, onClose }: CollaborationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    expertise: '',
    collaboration_type: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const collaborationTypes = [
    { value: 'create-tools', label: '🛠️ Create Tools Together' },
    { value: 'research', label: '📊 Research Partnership' },
    { value: 'funding', label: '💰 Funding Opportunity' },
    { value: 'content', label: '✍️ Content Collaboration' },
    { value: 'promotion', label: '📢 Cross-Promotion' },
    { value: 'other', label: '💡 Other Ideas' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // For now, we'll show a success message and provide the email
      // In production, you might want to implement an actual email service
      alert(
        `🎉 Thank you for your interest in collaborating!\n\n` +
        `We&apos;ll be in touch soon. You can also reach us directly at:\n` +
        `pp@playfulprocess.com\n\n` +
        `Your inquiry details have been saved.`
      );

      // Reset form
      setFormData({
        name: '',
        email: '',
        organization: '',
        expertise: '',
        collaboration_type: '',
        message: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting collaboration request:', error);
      alert('❌ Failed to submit request. Please email us directly at pp@playfulprocess.com');
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
            <h2 className="text-2xl font-bold text-gray-900">Collaborate with Us</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              💚 Building Gateways, Not Gatekeepers
            </h3>
            <p className="text-green-700 text-sm">
              We believe in open collaboration and community-driven wellness. Whether you&apos;re a therapist, 
              coach, researcher, or just someone passionate about mental health tools, we&apos;d love to work together!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization/Company (optional)
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Your organization, practice, or company"
              />
            </div>

            {/* Expertise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Expertise/Background *
              </label>
              <textarea
                required
                value={formData.expertise}
                onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tell us about your background, expertise, or what you bring to the table..."
              />
            </div>

            {/* Collaboration Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Collaboration *
              </label>
              <select
                required
                value={formData.collaboration_type}
                onChange={(e) => setFormData({ ...formData, collaboration_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select collaboration type</option>
                {collaborationTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message *
              </label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tell us about your collaboration idea, what you'd like to work on together, or any questions you have..."
              />
            </div>

            {/* Ideas Section */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">💡 Collaboration Ideas</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Co-create therapeutic tools and exercises</li>
                <li>• Research partnerships on tool effectiveness</li>
                <li>• Guest content and cross-promotion</li>
                <li>• Workshop and training collaborations</li>
                <li>• Integration with existing platforms</li>
                <li>• Community building initiatives</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isSubmitting ? '⏳ Sending...' : '🤝 Start Collaboration'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>

            {/* Contact Info */}
            <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
              <p>You can also reach us directly at:</p>
              <a href="mailto:pp@playfulprocess.com" className="text-green-600 hover:text-green-700 font-medium">
                pp@playfulprocess.com
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}