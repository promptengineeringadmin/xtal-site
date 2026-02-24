import Image from 'next/image';

interface AuthorCardProps {
  name: string;
  title?: string;
  avatar?: string;
}

export function AuthorCard({ name, title, avatar }: AuthorCardProps) {
  return (
    <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-xl mt-12">
      {avatar ? (
        <Image src={avatar} alt={name} width={56} height={56} className="rounded-full" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-xtal-navy/10 flex items-center justify-center text-xtal-navy font-bold text-xl">
          {name.charAt(0)}
        </div>
      )}
      <div>
        <p className="font-semibold text-xtal-navy">{name}</p>
        {title && <p className="text-sm text-slate-500">{title}</p>}
      </div>
    </div>
  );
}
