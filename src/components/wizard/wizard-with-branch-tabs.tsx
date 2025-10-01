"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FormWizard, WizardStep } from '@/components/wizard/form-wizard';
import { MeterReadingStep } from '@/components/wizard/steps/meter-reading-step';
import { ProductsStep } from '@/components/wizard/steps/products-step';
import { PaymentStep } from '@/components/wizard/steps/payment-step';
import { CreditStep } from '@/components/wizard/steps/credit-step';
import { ExpenseStep } from '@/components/wizard/steps/expense-step';
import { BankDepositStep } from '@/components/wizard/steps/bank-deposit-step';
import { SalesStep } from '@/components/wizard/steps/sales-step';

type WizardWithBranchTabsProps = {
  branches: { id: string; name: string }[];
  userRole?: string;
  userBranchId?: string;
};

export function WizardWithBranchTabs({ branches, userRole, userBranchId }: WizardWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");
  const router = useRouter();

  const handleComplete = () => {
    // Redirect to the Report tab in Meter Reading
    router.push('/meter-reading?tab=report');
  };

  const handleStepChange = () => {
    // Optional: Handle step changes if needed
  };

  // Create wizard steps with branch context
  const createWizardSteps = (branchId: string): WizardStep[] => [
    {
      id: 'meter-reading',
      title: 'Meter Reading',
      description: 'Record meter readings for all nozzles',
      component: () => <MeterReadingStep branchId={branchId} />,
    },
    {
      id: 'products',
      title: 'Products',
      description: 'Add oil, AdBlue, and other products',
      component: () => <ProductsStep branchId={branchId} />,
    },
    {
      id: 'payment',
      title: 'Payment (Customer Dues)',
      description: 'Record customer payments and outstanding dues',
      component: () => <PaymentStep branchId={branchId} />,
    },
    {
      id: 'credit',
      title: 'Credit',
      description: 'Record credit transactions',
      component: () => <CreditStep branchId={branchId} />,
    },
    {
      id: 'expense',
      title: 'Expense',
      description: 'Record daily expenses',
      component: () => <ExpenseStep branchId={branchId} />,
    },
    {
      id: 'bank-deposit',
      title: 'Bank Deposit',
      description: 'Record bank deposits',
      component: () => <BankDepositStep branchId={branchId} />,
    },
    {
      id: 'sales',
      title: 'Sales',
      description: 'Record sales transactions',
      component: () => <SalesStep branchId={branchId} />,
    },
  ];

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Reading</h1>
            <p className="text-muted-foreground">Complete all steps to finish the daily workflow by branch</p>
          </div>
        </div>

        {/* Branch Tabs */}
        <Tabs value={activeBranch} onValueChange={setActiveBranch} className="w-full">
          <TabsList className="mb-4 flex flex-wrap gap-2">
            {branches.map((branch) => (
              <TabsTrigger key={branch.id} value={branch.id}>
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {branches.map((branch) => (
            <TabsContent key={branch.id} value={branch.id}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branch.name} Daily Reading</h2>
                <p className="text-sm text-muted-foreground">
                  Complete all steps for {branch.name} branch
                </p>
              </div>

              <FormWizard
                steps={createWizardSteps(branch.id)}
                onComplete={handleComplete}
                onStepChange={handleStepChange}
                title={`${branch.name} Daily Reading Records`}
                description={`Complete all steps in order to finish your daily reading records for ${branch.name}.`}
                initialBranchId={branch.id}
                userRole={userRole}
                userBranchId={userBranchId}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
