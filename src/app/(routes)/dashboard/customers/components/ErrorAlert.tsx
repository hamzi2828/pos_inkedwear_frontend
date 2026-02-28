type Props = {
  message: string;
};

export default function ErrorAlert({ message }: Props) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-600">{message}</p>
    </div>
  );
}
