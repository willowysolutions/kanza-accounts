export const dynamic = "force-dynamic";
import MeterTabManagement from "@/components/meter-tab-management/reading-management";


export default async function MeterReadingPage() {
    const meterReadingRes = await await fetch("http://localhost:3000/api/meterreadings")
    const {withDifference} = await meterReadingRes.json() 

    const oilRes = await await fetch("http://localhost:3000/api/oils")
    const {oils} = await oilRes.json() 

    const salesRes = await await fetch("http://localhost:3000/api/sales")
    const {sales} = await salesRes.json() 
    

  return (
    <div className="flex flex-1 flex-col">
      <MeterTabManagement meterReading={withDifference} oil={oils} sales={sales}/>
    </div>
  );
}
