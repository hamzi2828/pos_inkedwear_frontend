import { UserPlus } from 'lucide-react';

type Props = {
  title: string;
  subtitle?: string;
  onAddUser?: () => void;
};

export default function PageHeader({ title, subtitle, onAddUser }: Props) {
  return (
    <div className="flex flex-col justify-between space-y-4 md:flex-row md:items-center md:space-y-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      {onAddUser && (
        <button
          onClick={onAddUser}
          className="flex items-center gap-2 px-4 py-2 bg-[#dc2626] text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      )}
    </div>
  );
}
