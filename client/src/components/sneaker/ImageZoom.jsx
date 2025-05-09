import { useState } from 'react';

// Adicionar zoom ao passar o mouse
const ImageZoom = ({ src, alt }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showZoom, setShowZoom] = useState(false);

  return (
    <div
      className="relative overflow-hidden"
      onClick={() => setShowZoom((prev) => !prev)}
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={(e) => {
        const { left, top, width, height } =
          e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setPosition({ x, y });
      }}
    >
      <img
        src={src}
        alt={alt}
        className={`w-full ${showZoom ? 'cursor-zoom-out' : 'cursor-pointer'}`}
      />

      {showZoom && (
        <div
          className="absolute top-0 left-0 w-full h-full bg-no-repeat bg-cover pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundPosition: `${position.x}% ${position.y}%`,
            backgroundSize: '200%',
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
};

export default ImageZoom;
