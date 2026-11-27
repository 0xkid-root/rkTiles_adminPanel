import React from 'react';

interface PageHeadingProps {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PageHeading({ eyebrow, title, description, action }: PageHeadingProps) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
