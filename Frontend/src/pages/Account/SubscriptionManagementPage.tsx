import React, { useState } from 'react';
import SubscriptionInfo from '../../components/common/SubscriptionInfo';
import SubscriptionPlansModal from '../../components/common/SubscriptionPlansModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/DocumentService/ui/card';
import { Button } from '../../components/DocumentService/ui/button';
import { CreditCard, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/account/profile')}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Subscription Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your subscription plan and billing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Subscription */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionInfo showRefreshButton={true} />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setIsPlansModalOpen(true)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => navigate('/credits-usage')}
                >
                  View Credit Usage
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Questions about your subscription or billing?
                </p>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.open('/contact-sales', '_blank')}
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Subscription Plans Modal */}
      <SubscriptionPlansModal 
        open={isPlansModalOpen} 
        onClose={() => setIsPlansModalOpen(false)} 
      />
    </div>
  );
};

export default SubscriptionManagementPage;

