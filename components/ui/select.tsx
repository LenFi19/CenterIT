import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  className?: string;
  options: SelectOption[];
} & React.ComponentProps<"select">;

export function Select({ className, options, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 outline-none focus-visible:border-zinc-500",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
