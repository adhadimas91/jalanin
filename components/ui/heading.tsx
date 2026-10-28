interface HeadingProps {
  title: string;
  description: string;
}

export function Heading({ title, description }: HeadingProps) {
  return (
    <div>
      <div className='flex items-center gap-2'>
        <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>{title}</h2>
      </div>
      <p className='text-muted-foreground text-sm'>{description}</p>
    </div>
  );
}

