"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Check, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Wizard Step Types
export interface WizardStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<Record<string, unknown>>;
  isCompleted?: boolean;
  isOptional?: boolean;
}

// Types for persistent data
export interface AddedExpense {
  id?: string;
  tempId?: string;
  description?: string;
  amount: number;
  date: Date;
  expenseCategoryId: string;
  bankId?: string;
}

export interface AddedCredit {
  id?: string;
  tempId?: string;
  customerId: string;
  fuelType: string;
  quantity?: number;
  amount: number;
  date: Date;
}

export interface AddedDeposit {
  id?: string;
  tempId?: string;
  bankId: string;
  amount: number;
  date: Date;
}

export interface AddedProduct {
  id?: string;
  tempId?: string;
  date: Date;
  productType: string;
  quantity?: number;
  price: number;
}

// Wizard Context
interface WizardContextType {
  currentStep: number;
  totalSteps: number;
  steps: WizardStep[];
  goToNext: () => void;
  goToPrevious: () => void;
  goToStep: (step: number) => void;
  markStepCompleted: (stepIndex: number) => void;
  markCurrentStepCompleted: () => void;
  isStepCompleted: (stepIndex: number) => boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastStep: boolean;
  isFirstStep: boolean;
  onSaveAndNext: (() => (() => Promise<boolean>)) | null;
  setOnSaveAndNext: (handler: (() => (() => Promise<boolean>)) | null) => void;
  isStepDisabled: boolean;
  setIsStepDisabled: (disabled: boolean) => void;
  isCurrentStepCompleted: boolean;
  setIsCurrentStepCompleted: (completed: boolean) => void;
  // Common date for all steps
  commonDate: Date;
  setCommonDate: React.Dispatch<React.SetStateAction<Date>>;
  // Persistent data across steps
  addedExpenses: AddedExpense[];
  setAddedExpenses: React.Dispatch<React.SetStateAction<AddedExpense[]>>;
  addedCredits: AddedCredit[];
  setAddedCredits: React.Dispatch<React.SetStateAction<AddedCredit[]>>;
  addedDeposits: AddedDeposit[];
  setAddedDeposits: React.Dispatch<React.SetStateAction<AddedDeposit[]>>;
  addedProducts: AddedProduct[];
  setAddedProducts: React.Dispatch<React.SetStateAction<AddedProduct[]>>;
  // Saved records count
  savedRecords: { [key: string]: number };
  setSavedRecords: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};

// Wizard Provider Props
interface WizardProviderProps {
  children: React.ReactNode;
  steps: WizardStep[];
  onComplete?: () => void;
  onStepChange?: (step: number) => void;
}

export const WizardProvider: React.FC<WizardProviderProps> = ({
  children,
  steps,
  onComplete,
  onStepChange,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [onSaveAndNext, setOnSaveAndNext] = useState<(() => (() => Promise<boolean>)) | null>(null);
  const [isStepDisabled, setIsStepDisabled] = useState(false);
  const [isCurrentStepCompleted, setIsCurrentStepCompleted] = useState(false);
  
  // Common date for all steps - initialized to today and persists across navigation
  const [commonDate, setCommonDate] = useState<Date>(new Date());
  
  // Persistent data across all steps
  const [addedExpenses, setAddedExpenses] = useState<AddedExpense[]>([]);
  const [addedCredits, setAddedCredits] = useState<AddedCredit[]>([]);
  const [addedDeposits, setAddedDeposits] = useState<AddedDeposit[]>([]);
  const [addedProducts, setAddedProducts] = useState<AddedProduct[]>([]);
  const [savedRecords, setSavedRecords] = useState<{ [key: string]: number }>({
    expenses: 0,
    credits: 0,
    deposits: 0,
    products: 0,
  });

  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const isStepCompleted = useCallback((stepIndex: number) => {
    return completedSteps.has(stepIndex);
  }, [completedSteps]);

  const markStepCompleted = useCallback((stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  }, []);

  const markCurrentStepCompleted = useCallback(() => {
    setIsCurrentStepCompleted(true);
    markStepCompleted(currentStep);
  }, [currentStep, markStepCompleted]);

  const goToNext = useCallback(async () => {
    if (onSaveAndNext) {
      const saveHandler = onSaveAndNext();
      if (typeof saveHandler === 'function') {
        const isValid = await saveHandler();
        if (!isValid) {
          return; // Don't proceed if validation fails
        }
      }
    }

    if (currentStep < totalSteps - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setIsCurrentStepCompleted(isStepCompleted(nextStep));
      onStepChange?.(nextStep);
    } else {
      onComplete?.();
    }
  }, [currentStep, totalSteps, onComplete, onStepChange, onSaveAndNext, isStepCompleted]);

  const goToPrevious = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setIsCurrentStepCompleted(isStepCompleted(prevStep));
      onStepChange?.(prevStep);
    }
  }, [currentStep, onStepChange, isStepCompleted]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
      setIsCurrentStepCompleted(isStepCompleted(step));
      onStepChange?.(step);
    }
  }, [totalSteps, onStepChange, isStepCompleted]);

  const canGoNext = currentStep < totalSteps - 1;
  const canGoPrevious = currentStep > 0;

  const value: WizardContextType = {
    currentStep,
    totalSteps,
    steps,
    goToNext,
    goToPrevious,
    goToStep,
    markStepCompleted,
    markCurrentStepCompleted,
    isStepCompleted,
    canGoNext,
    canGoPrevious,
    isLastStep,
    isFirstStep,
    onSaveAndNext,
    setOnSaveAndNext,
    isStepDisabled,
    setIsStepDisabled,
    isCurrentStepCompleted,
    setIsCurrentStepCompleted,
    // Common date
    commonDate,
    setCommonDate,
    // Persistent data
    addedExpenses,
    setAddedExpenses,
    addedCredits,
    setAddedCredits,
    addedDeposits,
    setAddedDeposits,
    addedProducts,
    setAddedProducts,
    savedRecords,
    setSavedRecords,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
};

// Common Date Picker Component
const CommonDatePicker: React.FC = () => {
  const { commonDate, setCommonDate } = useWizard();

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-medium text-muted-foreground">Common Date:</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !commonDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {commonDate ? format(commonDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={commonDate}
            onSelect={(date) => date && setCommonDate(date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

// Step Indicator Component
const StepIndicator: React.FC = () => {
  const { currentStep, totalSteps, steps, goToStep, isStepCompleted } = useWizard();

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <button
              onClick={() => goToStep(index)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                index === currentStep
                  ? "bg-primary text-primary-foreground"
                  : isStepCompleted(index)
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {isStepCompleted(index) ? (
                <Check className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </button>
            <span className={cn(
              "text-xs mt-2 text-center max-w-20",
              index === currentStep ? "text-primary font-medium" : "text-muted-foreground"
            )}>
              {step.title}
            </span>
          </div>
          {index < totalSteps - 1 && (
            <div className={cn(
              "w-16 h-0.5 mx-2",
              isStepCompleted(index) ? "bg-green-500" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );
};

// Progress Bar Component
const ProgressBar: React.FC = () => {
  const { currentStep, totalSteps } = useWizard();
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

// Navigation Component
interface WizardNavigationProps {
  onBack?: () => void;
  isLoading?: boolean;
  nextButtonText?: string;
  backButtonText?: string;
}

const WizardNavigation: React.FC<WizardNavigationProps> = ({
  onBack,
  isLoading = false,
  nextButtonText,
  backButtonText,
}) => {
  const { 
    currentStep, 
    steps, 
    goToNext, 
    goToPrevious, 
    isLastStep, 
    isFirstStep,
    isStepDisabled,
    isCurrentStepCompleted
  } = useWizard();

  const currentStepData = steps[currentStep];

  const handleNext = async () => {
    await goToNext();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goToPrevious();
    }
  };

  return (
    <div className="flex justify-between items-center pt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={handleBack}
        disabled={isFirstStep || isLoading}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        {backButtonText || "Back"}
      </Button>

      <div className="text-sm text-muted-foreground">
        {currentStepData?.description}
      </div>

      <Button
        type="button"
        onClick={handleNext}
        disabled={isLoading || isStepDisabled || !isCurrentStepCompleted}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          "Saving..."
        ) : (
          <>
            {nextButtonText || (isLastStep ? "Finish" : "Save & Next")}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </>
        )}
      </Button>
    </div>
  );
};

// Main Wizard Component
interface FormWizardProps {
  steps: WizardStep[];
  onComplete?: () => void;
  onStepChange?: (step: number) => void;
  title?: string;
  description?: string;
  className?: string;
}

export const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  onComplete,
  onStepChange,
  title = "Form Wizard",
  description = "Complete all steps to finish the process",
  className,
}) => {
  return (
    <WizardProvider steps={steps} onComplete={onComplete} onStepChange={onStepChange}>
      <div className={cn("w-full mx-auto", className)}>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-muted-foreground">{description}</p>
            <CommonDatePicker />
          </CardHeader>
          <CardContent className="space-y-6">
            <StepIndicator />
            <ProgressBar />
            <WizardContent />
            <WizardNavigation />
          </CardContent>
        </Card>
      </div>
    </WizardProvider>
  );
};

// Wizard Content Component
const WizardContent: React.FC = () => {
  const { currentStep, steps } = useWizard();
  const CurrentStepComponent = steps[currentStep]?.component;

  if (!CurrentStepComponent) {
    return <div>Step component not found</div>;
  }

  return (
    <div className="min-h-[600px]">
      <CurrentStepComponent />
    </div>
  );
};

// Export all components
export { WizardNavigation, StepIndicator, ProgressBar, CommonDatePicker };
