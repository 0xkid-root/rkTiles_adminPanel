import React from 'react';

interface StatusBadgeProps {
  value: string;
}

export function StatusBadge({ value }: StatusBadgeProps) {
  const style =
    value === 'Approved' || value === 'In stock' || value === 'Active' || value === 'Published'
      ? 'positive'
      : value === 'Pending' || value === 'Low stock'
      ? 'warning'
      : value === 'Rejected' || value === 'Out of stock' || value === 'Inactive' || value === 'Unpublished'
      ? 'negative'
      : 'neutral';

  return (
    <span className={`status ${style}`}>
      <i />
      {value}
    </span>
  );
}
