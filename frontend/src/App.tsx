// import { useState, useEffect } from "react";
import CheckInCard from "./ui/checkin";
import RecordTable from "./ui/table";

function App() {
  return (
    <>
      <CheckInCard name={"Jie Chen"}></CheckInCard>
      <CheckInCard name={"Kelly Chen"}></CheckInCard>
      <RecordTable />
    </>
  );
}

export default App;
