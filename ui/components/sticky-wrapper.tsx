type Props = {
  children: React.ReactNode;
};

export const StickyWrapper = ({ children }: Props) => {
  return (
    <div className="hidden lg:block w-[368px] sticky self-end bottom-6">
      <div className="flex min-h-[calc(100vh-48px)] max-h-[calc(100vh-24px)] flex-col gap-y-4 sticky top-6">
        {children}
      </div>
    </div>
  );
};