"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentFormDialog } from "@/components/payments/customer-payment-form-modal";
import { PaymentFormData, PaymentWithCustomer } from "@/types/payment";
import { IconCash } from "@tabler/icons-react";
import { useWizard } from '@/components/wizard/form-wizard';


// PaymentButton component for handling customer payments
const PaymentButton = ({ customer }: { customer: PaymentWithCustomer }) => {
  const [openPayment, setOpenPayment] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData | null>(null);
  const { commonDate } = useWizard();

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
        />
      )}
    </div>
  );
};

export const PaymentStep: React.FC<{ branchId?: string }> = () => {
  const { selectedBranchId } = useWizard();
  const [pendingCustomers, setPendingCustomers] = useState<PaymentWithCustomer[]>([]);

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


  return (
    <div className="space-y-6">
      {/* Pending Customers Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Outstanding Customer Dues</h3>
          <p className="text-sm text-muted-foreground">
            Customers with outstanding payments - click Pay to process payment
          </p>
        </div>
        
        {pendingCustomers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground">No outstanding customer dues</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1">
            {pendingCustomers.map((customer) => (
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

    </div>
  );
};