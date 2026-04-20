interface ProgressBarProps {
    percentage: number;
    label?: string;
    showPercentage?: boolean;
    height?: 'sm' | 'md' | 'lg';
}

export default function ProgressBar({
    percentage,
    label,
    showPercentage = true,
    height = 'md'
}: ProgressBarProps) {
    const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);

    // Brand scale: club black -> club yellow
    const ratio = normalizedPercentage / 100;
    const start = { r: 23, g: 23, b: 23 };
    const end = { r: 245, g: 179, b: 1 };
    const red = Math.round(start.r + (end.r - start.r) * ratio);
    const green = Math.round(start.g + (end.g - start.g) * ratio);
    const blue = Math.round(start.b + (end.b - start.b) * ratio);
    const color = `rgb(${red}, ${green}, ${blue})`;
    const bgColor = 'rgba(245, 179, 1, 0.18)';

    const heightClasses = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-3'
    };

    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-club-black-700">{label}</p>
                    {showPercentage && (
                        <p className="text-sm font-semibold text-club-black-900">{normalizedPercentage}%</p>
                    )}
                </div>
            )}

            <div className={`w-full rounded-full overflow-hidden ${heightClasses[height]}`} style={{ backgroundColor: bgColor }}>
                <div
                    className={`${heightClasses[height]} rounded-full transition-all duration-500 ease-out`}
                    style={{
                        width: `${normalizedPercentage}%`,
                        backgroundColor: color
                    }}
                />
            </div>
        </div>
    );
}
