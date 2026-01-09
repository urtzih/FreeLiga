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
    // Asegurar que el porcentaje esté entre 0 y 100
    const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
    
    // Calcular color: rojo (0%) -> amarillo (50%) -> verde (100%)
    let color: string;
    let bgColor: string;
    
    if (normalizedPercentage <= 50) {
        // De rojo a amarillo (0% -> 50%)
        const ratio = normalizedPercentage / 50;
        const red = 220;
        const green = Math.round(185 * ratio); // De 0 a 185 (amarillo)
        const blue = 50;
        color = `rgb(${red}, ${green}, ${blue})`;
        
        // Background color más claro
        bgColor = `rgba(${red}, ${green}, ${blue}, 0.1)`;
    } else {
        // De amarillo a verde (50% -> 100%)
        const ratio = (normalizedPercentage - 50) / 50;
        const red = Math.round(220 - (220 * ratio)); // De 220 a 0
        const green = 185 + Math.round((70 * ratio)); // De 185 a 255
        const blue = 50;
        color = `rgb(${red}, ${green}, ${blue})`;
        
        // Background color más claro
        bgColor = `rgba(${red}, ${green}, ${blue}, 0.1)`;
    }

    const heightClasses = {
        sm: 'h-1.5',
        md: 'h-2.5',
        lg: 'h-3'
    };

    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
                    {showPercentage && (
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{normalizedPercentage}%</p>
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
