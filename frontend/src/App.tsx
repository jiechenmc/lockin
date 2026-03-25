import { useState } from "react";
import CheckInCard from "./ui/checkin";
import RecordTable from "./ui/table";

function App() {
  const [refresh, setRefresh] = useState(0);
  return (
    <div className="">
      <CheckInCard name={"Jie Chen"} setRefresh={setRefresh}></CheckInCard>
      <CheckInCard name={"Kelly Chen"} setRefresh={setRefresh}></CheckInCard>
      <RecordTable refresh={refresh} />
    </div>
  );
}

export default App;
