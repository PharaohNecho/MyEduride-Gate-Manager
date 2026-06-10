'use client';

import { useState } from 'react';

interface StudentAvatarProps {
  photoUrl?: string | null;
  firstName?: string;
  lastName?: string;
  size?: number;
}

export default function StudentAvatar({ photoUrl, firstName = '', lastName = '', size = 32 }: StudentAvatarProps) {
  const [error, setError] = useState(false);
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?';

  if (photoUrl && !error) {
    const src = photoUrl.startsWith('http') 
      ? photoUrl 
      : `/api/photo?path=${encodeURIComponent(photoUrl)}`;

    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className="rounded-full object-cover shadow-xs select-none"
        style={{ width: size, height: size }}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs select-none shadow-xs"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

export { StudentAvatar };
