"use client";

export default function TasksMap({
  tasks,
}: {
  tasks: any[];
}) {
  return (
    <div
      style={{
        height: "600px",
        border: "2px solid green",
        borderRadius: "10px",
        padding: "20px",
        background: "#f5fff5",
      }}
    >
      <h2>🗺️ Térkép</h2>

      <p>Feladatok száma: {tasks.length}</p>
    </div>
  );
}
