export const dynamic = "force-dynamic";
import MeterTabManagement from "@/components/meter-tab-management/reading-management";


export default async function MeterReadingPage() {
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Meter Readings
const meterReadingRes = await fetch(`${baseUrl}/api/meterreadings`, {
  cache: "no-store",
});
const { withDifference } = await meterReadingRes.json();

// Oils
const oilRes = await fetch(`${baseUrl}/api/oils`, {
  cache: "no-store",
});
const { oils } = await oilRes.json();

// Sales
const salesRes = await fetch(`${baseUrl}/api/sales`, {
  cache: "no-store",
});
const { sales } = await salesRes.json();

  return (
    <div className="flex flex-1 flex-col">
      <MeterTabManagement meterReading={withDifference} oil={oils} sales={sales}/>
    </div>
  );
}
