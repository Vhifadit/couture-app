type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-pierre-light p-4 ${className}`}>
      {children}
    </div>
  );
}