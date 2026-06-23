interface BadgeProps {
  variant: 'granted' | 'denied' | 'denied-inactive' | 'inactive' | 'active';
  children: React.ReactNode;
}

const styles = {
  granted:         'bg-green-50 text-green-700 ring-1 ring-green-200',
  denied:          'bg-red-50 text-red-700 ring-1 ring-red-200',
  'denied-inactive': 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  active:          'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  inactive:        'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
