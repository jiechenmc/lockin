import { useEffect, useState } from "react";

interface Record {
  ID: number;
  Name: string;
  CreatedAt: string;
  Ack: boolean;
}

const RecordTable = () => {
  const [records, setRecords] = useState<Record[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch(`/api`);
        if (!res.ok) return;
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error("failed to fetch records", err);
      }
    };
    fetchRecords();
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Created At</th>
            <th>Ack</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, i) => (
            <tr
              key={record.ID}
              className={
                new Date(record.CreatedAt).toDateString() ===
                new Date().toDateString()
                  ? "bg-base-200"
                  : ""
              }
            >
              <th>{i + 1}</th>
              <td>{record.Name}</td>
              <td>
                {new Date(record.CreatedAt).toLocaleString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </td>
              <td>{record.Ack ? "✅" : "❌"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecordTable;
