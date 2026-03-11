export default function Dashboard() {
  return (
    <div style={{
      padding: "40px",
      maxWidth: "800px",
      margin: "0 auto",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ marginBottom: "10px" }}>NS-AIR KLÍMA rendszer</h1>
      <p style={{ marginBottom: "30px", fontSize: "18px", opacity: 0.8 }}>
        Válassz a funkciók közül:
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px"
      }}>
        <a href="/clients" style={tileStyle}>Ügyfelek</a>
        <a href="/maintenance" style={tileStyle}>Karbantartások</a>
        <a href="/quotes" style={tileStyle}>Ajánlatok</a>
        <a href="/notifications" style={tileStyle}>Értesítések</a>
      </div>
    </div>
  );
}

const tileStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f2f4f7",
  padding: "30px",
  borderRadius: "10px",
  textDecoration: "none",
  color: "#333",
  fontSize: "20px",
  fontWeight: "bold",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  transition: "0.2s",
};
