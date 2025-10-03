"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bank } from "@prisma/client";
import { BankDeposite } from "@/types/bank-deposite";
import { BankFormDialog } from "./bank-form";
import { BankDepositeFormDialog } from "../banks-deposite/banks-deposite-form";
import { bankColumns } from "./bank-colums";
import { BankTable } from "./bank-table";
import { BankDepositeTable } from "../banks-deposite/banks-deposite-table";

type BankManagementProps = {
  bank: Bank[];
  bankDeposite: BankDeposite[];
  userRole?: string;
  userBranchId?: string;
};

export default function BankManagement({ bank, bankDeposite, userRole, userBranchId }: BankManagementProps) {
  const [activeTab, setActiveTab] = useState("bank");

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bank Management</h1>
            <p className="text-muted-foreground">Manage bank account and deposites</p>
          </div>
          {activeTab === "bank" ? <BankFormDialog userRole={userRole} userBranchId={userBranchId} /> : <BankDepositeFormDialog userRole={userRole} userBranchId={userBranchId} />}
        </div>

        <Tabs
          defaultValue="bank"
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList>
            <TabsTrigger value="bank">Bank List</TabsTrigger>
            <TabsTrigger value="bankdeposite">Bank Deposites</TabsTrigger>
          </TabsList>

          <TabsContent value="bank">
            <BankTable data={bank} columns={bankColumns} />
          </TabsContent>

          <TabsContent value="bankdeposite">
            <BankDepositeTable data={bankDeposite} userRole={userRole} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
