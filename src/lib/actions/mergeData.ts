type MonthlySale = {
  date: Date;
  _sum: { rate: number | null };
};

type MonthlyPurchase = {
  date: Date;
  _sum: { purchasePrice: number | null };
};

type MergedData = {
  date: string;
  sales: number;
  purchases: number;
};

export function mergeData(
  monthlySales: MonthlySale[],
  monthlyPurchases: MonthlyPurchase[]
): MergedData[] {
  const salesMap = new Map(
    monthlySales.map((s) => [
      new Date(s.date).toISOString().split("T")[0],
      s._sum.rate || 0,
    ])
  );

  const purchaseMap = new Map(
    monthlyPurchases.map((p) => [
      new Date(p.date).toISOString().split("T")[0],
      p._sum.purchasePrice || 0,
    ])
  );

  const allDates = Array.from(
    new Set([...salesMap.keys(), ...purchaseMap.keys()])
  ).sort();

  return allDates.map((date) => ({
    date,
    sales: salesMap.get(date) || 0,
    purchases: purchaseMap.get(date) || 0,
  }));
}
