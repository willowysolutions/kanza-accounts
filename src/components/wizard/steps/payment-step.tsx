"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentFormDialog } from "@/components/payments/customer-payment-form-modal";
import { PaymentFormData, PaymentWithCustomer } from "@/types/payment";
import { IconCash } from "@tabler/icons-react";
import { useWizard } from '@/components/wizard/form-wizard';
import { Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';


// PaymentButton component for handling customer payments
const PaymentButton = ({ customer }: { customer: PaymentWithCustomer }) => {
  const [openPayment, setOpenPayment] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData | null>(null);
  const { commonDate, addedPayments, setAddedPayments, selectedBranchId } = useWizard();

  const handleOpenPayment = () => {
    setPaymentFormData({
      customerId: customer.id,
      amount: Math.abs(customer.outstandingPayments),
      paymentMethod: "",
      paidOn: commonDate,
      customerName: customer.name,
    });
    setOpenPayment(true);
  };

  const handleAddPayment = async (paymentData: PaymentFormData) => {
    try {
      // Save payment to database
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: paymentData.customerId,
          amount: paymentData.amount, // Use 'amount' for customerPaymentSchema
          paymentMethod: paymentData.paymentMethod,
          paidOn: paymentData.paidOn,
          branchId: selectedBranchId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save payment');
      }

      const result = await response.json();
      const savedPayment = result.data;

      // Add to local state with the actual ID from database
      const newPayment = {
        tempId: `temp-${Date.now()}`,
        id: savedPayment.id,
        customerId: paymentData.customerId,
        customerName: paymentData.customerName || 'Unknown Customer',
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        paidOn: paymentData.paidOn,
      };
      
      setAddedPayments([...addedPayments, newPayment]);
      setOpenPayment(false);
      toast.success('Payment saved successfully');
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error('Failed to save payment');
    }
  };

  return (
    <div className="text-right">
      <Button variant="outline" className="bg-primary text-primary-foreground" size="sm" onClick={handleOpenPayment}>
        <IconCash className="size-4 mr-2" /> Pay
      </Button>

      {paymentFormData && (
        <PaymentFormDialog
          open={openPayment}
          openChange={setOpenPayment}
          payments={paymentFormData}
          onPaymentAdded={handleAddPayment}
        />
      )}
    </div>
  );
};

export const PaymentStep: React.FC = () => {
  const { selectedBranchId, addedPayments, setAddedPayments, markCurrentStepCompleted } = useWizard();
  const [pendingCustomers, setPendingCustomers] = useState<PaymentWithCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editPaymentData, setEditPaymentData] = useState<PaymentFormData | null>(null);

  // Load pending customers for the specific branch
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        // Load pending customers for the specific branch
        const url = selectedBranchId ? `/api/payments/due?branchId=${selectedBranchId}` : '/api/payments/due';
        const customersResponse = await fetch(url);
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setPendingCustomers(customersData.customers || []);
        }
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    };

    loadCustomers();
  }, [selectedBranchId]);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return pendingCustomers;
    return pendingCustomers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pendingCustomers, searchTerm]);

  // Handle edit payment
  const handleEditPayment = (index: number) => {
    const payment = addedPayments[index];
    setEditPaymentData({
      customerId: payment.customerId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paidOn: payment.paidOn,
      customerName: payment.customerName,
    });
    setEditingIndex(index);
    setEditModalOpen(true);
  };

  // Handle update payment
  const handleUpdatePayment = async (paymentData: PaymentFormData) => {
    if (editingIndex !== null) {
      try {
        const payment = addedPayments[editingIndex];
        
        // If payment has an ID, update in database
        if (payment.id) {
          const response = await fetch(`/api/payments/${payment.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: paymentData.customerId,
              paidAmount: paymentData.amount, // Map amount to paidAmount
              paymentMethod: paymentData.paymentMethod,
              paidOn: paymentData.paidOn,
              branchId: selectedBranchId
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update payment');
          }
        }

        // Update local state
        const updatedPayments = [...addedPayments];
        updatedPayments[editingIndex] = {
          ...updatedPayments[editingIndex],
          customerId: paymentData.customerId,
          customerName: paymentData.customerName || 'Unknown Customer',
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          paidOn: paymentData.paidOn,
        };
        setAddedPayments(updatedPayments);
        setEditingIndex(null);
        setEditModalOpen(false);
        setEditPaymentData(null);
        toast.success('Payment updated successfully');
      } catch (error) {
        console.error('Error updating payment:', error);
        toast.error('Failed to update payment');
      }
    }
  };

  // Handle delete payment
  const handleDeletePayment = async (index: number) => {
    try {
      const payment = addedPayments[index];
      
      // If payment has an ID, delete from database
      if (payment.id) {
        const response = await fetch(`/api/payments/${payment.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete payment');
        }
      }

      // Remove from local state
      const updatedPayments = addedPayments.filter((_, i) => i !== index);
      setAddedPayments(updatedPayments);
      toast.success('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Section - Outstanding Customers */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Outstanding Customer Dues</h3>
          <p className="text-sm text-muted-foreground">
            Customers with outstanding payments - click Pay to process payment
          </p>
        </div>

        {/* Search Box */}
        <div className="space-y-2">
          <Input
            placeholder="Search customers by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No customers found matching your search' : 'No outstanding customer dues'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="py-2">
                <CardContent className="flex items-center justify-between px-4 py-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{customer.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Outstanding: ₹{Math.abs(customer.outstandingPayments)}
                    </div>
                  </div>
                  <PaymentButton customer={customer} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Right Section - Added Payments */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Added Payments</h3>
          <p className="text-sm text-muted-foreground">
            Payments added in this session - {addedPayments.length} payment(s)
          </p>
        </div>

        {addedPayments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground">No payments added yet</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {addedPayments.map((payment, index) => (
                  <div key={payment.tempId || index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{payment.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {payment.paymentMethod} • {new Date(payment.paidOn).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-medium text-sm">₹{payment.amount.toFixed(2)}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditPayment(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePayment(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Complete Button */}
      <div className="flex justify-end mt-6">
        <Button
          onClick={markCurrentStepCompleted}
          className="bg-primary text-primary-foreground"
        >
          Complete
        </Button>
      </div>

      {/* Edit Payment Modal */}
      {editPaymentData && (
        <PaymentFormDialog
          open={editModalOpen}
          openChange={setEditModalOpen}
          payments={editPaymentData}
          onPaymentAdded={handleUpdatePayment}
        />
      )}
    </div>
  );
};