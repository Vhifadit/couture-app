type BadgeProps = {
  status: string;
};

export default function Badge({ status }: BadgeProps) {
  const getStyles = (s: string) => {
    switch (s) {
      case "En attente":
      case "PLANNED":
      case "CONFIRMED":
        return "bg-yellow-100 text-yellow-700";
      case "En cours":
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700";
      case "Terminé":
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "Annulé":
      case "CANCELLED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getDisplayText = (s: string) => {
    switch (s) {
      case "PLANNED": return "En attente";
      case "CONFIRMED": return "Confirmé";
      case "IN_PROGRESS": return "En cours";
      case "COMPLETED": return "Terminé";
      case "CANCELLED": return "Annulé";
      default: return s;
    }
  };

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStyles(status)}`}>
      {getDisplayText(status)}
    </span>
  );
}
