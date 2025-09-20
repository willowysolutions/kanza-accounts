"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FormWizard, WizardStep } from '@/components/wizard/form-wizard';
import { MeterReadingStep } from '@/components/wizard/steps/meter-reading-step';
import { ProductsStep } from '@/components/wizard/steps/products-step';
import { SalesStep } from '@/components/wizard/steps/sales-step';
import { ExpenseStep } from '@/components/wizard/steps/expense-step';
import { CreditStep } from '@/components/wizard/steps/credit-step';
import { BankDepositStep } from '@/components/wizard/steps/bank-deposit-step';

const wizardSteps: WizardStep[] = [
  {
    id: 'meter-reading',
    title: 'Meter Reading',
    description: 'Record meter readings for all nozzles',
    component: MeterReadingStep,
  },
  {
    id: 'products',
    title: 'Products',
    description: 'Add oil, AdBlue, and other products',
    component: ProductsStep,
  },
  {
    id: 'expense',
    title: 'Expense',
    description: 'Record daily expenses',
    component: ExpenseStep,
  },
  {
    id: 'credit',
    title: 'Credit',
    description: 'Record credit transactions',
    component: CreditStep,
  },
  {
    id: 'bank-deposit',
    title: 'Bank Deposit',
    description: 'Record bank deposits',
    component: BankDepositStep,
  },
  {
    id: 'sales',
    title: 'Sales',
    description: 'Record sales transactions',
    component: SalesStep,
  },
];

export default function WizardPage() {
  const router = useRouter();

  const handleComplete = () => {
    // Redirect to the Report tab in Meter Reading
    router.push('/meter-reading?tab=report');
  };

  const handleStepChange = () => {
    // Optional: Handle step changes if needed
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Reading</h1>
            <p className="text-muted-foreground">Complete all steps to finish the daily workflow</p>
          </div>
        </div>

        <FormWizard
          steps={wizardSteps}
          onComplete={handleComplete}
          onStepChange={handleStepChange}
          title="Daily Reading Records"
          description="Complete all steps in order to finish your daily reading records."
        />
      </div>
    </div>
  );
}
