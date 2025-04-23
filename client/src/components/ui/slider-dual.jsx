'use client';

import { cn } from '@/lib/utils';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

const DualRangeSlider = React.forwardRef(
  ({ className, label, labelPosition = 'top', ...props }, ref) => {
    // Estado interno para gerenciar valores durante o arrasto
    const [localValues, setLocalValues] = React.useState(
      Array.isArray(props.value)
        ? props.value
        : [props.min || 0, props.max || 100]
    );

    // Atualizar valores locais quando props.value mudar
    React.useEffect(() => {
      if (props.value && Array.isArray(props.value)) {
        setLocalValues(props.value);
      }
    }, [props.value]);

    const handleValueChange = (newValues) => {
      // Atualiza apenas o estado local durante o arrasto para visualização
      setLocalValues(newValues);
    };

    const handleValueCommit = (newValues) => {
      // Atualiza o componente pai quando o arrasto terminar
      if (props.onValueChange) {
        props.onValueChange(newValues);
      }
    };

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          className
        )}
        value={localValues}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        min={props.min}
        max={props.max}
        step={props.step || 1}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>
        {localValues.map((value, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className="relative block h-5 w-5 rounded-full border-2 border-primary bg-background cursor-grab active:cursor-grabbing hover:scale-110 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            aria-label={`Thumb ${index + 1}`}
          ></SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>
    );
  }
);

DualRangeSlider.displayName = 'DualRangeSlider';

export { DualRangeSlider };
