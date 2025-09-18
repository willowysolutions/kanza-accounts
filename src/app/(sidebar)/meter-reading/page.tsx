export const dynamic = "force-dynamic";
import MeterTabManagement from "@/components/meter-tab-management/reading-management";
import { headers, cookies } from "next/headers";

export default async function MeterReadingPage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  
  // 🔹 Forward cookies
  const cookie = cookies().toString();
  
  // 🔹 Fetch meter readings
  const meterReadingRes = await fetch(`${proto}://${host}/api/meterreadings`, {
    cache: "no-store",
    headers: { cookie },
  });const { withDifference } = await meterReadingRes.json();

  const oilRes = await fetch(`${proto}://${host}/api/oils`, {
    cache: "no-store",
    headers: { cookie },
  });
  const { oils } = await oilRes.json();
  
  // 🔹 Sales
  const salesRes = await fetch(`${proto}://${host}/api/sales`, {
    cache: "no-store",
    headers: { cookie },
  });
  const { sales } = await salesRes.json();
  
  return (
    <div className="flex flex-1 flex-col">
      <MeterTabManagement meterReading={withDifference} oil={oils} sales={sales}/>
    </div>
  );
}
