import { useState } from "react";

type Seat = {
  id: string;
  row: string;
  number: number;
  status: "available" | "booked";
};

const rows = ["A", "B", "C"];

const seats: Seat[] = rows.flatMap((row) =>
  Array.from({ length: 8 }, (_, i) => ({
    id: `${row}${i + 1}`,
    row,
    number: i + 1,
    status:
      (row === "A" && i === 5) ||
      (row === "B" && i === 2) ||
      (row === "C" && i === 6)
        ? "booked"
        : "available",
  })),
);

function SeatGrid() {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === "booked") return;

    setSelectedSeats((prev) =>
      prev.includes(seat.id)
        ? prev.filter((id) => id !== seat.id)
        : [...prev, seat.id],
    );
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "30px",
        textAlign: "center",
      }}
    >
      {/* Title */}
      <h1 style={{ marginBottom: "8px" }}>Select Your Seats</h1>

      <p style={{ color: "#999", marginBottom: "30px" }}>
        Choose your preferred seats
      </p>

      {/* Screen */}
      <div
        style={{
          width: "70%",
          height: "8px",
          margin: "0 auto 10px",
          background:
            "linear-gradient(90deg, transparent, #8b5cf6, transparent)",
          borderRadius: "50%",
        }}
      />

      <p
        style={{
          color: "#aaa",
          fontSize: "13px",
          marginBottom: "35px",
          letterSpacing: "3px",
        }}
      >
        SCREEN
      </p>

      {/* Seat Rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          alignItems: "center",
        }}
      >
        {rows.map((row) => (
          <div
            key={row}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {/* Row Label */}
            <span
              style={{
                width: "25px",
                color: "#aaa",
                fontWeight: "bold",
              }}
            >
              {row}
            </span>

            {/* Seats */}
            {seats
              .filter((seat) => seat.row === row)
              .map((seat) => {
                const isSelected = selectedSeats.includes(seat.id);
                const isBooked = seat.status === "booked";

                return (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    disabled={isBooked}
                    style={{
                      width: "48px",
                      height: "42px",
                      borderRadius: "8px",
                      border: "1px solid #444",
                      background: isBooked
                        ? "#555"
                        : isSelected
                          ? "#7c3aed"
                          : "#202020",
                      color: "#fff",
                      cursor: isBooked ? "not-allowed" : "pointer",
                      transition: "0.2s",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    {seat.id}
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "30px",
          marginTop: "40px",
          color: "#aaa",
          fontSize: "13px",
        }}
      >
        <Legend color="#202020" label="Available" />
        <Legend color="#7c3aed" label="Selected" />
        <Legend color="#555" label="Booked" />
      </div>

      {/* Selected Seats */}
      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          border: "1px solid #333",
          borderRadius: "12px",
          background: "#181818",
        }}
      >
        <h3>Selected Seats</h3>

        {selectedSeats.length === 0 ? (
          <p style={{ color: "#888" }}>No seats selected</p>
        ) : (
          <p>{selectedSeats.join(", ")}</p>
        )}

        <p style={{ color: "#aaa" }}>
          {selectedSeats.length} seat
          {selectedSeats.length !== 1 ? "s" : ""} selected
        </p>

        <button
          disabled={selectedSeats.length === 0}
          style={{
            marginTop: "10px",
            padding: "12px 28px",
            border: "none",
            borderRadius: "8px",
            background: selectedSeats.length === 0 ? "#444" : "#7c3aed",
            color: "#fff",
            cursor: selectedSeats.length === 0 ? "not-allowed" : "pointer",
            fontWeight: "600",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "7px",
      }}
    >
      <span
        style={{
          width: "14px",
          height: "14px",
          borderRadius: "4px",
          background: color,
          border: "1px solid #555",
        }}
      />

      <span>{label}</span>
    </div>
  );
}

export default SeatGrid;
