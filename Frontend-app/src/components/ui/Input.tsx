type InputProps = {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function Input({
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-ardoise">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="border border-pierre rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emeraude focus:border-transparent"
      />
    </div>
  );
}