import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.07] active:translate-y-0 active:scale-[0.98] shadow-sm hover:shadow-lg";
      

    const variantClasses = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      outline: "border border-gray-300 bg-white hover:bg-gray-50",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      ghost: "hover:bg-gray-100",
      link: "text-blue-600 underline-offset-4 hover:underline",
    } as const;

    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    } as const;

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return <button className={classes} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

// Convenience wrapper to show a hint line under the button
export function ViewAllBranchesButton({
  children,
  hint = "Bấm vào để xem tất cả chi nhánh",
  className = "bg-orange-500",
  ...props
}: ButtonProps & { hint?: string }) {
  return (
    <div className={`flex flex-col items-stretch ${className}`}>
      <Button {...props}>{children}</Button>
      <span className="mt-1 text-[11px] text-gray-500 text-center">{hint}</span>
    </div>
  );
}

export { Button };

