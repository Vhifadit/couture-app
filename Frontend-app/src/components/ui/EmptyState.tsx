import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center p-6 bg-white rounded-xl border border-[#C9B99A] border-dashed">
      <div className="w-16 h-16 bg-[#F5EFE6] rounded-full flex items-center justify-center mb-4">
        <Icon size={32} className="text-[#2D6A4F]" />
      </div>
      <h3 className="text-lg font-semibold text-[#2D6A4F] mb-1">{title}</h3>
      <p className="text-sm text-[#718096] max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}