type TooltipProps = {
  active?: boolean;
  payload?: any[];
  label?: string;
};

export const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white shadow px-3 py-2 rounded border">
        <p>{label}</p>
        <p style={{ color: "#ef4444" }}>
          errors : {payload.find(obj => obj.dataKey === "errors")?.value}%
        </p>
        <p style={{ color: "#2563eb" }}>
          requests : {payload.find(obj => obj.dataKey === "requests")?.value}
        </p>
      </div>
    );
  }
  return null;
};
