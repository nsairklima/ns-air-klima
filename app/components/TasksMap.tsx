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
        border: "2px solid #4285f4",
        borderRadius: "10px",
        padding: "20px",
        overflow: "auto",
        background: "#f8fbff",
      }}
    >
      <h2>🗺️ Térkép előkészítés</h2>

      <p>Szűrt feladatok száma: {tasks.length}</p>

      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            marginBottom: "10px",
            padding: "10px",
            background: "white",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        >
          <strong>{task.name || "Nincs név"}</strong>

          <br />

          {task.address || "Nincs cím"}
        </div>
      ))}
    </div>
  );
}
