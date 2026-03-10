type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
};

export default function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  className = "",
}: ButtonProps) {
  const base = "px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm";

  const variants = {
    primary: "bg-emeraude text-white hover:bg-emeraude-dark",
    secondary: "bg-pierre text-white hover:bg-pierre-dark",
    outline: "border border-emeraude text-emeraude hover:bg-pierre-light",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}